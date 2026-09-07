# CLAUDE.md — sponsor.imswarnil.com (Swarnil's personal sponsorship platform)

> **Re-platforming status.** Moved from `~/Be My Sponsor/be-my-sponsor` to
> `~/Swarnil/sponsor.imswarnil.com` with a fresh git history on 2026-09-04. Supabase →
> Neon + Neon Auth: **done** (§3). Vercel → Cloudflare Workers: **done** (§8) — the
> original plan was GitHub Pages + a small API Worker, abandoned for the reason §8
> explains. Points → Dodo Payments: **in progress** — `DODO_PAYMENTS_KEY_TEST_MODE` is
> set, build against it; see TODO.md for the security posture (webhook verification,
> server-side pricing) before wiring a checkout. Files → Cloudflare R2: **not started**
> (TODO.md has the plan). This platform is for Swarnil and Swarnil's sponsors only —
> never generalize it multi-tenant.

This file is the rulebook for this repo. When code and this file disagree, this file wins.
When this file and a chat instruction disagree, ask before proceeding.

---

## §0 — What this is

A single-tenant advertising platform for one creator (Swarnil). Advertisers browse and buy
placements — a blog sidebar slot, a YouTube mention, a newsletter block, an Instagram post,
an open-source README badge, or an "ambassador" shout-out on their own social accounts — for
any custom date range, in a points economy (no real money yet). There is no publisher-side
signup and no multi-tenant marketplace: `/studio` is Swarnil's own admin, everyone else who
signs up is an advertiser.

This repo used to carry a second, never-finished "spec track" (a pnpm-workspace monorepo
under `apps/`/`packages/` implementing a more general multi-org marketplace with Stripe,
booking overlap constraints, etc.). That scaffold was deleted — it was never wired into the
live app, and this platform's actual direction is the single-tenant one described above, not
that one. If you find historical references to "Phase 1–5", "spec track", "prototype track",
`packages/db`, `apps/web`, `apps/ad-server`, `apps/widget`, `better-auth`, or multi-org
membership in old commit messages or docs, they describe that abandoned direction — ignore
them; this file describes what's actually live.

### The two doors

There are exactly **two** ways to back this work, they are for two different people, and
every public surface says so in the same order:

| | Who | What they get | Priced |
|---|---|---|---|
| **Placement** | a brand | a spot on one channel, dates they choose, creative they supply | per week, `bms_slot.pricePoints` |
| **Membership** | a reader | a face on the public sponsor wall + a paid membership on the blog | fixed monthly, read live from the Ghost tier |

The homepage used to sell only the first while the nav offered the second, so a reader
landed on an advertiser's pitch. `components/marketing/two-doors.tsx` is the fork, and it
is the first thing under the hero. Both doors read their numbers live — cheapest open
placement out of Neon, tier price out of Ghost, member count off the wall — and a number
that cannot be read is **absent**, never guessed (§4).

`components/marketing/points-note.tsx` states, on every page that quotes a price, that
points are not money. When Dodo Payments replaces points (TODO.md) that component is the
one thing that has to change, and its absence is the signal that it did.

---

## §1 — Architecture

A single Next.js App Router app at the repo root. No monorepo, no workspace.

```
app/(marketing)/  EVERY page a logged-out visitor can reach, under ONE shell:
                  / (the homepage), /placements, /placements/[channel], /members,
                  /members/join, /how-it-works, /s/[publicId] (buy a placement).
                  layout.tsx supplies the header and footer and declares
                  `force-dynamic` for the whole segment — SiteHeader reads the
                  session, so §3's rule applies to all of it at once. The route
                  group costs nothing at the URL: /placements is still /placements.
                  Each of these pages used to carry its own copied header bar and
                  three had no footer at all.
app/            the rest — /studio (creator admin), /sponsor (advertiser
                dashboard), /embed/[publicId] (the widget iframe), auth pages,
                robots.ts + sitemap.ts
components/     UI, organized by area: ui/ (primitives), app/ (studio+sponsor consoles),
                auth/, marketing/
lib/proto/      the real backend — schema.ts (Drizzle), db.ts, queries.ts, actions.ts,
                roles.ts. Despite the "proto" name (a holdover from when this coexisted with
                the deleted spec-track packages), this is not a prototype — it's the live
                backend. Do not read "proto" as "temporary."
lib/auth/       Neon Auth — server.ts (the client) + actions.ts (every mutation)
lib/proto/neon-auth.ts  read-only Drizzle mapping of Neon's `neon_auth` tables
drizzle/manual/ SQL drizzle-kit cannot generate (the neon_auth FK)
scripts/seed.mjs  creates the admin + demo accounts and some placements
lib/properties.ts     the sites a placement can run on — see §2
lib/github-sponsors.ts  read-only GitHub Sponsors listing — see §10
app/creator/    vendored design-system token layers (never hand-edit — §4)
app/design-local/  app-owned CSS with no upstream: the wordmark and window frames (§4)
scripts/dev.sh  the dev server: port, start/stop/restart/status/logs (§7)
public/widget.js  the embeddable ad script — vanilla JS, zero deps
```

---

## §2 — Data model

Owned by Drizzle (`lib/proto/schema.ts`). No versioned migrations — `npm run db:push`
(`drizzle-kit push`) diffs the schema file against the live Neon DB directly. Points are
plain integers (no real money yet; if that changes, switch to integer minor units + a
currency column, never floats).

| Table | Purpose |
|---|---|
| `bms_profile` | One row per user (creator or advertiser), keyed to `auth.users.id`. `points`, `name`, `role`. |
| `bms_slot` | A placement: `placement` (channel key), `pricePoints`/week, `status` (open/sponsored), current `ad_*` fields, `brief`, `sponsoredStart`/`sponsoredUntil`. |
| `bms_sponsorship_history` | Append-only ledger, one row per sponsorship at booking time — survives the slot's live fields being cleared on expiry. Powers "past sponsors". |
| `bms_event` | view/click counts for embeddable slots. |
| `bms_txn` | points transfers. |
| `bms_notification` | in-app notifications for the creator (bell icon in `/studio`). |
| `bms_channel_connection` | placeholder — a named channel (YouTube/Ghost/blog/Instagram) with no live sync yet; see §6. |

### Channels (`lib/channels.ts`)
`blog | youtube | newsletter | instagram | open-source | ambassador`. Only `blog` is
`embeddable` (serves through `public/widget.js`, gets real view/click counts). The others are
"placed by hand." `ambassador` is special: the advertiser shares their own social links
instead of ad creative, and the rendered ad always appends a fixed, non-editable line
("One of my subscribers/readers sponsored me for my work — you can do it too.").

### Properties (`lib/properties.ts`)
A *channel* is the kind of surface; a **property** is which of Swarnil's sites it runs on
(`imswarnil.com`, `design.`, `theme.`, `crmanalytics.`, `jobseekers.`, `salesforce.`,
`trailblazer.`, `nac.`, `icons.`, `dev.`, `links.`, and the GitHub profile). The two are
orthogonal and both are stored on the slot: `bms_slot.property`, nullable, where NULL means
"across everything" — a real answer for a newsletter issue or a video, not a missing one.

Each entry carries `live`, meaning "this host has a DNS record". A property that isn't live
is still listed but never rendered as a link. `npm run check:hosts` re-checks every host
against 1.1.1.1 and fails if the file disagrees with reality — run it after any DNS change.

### Sponsorship flow
An advertiser picks any custom date range (3–90 days) on `/s/[publicId]`; price is
`ceil(pricePoints/week × days / 7)`. `sponsorSlot` (`lib/proto/actions.ts`) transfers points,
sets the slot's live `ad_*`/`sponsoredStart`/`sponsoredUntil` fields, and writes one row to
`bms_sponsorship_history`. `expireStaleSlots()` runs on every relevant read and reopens slots
past `sponsoredUntil`, clearing the live fields (the history row is untouched).

---

## §3 — Auth

**Neon Auth** — Better Auth, hosted by Neon, writing users and sessions into the `neon_auth`
schema of *our own* database. Email + password only.

- `lib/auth/server.ts` — `getAuth()`, constructed lazily. Never at module scope: `next build`
  imports every route to collect page data, so a top-level construction makes the build
  require credentials. Building needs none; serving does.
- `lib/auth/actions.ts` — the **only** way a client component touches auth. Sign in, sign up,
  sign out, demo sign-in, password reset. Credentials never reach the browser bundle.
- `app/api/auth/[...path]/route.ts` — proxies auth calls so the session cookie is set on
  *this* origin. Cross-site cookies would not stick.
- Identity is `neon_auth.user.id`, a **uuid** — the same type `bms_profile.id` already was, so
  the swap needed no schema change. The real FK lives in `drizzle/manual/001_profile_auth_fk.sql`,
  applied by `npm run db:fk`, because drizzle-kit must never reach `neon_auth` (Neon provisions
  and migrates it).
- **Profiles are created in app code, not by a trigger.** Supabase let us hang
  `handle_new_user()` off `auth.users`; Neon owns `neon_auth`, so `ensureProfile()` in
  `lib/proto/queries.ts` does it on an account's first authenticated request — including the
  "new sponsor" notification the trigger used to raise.
- `getCurrentUserId()`/`getCurrentUser()` are memoised per request with React `cache()`. Every
  gate in `roles.ts` calls through them, and without it one render made five or six identical
  HTTP round-trips to the auth server.
- **Every route that reads the session must be dynamic.** `app/studio/layout.tsx` and
  `app/sponsor/layout.tsx` declare `export const dynamic = 'force-dynamic'` and it cascades to
  their children. Under Supabase, `middleware.ts` touched cookies on every navigation and made
  the tree dynamic *by accident*; that middleware is gone, so the requirement is now stated.
  Get this wrong and Next prerenders a signed-out page and serves it to everyone.
- `getCreatorId()`/`getViewer()` (`lib/proto/roles.ts`) are unchanged: the creator is whoever
  matches `CREATOR_EMAIL`, so admin cannot be granted by a database row.
- **There is no Google sign-in.** The button existed but the provider was never enabled, so it
  had only ever produced an error. Re-add via `getAuth().signIn.social` once a provider is
  configured in the Neon console.

## §4 — Design system ("Frame & Signal")

The platform wears the same identity as **imswarnil.com**. Token layers are **vendored
verbatim** from the sibling repo `../design.imswarnil.com/src` (1-foundation + 2-elements)
into `app/creator/*.css`; `app/globals.css` maps them onto the Tailwind v4 `@theme`.

| Rule | Why |
|---|---|
| **Never hand-edit `app/creator/*.css`** | They are copies — see the re-sync command below. |
| **Customise by overriding a token after the import**, never inside `creator/` | That is the system's entire customisation API. If a change can't be expressed as a token, it's a design question, not a patch. |
| **`pop` is the fill, `signal` is the text** | `--accent` (signal-500) needs white on top; `--fg-accent` (signal-700/400) is the accent tone that clears 4.5:1 on the canvas. `text-pop` is the one way to fail contrast here. |
| **Active state is a dot or a 2px rule — never a filled pill**, and it hangs off `aria-current` | The stylesheet and the accessibility tree can then never disagree. |
| **Adding a `--color-*` alias to `@theme`? Add it to the `[data-surface='inverse']` block too** | A custom property resolves where it is *declared*. `--color-foreground: var(--fg-default)` is computed once at `:root`, so re-pointing `--fg-default` inside an inverse island does nothing to it — the alias has to be re-declared there. (Dark mode escapes this only because `[data-theme='dark']` matches `:root` itself.) Symptom: dark-on-dark text inside a `data-surface="inverse"` block. |
| **One accent, rationed** | Adding a second hue changes the argument of the system, not just a colour. |

- **Faces: one, not three.** Inter sets the headline and the sentence alike — a heading is
  Inter worn large with the tracking closed (`font-display`, which now *aliases* the body
  face), a label is Inter worn small, uppercase and tracked open (`font-label`), and a count
  is Inter small, light and tabular. **IBM Plex Mono is for code only** (`font-mono`): a mono
  badge, label or count is a bug. Space Grotesk was removed with the design-system refresh —
  a display family only earns its keep if it says something the body family cannot, and size
  plus tracking were already doing that work. Wired via `next/font` in `app/layout.tsx`.
- `tracking-slate` survives as an alias of `tracking-label`, so existing markup keeps working.
- **Theme:** dark mode is `:root[data-theme='dark']` (**not** a `.dark` class) plus a
  `prefers-color-scheme` fallback; `ThemeToggle` writes the attribute.
- **Reused DS components:** the `.tok-*` syntax palette (`creator/22-code.css`, upstream).
  `.logo`/`.logo__tittle` (`SwarnilWordmark` in `components/logo.tsx`) and the
  `.win`/`.win-mac`/`.win-code`/`.win-term`/`.win-browser`/`.win-phone` frames used by the
  animated ad-preview showcase now live in `app/design-local/` — app-owned, no upstream.
- **`BackToSite`** (`components/back-to-site.tsx`) puts the personal wordmark in every navbar.
- **No audience figures anywhere.** Deliberate: inventing reach/subscriber numbers on an
  advertiser-facing page would be fabricating a record. Add a stats block only with real values.
- **Re-sync the vendored tokens** after any change in the design system:
  ```bash
  cd ~/Swarnil/sponsor.imswarnil.com
  DS=../design.imswarnil.com/src
  cp $DS/1-foundation/0{1,2,3,4,5}-*.css $DS/1-foundation/09-shape.css \
     $DS/2-elements/22-code.css app/creator/
  ```
  Only those seven. `app/design-local/{frame,logo}.css` are **app-owned**: the
  system dropped the window variants this app's ad preview uses (`.win-mac`,
  `.win-code`, `.win-phone`) and never shipped the wordmark, so they have no
  upstream to copy from. Do not move them back into `creator/`.

---

## §5 — Approved dependencies

Don't add a dependency without checking it's actually needed — this app is deliberately light
(no charting library, no PWA library, no ORM beyond Drizzle, no email service). Current stack:
`next`, `react`, `react-dom`, `drizzle-orm`, `drizzle-kit`, `postgres`, `zod`,
`@neondatabase/auth`, `@neondatabase/serverless`, `tailwindcss` v4, `radix-ui`, `class-variance-authority`,
`clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`, `swr`, `server-only`, `jose`.

`jose` is **not** dormant — `lib/ghost.ts` signs the Ghost Admin API's HS256 JWT with it,
which is why the Ghost SDK isn't a dependency. (`lib/proto/session.ts`, the unused legacy
session helper this file used to point at, has been deleted.)

---

## §6 — Channel connections (placeholder, not yet live)

`bms_channel_connection` + `/studio/channels`: lets the creator name a channel (YouTube,
Ghost, blog/RSS, Instagram) with **no credentials and no API calls**. This exists purely so
real analytics integrations have a landing spot once the actual API details (YouTube Data
API key, Ghost Admin API key, etc.) are provided — do not build against guessed API shapes
before that happens.

---

## §7 — Running it locally

### Database + accounts (first time, and after any schema change)

```bash
npm run db:setup     # push schema → apply the neon_auth FK → seed the accounts
```

Or the three steps on their own: `db:push`, `db:fk`, `db:seed`. They are all idempotent.

`db:seed` (`scripts/seed.mjs`) creates two accounts **through the Neon Auth HTTP API**, never
by writing to `neon_auth` directly — Better Auth owns the password hashing, and a row we
inserted would carry a hash it does not accept:

| Account | From | Lands on |
|---|---|---|
| creator / admin | `CREATOR_EMAIL` + `ADMIN_PASSWORD` | `/studio` |
| demo sponsor | `DEMO_EMAIL` + `DEMO_PASSWORD` | `/sponsor` |

It also seeds five open placements so `/studio` and `/placements` are not empty. The demo
account is what the "Explore the demo account" button on `/login` signs into — through a
server action, so the password stays in the server environment and never enters the bundle.
Leave `DEMO_EMAIL` unset and that button is simply not rendered.

Seeding needs the deployment's origin to be trusted by Neon Auth; the script sends
`BASE_URL` (or `APP_ORIGIN`) as the Origin header and says so if it is rejected.

### The dev server


```bash
npm run dev        # foreground, Ctrl-C to quit — the normal way
npm run serve      # background; waits until it actually answers
npm run stop       # stops it, whichever way it was started
npm run restart
npm run status
npm run logs       # tail .dev/server.log
```

**The port is defined in exactly one place: `PORT` in `scripts/dev.sh` (3500).** `package.json`
calls the script (`dev` → `dev.sh fg`, `start` → `dev.sh port`) instead of repeating the
number — when it was written in both files the two drifted apart twice in one afternoon and
the background server ended up on a different port from `npm run dev`. Changing the port means
editing that one line, plus `BASE_URL` in `.env`.

3500 is clear of every sibling under `~/Swarnil`: 3000 (`salesforce.` on Nuxt, `nac.` on Next),
3100 (`job.`), 3111, 3400 (`imswarnil.github.io`), 4001, 8080-8099. `dev.sh` refuses to start
when something else holds the port rather than letting Next hop to the next free one — a moved
port is how an embed snippet or an OAuth redirect quietly breaks.

**Only one `next dev` can run per directory.** Next takes an exclusive lock on
`.next/dev/lock`, so a forgotten background server makes `npm run dev` fail with "Unable to
acquire lock", which does not say who is holding it. Every entry point in `dev.sh` checks
first and names the offending pid; `npm run stop` clears both the processes and the lock.

`.dev/` (PID + log) is gitignored.

## §8 — Deployment

**Cloudflare Workers, via OpenNext.** Same stack as the two sibling sites under
`~/Swarnil` (`links.imswarnil.com` and `nac.imswarnil.com`), so there is one deployment
story across the umbrella rather than three.

```bash
npm run preview     # build + run the real Worker on workerd locally (port 8788)
npm run cf:deploy   # build + ship
npm run cf:typegen  # regenerate cloudflare-env.d.ts from wrangler.jsonc
```

### Why not GitHub Pages

The original re-platforming plan was a static export to GitHub Pages plus a small API
Worker. That cannot work: every page reads the session or the database per request, and
§3 requires it — a static export has no server actions, no `/api/auth/[...path]` proxy
and no way to gate `/studio`. Hosting the whole app on Cloudflare Workers (OpenNext)
instead is what is implemented. `vercel.json` is gone; Vercel is not the target.

### Two things the adapter changes, both verified against the built Worker

- **PPR had to go.** `experimental.ppr` flushes a static shell with a **200** before the
  route's own code runs, so `redirect()` in a gate can no longer set the status — it is
  delivered inside the RSC stream instead. `/studio` answered `307 → /login` in dev and
  `200` on the Worker for the same signed-out request. Nothing leaked (the shells were all
  zero bytes, precisely because every page reads the session), but a gated URL returning
  200 to every crawler and uptime check is a bad signal, and dev disagreeing with
  production about a status code is a trap. It is off, with the argument in `next.config.ts`.
  All six gates now answer 307 on the Worker.
- **A `has: [{ type: 'host' }]` redirect does not fire.** The `advertise` →
  `sponsor` canonicalisation was written as a Next redirect and returned 200 through the
  adapter, with both a spoofed `Host` header and a real request URL. It is a **Cloudflare
  Redirect Rule** on the zone instead — the edge, before the Worker runs. Path redirects
  (`/browse`, `/pricing`, `/app/*`) *are* honoured; those are verified.

### Hosts

`sponsor.imswarnil.com` is canonical — `lib/site.ts`, `metadataBase`, the sitemap, robots
and Neon Auth's trusted origin all say so, and it is the only pattern in
`wrangler.jsonc`'s `routes`. `advertise.imswarnil.com` gets a proxied DNS record and a
Redirect Rule to it, and is deliberately **not** routed to the Worker: serving the app on
two hostnames means two cookie origins, two canonical URLs, and a Neon Auth origin check
that fails on one of them.

Neither name resolves yet (checked against 1.1.1.1, 2026-09-07). A Worker Route attaches
to an existing **proxied** record rather than owning DNS, so the record comes first — see
TODO.md for the ordered list.

### Secrets

Set with `wrangler secret put NAME`, never in `wrangler.jsonc` (it is committed). The
authoritative list is the comment at the bottom of that file, and the names there are the
ones the code actually reads — `grep -rhoE "process\.env\.[A-Z0-9_]+" app lib scripts`.

Required: `DATABASE_URL` (pooled), `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`,
`CREATOR_EMAIL`. **`CREATOR_EMAIL` is not optional in production**: unset, `getCreator()`
falls back to the oldest account and that fallback *grants admin* (§3). Everything else
degrades to nothing rendered rather than to an error. Do **not** set `DEMO_EMAIL` /
`DEMO_PASSWORD` in production — the demo button is an unauthenticated endpoint that mints
a session, and leaving them unset is what stops it rendering at all.

`.dev.vars` is what `wrangler dev` reads locally (`.env` is Next's, not workerd's). It is
gitignored, and generated from `.env`:

```bash
grep -vE '^\s*#' .env | grep -E '^[A-Z_]+=' > .dev.vars
```

- **GitHub:** `github.com/imswarnil/Sponsor-Me-Platform`, created 2026-09-07 with a fresh
  history when this repo moved here (see the top of this file) — the old
  `advertise-with-me-platform` repo is unrelated history and no longer exists. No CI deploy
  yet — `npm run cf:deploy` is manual.
- **Supabase is gone entirely** — project deleted, packages removed, `supabase/` config and
  the `.claude/skills/supabase` steps no longer describe anything this repo uses. See §3.

---

## §9 — Security

- `points` is `input:false` on the profile row (can't be self-granted); zod validation on all
  server actions; only http(s) URLs are ever stored (blocks `javascript:`/`data:`); security
  headers in `next.config.ts` (CSP `frame-ancestors 'self'`, HSTS, nosniff, X-Frame-Options)
  with `/embed` kept `frame-ancestors *` since it's meant to be embedded anywhere; RLS enabled
  + forced with anon/authenticated revoked on every table (the app connects as the Postgres
  role, which bypasses RLS — RLS here is a defense-in-depth backstop, not the authorization
  layer; authorization lives in `lib/proto/roles.ts` and each action's own checks).
- **Still open:** email verification (signup currently auto-confirms), action-level rate
  limiting (would need Redis/Upstash), a strict `script-src` CSP.

---

## §10 — GitHub Sponsors (read-only)

The second way someone can sponsor this work. `lib/github-sponsors.ts` reads the listing off
GitHub's GraphQL API and nothing more — **it never writes to the database**, and a GitHub
sponsor is not a `bms_*` row. The two lists sit side by side on the page and stay separate
underneath. Surfaced by `components/marketing/github-sponsors.tsx` (public: `/` and
`/placements`) and `components/app/github-sponsors-panel.tsx` (`/studio`).

Needs `GITHUB_TOKEN` (classic or fine-grained PAT, scope `read:user`) and `GITHUB_LOGIN`.
**Everything degrades to `null`** — no token, revoked token, rate limit, GitHub down, listing
private — and a `null` renders *nothing at all* rather than a zero or a placeholder. That is
the same rule as §4's "no audience figures anywhere": a number here is either real or absent.

`.github/FUNDING.yml` points the repo's own Sponsor button at the same listing.

State as of 2026-09-06: the listing `sponsors-imswarnil` is public, but it has **no tiers**
and no sponsors — so nobody can actually sponsor until at least one tier is created on
github.com/sponsors/imswarnil. The studio panel says so in as many words.

There is no webhook receiver. Adding one is the next step if GitHub sponsors should appear in
`bms_sponsorship_history`; it needs a public URL, which §8 says the platform does not have yet.

## §11 — Current state / open items

- **Live on Neon.** Project `sponsor-imswarnil` (`ancient-recipe-82156884`, aws-us-east-2, org
  `Imswarnil`), Neon Auth enabled, localhost origins allowed. Schema pushed, the `neon_auth`
  FK applied, and both accounts seeded. Sign-in, role separation (`/studio` vs `/sponsor`) and
  the demo button are all verified end to end against this database.
- The old Supabase project was Vercel-managed and was deleted along with the integration —
  which is why it vanished rather than merely pausing. Nothing references it any more.
- Passwords for the two seeded accounts are in `.env` (`ADMIN_PASSWORD`, `DEMO_PASSWORD`),
  which is gitignored. They exist nowhere else — rotate by editing `.env` and re-running
  `db:seed` against a fresh account, or through the app's own password reset.
- Neon Auth must be told to trust each origin that signs in — `http://localhost:3500` for dev,
  and the real hostname once DNS exists (§8). Sign-in works locally and fails in production if
  this is missed.
- No transactional email is configured, so **password reset emails will not arrive** until
  Neon Auth has an email sender. The in-app notification bell (§3) still covers the "new
  sponsor" signal.
- Channel analytics (§6) are a placeholder — real YouTube/Ghost/etc. sync is pending API
  details from the creator.
- `sponsor.imswarnil.com` → `advertise.imswarnil.com` was a planned domain migration. Neither
  resolves today (§8), so it is a decision about which name to create, not which to retire.
