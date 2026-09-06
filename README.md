# sponsor.imswarnil.com

Swarnil's own sponsorship platform. Sponsors browse and buy placements across **every site
Swarnil builds** — the blog, YouTube, the newsletter, Instagram, the courses, the themes and
the open-source projects — on any custom date range, or shout him out on their own social
accounts as an "ambassador". GitHub Sponsors sits alongside it as the recurring,
no-negotiation route.

Single-tenant on purpose: there are exactly two roles, Swarnil (`/studio`) and a sponsor.

See `CLAUDE.md` for the full architecture/rulebook and `HOWTOUSE.md` for a route map.

## Stack

Next.js (App Router) · Drizzle ORM + **Neon** Postgres · **Neon Auth** (email + password,
CLAUDE.md §3) · Tailwind v4 · a vendored design system (`app/creator/*.css`, see CLAUDE.md §4)
· GitHub Sponsors, read-only (CLAUDE.md §10).

## Local development

This project owns **port 3500** and refuses to start on anything else — several sibling
projects under `~/Swarnil` default to 3000, and a dev server that silently hops to a
different port breaks embed snippets and OAuth redirects. The number lives in one place,
`PORT` in `scripts/dev.sh`; `package.json` reads it from there.

```bash
pnpm install
cp .env.example .env   # fill in the Neon connection strings + auth base URL
npm run db:setup       # schema → neon_auth FK → seed the admin + demo accounts

npm run dev        # foreground, Ctrl-C to quit — the normal way
npm run serve      # background; waits until it actually answers
npm run status     # running? started how? on what pid? does it respond?
npm run stop       # stops it either way, and clears Next's dev lock
npm run restart
npm run logs       # tail .dev/server.log
```

Only one `next dev` can run per directory — Next locks `.next/dev/lock`. If a start is
refused, the message names the pid already holding it; `npm run stop` clears it.

`npm run check:hosts` re-checks every site in `lib/properties.ts` against DNS.

Push a schema change (edits to `lib/proto/schema.ts`):

```bash
npm run db:push
```

## Deployment

Git-connected to Vercel — pushes to `main` deploy straight to production.

**Not currently reachable:** neither `sponsor.imswarnil.com` nor `advertise.imswarnil.com`
has a DNS record, and no Neon project has been created yet, so `DATABASE_URL` is empty and
DB-backed routes 500. See `TODO.md` for what unblocks it.

## Deploy your own

This is single-tenant (one creator per deploy) by design, not multi-tenant SaaS — but nothing
here is hardcoded to Swarnil specifically beyond content and branding, both of which live in a
few clearly-marked places:

1. **Identity & content** — `lib/site.ts` (name, tagline, description, channel blurbs),
   `lib/channels.ts` (what each channel is, its pricing unit/copy) and `lib/properties.ts`
   (the sites a sponsorship covers). Start here.
2. **`CREATOR_EMAIL`** — the one env var that decides who "owns" the deploy (see `.env.example`
   and CLAUDE.md §3). Whoever signs up with this email gets `/studio`; everyone else is an
   advertiser.
3. **Branding** — `components/logo.tsx` (the wordmark/mark), `app/icon.tsx`/`app/apple-icon.tsx`
   (favicon — see CLAUDE.md §2 for the design-system's mark spec if you want to keep the same
   style), and the accent color token in `app/creator/01-color.css` (vendored — see CLAUDE.md
   §4 before touching this file directly).
4. **`components/marketing/github-star-badge.tsx`** — hardcodes this repo's `owner/name`; point
   it at your own fork if you want the star count to reflect yours.
5. **Optional integrations** — Ghost (`GHOST_*`) and GitHub Sponsors (`GITHUB_TOKEN` +
   `GITHUB_LOGIN`) both degrade gracefully when unset: the sections they feed render nothing
   rather than showing a placeholder number. There is no Google sign-in (CLAUDE.md §3).

Everything else (schema, auth, the sponsorship/messaging flow) works as-is for any single
creator once those are updated.
