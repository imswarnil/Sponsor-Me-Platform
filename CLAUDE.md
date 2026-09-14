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
  page.tsx            THE homepage — eight stacked sections, in the order a
                      sponsor asks them: hero (the real unit at real sizes),
                      ticker, the two kinds, the race (board + simulator),
                      fixed slots, how-it-works, analytics, the deal, FAQ,
                      activity + sign-up.
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
  layout.tsx    Container / Section / SectionHead / Figure / Stat / Empty
  chrome.tsx    Wordmark, Header, Footer   nav.tsx  the menu + scroll-spy
  leaderboard.tsx  Podium + Field, @container-responsive
  analytics.tsx / charts.tsx   the panel, and Sparkline + Meter
  bid-simulator.tsx  "what would it take?" against the live board
  hero-showcase.tsx  the real ad at the three shapes' real sizes
  icons.tsx     24-grid strokes; no icon package, no emoji
  theme-toggle.tsx / reveal.tsx / faq.tsx
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
`tailwind.config`.

> **Rebuilt on 2026-09-14.** The previous design was a *visible twelve-column
> grid*: hairline columns fixed behind the page, `.rig` / `.bay` / `.band`,
> one hairline weight, square corners, an OKLCH palette named
> `ink`/`signal`/`craft`/`teal`/`iris`/`mint`, and a mono uppercase `.label`
> on everything. All of it is gone — the palette, `components/rig.tsx`, and
> the `.panel` / `.btn` / `.label` / `.field` / `.tnum` classes. If you find
> those names anywhere, they are from before this date.

### THE IDEA: DEPTH BY TINT, NOT BY LINE

Four background levels and one nearly-invisible border. Surfaces separate by
**tone**, not by outline: a card is a step up from the page, not a box drawn
around content. Corners are round, buttons are pills, brand marks are circles,
and hierarchy is carried by weight and colour on a four-step text ladder
(`contrast → foreground → secondary → mute`).

### Every value is a `--sponsor-*` token

The token block at the top of `globals.css` is the whole contract. Nothing in
this app may invent a colour, a radius, a font or a spacing step — if a value
is needed it is added there and used by name. Tailwind sees them through
`@theme inline`, which matters: `bg-surface-100` compiles to
`background-color: var(--sponsor-color-background-100)`, so the utility
follows the token and the token follows the theme.

`--color-*: initial` clears Tailwind's stock palette, so `bg-gray-500` and
`text-white` do not exist. That is deliberate — a colour you cannot name in
the token file is a colour you cannot use.

| Meaning | Token |
|---|---|
| structure, text, surfaces | `--sponsor-color-{contrast,foreground,secondary,mute,background,background-100/200/300,border}` |
| **"do this"** — rationed to one control per view | `--sponsor-accent`, `-hover`, `-ink`, `-soft`, `-foreground` |
| **first place, and nothing else** | `--sponsor-gold`, `-fill`, `-line`, `-soft` |
| states | `--sponsor-color-{success,error}` + `-soft` |

**A colour means a thing.** Gold is rank one. The accent is the primary
action. Nothing is a section's personality — that was the old design's rule
and it is not this one's.

### Dark mode is decided once, in that file

`[data-color-scheme='dark']` and `@media (prefers-color-scheme: dark)
[data-color-scheme='system']` re-declare the same names. **No component
anywhere carries a dark-mode branch, and none should.** Three consequences
worth knowing:

- The blocks key off the **attribute**, not `:root`, so a subtree can be
  pinned to a scheme. That is how `/embed` honours `data-theme` on a host's
  script tag.
- Light values are declared on `:root, [data-color-scheme='light']` together —
  without the second selector, a subtree asking for light inside a dark root
  would simply inherit dark.
- `app/layout.tsx` writes the attribute in an inline pre-paint script and the
  `<html>` element carries `suppressHydrationWarning`. That is **required**,
  not cosmetic: React would otherwise reconcile the attribute back to
  `"system"` and flash the wrong theme.

### Component classes, not utility soup

`.sp-*` in the `components` layer: `sp-container` / `sp-section` / `sp-rule`,
`sp-card` / `sp-panel` / `sp-lift` / `sp-rows`, `sp-btn` (+ `-solid` `-soft`
`-outline` `-quiet` `-danger` `-sm` `-lg` `-icon` `-block`), `sp-seg`,
`sp-field` (+ `-area`, `sp-select`, `sp-money`), `sp-choice`, `sp-badge`,
`sp-mark`, `sp-callout`, `sp-code`, `sp-table`, `sp-faq`, `sp-sheet`,
`sp-nav-link`, `sp-display` / `sp-h1..h4` / `sp-lead` / `sp-eyebrow` /
`sp-num` / `sp-link`, and the chart parts `sp-track` / `sp-col` /
`sp-chart-rules` / `sp-ordinal`.

Two that are easy to get wrong:

- **`.sp-card` is tinted; `.sp-panel` is bordered white.** A form gets a
  panel, because the fields inside it are already tinted planes and a tint
  inside a tint is mush.
- **`.sp-num` on every figure.** Tabular numerals, so a number that changes
  while somebody is looking at it never reflows its row.

### Patterns, and the tone trap they exist to avoid

`sp-dots`, `sp-rings`, `sp-glow`, `sp-glow-gold`, `sp-stripes` (which is what
"unsold" looks like), plus `sp-fade-b/-t/-x` masks, all drawn from
`--sponsor-color-border` / `-background-300` / `-accent-soft` so they re-tone
with the theme. They live on a `.sp-backdrop` layer with content in
`.sp-fore`, never on the content's own box.

⚠️ **This is why sections use a pattern rather than a tint.** A card in this
system *is* a tint — one step up from the page — so painting a section that
same step makes every card in it vanish and the reading inverts: the gaps look
like panels. `Section`'s `pattern` prop gives rhythm without spending the one
tone the cards need. `.sp-plane` still exists, but **only** for sections whose
content is bordered white panels: `app/page.tsx` has exactly two.
The same trap bit the leaderboard's share bar, which is `surface-200` for the
same reason.

### A leaderboard is not a grid

`components/leaderboard.tsx` says the order twice on purpose:

- **`Podium`** — 2nd, 1st, 3rd at three real heights, so the gap is visible
  before a figure is read. **Bar heights are computed from the amount**
  (`STEP_MAX`/`STEP_MIN`): three fixed heights made a runaway leader and three
  near-equal bids draw the same picture, which is the one thing a podium
  exists to tell apart. The three fills are gold, `mute` and `background-300`
  — a ladder with real gaps, because two adjacent background steps read as one
  colour and a mistake. `scripts/verify.mjs` reads `STEP_MAX` out of this file
  rather than duplicating it.
- **`Field`** — everybody in order, each row backed by a bar whose width is
  their share of the leader's.

**An entry is an ADVERT, not a table row**: mark, brand, website, what they do,
and a CTA that goes somewhere. A missing logo falls back to the initial on a
tinted disc — and the `img` carries `onError` to REMOVE itself, because it has
a white backing and a 404 would otherwise paint a blank disc over that
fallback.

**The board is responsive to its CONTAINER, not the viewport** (`@container`).
It renders in a 300px sidebar, a wide article, and this site's own pages from
one component — and inside an iframe the viewport IS the iframe, so a viewport
query would be wrong in the one place that matters most. The podium needs
~672px of container before it lays three abreast, which is why the homepage
gives it 8 of 12 columns at `--sponsor-container-max--width`.

### Interactive parts

None of these is decoration; each answers a question the page was otherwise
asking the reader to imagine.

| Component | What it is for |
|---|---|
| `bid-simulator.tsx` | Type an amount, see where it lands on the **real** board — rank, who you pass, what is still above. Nobody should have to sign up and reach a checkout to learn they are ₹500 short. Uses the database's own tie rule (`>=`, so matching the leader leaves you second) and says out loud that it is a preview, not a quote. |
| `hero-showcase.tsx` | The real winning ad, at the three shapes' true pixel sizes, inside a pretend host page. |
| `analytics.tsx` | One metric at a time (views / clicks / rate) over 7 or 30 days, with a hover readout. One series because views and clicks differ by two orders of magnitude: on a shared axis the clicks are a flat line, on two axes the chart lies. |
| `charts.tsx` | `Sparkline` and `Meter`, hand-drawn SVG. A flat-zero series draws **nothing** — a line along the floor implies a measurement. |
| `nav.tsx` | Sections inline on wide screens with an IntersectionObserver marking the one on screen; a sheet on narrow ones. |
| `reveal.tsx` | Withholds opacity until near the viewport. Fails **open**: reduced motion and `scripting: none` both force it visible in CSS. |
| `theme-toggle.tsx` | light / dark / **system** — three states, because a reader whose laptop flips at sunset wants the site to flip with it. |
| `faq.tsx` | Native `<details>`: works with JS off, and find-in-page searches closed answers. |

**A money field must blur on wheel.** `onWheel={(e) => e.currentTarget.blur()}`
on both amount inputs: Chrome silently rewrites a focused `<input type=number>`
when the page scrolls past it, and these are rupees.

### Icons, not emoji

`components/icons.tsx` — 24-grid strokes at `strokeWidth 1.75`, inheriting
`currentColor`. Emoji used to do this job and it read as a toy: an emoji is
rendered by the reader's OS, so its weight, colour and size are all outside
this system's control. `lib/site.ts` no longer carries an `emoji` per format
or a palette `tone` per slot kind — both were the design leaking into the
config.

### Type

**Geist** and **Geist Mono** (`next/font/google`), one family for headings,
body and controls. Sizes come from `--sponsor-font-{display,h1..h4,large,
small,x-small}`; `display` and `h1`/`h2` are `clamp()`d so no heading wraps to
three lines on a phone.

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

**No icon package and no charting library**, and both are load-bearing
decisions rather than omissions: `components/icons.tsx` is fifteen 24-grid
strokes, and every chart in this app is one series of daily integers —
`components/charts.tsx` draws them as a polyline and a `<div>`. A library for
that is 40kB to avoid twenty lines.

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
- **The host chooses the theme, not us and not the session.** `data-theme` on
  the script tag (`"light"` | `"dark"`) is forwarded as `?theme=` and pins the
  unit; left off, it follows the reader's own system setting. The value is
  whitelisted in both places — it lands in a URL and then in an HTML
  attribute, and the set of legal schemes is three words long. The embed paints
  **no background** (`body:has(.sp-embed)`), because a white plate behind a
  transparent unit is a white box on somebody's dark site.
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

**`npm run demo` is FAKE and says so.** Eight invented sponsors, so the board
can be looked at. It stays honest about itself in two ways: every row is
self-identifying (`demo-*@example.com` accounts, `demo_` payment ids) so
`npm run demo clean` removes all of it, and each bid gets a matching
`sm_payment` so the studio's "collected" agrees with the board. A demo where
the leaderboard says ₹12,000 and the studio says ₹0 is not a demo, it is a bug
report. **Run `npm run demo clean` before this is shown to anyone who might
read it as real revenue.**

**`npm run verify` is the one that matters before a deploy.** It creates a
throwaway slot and a deliberately awkward field of ads — a TIE on amount, a
house ad, a paid-but-unapproved ad, an expired one, a zero-amount draft — then
drives the real pages over HTTP and asserts what came back, cleaning up in a
`finally`. A happy-path test passes on all five of those while the product is
broken, which is why they are the cases. It runs against production too, and
should.

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
- **Verified locally**: `npm run verify` is **30/30**. Gates 307 signed-out;
  homepage, slot page, studio and both auth pages render; the embed serves the
  winning ad and records a view (and honours `?theme=`); the click hop 307s to
  the real destination; a malformed ad id is 400; an unsigned webhook is 401.
- **The redesign was checked in a real browser**, light and dark: the podium
  lays three abreast, the analytics panel switches metric and shows its hover
  readout, the mobile sheet opens and closes on Escape, and no hydration
  warning is logged. Four things that only a browser would have found are
  fixed: the `<html>` hydration mismatch from the pre-paint theme script, a
  money `<input type=number>` silently rewritten by a mouse wheel, and two
  tone collisions where a tinted card or bar sat on an equally tinted plane
  (§4, "the tone trap").
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

- [x] ~~**An expired fixed ad still shows on the sponsor's own page.**~~
      Fixed 2026-09-14: `/me` reads `endsAt`, shows an **Ended** badge, says
      the run has ended and how to restart it, and labels the date "Ran until"
      rather than "Runs until".
- [ ] **Refunds and disputes** are acknowledged and ignored, so a refunded ad
      keeps serving. Decide the policy before writing the handler.
- [ ] **Email verification** — signup auto-confirms, and no transactional email
      is configured at all, so password resets do not arrive. (There are no
      forgot-password pages in this build.)
- [ ] **Rate limiting** on the actions. Needs Redis/Upstash.
- [ ] **A strict `script-src` CSP.**
- [x] ~~**Per-slot stats in the studio.**~~ Fixed 2026-09-14:
      `perSlotStats()` gives the studio a **By slot** table — views, clicks,
      rate, revenue and a 30-day sparkline per slot — under an `Analytics`
      panel of the platform total. `/me` gets the same panel for the
      sponsor's own ads, plus a sparkline and a position meter per ad.
      Zero-filling a window does not break §0 rule 1 (a day inside the window
      with no row is a measured zero), but the panel is only drawn when a real
      total exists; otherwise `EmptyAnalytics` says nothing has been counted.

### Ideas

- A public JSON feed of a slot, so a theme could render the ad natively instead
  of through an iframe.
- Let a sponsor schedule a bid increase, to defend a rank while asleep.
- Show a sponsor the *second* place amount, so they know how safe they are.
