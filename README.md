# SponsorBid

**One board, running across every site I build. Highest bid renders first.**

`sponsor.imswarnil.com` — a single-creator advertising platform. A brand bids for
a spot on a leaderboard that is syndicated to the whole network by one script
tag: **#1 renders large, #2 and #3 render small beside it**, and every rendered
unit links back to outbid. A rank is bought once and held until somebody pays
more — it never renews and never expires.

Alongside it, **slots**: a named position on one site, priced per month, booked
for a window. If a brand already holds it, the next one books the window after
theirs rather than being told to come back later.

```
┌──────────────────────────────┬──────────────────┐
│                              │  ┌ 2 ───────────┐│
│  ┌ 1 ───────────────────┐    │  │ Second brand ││
│  │ The top bid's ad     │    │  └──────────────┘│
│  │ large, with a button │    │  ┌ 3 ───────────┐│
│  └──────────────────────┘    │  │ Third brand  ││
│                              │  └──────────────┘│
└──────────────────────────────┴──────────────────┘
```

## Embedding it

```html
<script src="https://sponsor.imswarnil.com/sponsorbid.js" data-format="rect" async></script>
```

No dependencies, no cookies, no third-party script. It creates one sandboxed
iframe at a height reserved from the format, so the host page never shifts. The
reader is not tracked in any way — the only analytics is a per-day counter of
views and clicks, which is all a sponsor was ever sold.

## Stack

Next.js App Router on Cloudflare Workers (OpenNext) · Neon Postgres + Drizzle ·
Neon Auth · Dodo Payments · [Swarnil Design System](https://design.imswarnil.com)
as one vendored stylesheet — no Tailwind, no CSS build step.

## Running it

```bash
npm install
cp .env.example .env     # fill it in
npm run db:setup         # schema, constraints, accounts, slots
npm run dev              # http://localhost:3500
```

See `CLAUDE.md` for how any of it actually works, and `TODO.md` for what is left.

## Three rules the code keeps

1. **A number is real or it is absent.** Nothing here invents a view count, a
   reach figure or a placeholder. An unmeasured slot shows no figure rather than
   a zero, and the board ships empty rather than seeded with fake sponsors.
2. **The server prices everything.** No amount is ever read from a form.
3. **Nothing goes live on a redirect.** An ad activates when a signed webhook
   confirms the payment, and at no other moment.

MIT.
