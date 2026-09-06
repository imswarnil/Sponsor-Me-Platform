# CLAUDE.md — sponsor.imswarnil.com (Swarnil's personal sponsorship platform)

> **2026-09-04 — repo moved & re-scoped.** This project moved from
> `~/Be My Sponsor/be-my-sponsor` to `~/Swarnil/sponsor.imswarnil.com` with a fresh git
> history. It is being re-platformed: Supabase → **Neon + Neon Auth**, points → **Dodo
> Payments** (real money), files → **Cloudflare R2** (`r2/`), Vercel → **GitHub Pages**
> (static export) + a small Cloudflare Worker API. See `REBUILD.md` for the plan and
> `docs/IDEA-full-scale.md` for the parked wider-audience idea. This platform is for
> Swarnil and Swarnil's sponsors only (brands, viewers, anyone sponsoring Swarnil) —
> never generalize it multi-tenant. Until a migration step lands, the sections below
> still describe the code accurately — update them as each step completes. §7 (old
> GitHub/Vercel/domain setup) describes the *previous* deployment.

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

---

## §1 — Architecture

A single Next.js App Router app at the repo root. No monorepo, no workspace.

```
app/            routes — marketing pages, /studio (creator admin), /sponsor (advertiser
                dashboard), /placements (public catalogue), /s/[publicId] (buy a placement),
                /embed/[publicId] (the widget iframe), auth pages
components/     UI, organized by area: ui/ (primitives), app/ (studio+sponsor consoles),
                auth/, marketing/
lib/proto/      the real backend — schema.ts (Drizzle), db.ts, queries.ts, actions.ts,
                roles.ts. Despite the "proto" name (a holdover from when this coexisted with
                the deleted spec-track packages), this is not a prototype — it's the live
                backend. Do not read "proto" as "temporary."
lib/supabase/   client/server/admin Supabase clients
public/widget.js  the embeddable ad script — vanilla JS, zero deps
```

---

## §2 — Data model

Owned by Drizzle (`lib/proto/schema.ts`). No versioned migrations — `npm run db:push`
(`drizzle-kit push`) diffs the schema file against the live Supabase DB directly. Points are
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

### Sponsorship flow
An advertiser picks any custom date range (3–90 days) on `/s/[publicId]`; price is
`ceil(pricePoints/week × days / 7)`. `sponsorSlot` (`lib/proto/actions.ts`) transfers points,
sets the slot's live `ad_*`/`sponsoredStart`/`sponsoredUntil` fields, and writes one row to
`bms_sponsorship_history`. `expireStaleSlots()` runs on every relevant read and reopens slots
past `sponsoredUntil`, clearing the live fields (the history row is untouched).

---

## §3 — Auth

**Supabase Auth** — email/password and Google OAuth, both via `@supabase/ssr`.

- Clients: `lib/supabase/{server,client,admin}.ts`. Edge middleware (`middleware.ts`)
  refreshes the session cookie on every navigation.
- Identity is `auth.users`; the `handle_new_user()` Postgres trigger on `auth.users` insert
  auto-creates the matching `bms_profile` row (1000 starting points) **and** — for anyone who
  isn't the creator — inserts a `bms_notification` for the creator ("New advertiser: …"). This
  fires for both signup paths (email/password via `signUpAction`, and Google) since it lives
  at the DB level rather than in app code.
- Email/password signup: `signUpAction` (server action, admin `email_confirm: true`) then
  client-side `signInWithPassword`. Google: `signInWithOAuth` in `components/auth/auth-form.tsx`
  → `app/auth/callback/route.ts` (PKCE code exchange) → `next` param (sanitized by
  `lib/safe-next.ts`).
- Password reset: `/forgot-password` (`resetPasswordForEmail`) → email link →
  `/auth/callback?next=/reset-password` → `/reset-password` (`updateUser({ password })`). The
  same callback route handles OAuth and recovery links.
- `getCreatorId()`/`getViewer()` (`lib/proto/roles.ts`): the creator is whoever's email matches
  the `CREATOR_EMAIL` env var (falls back to the oldest account if unset — keep `CREATOR_EMAIL`
  set in every Vercel environment, or the site picks the wrong "admin").
- Supabase dashboard Auth config (Site URL, redirect allow-list, enabling the Google provider)
  is documented in the `supabase` skill (`.claude/skills/supabase/`) — not manageable from this
  repo's code, and not via `supabase config push` (see that skill for why).

---

## §4 — Design system ("Frame & Signal")

The platform wears the same identity as **imswarnil.com**. Token layers are **vendored
verbatim** from the sibling repo `../design-system/src/1-foundation` + `2-elements` into
`app/creator/*.css`; `app/globals.css` maps them onto the Tailwind v4 `@theme`.

| Rule | Why |
|---|---|
| **Never hand-edit `app/creator/*.css`** | They are copies — see the re-sync command below. |
| **Customise by overriding a token after the import**, never inside `creator/` | That is the system's entire customisation API. If a change can't be expressed as a token, it's a design question, not a patch. |
| **`pop` is the fill, `signal` is the text** | `--accent` (signal-500) needs white on top; `--fg-accent` (signal-700/400) is the accent tone that clears 4.5:1 on the canvas. `text-pop` is the one way to fail contrast here. |
| **Active state is a dot or a 2px rule — never a filled pill**, and it hangs off `aria-current` | The stylesheet and the accessibility tree can then never disagree. |
| **Adding a `--color-*` alias to `@theme`? Add it to the `[data-surface='inverse']` block too** | A custom property resolves where it is *declared*. `--color-foreground: var(--fg-default)` is computed once at `:root`, so re-pointing `--fg-default` inside an inverse island does nothing to it — the alias has to be re-declared there. (Dark mode escapes this only because `[data-theme='dark']` matches `:root` itself.) Symptom: dark-on-dark text inside a `data-surface="inverse"` block. |
| **One accent, rationed** | Adding a second hue changes the argument of the system, not just a colour. |

- **Faces:** Space Grotesk (display/headings/stats) · Inter (body) · IBM Plex Mono (the "slate"
  voice: labels, badges, counts, breadcrumbs, code). Wired via `next/font` in `app/layout.tsx`.
- **Theme:** dark mode is `:root[data-theme='dark']` (**not** a `.dark` class) plus a
  `prefers-color-scheme` fallback; `ThemeToggle` writes the attribute.
- **Reused DS components:** `.logo`/`.logo__tittle` (`SwarnilWordmark` in `components/logo.tsx`),
  `.win`/`.win-mac`/`.win-code`/`.win-term`/`.win-browser`/`.win-phone` frames (used by the
  animated ad-preview showcase on `/placements`), `.codebox` + `.tok-*` syntax palette.
- **`BackToSite`** (`components/back-to-site.tsx`) puts the personal wordmark in every navbar.
- **No audience figures anywhere.** Deliberate: inventing reach/subscriber numbers on an
  advertiser-facing page would be fabricating a record. Add a stats block only with real values.
- **Re-sync the vendored tokens** after any change in the design-system repo:
  ```bash
  cd advertise-with-me-platform   # this repo
  cp ../design-system/src/1-foundation/0{1,2,3,4,5}-*.css \
     ../design-system/src/1-foundation/09-logo.css \
     ../design-system/src/1-foundation/12-frame.css \
     ../design-system/src/2-elements/15-syntax.css \
     app/creator/
  ```

---

## §5 — Approved dependencies

Don't add a dependency without checking it's actually needed — this app is deliberately light
(no charting library, no PWA library, no ORM beyond Drizzle, no email service). Current stack:
`next`, `react`, `react-dom`, `drizzle-orm`, `drizzle-kit`, `postgres`, `zod`,
`@supabase/ssr`, `@supabase/supabase-js`, `tailwindcss` v4, `radix-ui`, `class-variance-authority`,
`clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`, `swr`, `server-only`, `jose`
(dormant — see `lib/proto/session.ts`, an unused legacy session helper kept around but never
called; safe to delete if it keeps coming up as dead code).

---

## §6 — Channel connections (placeholder, not yet live)

`bms_channel_connection` + `/studio/channels`: lets the creator name a channel (YouTube,
Ghost, blog/RSS, Instagram) with **no credentials and no API calls**. This exists purely so
real analytics integrations have a landing spot once the actual API details (YouTube Data
API key, Ghost Admin API key, etc.) are provided — do not build against guessed API shapes
before that happens.

---

## §7 — Deployment

- **GitHub:** `github.com/imswarnil/advertise-with-me-platform` (renamed from `be-my-sponsor`
  2026-07-28; GitHub redirects the old URL).
- **Vercel:** project `advertise-with-me-platform` (same rename), git-connected → pushes to
  `main` auto-deploy directly to **production** (no preview-branch workflow — push straight to
  `main`). Requires `vercel.json` (`framework: nextjs`) or Vercel serves `public/` statically
  and 404s every route; middleware matcher must be non-empty or deploy finalization fails.
- **Domains:** live at both `sponsor.imswarnil.com` (original) and `advertise.imswarnil.com`
  (added 2026-07-28, already verified via the existing wildcard DNS on `imswarnil.com` — no
  DNS action was needed). Both currently resolve to the same deployment; `sponsor.` stays live
  until an explicit decision to retire it.
- **Env vars** (DB/Supabase/`CREATOR_EMAIL`) must be set in **all three** Vercel environments
  (Production, Preview, Development) — a var missing from one silently breaks only that
  environment, which is exactly how the `CREATOR_EMAIL`-unset-in-prod bug happened once before.
- **Supabase project** is still named `be-my-sponsor` — deliberately not renamed alongside the
  repo/Vercel project (see the `supabase` skill for why).

---

## §8 — Security

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

## §9 — Current state / open items

- Google sign-in is wired end-to-end in code (`components/auth/auth-form.tsx`,
  `app/auth/callback/route.ts`) but the Google provider isn't enabled in Supabase yet — needs
  a Google Cloud OAuth Client ID/Secret (requires the creator's own Google account to create;
  see the `supabase` skill for the exact dashboard steps once that credential exists).
- Channel analytics (§6) are a placeholder — real YouTube/Ghost/etc. sync is pending API
  details from the creator.
- No transactional email is configured — "new advertiser" signals go through the in-app
  notification bell (§3), not email, by deliberate choice.
- `sponsor.imswarnil.com` → `advertise.imswarnil.com` is a planned domain migration; both work
  today, no cutover date set.
