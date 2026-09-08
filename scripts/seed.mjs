/**
 * Seeds the two accounts this platform needs to be worth looking at, plus a
 * few ad slots so the studio and the homepage are not empty on first open.
 *
 *   1. the CREATOR      — CREATOR_EMAIL / ADMIN_PASSWORD, lands on /studio
 *   2. a DEMO SPONSOR   — DEMO_EMAIL / DEMO_PASSWORD,     lands on /dashboard
 *
 * Users are created through the Neon Auth HTTP API, never by writing to
 * `neon_auth` directly: Better Auth owns the password hashing, and a row we
 * inserted ourselves would carry a hash it will not accept. The `sb_profile`
 * rows are ours, so those we do write.
 *
 * WHAT THIS DOES NOT SEED: bids, payments, impressions or activity. Every one
 * of those is a number somebody would read as a measurement — a leaderboard
 * with invented sponsors on it is a lie told to the first real one, and fake
 * view counts are worse. The board starts empty because it *is* empty.
 *
 * Idempotent: re-running skips what already exists.
 *
 *   npm run db:seed
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

// Seeding wants a real session, not the HTTP pooler.
const sql = neon(DATABASE_URL_UNPOOLED ?? DATABASE_URL);

/** Better Auth refuses a request whose Origin it does not trust. */
const ORIGIN = process.env.APP_ORIGIN ?? BASE_URL ?? 'http://localhost:3500';

/* ── 1 · accounts ─────────────────────────────────────────────────────────── */

async function ensureAccount({ email, password, name, label }) {
  const existing = await sql`
    SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${email}) LIMIT 1`;
  if (existing.length) {
    console.log(`· ${label} already exists (${email})`);
    return existing[0].id;
  }

  const res = await fetch(`${NEON_AUTH_BASE_URL}/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body: JSON.stringify({ email, password, name })
  });

  if (!res.ok) {
    console.error(`Sign-up failed for ${label} (${res.status}): ${await res.text()}`);
    console.error(
      `If this is an origin error, add ${ORIGIN} to the trusted origins for this Neon Auth project.`
    );
    process.exit(1);
  }

  const rows = await sql`
    SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${email}) LIMIT 1`;
  if (!rows.length) {
    console.error(`Sign-up reported success for ${label} but no user row appeared.`);
    process.exit(1);
  }
  console.log(`✓ created ${label} (${email})`);
  return rows[0].id;
}

/** The app creates profiles on first request; seeding one keeps them in step. */
async function ensureProfile(id, email, name, brand) {
  await sql`
    INSERT INTO sb_profile (id, email, name, brand)
    VALUES (${id}, ${email}, ${name}, ${brand})
    ON CONFLICT (id) DO NOTHING`;
}

const creatorId = await ensureAccount({
  email: CREATOR_EMAIL,
  password: ADMIN_PASSWORD,
  name: ADMIN_NAME ?? 'Swarnil',
  label: 'creator'
});
await ensureProfile(creatorId, CREATOR_EMAIL, ADMIN_NAME ?? 'Swarnil', null);

if (DEMO_EMAIL && DEMO_PASSWORD) {
  const demoId = await ensureAccount({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    name: DEMO_NAME ?? 'Demo sponsor',
    label: 'demo sponsor'
  });
  await ensureProfile(demoId, DEMO_EMAIL, DEMO_NAME ?? 'Demo sponsor', null);
} else {
  console.log('· no DEMO_EMAIL/DEMO_PASSWORD set — skipping the demo account');
}

/* ── 2 · ad slots ─────────────────────────────────────────────────────────── */

/**
 * Real inventory, priced but unsold. `monthly_views` is left NULL on every one
 * of them: a seeded view count is a fabricated measurement, and the UI is
 * built to render nothing rather than a number nobody counted.
 */
const SLOTS = [
  {
    publicId: 'blog-sidebar',
    name: 'Blog sidebar',
    property: 'imswarnil',
    format: 'rect',
    description: 'The rail beside every post on imswarnil.com.',
    previewUrl: 'https://imswarnil.com',
    pricePaise: 250_000
  },
  {
    publicId: 'article-leaderboard',
    name: 'In-article banner',
    property: 'imswarnil',
    format: 'leader',
    description: 'A wide banner inside the article, after the opening section.',
    previewUrl: 'https://imswarnil.com',
    pricePaise: 400_000
  },
  {
    publicId: 'design-docs-rail',
    name: 'Design system docs',
    property: 'design',
    format: 'sky',
    description: 'The tall rail on every page of the design system documentation.',
    previewUrl: 'https://design.imswarnil.com',
    pricePaise: 300_000
  },
  {
    publicId: 'course-inline',
    name: 'CRM Analytics course',
    property: 'crmanalytics',
    format: 'inline',
    description: 'Inside the course pages, between lessons.',
    previewUrl: 'https://crmanalytics.imswarnil.com',
    pricePaise: 200_000
  }
];

for (const slot of SLOTS) {
  const existing = await sql`SELECT id FROM sb_slot WHERE public_id = ${slot.publicId} LIMIT 1`;
  if (existing.length) {
    console.log(`· slot "${slot.name}" already exists`);
    continue;
  }
  await sql`
    INSERT INTO sb_slot (public_id, name, property, format, description, preview_url, price_paise)
    VALUES (${slot.publicId}, ${slot.name}, ${slot.property}, ${slot.format},
            ${slot.description}, ${slot.previewUrl}, ${slot.pricePaise})`;
  console.log(`✓ slot "${slot.name}" — ₹${slot.pricePaise / 100}/month`);
}

console.log('\nDone. Sign in at /signin.');
console.log(`  creator: ${CREATOR_EMAIL} → /studio`);
if (DEMO_EMAIL) console.log(`  sponsor: ${DEMO_EMAIL} → /dashboard`);
