# CLAUDE.md — sponsor.imswarnil.com (SponsorBid)

> **Rebuilt from scratch on 2026-09-09.** Everything before that commit — a
> points-economy placements marketplace with channels, offers, memberships and
> a Tailwind design layer — was deleted, not migrated. The `bms_*` tables are
> dropped by `npm run db:legacy`. If you find references to points, placements,
> channels, `lib/proto/`, membership tiers or Tailwind in old commits, they
> describe the platform this replaced. This file describes what is actually here.

This file is the rulebook. When code and this file disagree, this file wins.
When this file and a chat instruction disagree, ask before proceeding.

---

## §0 — What this is

A single-tenant advertising platform for one creator (Swarnil). It sells **two
things**, and keeping them distinct is the whole architecture:

| | What it is | Priced | Expires? |
|---|---|---|---|
| **SponsorBid** | A lifetime leaderboard, outbid-style, syndicated to every site in the network. #1 renders large, #2 and #3 render small beside it. | One payment, added to your lifetime total. Pay more to climb. | **Never.** Held until somebody outbids you. |
| **Slots** | A named position on one site, bookable for a fixed number of months. | `sb_slot.price_paise` per month. | Yes — and the next brand books the window after yours. |

There is no publisher-side signup and no marketplace: `/studio` is Swarnil's own
admin, everybody else who signs up is an advertiser. **Never generalise this
multi-tenant.**

### Three rules that are not negotiable

1. **A number is real or it is absent.** Nothing in this codebase invents a view
   count, a reach figure or a placeholder. `sb_slot.monthly_views` is `NULL`
   when nothing was measured, and a `NULL` renders as *no row at all* — never a
   zero, which would read as a measurement. The seed script deliberately seeds
   no bids, no payments and no impressions for the same reason.
2. **The server prices everything.** No amount is ever read from a form. A bid's
   minimum comes from the live leaderboard; a booking's total is the slot's own
   row times a whitelisted month count. The browser chooses *what* to buy, never
   *for how much*.
3. **Nothing goes live on a redirect.** A browser arriving at `/dashboard?paid=1`
   is not evidence money moved. Ads activate in the signed webhook and nowhere
   else.

---

## §1 — Architecture

One Next.js App Router app at the repo root. No monorepo, no workspace.

```
app/
  page.tsx              THE homepage — board, podium, ladder, slots, network,
                        advantages, activity. Deliberately one page: somebody
                        deciding whether to sponsor needs all of it in one
                        scroll, and four routes only add places to leave.
  signin/ signup/ forgot-password/ reset-password/
  dashboard/            the advertiser's console — one page
  studio/               the creator's console — one page (+ messages/[id])
  slot/[publicId]/      book a window; shows the REAL page in an iframe first
  embed/board/          the widget that renders on the network
  api/auth/[...path]/   Neon Auth proxy, so the cookie is same-origin
  api/webhooks/dodo/    the only place money becomes true
  api/click/            the click hop: counts, then redirects
  swarnil-design.css    VENDORED. Never hand-edit — `npm run ds:sync`
  app.css               app-owned design layer (§4)
lib/
  site.ts               the network, the bid ladder, the ad kinds, the formats
  money.ts              integer paise ↔ rupees, and nothing else
  db/{schema,client,neon-auth}.ts
  roles.ts              who is the creator; every gate
  queries.ts            every read
  actions.ts            every write
  creative.ts           what a sponsor may put in front of the audience
  track.ts              view/click counting
  dodo.ts               payments
components/             flat; no barrel files
public/sponsorbid.js    the embed script — vanilla, zero deps
drizzle/manual/         SQL drizzle-kit cannot generate
```

---

## §2 — Data model

Drizzle owns it (`lib/db/schema.ts`); `npm run db:push` diffs the file against
Neon directly. Eight tables, all prefixed `sb_`.

**MONEY IS ALWAYS `integer` PAISE.** Never numeric, never a float, never rupees.
`lib/money.ts` holds the only two functions allowed to convert, and
`rupeesToPaise` rejects anything that is not a positive whole number.

**RANK IS NEVER STORED.** The leaderboard is
`ORDER BY amount_paise DESC, first_paid_at ASC`, it lives in `rankedBids()`, and
nowhere else may have an opinion about ordering. A stored rank is a cache of one
ORDER BY that four code paths would have to remember to invalidate, and the
first one that forgets sells the top spot twice.

| Table | Purpose |
|---|---|
| `sb_profile` | one row per account, FK → `neon_auth.user.id` |
| `sb_bid` | one row per sponsor on the leaderboard: creative + **lifetime** total |
| `sb_slot` | a sellable position; `public_id` is what appears in the embed tag |
| `sb_booking` | one brand holding one slot for one window |
| `sb_payment` | append-only ledger; `dodo_payment_id` UNIQUE = the idempotency key |
| `sb_event` | views/clicks rolled up per day per ad — never one row per impression |
| `sb_message` | one thread per sponsor, with the creator |
| `sb_activity` | append-only feed: the homepage ticker and the audit trail, one table |

### `db.batch`, never `db.transaction`
The app talks to Neon over HTTP and that driver throws
"No transactions support in neon-http driver" the instant a transaction opens.
`batch` sends the statements in one request and Neon commits them together. The
cost: a batch cannot read mid-way, so **every read and check happens first, then
the writes go in one batch**.

### Two constraints Postgres enforces, not the app
- `drizzle/manual/001` — the `sb_profile → neon_auth.user` FK. drizzle-kit must
  never reach `neon_auth` (Neon provisions it), so this is applied separately.
- `drizzle/manual/002` — an **EXCLUSION constraint** stopping two paid bookings
  overlapping on one slot. `windowIsFree()` checks first to give a sponsor a
  sentence instead of an error, but two webhooks landing together both pass that
  check. The database is the only arbiter that cannot lose the race. Scoped to
  `status = 'paid'`, so an abandoned checkout holds no inventory.

---

## §3 — Auth

**Neon Auth** (Better Auth, hosted by Neon, writing into `neon_auth` in our own
database). Email + password only. There is no Google sign-in.

- `lib/auth/server.ts` — `getAuth()`, constructed **lazily**. `next build`
  imports every route to collect page data, so a top-level construction makes
  the build require credentials. Building needs none; serving does. Same
  reasoning for `lib/db/client.ts` and `lib/dodo.ts`.
- `lib/auth/actions.ts` — the only way a client component touches auth.
- **The creator is whoever matches `CREATOR_EMAIL`**, not a database column, so
  admin cannot be granted by a stray UPDATE — it takes a deploy. Unset, it falls
  back to the oldest account **and that fallback grants admin**; the studio says
  so out loud (`creatorEmailConfigured()`).
- **Every route that reads the session must be dynamic.** Both console layouts
  declare `export const dynamic = 'force-dynamic'` and it cascades. Get this
  wrong and Next prerenders a signed-out page and serves it to everyone.
- Session reads are memoised per request with React `cache()` — without it one
  render made five or six identical round-trips to the auth server.
- A revoked cookie reads as "signed out", never a 500. See the long comment in
  `lib/roles.ts` for why that `catch {}` is correct rather than lazy.

---

## §4 — Design

**No Tailwind. No PostCSS. No build step for CSS.** Two stylesheets:

| File | What | Rule |
|---|---|---|
| `app/swarnil-design.css` | The `@imswarnil/swarnil-design` **framework bundle**, vendored whole (58 KB gzipped). Tokens, elements, components, patterns, sections, and the 12-column grid. | **Never hand-edit.** `npm run ds:sync` re-copies it. |
| `app/app.css` | The app's own layer: the wordmark, medals, the podium, the bid ladder, the chart, the browser-frame preview. | May only *use* the system's tokens. |

`app.css` sits **outside every `@layer`**, which is the design system's stated
customisation API: an unlayered rule beats all layers with no specificity fight,
so nothing needs `!important` and nothing can be accidentally out-specified.

- **The accent is rationed.** First place gets it. Second and third are
  deliberately identical to each other — drawing silver and bronze would be
  three prizes where there is one.
- **Two faces.** Inter for everything; IBM Plex Mono for code only. A mono badge
  or a mono price is a bug.
- **Figures are tabular** (`.live-figure`), so a number that updates does not
  reflow the row it is in.
- **Theme** is `:root[data-theme='dark']` plus a `prefers-color-scheme`
  fallback, set before first paint by the script in `app/layout.tsx`.
- **No charting library.** The chart is a flex row of divs with a height. A
  library would ship more bytes to every dashboard than the whole design system.

---

## §5 — Approved dependencies

Deliberately light. `next`, `react`, `drizzle-orm`, `drizzle-kit`,
`@neondatabase/auth`, `@neondatabase/serverless`, `dodopayments`,
`standardwebhooks`, `zod`, `server-only`, `dotenv`.

That is the whole list. Removed in the rebuild and **not to be re-added without
a reason**: tailwindcss, postcss, autoprefixer, radix-ui,
class-variance-authority, clsx, tailwind-merge, tw-animate-css, lucide-react,
swr, jose, postgres. Icons are inline SVG; there is no icon package.

---

## §6 — The widget

`public/sponsorbid.js` — one tag, on any site:

```html
<script src="https://sponsor.imswarnil.com/sponsorbid.js" data-format="rect" async></script>
```

- **An iframe, not injected HTML.** An iframe cannot read the host page's
  cookies or DOM, and its CSS cannot be broken by the host's stylesheet — which
  is not a small thing, because injected ad markup inherits whatever the host
  does to `a` and `img`.
- **The height is reserved before the frame loads**, from the format, so the
  host page never shifts. The frame posts its real height back and the script
  only ever **grows** the iframe; a shrink would pull the page up under the
  reader's cursor.
- **`/embed/*` must never read the session.** `frame-ancestors *` lets any site
  frame it, and a page that is both framable by anyone and aware of who is
  signed in is a clickjacking surface. That is why the embed has its own layout.
- **Nothing about the reader is collected** — no IP, no user agent, no cookie,
  no visitor id. `lib/track.ts` increments a per-day counter and that is all the
  analytics there is. This is also why the widget loads no third-party script.

---

## §7 — Running it

```bash
npm run db:setup    # push schema → apply constraints → seed accounts + slots
npm run db:legacy   # DESTRUCTIVE: drops the old bms_* tables. Run once.
npm run dev         # foreground, Ctrl-C to quit
npm run serve       # background; waits until it actually answers
npm run stop | restart | status | logs
```

**The port is defined in exactly one place: `PORT` in `scripts/dev.sh` (3500).**
`package.json` calls the script instead of repeating the number — when it was
written in both, the two drifted apart twice in one afternoon. Changing it means
editing that one line plus `BASE_URL` in `.env`.

**Never run `npm run build` while the dev server is up.** Both write `.next`;
the build clobbers the dev server's client chunks and the page stops hydrating
with no error anywhere. Stop → build → `rm -rf .next` → start.

Seeded accounts: `CREATOR_EMAIL`/`ADMIN_PASSWORD` → `/studio`,
`DEMO_EMAIL`/`DEMO_PASSWORD` → `/dashboard`. The demo button on `/signin` signs
in through a server action, so the password stays in the server environment.
Leave `DEMO_EMAIL` unset and the button is not rendered at all.

---

## §8 — Deployment

**Cloudflare Workers via OpenNext**, same as the sibling sites under `~/Swarnil`.

```bash
npm run preview     # build + run the real Worker on workerd (port 8788)
npm run cf:deploy   # build + ship
```

- **PPR is off**, with the argument in `next.config.ts`. It flushes a static
  shell with a 200 before the route's own code runs, so `redirect()` in a gate
  can no longer set the status: `/studio` answered 307 in dev and 200 on the
  Worker for the same signed-out request. Every page here reads the session or
  the database, so the shells were all zero bytes — nothing to gain, a real
  invariant to lose.
- A `has: [{ type: 'host' }]` redirect does **not** fire through the adapter.
  Host canonicalisation belongs in a Cloudflare Redirect Rule on the zone.
- Secrets via `wrangler secret put`, never in `wrangler.jsonc` (it is committed).
  Required: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`,
  `CREATOR_EMAIL`, `DODO_PAYMENTS_KEY_*`, `DODO_PRODUCT_ID`,
  `DODO_PAYMENTS_WEBHOOK_KEY`. **`CREATOR_EMAIL` is not optional in
  production** (§3). Do **not** set `DEMO_EMAIL`/`DEMO_PASSWORD` there.
- Neon Auth must be told to trust each origin that signs in.
- `sponsor.imswarnil.com` does not resolve yet; a Worker Route attaches to an
  existing **proxied** DNS record, so the record comes first.

---

## §9 — Security

What is already true, and must stay true:

- **Webhook**: signature verified before the body is believed; the amount is
  read from **our** payment row, never the payload (a signature proves the
  sender, not the figure); `dodo_payment_id` UNIQUE makes redelivery a no-op;
  only a `pending` row can be claimed.
- **Click hop**: the destination is read from the database, never from the query
  string. A redirector that forwards to a URL in its own parameters is an open
  redirect on the creator's own domain. The id is shape-checked so a malformed
  one is a 400, not a 500.
- **Creative URLs**: parsed and protocol-checked against an http/https
  allowlist, never pattern-matched — `javascript:` in an href executes on
  whatever page the ad is embedded in.
- **Authorization is in the WHERE clause**: every owner-scoped write predicates
  on `profileId`, so a guessed uuid rewrites nothing.
- **Editing an approved creative returns it to `pending`.** Otherwise a sponsor
  could get anything at all in front of the audience: approve something mild,
  then swap the copy.
- **Sign-out is a POST**, so it cannot be triggered by a prefetch or an `<img>`.
- Security headers in `next.config.ts`; `/embed` is the deliberate exception.

**Still open:** email verification (signup auto-confirms), action-level rate
limiting (needs Redis/Upstash), a strict `script-src` CSP, and a Dodo webhook
for refunds/disputes (currently acknowledged and ignored, which is correct but
incomplete).

---

## §10 — Current state

- Schema pushed to Neon (`sponsor-imswarnil`), both constraints applied, the old
  `bms_*` tables dropped, creator + demo accounts seeded, four slots seeded.
- **Verified end to end locally**: gates answer 307 signed-out; the board, the
  podium and the ladder render; the embed renders and records a view per ad; the
  click hop 307s to the real destination and records a click; an unsigned or
  badly-signed webhook is rejected 401.
- **Not yet exercised with a real checkout.** `startBidCheckoutAction` and
  `startBookingCheckoutAction` build a Dodo session and redirect, and the
  webhook handler is written against Dodo's documented payload, but no payment
  has been put through even in test mode. Do that before trusting the flow: run
  `npm run dodo:setup`, set `DODO_PRODUCT_ID` and `DODO_PAYMENTS_WEBHOOK_KEY`,
  and point a webhook at a tunnelled `/api/webhooks/dodo`.
- The board is **empty on purpose**. No demo sponsors, no seeded payments, no
  invented impressions (§0, rule 1).
