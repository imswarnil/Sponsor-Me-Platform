# REBUILD.md — sponsor.imswarnil.com (personal edition)

This repo was moved here from `~/Be My Sponsor/be-my-sponsor` on 2026-09-04 with a fresh
git history (old repo: `github.com/imswarnil/advertise-with-me-platform`, still on GitHub
untouched). The code as copied still runs on the old stack (Supabase + Vercel); this file
is the plan for what it becomes.

## What this is (and is not)

**For me only.** One creator — Swarnil. The people who log in are sponsors: brands,
viewers/readers, or anyone who wants to sponsor my work. There is no multi-tenant anything,
no publisher signup, no marketplace. Build every screen and every permission check with
exactly two roles in mind: **me** (admin, `/studio`) and **a sponsor** (everyone else).

A full-scale, wider-audience version is a separate future project — see
`docs/IDEA-full-scale.md`. Do not smuggle multi-tenant abstractions into this codebase
"to prepare"; build the simplest thing that serves me.

## Target stack (replaces the current one)

| Concern | Old (current code) | New |
|---|---|---|
| Database | Supabase Postgres | **Neon** Postgres (Drizzle stays) |
| Auth | Supabase Auth | **Neon Auth** |
| Payments | Points economy (fake) | **Dodo Payments** (real money, merchant-of-record — handles global tax/invoicing, good for Indian creators) |
| File storage | external URLs only | **Cloudflare R2** — see `r2/README.md` |
| Hosting | Vercel | **GitHub Pages** (static) + a small API layer, see below |

## The GitHub Pages constraint (important)

GitHub Pages serves **static files only** — no server actions, no API routes, no middleware,
no server-side auth callbacks. The current app is a server-rendered Next.js app, so it cannot
deploy to Pages as-is. The workable shape:

1. **Frontend** → Next.js `output: 'export'` (static export) deployed to GitHub Pages at
   `sponsor.imswarnil.com` (CNAME).
2. **Backend** → one small **Cloudflare Worker** (fits the existing Cloudflare account, sits
   next to R2 natively) exposing the few endpoints that must be server-side:
   - Neon Auth session verification
   - Dodo Payments checkout-session creation + **webhook receiver** (payment confirmed →
     activate sponsorship in Neon)
   - presigned R2 upload URLs
   - the ad-serving endpoint for `public/widget.js` + view/click counting
3. Everything else (catalogue, media kit, marketing pages) is pure static.

If the Worker grows annoying, the honest alternative is hosting the whole app on Cloudflare
Workers (OpenNext) and pointing the domain there instead of Pages — decide when we get there.

## Security posture (personal ≠ lax)

Real money + strangers signing up means the bar goes **up**, not down:

- Webhook signature verification on every Dodo webhook; never activate a sponsorship from
  client-side "payment succeeded" state.
- Price is computed and charged server-side from the slot record — the client never sends
  an amount.
- Keep the existing invariants from the old code: zod on every mutation, http(s)-only
  stored URLs, security headers, `/embed` the only frameable route.
- Sponsor uploads (R2) validated by type/size, served from a separate domain
  (`files.imswarnil.com`) so user content never executes on the app origin.
- Admin (= me) recognized by Neon Auth identity, single allow-listed email — same
  `CREATOR_EMAIL` idea as before.
- Rate-limit the Worker endpoints (Cloudflare has this built in).
- Secrets live in Worker env / GitHub Actions secrets — never in the static bundle. Anything
  shipped to Pages is public by definition.

## Migration order

1. `pnpm install` here; app still runs against Supabase (nothing breaks day one).
2. Stand up Neon, point Drizzle at it (`db:push`), migrate the `bms_*` data.
3. Swap Supabase Auth → Neon Auth (touches `lib/supabase/*`, `middleware.ts`, auth pages).
4. Build the Cloudflare Worker API + R2 buckets (`r2/`).
5. Integrate Dodo Payments; retire the points economy (keep the ledger table shape —
   `bms_sponsorship_history` becomes the paid-sponsorship ledger).
6. Static-export the frontend, deploy to GitHub Pages, cut DNS for `sponsor.imswarnil.com`.
7. Decommission Vercel + Supabase once traffic is fully moved.

## Repo status

- Fresh `git init`, no history from the old repo (old Claude-co-authored commits stayed
  behind in `advertise-with-me-platform`). First commit is yours to make; GitHub repo name
  is free to choose — we recommit/rename later.
- `docs/archive/` holds the original spec HTML/PDF from the old `spec/` folder.
- `CLAUDE.md` still documents the **current** (old-stack) code and stays authoritative for
  the code until each migration step lands — update it as steps complete.
