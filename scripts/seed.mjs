/**
 * Seeds the two accounts and a few slots, so the studio and homepage are not
 * empty on first open.
 *
 * Users are created through the Neon Auth HTTP API, never by writing to
 * `neon_auth` directly: Better Auth owns the password hashing, and a row we
 * inserted would carry a hash it will not accept.
 *
 * WHAT THIS DOES NOT SEED: ads, payments or view counts. Every one of those is
 * a number somebody would read as a measurement — a leaderboard with invented
 * sponsors on it is a lie told to the first real one.
 *
 * Idempotent.  npm run db:seed
 */
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

for (const [k, v] of Object.entries({ DATABASE_URL, NEON_AUTH_BASE_URL, CREATOR_EMAIL, ADMIN_PASSWORD })) {
  if (!v) {
    console.error(`Missing ${k} — see .env.example.`);
    process.exit(1);
  }
}

const sql = neon(DATABASE_URL_UNPOOLED ?? DATABASE_URL);
const ORIGIN = process.env.APP_ORIGIN ?? BASE_URL ?? 'http://localhost:3500';

async function account(email, password, name, label) {
  const found = await sql`SELECT id FROM neon_auth."user" WHERE lower(email)=lower(${email}) LIMIT 1`;
  if (found.length) {
    console.log(`· ${label} already exists (${email})`);
    return found[0].id;
  }
  const res = await fetch(`${NEON_AUTH_BASE_URL}/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body: JSON.stringify({ email, password, name })
  });
  if (!res.ok) {
    console.error(`Sign-up failed for ${label} (${res.status}): ${await res.text()}`);
    console.error(`If that is an origin error, add ${ORIGIN} to this Neon Auth project's trusted origins.`);
    process.exit(1);
  }
  const rows = await sql`SELECT id FROM neon_auth."user" WHERE lower(email)=lower(${email}) LIMIT 1`;
  console.log(`✓ created ${label} (${email})`);
  return rows[0].id;
}

const creatorId = await account(CREATOR_EMAIL, ADMIN_PASSWORD, ADMIN_NAME ?? 'Swarnil', 'creator');
await sql`INSERT INTO sm_profile (id, email, name) VALUES (${creatorId}, ${CREATOR_EMAIL}, ${ADMIN_NAME ?? 'Swarnil'})
          ON CONFLICT (id) DO NOTHING`;

if (DEMO_EMAIL && DEMO_PASSWORD) {
  const demoId = await account(DEMO_EMAIL, DEMO_PASSWORD, DEMO_NAME ?? 'Demo', 'demo sponsor');
  await sql`INSERT INTO sm_profile (id, email, name) VALUES (${demoId}, ${DEMO_EMAIL}, ${DEMO_NAME ?? 'Demo'})
            ON CONFLICT (id) DO NOTHING`;
} else {
  console.log('· no DEMO_EMAIL/DEMO_PASSWORD — skipping the demo account');
}

/* Real inventory, priced but unsold. One of each kind, so both halves of the
   product are visible the first time the homepage is opened. */
const SLOTS = [
  ['top-spot',      'The Top Spot',    'The one everybody fights over. Runs on every page I own.', 'bid',   'card',   50000, 10000, 'https://imswarnil.com'],
  ['blog-sidebar',  'Blog sidebar',    'Beside every post on imswarnil.com.',                      'fixed', 'card',   250000, 10000, 'https://imswarnil.com'],
  ['article-banner','In-article banner','Wide, right after the opening section.',                  'fixed', 'banner', 400000, 10000, 'https://imswarnil.com'],
  ['docs-rail',     'Design docs rail','The tall column on the design system docs.',               'fixed', 'rail',   300000, 10000, 'https://design.imswarnil.com']
];

for (const [publicId, name, blurb, kind, shape, price, step, preview] of SLOTS) {
  const exists = await sql`SELECT id FROM sm_slot WHERE public_id=${publicId} LIMIT 1`;
  if (exists.length) {
    console.log(`· slot "${name}" already exists`);
    continue;
  }
  await sql`INSERT INTO sm_slot (public_id, name, blurb, kind, shape, price_paise, step_paise, preview_url)
            VALUES (${publicId}, ${name}, ${blurb}, ${kind}, ${shape}, ${price}, ${step}, ${preview})`;
  console.log(`✓ ${kind === 'bid' ? '🏆' : '✨'} "${name}" — ₹${price / 100}`);
}

console.log('\nDone.');
console.log(`  creator: ${CREATOR_EMAIL} → /studio`);
if (DEMO_EMAIL) console.log(`  sponsor: ${DEMO_EMAIL} → /me`);
