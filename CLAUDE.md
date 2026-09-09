# CLAUDE.md — Sponsor Me

> **Rebuilt from scratch on 2026-09-09.** Two earlier platforms lived here (a
> points-economy placements marketplace, then "SponsorBid" on a vendored CSS
> design system). Both were deleted, not migrated, along with their `bms_*` and
> `sb_*` tables. If you find references to points, placements, channels,
> memberships, `lib/proto/`, or the Swarnil Design System in old commits, they
> describe what this replaced. This file describes what is here.

When code and this file disagree, this file wins. When this file and a chat
instruction disagree, ask before proceeding.

---

## §0 — What this is

A single-creator ad platform. The creator makes **slots**, pastes a tag on their
sites, and sponsors buy them. Single-tenant by design — **never generalise it
multi-tenant.**

### The one idea: a slot has a `kind`

```
kind = 'fixed'   Somebody buys it. Their ad serves. Done.
kind = 'bid'     Everybody bids. Highest bid serves; the rest are visible on
                 the leaderboard, waiting to overtake.
```

Both kinds are the **same table**, sell the **same ad formats**, and share the
**same embed**. Only *who gets served* differs, and that is one `ORDER BY` in
`winnerFor()`. Modelling them as two products would mean two of everything to
express one branch.

A bid is a **lifetime total**: paying again adds to it, which is how you climb,
and it means nobody is ever refunded when overtaken.

### Three rules the code keeps

1. **A number is real or it is absent.** Nothing invents a view count or a
   reach figure. No data renders as *nothing*, never a zero dressed as a
   measurement. The seed plants no ads, payments or impressions.
2. **The server prices everything.** No amount is read from a form. A fixed
   slot's total is its own row times a whitelisted term; a bid's minimum is the
   live leader plus the slot's step.
3. **Nothing serves on a redirect.** Ads activate in the signed webhook and
   nowhere else. A browser at a success URL is not evidence money moved.

---

## §1 — Layout

```
app/
  page.tsx            THE homepage — hero, marquee, bid slots (with the
                      leaderboard), fixed slots, formats, how-it-works.
  slot/[slug]/        Buy it or bid on it. Write the ad, then pay.
  me/                 The sponsor's page: every ad they run, on one screen.
  studio/             The creator's page: make slots, get tags, approve ads.
  signin/ signup/
  embed/[slug]/       What loads in the iframe on the creator's sites.
  api/auth/[...path]/ Neon Auth proxy, so the cookie is same-origin.
  api/webhooks/dodo/  The only place money becomes true.
  api/go/             The click hop: counts, then redirects.
  globals.css         Tailwind v4 + the theme (§4).
lib/
  site.ts     slot kinds, shapes, formats, terms — the config
  db/         schema, client, neon-auth mapping
  roles.ts    who is the creator; every gate
  queries.ts  every read; `winnerFor()` decides who serves
  actions.ts  every write
  creative.ts what a sponsor may submit; the URL allowlist
  track.ts    view/click counting
  money.ts    integer paise ↔ rupees
components/   flat, no barrels
public/sponsor.js   the embed script — vanilla, zero deps
```

---

## §2 — Data

Five tables, `sm_*`. **Money is always `integer` paise.** Never a float.

| Table | Purpose |
|---|---|
| `sm_profile` | one row per account, FK → `neon_auth.user.id` |
| `sm_slot` | what is for sale: `kind`, `shape`, `price_paise`, `step_paise` |
| `sm_ad` | one ad per sponsor per slot: creative + lifetime `amount_paise` |
| `sm_payment` | append-only; `dodo_payment_id` UNIQUE = the idempotency key |
| `sm_stat` | views/clicks per ad per day; UNIQUE(ad, day) so the upsert works |

**Rank is never stored.** `ORDER BY amount_paise DESC, first_paid_at ASC` lives
in `contendersFor()` and nowhere else may have an opinion about ordering.

**`db.batch`, never `db.transaction`** — the neon-http driver throws the instant
a transaction opens. A batch cannot read mid-way, so every read happens first.

**Two constraints Postgres enforces, not the app** (`drizzle/manual/`, applied
by `npm run setup`):
- `001` the `neon_auth` FK, which drizzle-kit must never touch.
- `002` UNIQUE(slot, profile) — one ad per sponsor per slot. The app reads
  before inserting, and two simultaneous requests both find nothing and both
  insert; the database is the only arbiter that cannot lose that race. Without
  it a sponsor splits their own bid across two rows and loses to someone who
  paid less.

⚠️ **`npm run db` creates tables fine and cannot ALTER them.** Its diff emits
`ALTER TABLE x DROP CONSTRAINT "x_col_not_null"` for every NOT NULL column — a
Postgres 17 feature this branch lacks — and aborts with 42P16. Changes to
existing tables go in `drizzle/manual/` and are applied by `npm run setup`.

---

## §3 — Auth

Neon Auth (Better Auth, hosted by Neon, writing into `neon_auth` in our own
database). Email + password only.

- `getAuth()` and the DB client are **lazy** — `next build` imports every route
  to collect page data, and a top-level construction would make the build
  require credentials. Building needs none; serving does.
- **The creator is whoever matches `CREATOR_EMAIL`**, not a column, so admin
  cannot be granted by a stray UPDATE. Unset, it falls back to the oldest
  account **and that grants admin**; the studio says so out loud.
- **Every route reading the session must be dynamic.** Get it wrong and Next
  prerenders a signed-out page and serves it to everyone.
- A revoked cookie reads as "signed out", never a 500 — see the comment in
  `lib/roles.ts` for why that `catch {}` is correct rather than lazy.

---

## §4 — Design

**Tailwind v4**, configured entirely in `app/globals.css` — there is no
`tailwind.config`. The palette is lifted from imswarnil.com's design system in
OKLCH, so this app is the same colours as the rest of the network.

| Hue | Meaning |
|---|---|
| `ink` (275) | everything structural |
| `signal` (34) | the brand's orange-red. The primary action, rationed. |
| `craft` (78) | **gold — first place, and almost nothing else** |
| `teal` / `iris` / `mint` / `azure` | one per section, so the page has rhythm |

**The rule that stops it being a clown car: a colour means a thing.** Gold is
rank one. Signal is "do this". The rest is a section's personality, never a
control.

The look is built from four component classes in `globals.css` — `.card-pop`,
`.btn-pop`, `.sticker`, `.field-pop` — all sharing one device: a hard 2px edge
and an offset **solid** shadow, never a blur. That single decision is what makes
it read as a sticker book instead of a dashboard.

**A leaderboard is not a grid.** A grid says "here are some things, equally". A
leaderboard says "these are in an ORDER, and the order is the point". So
`components/leaderboard.tsx` is one column of rows with three ranking devices:
a medal, a size difference, and a bar whose width is that bid's share of the
leader's — so the *gap* is a picture rather than arithmetic.

---

## §5 — Dependencies

`next`, `react`, `drizzle-orm`, `drizzle-kit`, `@neondatabase/auth`,
`@neondatabase/serverless`, `dodopayments`, `standardwebhooks`, `zod`,
`server-only`, `dotenv`, `tailwindcss`, `@tailwindcss/postcss`, `postcss`.

That is the list.

**This is a pnpm project — `npm install` corrupts the tree.** `npm run <script>`
is fine; `npm install` is not.

**Postinstall scripts are allowlisted in `pnpm-workspace.yaml`, not in
package.json.** pnpm 12 stopped reading `pnpm.onlyBuiltDependencies` from
package.json: leaving it there makes `pnpm install` warn and then fail with
`ERR_PNPM_IGNORED_BUILDS`. Each entry under `allowBuilds` is an explicit
yes/no, because "allow everything" is how a dependency's postinstall gets to
run arbitrary code on your machine. `@tailwindcss/oxide`, `esbuild` and
`workerd` are on; `sharp` and `core-js` are off and say why.

No icon package: icons are emoji or inline SVG. No charting library.

**Dead code is deleted, not kept "just in case".** `lib/money.ts` is one
function because one is all anything calls; `lib/auth/actions.ts` has sign-in,
sign-up and sign-out because this build has no other auth pages; the
`neon_auth` Drizzle mapping is gone because nothing read it (the FK it
documented lives in `drizzle/manual/001`). If you add a password-reset page,
the action comes back with it.

---

## §6 — The widget

```html
<script src="https://sponsor.imswarnil.com/sponsor.js" data-slot="top-spot" async></script>
```

- **An iframe, not injected HTML.** It cannot read the host's cookies or DOM,
  and its CSS cannot be broken by the host's stylesheet — injected ad markup
  inherits whatever the host does to `a` and `img`, and looks broken on exactly
  the sites paying for it.
- **The height is reserved before the frame loads**, and the frame only ever
  *grows*; a shrink pulls the page up under the reader's cursor.
- **`/embed/*` must never read the session.** `frame-ancestors *` lets anyone
  frame it, and a framable page that knows who is looking is a clickjacking
  surface. That is why the embed has its own layout.
- **Nothing about the reader is collected** — no IP, no user agent, no cookie,
  no visitor id. A per-day counter is all a sponsor was sold.
- **Sponsor HTML never touches this origin's DOM.** `format = 'html'` renders
  into a `sandbox=""` srcDoc iframe. Injecting it — even "just for trusted
  sponsors" — would be a stored XSS with a price list attached.

---

## §7 — Running it

```bash
pnpm install        # NOT npm — see §5
npm run db          # push the schema (drizzle-kit)
npm run setup       # constraints, accounts, slots. Add `dodo` to also make
                    # the payment product: `npm run setup dodo`
npm run dev         # foreground, Ctrl-C to quit
npm run start | stop | restart | status | logs   # background server
npm run check       # tsc --noEmit
npm run build | preview | deploy
```

Thirteen scripts, and every one is a verb somebody types. There is one shell
script (`scripts/dev.sh`, the server) and one node script (`scripts/setup.mjs`,
the database) — the three separate `apply-sql` / `seed` / `dodo-setup` files
were three files calling the same two libraries in a fixed order.

**The port lives in exactly one place: `PORT` in `scripts/dev.sh` (3500).**
`package.json` calls the script rather than repeating the number — when it was
written in both, the two drifted apart twice in one afternoon.

**Never run `npm run build` while the dev server is up.** Both write `.next`;
the build clobbers the dev server's chunks and the page stops hydrating with no
error anywhere. Stop → build → `rm -rf .next` → start.

---

## §8 — Deployment

Cloudflare Workers via OpenNext. `npm run preview` / `npm run deploy`.

- **PPR is off**, with the argument in `next.config.ts`: it flushes a 200 shell
  before the route runs, so `redirect()` in a gate cannot set the status. Gates
  answered 307 in dev and 200 on the Worker for the same request.
- Secrets via `wrangler secret put`, never in `wrangler.jsonc` (it is
  committed). `CREATOR_EMAIL` is **not optional in production** (§3). Do not set
  `DEMO_EMAIL`/`DEMO_PASSWORD` there.
- Neon Auth must be told to trust each origin that signs in.
- `sponsor.imswarnil.com` does not resolve yet; a Worker Route attaches to an
  existing **proxied** DNS record, so the record comes first.

---

## §9 — Security

- **Webhook**: signature verified before the body is believed; the amount comes
  from *our* payment row, never the payload (a signature proves the sender, not
  the figure); `status = 'pending'` in the WHERE makes redelivery a no-op; the
  ad is credited in SQL (`amount + n`) so two payments cannot erase each other.
- **Click hop**: destination read from the database, never the query string. An
  open redirect on the creator's domain is a phishing tool with his name on it.
  A malformed id is a 400, not a 500.
- **URLs**: parsed and protocol-checked against an http/https allowlist, never
  pattern-matched — `javascript:` in an href executes on the host's page.
- **Sponsor HTML**: sandboxed iframe, no scripts, no same-origin (§6).
- **Authorization is in the WHERE clause**: owner-scoped writes predicate on
  `profileId`, so a guessed uuid rewrites nothing.
- **Editing a live ad returns it to `pending`** — otherwise: get something mild
  approved, then swap the copy.
- **Sign-out is a POST**, so a prefetch or an `<img>` cannot trigger it.

**Still open:** email verification (signup auto-confirms), rate limiting (needs
Redis/Upstash), a strict `script-src` CSP, and refund/dispute handling (webhook
acknowledges and ignores them).

---

## §10 — State

- Schema pushed, both constraints applied, creator + demo accounts seeded, four
  slots seeded (one `bid`, three `fixed`). Old `bms_*` and `sb_*` tables dropped.
- **Verified locally**: gates 307 signed-out; homepage, slot page and studio all
  render (studio checked with an authenticated smoke test — slots, tag, review
  queue and sponsor table all present); the embed serves the winning ad and
  records a view; the click hop 307s to the real destination; a malformed ad id
  is 400; an unsigned webhook is 401.
- **No real checkout has been put through, even in test mode.** That is the
  first item in §11, and it is first for a reason.
- The board is **empty on purpose** (§0, rule 1).

---

## §11 — What is left

### Put a payment through, end to end

**Before anything else.** The checkout builds a Dodo session and the webhook is
written against Dodo's documented payload and correctly rejects unsigned
deliveries (verified, 401). But **no payment has completed even in test mode**,
so the success path is unexercised.

- [ ] `npm run setup dodo`, set the `DODO_PRODUCT_ID` it prints.
- [ ] Create a webhook endpoint in Dodo, set `DODO_PAYMENTS_WEBHOOK_KEY`.
      Without this key the webhook rejects every delivery and no ad ever goes
      live — the correct failure, but a silent one.
- [ ] Tunnel `/api/webhooks/dodo` (`cloudflared tunnel --url http://localhost:3500`).
- [ ] Buy a fixed slot. Confirm `sm_payment` goes `pending → paid`, the ad moves
      to `pending`, and it only serves after you approve it in `/studio`.
- [ ] Bid on the bid slot twice from one account. Confirm `amount_paise` ADDS
      up and `first_paid_at` is set once, not overwritten.
- [ ] Deliver the same webhook twice — the second must be a no-op.

### Deploy, in this order

1. [ ] **DNS first** — a Worker Route attaches to a record that already exists.
       Add a **proxied** record for `sponsor` in the `imswarnil.com` zone.
2. [ ] `wrangler secret put` for each name in `.env.example` except the demo
       pair. `CREATOR_EMAIL` must not be skipped.
3. [ ] Trust the production origin in Neon Auth, or sign-in fails in production
       while working perfectly on localhost.
4. [ ] `npm run deploy`, then check the gates answer **307** and not 200.
5. [ ] Point the Dodo webhook at the real URL.

### `drizzle-kit push` cannot ALTER this database

Its diff emits `ALTER TABLE x DROP CONSTRAINT "x_col_not_null"` for every NOT
NULL column — a Postgres 17 feature this branch lacks — and aborts with 42P16.
Creating tables works; altering them does not. Until fixed, schema changes go
in `drizzle/manual/` and are applied by `npm run setup`.

- [ ] Upgrade `drizzle-kit` (0.31.1 → 0.31.10) with **pnpm**, and re-test
      against a Neon *branch*, not the live database.
- [ ] If push still cannot alter, switch to `drizzle-kit generate` + versioned
      migrations, which do not diff.

### Known gaps

- [ ] **An expired fixed ad still shows on the sponsor's own page.**
      `contendersFor()` correctly stops serving it, but `/me` renders every ad
      the sponsor has without saying "this run has ended". Add the state.
- [ ] **Refunds and disputes** are acknowledged and ignored, so a refunded ad
      keeps serving. Decide the policy before writing the handler.
- [ ] **Email verification** — signup auto-confirms, and no transactional email
      is configured at all, so password resets do not arrive. (There are no
      forgot-password pages in this build.)
- [ ] **Rate limiting** on the actions. Needs Redis/Upstash.
- [ ] **A strict `script-src` CSP.**
- [ ] **Per-slot stats in the studio** — `sm_stat` has the data, the studio only
      shows platform totals.

### Ideas

- A public JSON feed of a slot, so a theme could render the ad natively instead
  of through an iframe.
- Let a sponsor schedule a bid increase, to defend a rank while asleep.
- Show a sponsor the *second* place amount, so they know how safe they are.
