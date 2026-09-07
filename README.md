# sponsor.imswarnil.com

**A creator's own storefront for being sponsored — no agency, no ad network, no cold DMs.**

Swarnil (a solo creator — videos, a blog, a newsletter, open source) built this instead of
answering sponsorship emails one at a time. It's the thing a media kit PDF and a spreadsheet
used to be, turned into a real page with real prices and instant checkout.

There are exactly two ways to back the work here:

| | Who it's for | What they get |
|---|---|---|
| **A placement** | A brand with something to promote | A spot on a real channel — a blog sidebar, a YouTube mention, a newsletter block, an Instagram post, a README badge, or a personal shout-out — for whatever dates they pick, disclosed as sponsored every time. |
| **A membership** | A reader who just wants to help | One fixed price a month. In return: a face on the public sponsor wall (shown across every site the creator runs, not just this one) and a paid membership on the blog. |

GitHub Sponsors sits alongside both, for anyone who'd rather just chip in with no strings.

Every number on the site is real or it isn't shown — reach, member counts, view/click stats
are all read live from the actual sources (the blog, YouTube, GitHub). Nothing here is a
made-up figure to look more impressive than it is.

**Prices are in points today, not money** — nothing charges a card yet. Every account starts
with 1,000 points, so the whole flow (browse → pay → go live) can be tried end to end before
real payments (Dodo Payments, in progress) land. See `points-note.tsx` wherever a price
appears on the site.

Single-tenant by design: there are exactly two roles, the creator (`/studio`) and a sponsor
(`/sponsor`) — this isn't a marketplace where strangers list their own placements.

See `CLAUDE.md` for the full architecture/rulebook, `TODO.md` for what's still open.

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
