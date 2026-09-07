/**
 * Seeds obviously-fake demo data so the site isn't empty while it's being
 * built: a populated sponsor wall, and a couple of placements shown as taken.
 *
 * Every row it writes carries `is_sample = true`, and the UI badges those
 * "Sample" wherever they appear. That flag is the whole point — this site's
 * position is that a number or a name is real or it is absent (CLAUDE.md §4),
 * and a wall quietly full of invented people would break that in the least
 * visible way possible.
 *
 *   node scripts/seed-samples.mjs            seed
 *   node scripts/seed-samples.mjs --clean    remove every sample row again
 *
 * Run --clean before the site starts taking real money. Idempotent either way.
 *
 * The accounts use `@sample.invalid` — `.invalid` is reserved by RFC 2606 and
 * can never be a deliverable address, so these can't be confused for real
 * people and can't accidentally be mailed. They are real Neon Auth rows
 * because `bms_profile.id` is a foreign key to `neon_auth.user.id`
 * (drizzle/manual/001), so there is no way to have a profile without one.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

const { DATABASE_URL, DATABASE_URL_UNPOOLED, NEON_AUTH_BASE_URL, CREATOR_EMAIL, BASE_URL } =
  process.env;

for (const [k, v] of Object.entries({ DATABASE_URL, NEON_AUTH_BASE_URL })) {
  if (!v) {
    console.error(`Missing ${k} — see .env.example.`);
    process.exit(1);
  }
}

const sql = neon(DATABASE_URL_UNPOOLED ?? DATABASE_URL);
const ORIGIN = process.env.APP_ORIGIN ?? BASE_URL ?? 'http://localhost:3500';
const clean = process.argv.includes('--clean');

/* ── people ───────────────────────────────────────────────────────────────── */

const SAMPLE_MEMBERS = [
  { name: 'Ana Duarte', handle: 'ana.builds', blurb: 'Reads the newsletter on the train.' },
  { name: 'Marcus Hale', handle: 'marcushale', blurb: 'Here for the Salesforce posts.' },
  { name: 'Priya Nair', handle: 'priya.codes', blurb: 'Been following since the first video.' },
  { name: 'Tomas Rivas', handle: 'tomasrivas', blurb: 'Open source, mostly.' },
  { name: 'Chloe Barnes', handle: 'chloe.b', blurb: 'The Kyoto series was worth it.' },
  { name: 'Devan Shah', handle: 'devanshah', blurb: 'Small monthly, happy to keep it going.' },
  { name: 'Ines Moreau', handle: 'inesmoreau', blurb: 'Design system nerd.' },
  { name: 'Sam Okafor', handle: 'samokafor', blurb: 'Found this through a README badge.' }
];

const SAMPLE_ADS = [
  {
    headline: 'Ship your side project this weekend',
    cta: 'Try it free',
    link: 'https://example.com/sample-a'
  },
  {
    headline: 'The database that scales to zero',
    cta: 'Read the docs',
    link: 'https://example.com/sample-b'
  }
];

const emailFor = (handle) => `${handle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}@sample.invalid`;

/* ── clean ────────────────────────────────────────────────────────────────── */

if (clean) {
  // Reopen any placement a sample sponsor was holding, then drop the sample
  // members. Deleting the auth users cascades to bms_profile (and from there
  // to their slots/txns) via the FK in drizzle/manual/001.
  const reopened = await sql`
    UPDATE bms_slot SET
      status = 'open', sponsor_id = NULL, is_sample = false,
      ad_headline = NULL, ad_image_url = NULL, ad_link_url = NULL, ad_cta_label = NULL,
      sponsored_start = NULL, sponsored_until = NULL, sponsored_weeks = NULL
    WHERE is_sample = true
    RETURNING id`;

  const removed = await sql`
    DELETE FROM neon_auth."user"
    WHERE lower(email) LIKE '%@sample.invalid'
    RETURNING id`;

  console.log(`✓ reopened ${reopened.length} sample placement(s)`);
  console.log(`✓ removed ${removed.length} sample account(s), members cascaded`);
  process.exit(0);
}

/* ── seed ─────────────────────────────────────────────────────────────────── */

async function ensureSampleAccount({ name, handle }) {
  const email = emailFor(handle);
  const existing = await sql`
    SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${email}) LIMIT 1`;
  if (existing.length) return { id: existing[0].id, email, fresh: false };

  const res = await fetch(`${NEON_AUTH_BASE_URL}/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    // Never reused, never mailed, never logged — these accounts exist only to
    // satisfy the profile FK.
    body: JSON.stringify({ email, password: randomBytes(24).toString('hex'), name })
  });
  if (!res.ok) {
    console.error(`✗ could not create ${email}: ${res.status} ${await res.text()}`);
    console.error(`  Is ${ORIGIN} a trusted origin in Neon Auth?`);
    process.exit(1);
  }

  const row = await sql`
    SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${email}) LIMIT 1`;
  return { id: row[0].id, email, fresh: true };
}

let made = 0;
const renewsAt = new Date(Date.now() + 30 * 86_400_000);

for (const person of SAMPLE_MEMBERS) {
  const { id, email, fresh } = await ensureSampleAccount(person);

  await sql`
    INSERT INTO bms_profile (id, email, name, points, role)
    VALUES (${id}, ${email}, ${person.name}, 0, 'both')
    ON CONFLICT (id) DO NOTHING`;

  await sql`
    INSERT INTO bms_member
      (id, profile_id, display_name, instagram_handle, blurb, tier_name,
       price_points, status, renews_at, is_sample)
    VALUES
      (${randomUUID()}, ${id}, ${person.name}, ${person.handle}, ${person.blurb},
       'Sample', 0, 'active', ${renewsAt.toISOString()}, true)
    ON CONFLICT (profile_id) DO NOTHING`;

  if (fresh) made += 1;
}

console.log(`✓ ${SAMPLE_MEMBERS.length} sample members on the wall (${made} newly created)`);

/* ── a couple of placements shown as taken ────────────────────────────────── */

const creator = CREATOR_EMAIL
  ? await sql`SELECT id FROM bms_profile WHERE lower(email) = lower(${CREATOR_EMAIL}) LIMIT 1`
  : [];

if (!creator.length) {
  console.log('· no CREATOR_EMAIL profile found — skipped the sample sponsorships');
} else {
  const open = await sql`
    SELECT id FROM bms_slot
    WHERE owner_id = ${creator[0].id} AND status = 'open' AND archived = false
    ORDER BY created_at ASC LIMIT ${SAMPLE_ADS.length}`;

  const sponsor = await sql`
    SELECT id FROM bms_profile WHERE lower(email) LIKE '%@sample.invalid' LIMIT 1`;

  let taken = 0;
  for (const [i, slot] of open.entries()) {
    const ad = SAMPLE_ADS[i];
    if (!ad || !sponsor.length) break;
    await sql`
      UPDATE bms_slot SET
        status = 'sponsored',
        sponsor_id = ${sponsor[0].id},
        ad_headline = ${ad.headline},
        ad_link_url = ${ad.link},
        ad_cta_label = ${ad.cta},
        sponsored_weeks = 2,
        sponsored_start = now(),
        sponsored_until = now() + interval '14 days',
        is_sample = true
      WHERE id = ${slot.id}`;
    taken += 1;
  }
  console.log(`✓ ${taken} placement(s) shown as taken by a sample sponsor`);
}

console.log('\nAll of it is badged "Sample" in the UI. Remove with --clean.');
