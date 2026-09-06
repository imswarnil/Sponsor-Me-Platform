/**
 * Seeds the two accounts this platform needs to be worth looking at:
 *
 *   1. the CREATOR  — CREATOR_EMAIL / ADMIN_PASSWORD, lands on /studio
 *   2. a DEMO SPONSOR — DEMO_EMAIL / DEMO_PASSWORD, lands on /sponsor
 *
 * ...plus a handful of open placements, so /studio and /placements are not
 * empty the first time they are opened.
 *
 * Users are created through the Neon Auth HTTP API, never by writing to
 * `neon_auth` directly: Better Auth owns the password hashing, and a row we
 * inserted ourselves would have a hash it does not accept. The profile rows in
 * `bms_profile` are ours, so those we do write.
 *
 * Idempotent. Re-running skips accounts that exist and placements whose names
 * are already taken; it never overwrites a live sponsorship.
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
  ADMIN_PASSWORD,
  DEMO_EMAIL,
  DEMO_PASSWORD
})) {
  if (!v) {
    console.error(`Missing ${k} — see .env.example.`);
    process.exit(1);
  }
}

// Schema work and seeding both want a real session, not the HTTP pooler.
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

/**
 * The profile row. Under Supabase a trigger on `auth.users` did this; Neon owns
 * its own schema, so the app does it instead (lib/proto/queries.ts) and the
 * seed does it here rather than waiting for a first page load.
 *
 * The creator gets no starting points: points are what a sponsor spends, and
 * giving the person being sponsored a balance was always meaningless.
 */
async function ensureProfile(id, email, name, points) {
  await sql`
    INSERT INTO bms_profile (id, email, name, points)
    VALUES (${id}, ${email}, ${name}, ${points})
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name`;
}

/* ── 2 · placements ───────────────────────────────────────────────────────── */

/** A short, readable public id in the same shape the app generates. */
function publicId() {
  return 'sl_' + Math.random().toString(36).slice(2, 10);
}

const PLACEMENTS = [
  {
    name: 'Blog sidebar',
    channel: 'blog',
    property: 'imswarnil',
    price: 250,
    adType: 'banner',
    width: 300,
    height: 250,
    brief: 'The sidebar slot on every post on imswarnil.com. Served by the widget, so views and clicks are counted for real.',
    specs: '300×250 PNG or JPG, headline under 60 characters.'
  },
  {
    name: 'Newsletter block',
    channel: 'newsletter',
    property: null,
    price: 400,
    brief: 'A sponsored block inside an issue, written to read like the rest of it.',
    specs: 'One paragraph, a link, and an optional 600×200 image.'
  },
  {
    name: 'Design system README',
    channel: 'open-source',
    property: 'design',
    price: 150,
    brief: 'A logo and link in the README and docs of the Frame & Signal design system.',
    specs: 'SVG or PNG logo, 200px wide, plus a URL.'
  },
  {
    name: 'CRM Analytics Academy banner',
    channel: 'blog',
    property: 'crmanalytics',
    price: 200,
    adType: 'banner',
    width: 728,
    height: 90,
    brief: 'Above the lesson list on the CRM Analytics Academy course site.',
    specs: '728×90 PNG or JPG.'
  },
  {
    name: 'Ambassador shout-out',
    channel: 'ambassador',
    property: null,
    price: 100,
    brief: "You post about my work on your own account, in your own words. No ad to design.",
    specs: 'Your own words — one post or story.'
  }
];

async function ensurePlacements(ownerId) {
  let created = 0;
  for (const p of PLACEMENTS) {
    const existing = await sql`
      SELECT id FROM bms_slot WHERE owner_id = ${ownerId} AND name = ${p.name} LIMIT 1`;
    if (existing.length) continue;

    await sql`
      INSERT INTO bms_slot (
        public_id, owner_id, name, placement, property, price_points,
        ad_type, width, height, brief, ad_specs, status
      ) VALUES (
        ${publicId()}, ${ownerId}, ${p.name}, ${p.channel}, ${p.property}, ${p.price},
        ${p.adType ?? null}, ${p.width ?? 300}, ${p.height ?? 250}, ${p.brief}, ${p.specs},
        'open'
      )`;
    created += 1;
  }
  console.log(
    created ? `✓ created ${created} placement(s)` : '· placements already present'
  );
}

/* ── run ──────────────────────────────────────────────────────────────────── */

const creatorId = await ensureAccount({
  email: CREATOR_EMAIL,
  password: ADMIN_PASSWORD,
  name: ADMIN_NAME ?? 'Swarnil Singhai',
  label: 'creator (admin)'
});
await ensureProfile(creatorId, CREATOR_EMAIL, ADMIN_NAME ?? 'Swarnil Singhai', 0);

const demoId = await ensureAccount({
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  name: DEMO_NAME ?? 'Demo Sponsor',
  label: 'demo sponsor'
});
await ensureProfile(demoId, DEMO_EMAIL, DEMO_NAME ?? 'Demo Sponsor', 1000);

await ensurePlacements(creatorId);

console.log(`
Done.

  Admin  → ${CREATOR_EMAIL}   lands on /studio
  Demo   → ${DEMO_EMAIL}   lands on /sponsor  (also the "Explore the demo account" button)

Passwords are in .env (ADMIN_PASSWORD / DEMO_PASSWORD). .env is gitignored.
`);
