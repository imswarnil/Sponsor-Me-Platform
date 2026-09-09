# Sponsor Me

**Get your thing in front of my people.**

A single-creator ad platform. I make slots, paste one tag on my sites, and you
buy them.

```
✨  Fixed slot   One price. You buy it, your ad serves.
🏆  Bid slot     Everybody bids. Highest serves — the rest are on the
                 leaderboard, waiting for you to slip.
```

Same table, same formats, same embed. The only difference is who gets served.

## Embedding

```html
<script src="https://sponsor.imswarnil.com/sponsor.js" data-slot="top-spot" async></script>
```

One sandboxed iframe. No dependencies, no cookies, no third-party scripts, and
nothing about the reader is ever collected — a per-day view counter is all a
sponsor is sold.

## Ads can be

🃏 a card · 🖼️ an image · 📺 a video · ⚡ your own HTML (sandboxed)

## Stack

Next.js on Cloudflare Workers · Neon + Drizzle · Neon Auth · Dodo Payments ·
Tailwind v4, themed with imswarnil.com's own OKLCH palette.

## Running it

```bash
pnpm install           # pnpm, not npm
cp .env.example .env   # fill it in
npm run db             # push the schema
npm run setup          # constraints, accounts, a few slots
npm run dev            # http://localhost:3500
```

`npm run start | stop | restart | status | logs` run it in the background.

`CLAUDE.md` explains how it works. `TODO.md` is what's left.

## Three rules the code keeps

1. **A number is real or it is absent.** Nothing invents a view count. The board
   ships empty rather than seeded with fake sponsors.
2. **The server prices everything.** No amount is ever read from a form.
3. **Nothing serves on a redirect.** An ad goes live when a signed webhook
   confirms the payment, and at no other moment.

MIT.
