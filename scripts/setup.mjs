/**
 * Everything that has to happen to a fresh database, in order.
 *
 *   npm run setup          constraints, then accounts, then slots
 *   npm run setup dodo     also create the Dodo product (run once per key)
 *
 * Run `npm run db` first — that pushes the schema. This is the part
 * drizzle-kit cannot do.
 *
 * All of it is idempotent: re-running skips what already exists.
 *
 * This replaces three separate scripts (apply-sql, seed, dodo-setup). They were
 * three files calling the same two libraries to run in a fixed order, which is
 * a shell alias's worth of value for three files' worth of maintenance.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

const {
  DATABASE_URL,
  DATABASE_URL_UNPOOLED,
  NEON_AUTH_BASE_URL,
  CREATOR_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_NAME,
  BASE_URL
} = process.env;

for (const [k, v] of Object.entries({
  DATABASE_URL,
  NEON_AUTH_BASE_URL,
  CREATOR_EMAIL,
  ADMIN_PASSWORD
})) {
  if (!v) {
    console.error(`Missing ${k} — see .env.example.`);
    process.exit(1);
  }
}

// Schema work and seeding both want a real session, not the HTTP pooler.
const sql = neon(DATABASE_URL_UNPOOLED ?? DATABASE_URL);

/* ── 1 · the constraints drizzle-kit cannot generate ─────────────────────── */

/**
 * Every .sql in drizzle/manual/, in filename order. They target `neon_auth`
 * (which Neon provisions and drizzle-kit must never reach) or express a rule
 * the schema file cannot. Each is a single idempotent statement, because
 * `sql.query` sends one command and Postgres refuses more.
 */
const dir = join(process.cwd(), 'drizzle', 'manual');
for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  try {
    await sql.query(readFileSync(join(dir, file), 'utf8'));
    console.log(`✓ ${file}`);
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
    console.error('  Run `npm run db` first — the tables have to exist.');
    process.exit(1);
  }
}

/* ── 2 · accounts ────────────────────────────────────────────────────────── */

/** Better Auth refuses a request whose Origin it does not trust. */
const ORIGIN = process.env.APP_ORIGIN ?? BASE_URL ?? 'http://localhost:3500';

/**
 * Accounts are created through the Neon Auth HTTP API, never by writing to
 * `neon_auth` directly: Better Auth owns the password hashing, and a row we
 * inserted would carry a hash it will not accept.
 */
async function account(email, password, name, label) {
  const found = await sql`
    SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${email}) LIMIT 1`;
  if (found.length) {
    console.log(`· ${label} exists (${email})`);
    return found[0].id;
  }

  const res = await fetch(`${NEON_AUTH_BASE_URL}/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body: JSON.stringify({ email, password, name })
  });
  if (!res.ok) {
    console.error(`✗ sign-up failed for ${label} (${res.status}): ${await res.text()}`);
    console.error(`  If that is an origin error, add ${ORIGIN} to this Neon Auth project.`);
    process.exit(1);
  }

  const rows = await sql`
    SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${email}) LIMIT 1`;
  console.log(`✓ created ${label} (${email})`);
  return rows[0].id;
}

const creatorId = await account(CREATOR_EMAIL, ADMIN_PASSWORD, ADMIN_NAME ?? 'Swarnil', 'creator');
await sql`
  INSERT INTO sm_profile (id, email, name)
  VALUES (${creatorId}, ${CREATOR_EMAIL}, ${ADMIN_NAME ?? 'Swarnil'})
  ON CONFLICT (id) DO NOTHING`;

if (DEMO_EMAIL && DEMO_PASSWORD) {
  const demoId = await account(DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME ?? 'Demo', 'demo sponsor');
  await sql`
    INSERT INTO sm_profile (id, email, name)
    VALUES (${demoId}, ${DEMO_EMAIL}, ${DEMO_NAME ?? 'Demo'})
    ON CONFLICT (id) DO NOTHING`;
} else {
  console.log('· no DEMO_EMAIL/DEMO_PASSWORD — skipping the demo account');
}

/* ── 3 · slots ───────────────────────────────────────────────────────────── */

/**
 * Real inventory, priced but unsold — one of each kind, so both halves of the
 * product are visible the first time the homepage is opened.
 *
 * NO ads, payments or view counts are seeded. Each of those is a number
 * somebody would read as a measurement, and a leaderboard with invented
 * sponsors on it is a lie told to the first real one.
 */
const SLOTS = [
  ['top-spot',       'The Top Spot',      'The one everybody fights over. Runs on every page I own.', 'bid',   'card',    50_000],
  ['blog-sidebar',   'Blog sidebar',      'Beside every post on imswarnil.com.',                      'fixed', 'card',   250_000],
  ['article-banner', 'In-article banner', 'Wide, right after the opening section.',                   'fixed', 'banner', 400_000],
  ['docs-rail',      'Design docs rail',  'The tall column on the design system docs.',               'fixed', 'rail',   300_000]
];

for (const [publicId, name, blurb, kind, shape, price] of SLOTS) {
  const exists = await sql`SELECT id FROM sm_slot WHERE public_id = ${publicId} LIMIT 1`;
  if (exists.length) {
    console.log(`· slot "${name}" exists`);
    continue;
  }
  await sql`
    INSERT INTO sm_slot (public_id, name, blurb, kind, shape, price_paise, step_paise)
    VALUES (${publicId}, ${name}, ${blurb}, ${kind}, ${shape}, ${price}, 10000)`;
  console.log(`✓ ${kind === 'bid' ? '🏆' : '✨'} ${name} — ₹${price / 100}`);
}

/* ── 4 · the Dodo product, on request ────────────────────────────────────── */

/**
 * ONE reusable pay-what-you-want product that every checkout charges against.
 * This app decides each amount (lib/dodo.ts), not Dodo's catalogue, because a
 * slot's price and a live bid both change independently of anything Dodo knows.
 *
 * Opt-in because it is NOT idempotent — the API has no natural key to look up,
 * so running it twice just creates a second, unused product.
 */
if (process.argv.includes('dodo')) {
  const key = process.env.DODO_PAYMENTS_KEY_LIVE || process.env.DODO_PAYMENTS_KEY_TEST_MODE;
  if (!key) {
    console.error('\n✗ Set DODO_PAYMENTS_KEY_TEST_MODE (or _LIVE) in .env first.');
    process.exit(1);
  }
  const { default: DodoPayments } = await import('dodopayments');
  const client = new DodoPayments({
    bearerToken: key,
    environment: process.env.DODO_PAYMENTS_KEY_LIVE ? 'live_mode' : 'test_mode'
  });
  const product = await client.products.create({
    name: 'Sponsorship',
    price: {
      type: 'one_time_price',
      currency: 'INR',
      // The floor this product can ever charge — ₹1. The real amount is set per
      // checkout session, which is the whole point of pay_what_you_want here.
      price: 100,
      pay_what_you_want: true,
      purchasing_power_parity: false,
      discount: 0,
      tax_inclusive: true
    },
    tax_category: 'saas'
  });
  console.log(`\n✓ Dodo product created. Set this in .env:\n  DODO_PRODUCT_ID=${product.product_id}`);
}

console.log('\nDone.');
console.log(`  creator: ${CREATOR_EMAIL} → /studio`);
if (DEMO_EMAIL) console.log(`  sponsor: ${DEMO_EMAIL} → /me`);
