/**
 * DEMO DATA — a full leaderboard, so the board can be looked at.
 *
 *   npm run demo         seed it
 *   npm run demo clean   remove every trace of it
 *
 * THIS IS FAKE. Every sponsor below is invented, and the platform is otherwise
 * built to refuse invented numbers (CLAUDE.md §0, rule 1). Two things keep
 * that rule intact rather than breaking it:
 *
 *   1. EVERY ROW IS SELF-IDENTIFYING. Accounts are `demo-*@example.com` and
 *      payments carry a `demo_` payment id, so `npm run demo clean` can find
 *      and remove all of it with no guesswork.
 *
 *   2. THE LEDGER MATCHES THE BOARD. Each bid gets a real `sm_payment` row for
 *      the same amount. A demo where the leaderboard shows ₹12,000 and the
 *      studio shows ₹0 collected is not a demo, it is a bug report — the two
 *      numbers have to agree or the demo teaches you the wrong thing.
 *
 * Run `npm run demo clean` before showing this to anybody who might mistake it
 * for real revenue.
 */
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);
const CLEAN = process.argv.includes('clean');
const ORIGIN = process.env.APP_ORIGIN ?? process.env.BASE_URL ?? 'http://localhost:3500';
const MARK = 'demo-';

/**
 * The field. Amounts are spaced so the bars actually show a shape — a run of
 * near-equal bids draws as a solid block and teaches nothing about the gap.
 *
 * [ handle, brand, tag, site, headline, cta, rupees, days since first paid ]
 *
 * Logos come from DuckDuckGo's public icon service, derived from the site — no
 * key, no account, and it answers 200 with a real image directly rather than
 * redirecting, which is what Google's equivalent does. Real sponsors supply
 * their own through the `logoUrl` field; the board falls back to an initial
 * on a tinted tile when there is none.
 */
const FIELD = [
  ['linear',   'Linear',    'Issue tracker',  'https://linear.app',      'Ship without the standup',        'Try it',    12000, 34],
  ['vercel',   'Vercel',    'Hosting',        'https://vercel.com',      'Deploy from a git push',          'Deploy',     7500, 21],
  ['raycast',  'Raycast',   'Launcher',       'https://raycast.com',     'The launcher you keep',           'Get it',     5200, 48],
  ['figma',    'Figma',     'Design tool',    'https://figma.com',       'Design together, actually',       'Open',       3800, 12],
  ['notion',   'Notion',    'Workspace',      'https://notion.so',       'One place for all of it',         'Try free',   2400, 63],
  ['posthog',  'PostHog',   'Analytics',      'https://posthog.com',     'See what people actually do',     'Install',    1600,  9],
  ['resend',   'Resend',    'Email API',      'https://resend.com',      'Email for developers',            'Send one',    900, 27],
  ['neon',     'Neon',      'Postgres',       'https://neon.tech',       'Postgres that scales to zero',    'Spin up',     500,  4]
];

async function cleanup() {
  const emails = FIELD.map(([h]) => `${MARK}${h}@example.com`);
  // Deleting the auth user cascades: profile → ads → stats, and payments.
  for (const email of emails) {
    await sql`DELETE FROM neon_auth."user" WHERE lower(email) = lower(${email})`;
  }
  await sql`DELETE FROM sm_payment WHERE dodo_payment_id LIKE 'demo_%'`;
  // `= ANY($1)` with a real array — the `sql(array)` IN-helper is postgres.js,
  // and this driver is @neondatabase/serverless, which does not have it.
  await sql`DELETE FROM sm_activity WHERE actor = ANY(${FIELD.map(([, b]) => b)})`;
}

if (CLEAN) {
  await cleanup();
  const left = await sql`SELECT count(*)::int AS n FROM sm_ad WHERE brand = ANY(${FIELD.map(([, b]) => b)})`;
  console.log(`✓ demo data removed (${left[0].n} demo ads left)`);
  process.exit(0);
}

/* ── Seed ─────────────────────────────────────────────────────────────────── */

const [slot] = await sql`SELECT id, name, step_paise FROM sm_slot WHERE kind = 'bid' ORDER BY created_at LIMIT 1`;
if (!slot) {
  console.error('No bid slot to populate. Run `npm run setup` first.');
  process.exit(1);
}

// Start clean, so re-running does not stack payments on top of old ones.
await cleanup();

async function account(handle, brand) {
  const email = `${MARK}${handle}@example.com`;
  const found = await sql`SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${email}) LIMIT 1`;
  if (found.length) return found[0].id;

  const res = await fetch(`${process.env.NEON_AUTH_BASE_URL}/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: ORIGIN },
    body: JSON.stringify({ email, password: 'demo-password-123', name: brand })
  });
  if (!res.ok) throw new Error(`sign-up ${handle}: ${res.status} ${await res.text()}`);

  const rows = await sql`SELECT id FROM neon_auth."user" WHERE lower(email) = lower(${email}) LIMIT 1`;
  return rows[0].id;
}

console.log(`Seeding the board on "${slot.name}"…\n`);

for (const [handle, brand, tag, site, headline, cta, rupees, days] of FIELD) {
  const id = await account(handle, brand);
  const paise = rupees * 100;

  await sql`
    INSERT INTO sm_profile (id, email, name, brand)
    VALUES (${id}, ${MARK + handle + '@example.com'}, ${brand}, ${brand})
    ON CONFLICT (id) DO UPDATE SET brand = EXCLUDED.brand`;

  const domain = new URL(site).hostname;
  const logo = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

  const [ad] = await sql`
    INSERT INTO sm_ad (slot_id, profile_id, format, brand, tag, logo_url, headline, body, url,
                       cta_label, amount_paise, status, first_paid_at)
    VALUES (${slot.id}, ${id}, 'card', ${brand}, ${tag}, ${logo}, ${headline}, '', ${site},
            ${cta}, ${paise}, 'live', now() - (${days} || ' days')::interval)
    ON CONFLICT (slot_id, profile_id) DO UPDATE SET
      amount_paise = EXCLUDED.amount_paise, tag = EXCLUDED.tag, logo_url = EXCLUDED.logo_url,
      headline = EXCLUDED.headline, url = EXCLUDED.url, status = 'live',
      first_paid_at = EXCLUDED.first_paid_at
    RETURNING id`;

  // The ledger has to agree with the board — see the note at the top.
  await sql`
    INSERT INTO sm_payment (profile_id, ad_id, amount_paise, currency, status,
                            dodo_payment_id, paid_at, created_at)
    VALUES (${id}, ${ad.id}, ${paise}, 'INR', 'paid', ${'demo_' + handle},
            now() - (${days} || ' days')::interval, now() - (${days} || ' days')::interval)
    ON CONFLICT (dodo_payment_id) DO NOTHING`;

  await sql`
    INSERT INTO sm_activity (kind, actor, slot_name, amount_paise, created_at)
    VALUES ('paid', ${brand}, ${slot.name}, ${paise}, now() - (${days} || ' days')::interval)`;

  /* A fortnight of impressions, weighted by rank — the leader is what serves,
     so it is the only one that collects many views. The others get the trickle
     they had while they were briefly on top. */
  const rank = FIELD.findIndex(([h]) => h === handle);
  for (let d = 0; d < 14; d++) {
    const views = Math.max(0, Math.round((900 / (rank + 1)) * (0.7 + Math.random() * 0.6)));
    if (!views) continue;
    const clicks = Math.round(views * (0.012 + Math.random() * 0.02));
    await sql`
      INSERT INTO sm_stat (ad_id, day, views, clicks)
      VALUES (${ad.id}, ${new Date(Date.now() - d * 864e5).toISOString().slice(0, 10)}, ${views}, ${clicks})
      ON CONFLICT (ad_id, day) DO UPDATE SET views = EXCLUDED.views, clicks = EXCLUDED.clicks`;
  }

  console.log(`  ${String(rank + 1).padStart(2)}. ${brand.padEnd(10)} ₹${rupees.toLocaleString('en-IN').padStart(7)}  ${tag}`);
}

const [{ total }] = await sql`SELECT coalesce(sum(amount_paise),0)::int AS total FROM sm_payment WHERE status='paid'`;
const [{ views }] = await sql`SELECT coalesce(sum(views),0)::int AS views FROM sm_stat`;

console.log(`\n✓ ${FIELD.length} sponsors, ₹${(total / 100).toLocaleString('en-IN')} collected, ${views.toLocaleString('en-IN')} views`);
console.log('\n⚠️  This is FAKE. Remove it with:  npm run demo clean');
