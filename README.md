# sponsor.imswarnil.com

Swarnil's own sponsorship platform. There are two ways in, for two different people:

- **A placement** — a brand takes a spot on one of Swarnil's channels (the blog sidebar, a
  YouTube read, a newsletter block, an Instagram post, a README badge, or an "ambassador"
  shout-out on the sponsor's own accounts) for any custom date range, across **every site
  Swarnil builds**.
- **A membership** — a reader pays one fixed amount a month and gets a face on the public
  sponsor wall, which is embedded across those same sites, plus a paid membership on the blog.

GitHub Sponsors sits alongside both as the recurring, no-negotiation route.

**Prices are in points, not money** — nothing charges a card yet. Every account starts with
1,000 points, so the whole flow can be walked end to end before real payments land.

Single-tenant on purpose: there are exactly two roles, Swarnil (`/studio`) and a sponsor.

See `CLAUDE.md` for the full architecture/rulebook and `HOWTOUSE.md` for a route map.

## Stack

Next.js (App Router) on **Cloudflare Workers** (`@opennextjs/cloudflare`) · Drizzle ORM +
**Neon** Postgres · **Neon Auth** (email + password, CLAUDE.md §3) · Tailwind v4 · a vendored
design system (`app/creator/*.css`, see CLAUDE.md §4) · GitHub Sponsors, read-only
(CLAUDE.md §10).

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

**Cloudflare Workers, via OpenNext** — the same stack as the sibling sites under `~/Swarnil`.

```bash
npm run preview     # build + run the real Worker on workerd locally (:8788)
npm run cf:deploy   # build + ship
```

```
sponsor.imswarnil.com     canonical — the only Worker route
advertise.imswarnil.com   a Cloudflare Redirect Rule to the above, not a route
```

**Not reachable yet:** neither hostname has a DNS record (checked 2026-09-07), so there is
nothing for the Worker Route to attach to. The Neon database and Neon Auth *are* live and
the built Worker serves real data locally — what is missing is account state, in the order
`TODO.md` lists it: DNS record → `wrangler secret put` → trust the origin in Neon Auth →
deploy → Redirect Rule.

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
