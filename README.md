# advertise-with-me-platform

A single-tenant advertising platform: advertisers browse and buy placements on Swarnil's
blog, YouTube, newsletter, Instagram, and open-source projects — or shout him out on their
own social accounts as an "ambassador" — for any custom date range.

See `CLAUDE.md` for the full architecture/rulebook, `HOWTOUSE.md` for a route map, and
`.claude/skills/supabase/SKILL.md` for Supabase-specific operations.

## Stack

Next.js (App Router) · Drizzle ORM + Postgres (Supabase) · Supabase Auth (email/password +
Google) · Tailwind v4 · a vendored design system (`app/creator/*.css`, see CLAUDE.md §4).

## Local development

```bash
pnpm install
cp .env.example .env   # fill in Supabase connection strings + keys
pnpm dev
```

Push a schema change (edits to `lib/proto/schema.ts`):

```bash
npm run db:push
```

## Deployment

Git-connected to Vercel — pushes to `main` deploy straight to production. Live at
`sponsor.imswarnil.com` and `advertise.imswarnil.com`.

## Deploy your own

This is single-tenant (one creator per deploy) by design, not multi-tenant SaaS — but nothing
here is hardcoded to Swarnil specifically beyond content and branding, both of which live in a
few clearly-marked places:

1. **Identity & content** — `lib/site.ts` (name, tagline, description, channel blurbs) and
   `lib/channels.ts` (what each channel is, its pricing unit/copy). Start here.
2. **`CREATOR_EMAIL`** — the one env var that decides who "owns" the deploy (see `.env.example`
   and CLAUDE.md §3). Whoever signs up with this email gets `/studio`; everyone else is an
   advertiser.
3. **Branding** — `components/logo.tsx` (the wordmark/mark), `app/icon.tsx`/`app/apple-icon.tsx`
   (favicon — see CLAUDE.md §2 for the design-system's mark spec if you want to keep the same
   style), and the accent color token in `app/creator/01-color.css` (vendored — see CLAUDE.md
   §4 before touching this file directly).
4. **`components/marketing/github-star-badge.tsx`** — hardcodes this repo's `owner/name`; point
   it at your own fork if you want the star count to reflect yours.
5. **Optional integrations** — Ghost (`GHOST_*` env vars, see `.env.example`) and Google sign-in
   (Supabase dashboard, see `.claude/skills/supabase/SKILL.md`) both degrade gracefully when
   unset — the app runs fine without either.

Everything else (schema, auth, the sponsorship/messaging flow) works as-is for any single
creator once those are updated.
