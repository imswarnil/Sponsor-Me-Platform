/**
 * END-TO-END VERIFICATION.
 *
 *   npm run verify              against http://localhost:3500
 *   npm run verify production   against the deployed Worker
 *
 * Creates a throwaway slot and a set of deliberately awkward ads, drives the
 * REAL pages over HTTP, asserts what actually came back, then deletes
 * everything it made. It writes to the live database, so every fixture is
 * prefixed `zz-verify-` and the cleanup runs in a `finally`.
 *
 * The cases are chosen to break things, not to pass:
 *
 *   · a TIE on amount        — must break by who paid first, deterministically
 *   · a HOUSE ad             — must sort below every payer, show "—", and not
 *                              set the ask
 *   · an UNAPPROVED ad       — paid, but must not appear anywhere public
 *   · an EXPIRED fixed ad    — endsAt in the past, must stop serving
 *   · a ZERO-amount ad       — a draft, must never rank
 *
 * A happy-path test would pass on all five of those while the product was
 * broken, which is the whole reason they are here.
 */
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env' });

const PROD = process.argv.includes('production');
const BASE = PROD ? 'https://sponsor.imswarnil.com' : 'http://localhost:3500';
const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL);

let pass = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

/** Order of first appearance in the HTML — which is what a reader sees. */
function order(html, names) {
  return names
    .map((n) => ({ n, at: html.indexOf(n) }))
    .filter((x) => x.at !== -1)
    .sort((a, b) => a.at - b.at)
    .map((x) => x.n);
}

const SLUG = 'zz-verify-slot';
const MARK = 'zz-verify-';

async function cleanup() {
  await sql`DELETE FROM sm_slot WHERE public_id = ${SLUG}`; // cascades to ads
  for (const e of ['alpha', 'bravo', 'charlie', 'delta', 'echo']) {
    await sql`DELETE FROM neon_auth."user" WHERE email = ${MARK + e + '@example.com'}`;
  }
}

async function account(name) {
  const email = `${MARK}${name}@example.com`;
  const found = await sql`SELECT id FROM neon_auth."user" WHERE email = ${email} LIMIT 1`;
  if (found.length) return found[0].id;
  const res = await fetch(`${process.env.NEON_AUTH_BASE_URL}/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: process.env.BASE_URL ?? BASE },
    body: JSON.stringify({ email, password: 'verify-password-123', name })
  });
  if (!res.ok) throw new Error(`sign-up ${name}: ${res.status} ${await res.text()}`);
  const rows = await sql`SELECT id FROM neon_auth."user" WHERE email = ${email} LIMIT 1`;
  await sql`INSERT INTO sm_profile (id, email, name, brand)
            VALUES (${rows[0].id}, ${email}, ${name}, ${name})
            ON CONFLICT (id) DO NOTHING`;
  return rows[0].id;
}

console.log(`\nVerifying ${BASE}\n`);

try {
  await cleanup();

  /* ── 1 · a slot, created the way the studio creates one ──────────────── */

  const [slot] = await sql`
    INSERT INTO sm_slot (public_id, name, blurb, kind, shape, price_paise, step_paise, active)
    VALUES (${SLUG}, 'Verify slot', 'Created by scripts/verify.mjs', 'bid', 'card', 50000, 10000, true)
    RETURNING id, public_id, price_paise, step_paise`;

  const [creator] = await sql`
    SELECT id FROM sm_profile WHERE lower(email) = lower(${process.env.CREATOR_EMAIL}) LIMIT 1`;

  /* ── 2 · the awkward field ───────────────────────────────────────────── */

  const ids = {};
  for (const name of ['alpha', 'bravo', 'charlie', 'delta', 'echo']) ids[name] = await account(name);

  async function ad(profileId, brand, tag, amount, status, opts = {}) {
    const [row] = await sql`
      INSERT INTO sm_ad (slot_id, profile_id, format, brand, tag, headline, url, cta_label,
                         amount_paise, status, is_house, first_paid_at, ends_at)
      VALUES (${slot.id}, ${profileId}, 'card', ${brand}, ${tag},
              ${brand + ' headline'}, ${'https://' + brand.toLowerCase() + '.example.com'},
              'Go', ${amount}, ${status}, ${opts.house ?? false},
              ${opts.paidAt ?? null}, ${opts.endsAt ?? null})
      ON CONFLICT (slot_id, profile_id) DO UPDATE SET amount_paise = EXCLUDED.amount_paise
      RETURNING id`;
    return row.id;
  }

  // Alpha and Bravo TIE at ₹2,000. Alpha paid first, so Alpha must outrank it.
  const alphaId = await ad(ids.alpha, 'Alpha', 'Tie-breaker', 200000, 'live', {
    paidAt: new Date(Date.now() - 5 * 864e5)
  });
  await ad(ids.bravo, 'Bravo', 'Also tied', 200000, 'live', {
    paidAt: new Date(Date.now() - 1 * 864e5)
  });
  // Charlie is clearly on top.
  await ad(ids.charlie, 'Charlie', 'Leader', 500000, 'live', {
    paidAt: new Date(Date.now() - 3 * 864e5)
  });
  // Delta PAID but is not approved — must be invisible in public.
  await ad(ids.delta, 'Delta', 'Unapproved', 900000, 'pending', {
    paidAt: new Date(Date.now() - 2 * 864e5)
  });
  // Echo is a draft with no money — must never rank.
  await ad(ids.echo, 'Echo', 'Draft', 0, 'draft');
  // A house ad, owned by the creator.
  await ad(creator.id, 'HouseBrand', 'Our own', 0, 'live', { house: true });

  /* ── 3 · what the pages actually return ──────────────────────────────── */

  const slotPage = await fetch(`${BASE}/slot/${SLUG}`).then((r) => r.text());
  const embed = await fetch(`${BASE}/embed/${SLUG}`).then((r) => r.text());
  const home = await fetch(`${BASE}/`).then((r) => r.text());

  console.log('Slot creation');
  check('slot page renders', slotPage.includes('Verify slot'));
  check('slot appears on the homepage', home.includes('Verify slot'));
  check('embed renders', embed.length > 0 && !embed.includes('not found'));
  check(
    'embed tag on the slot page points at this slot',
    slotPage.includes(SLUG),
    'the public id must be what leaves the building'
  );

  console.log('\nRanking');
  const seen = order(slotPage, ['Charlie', 'Alpha', 'Bravo', 'HouseBrand']);
  check(
    'highest bid first',
    seen[0] === 'Charlie',
    `got ${JSON.stringify(seen)}`
  );
  check(
    'a tie breaks by who paid first (Alpha before Bravo)',
    seen.indexOf('Alpha') < seen.indexOf('Bravo'),
    `got ${JSON.stringify(seen)}`
  );
  check(
    'the house ad sorts below every payer',
    seen[seen.length - 1] === 'HouseBrand',
    `got ${JSON.stringify(seen)}`
  );
  check('a paid-but-unapproved ad is invisible', !slotPage.includes('Delta'));
  check('a zero-amount draft never ranks', !slotPage.includes('Echo'));

  console.log('\nThe podium and the field');
  /* NOTE ON ASSERTING AGAINST THIS HTML. A Next page carries the rendered
     markup AND the RSC flight payload, so every string appears about twice —
     counting occurrences is meaningless. And the medals are lowercase in the
     source (`1st`); CSS uppercases them. Assert on what is in the bytes. */
  check(
    'podium renders a step per placed ad',
    ['>1st<', '>2nd<', '>3rd<'].every((m) => slotPage.includes(m)),
    'expected all three medals in the markup'
  );
  check(
    'the steps animate up from the floor',
    slotPage.includes('animate-grow') && slotPage.includes('origin-bottom')
  );
  check('websites are shown', slotPage.includes('charlie.example.com'));
  check('tags are shown', slotPage.includes('Leader') && slotPage.includes('Tie-breaker'));
  check(
    'the house ad shows a dash, not a rupee figure it never paid',
    slotPage.includes('HouseBrand') && !/HouseBrand[\s\S]{0,400}₹0/.test(slotPage)
  );

  console.log('\nThe ask');
  // Charlie leads at ₹5,000 and the step is ₹100, so the ask is ₹5,100.
  check(
    'ask = leader + step',
    slotPage.includes('5,100'),
    'expected ₹5,100 on the page'
  );

  console.log('\nServing and counting');
  check('the leader is what serves in the embed', embed.includes('Charlie'));
  const before = await sql`SELECT coalesce(sum(views),0)::int AS v FROM sm_stat
                           WHERE ad_id IN (SELECT id FROM sm_ad WHERE slot_id = ${slot.id})`;
  await fetch(`${BASE}/embed/${SLUG}`);
  const after = await sql`SELECT coalesce(sum(views),0)::int AS v FROM sm_stat
                          WHERE ad_id IN (SELECT id FROM sm_ad WHERE slot_id = ${slot.id})`;
  check('a view is recorded', after[0].v > before[0].v, `${before[0].v} → ${after[0].v}`);

  const hop = await fetch(`${BASE}/api/go?ad=${alphaId}`, { redirect: 'manual' });
  check(
    'the click hop redirects to the real destination',
    hop.status === 307 && (hop.headers.get('location') ?? '').includes('alpha.example.com'),
    `${hop.status} → ${hop.headers.get('location')}`
  );
  const clicks = await sql`SELECT coalesce(sum(clicks),0)::int AS c FROM sm_stat WHERE ad_id = ${alphaId}`;
  check('a click is recorded', clicks[0].c > 0, `clicks=${clicks[0].c}`);

  console.log('\nExpiry (fixed slots)');
  const [fixed] = await sql`
    INSERT INTO sm_slot (public_id, name, kind, shape, price_paise, active)
    VALUES (${SLUG + '-fixed'}, 'Verify fixed', 'fixed', 'card', 250000, true) RETURNING id`;
  await sql`INSERT INTO sm_ad (slot_id, profile_id, format, brand, headline, url,
                               amount_paise, status, first_paid_at, ends_at)
            VALUES (${fixed.id}, ${ids.alpha}, 'card', 'Expired', 'Expired headline',
                    'https://expired.example.com', 250000, 'live',
                    now() - interval '60 days', now() - interval '1 day')`;
  const fixedPage = await fetch(`${BASE}/slot/${SLUG}-fixed`).then((r) => r.text());
  check('an expired ad stops serving', !fixedPage.includes('Expired headline'));
  await sql`DELETE FROM sm_slot WHERE public_id = ${SLUG + '-fixed'}`;

  console.log('\nEvery shape serves');
  /* A slot's shape decides the height the host page reserves, so a shape that
     renders nothing is a hole in somebody's sidebar. Check all three. */
  for (const shape of ['card', 'banner', 'rail']) {
    const id = `${SLUG}-${shape}`;
    const [sl] = await sql`
      INSERT INTO sm_slot (public_id, name, kind, shape, price_paise, active)
      VALUES (${id}, ${'Verify ' + shape}, 'fixed', ${shape}, 250000, true) RETURNING id`;
    await sql`INSERT INTO sm_ad (slot_id, profile_id, format, brand, tag, headline, url,
                                 amount_paise, status, first_paid_at)
              VALUES (${sl.id}, ${ids.alpha}, 'card', ${'Shape' + shape}, 'Shape test',
                      ${shape + ' headline'}, 'https://shape.example.com', 250000, 'live', now())`;
    const html = await fetch(`${BASE}/embed/${id}`).then((r) => r.text());
    check(`${shape} embed serves its ad`, html.includes(`${shape} headline`));
    await sql`DELETE FROM sm_slot WHERE public_id = ${id}`;
  }

  console.log('\nSlug collisions');
  /* Force the exact failure the retry exists for: a slug that already exists.
     Before the retry, this was an unhandled unique-violation — a crash with no
     message rather than "try again". */
  const taken = 'zz-verify-taken';
  await sql`INSERT INTO sm_slot (public_id, name, kind, shape, price_paise)
            VALUES (${taken}, 'Taken', 'fixed', 'card', 100000)`;
  let threw = false;
  try {
    await sql`INSERT INTO sm_slot (public_id, name, kind, shape, price_paise)
              VALUES (${taken}, 'Taken again', 'fixed', 'card', 100000)`;
  } catch {
    threw = true;
  }
  check(
    'a duplicate public_id is refused by the database',
    threw,
    'the UNIQUE constraint is what the retry loop is guarding against'
  );
  await sql`DELETE FROM sm_slot WHERE public_id = ${taken}`;

  console.log('\nGates and abuse');
  for (const [path, want] of [['/studio', 307], ['/me', 307]]) {
    const r = await fetch(`${BASE}${path}`, { redirect: 'manual' });
    check(`${path} is gated`, r.status === want, `got ${r.status}`);
  }
  const bad = await fetch(`${BASE}/api/go?ad=not-a-uuid`);
  check('a malformed ad id is a 400, not a 500', bad.status === 400, `got ${bad.status}`);
  const forged = await fetch(`${BASE}/api/webhooks/dodo`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'payment.succeeded', data: { payment_id: 'x' } })
  });
  check('an unsigned webhook is rejected', forged.status === 401, `got ${forged.status}`);
} finally {
  await cleanup();
}

console.log(`\n${pass} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  · ${f}`);
  process.exit(1);
}
console.log('All good.\n');
