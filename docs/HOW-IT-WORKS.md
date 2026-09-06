# How Be My Sponsor works

A points-based prototype of a self-serve sponsorship marketplace. Two roles share one loop:

```
Publisher lists a slot ──▶ embeds one <script> tag ──▶ visitor sees the spot
        ▲                                                        │
        │                                                        ▼
   ad goes live ◀── sponsor pays points ◀──────────── opens the slot's public page
```

Every new account starts with **1000 points**. There is **no real money** — points are the
currency (real payments are a later phase).

> There's a friendly, in-app version of this page at **`/how-it-works`**.

---

## 👤 For publishers — "I want to get sponsored"

| # | Step | Where |
|---|------|-------|
| 1 | **Create an account.** Log in with a name + email; get 1000 points. | `/login` |
| 2 | **Create a slot.** Fixed 300×250 sidebar. Set a name and a price in points (what a sponsor pays to take it). | `/app/slots/new` |
| 3 | **Embed it.** Copy the one-line `<script>` snippet and paste it on your site. It injects an iframe that reserves the exact size → **zero layout shift**. | `/app/slots/[id]/embed` |
| 4 | **It fills itself.** While open, the widget shows a "Sponsor this spot" CTA. When someone sponsors, their ad appears automatically. | — |
| 5 | **Get paid in points + see stats.** Points land in your wallet the instant a sponsor pays. Views/clicks show per slot. | `/app`, `/app/wallet` |

**Embed snippet:**
```html
<script
  src="http://localhost:3000/widget.js"
  data-slot="sl_xxxxxxxx"
  async></script>
```

---

## 💰 For sponsors — "I want to sponsor someone"

| # | Step | Where |
|---|------|-------|
| 1 | **Find a slot.** Browse the marketplace, or click a "Sponsor this spot" widget on any site. | `/browse` |
| 2 | **Read the details.** Public page shows size, price (points), owner, and live view/click stats. | `/s/[publicId]` |
| 3 | **Log in.** New accounts start with 1000 points. | `/login` |
| 4 | **Submit your ad & pay.** Add a headline, optional image URL, and a destination link, then pay the slot's price. Points transfer instantly to the publisher. | `/s/[publicId]` |
| 5 | **Your ad goes live.** The widget serves your creative immediately; clicks forward to your link and are counted. | — |

---

## How points work
- Every new account starts with **1000 points**.
- Sponsoring **transfers** the slot's price from sponsor → publisher, in a single database transaction.
- Every transfer is recorded in the **Wallet** ledger (`/app/wallet`).
- You **cannot** sponsor your own slot (points must move between two different people).
- No real money — points only, for now.

## How tracking works
- The widget loading counts a **view**.
- Tapping the ad counts a **click**, then forwards the visitor to the sponsor's link (`/api/click/[publicId]`).
- Views and clicks appear on the publisher dashboard and the slot's public page.
- No cookies, no cross-site visitor tracking.

---

## Try the full loop
1. `pnpm dev` → open http://localhost:3000
2. Log in (e.g. `priya@demo.com`) as a **publisher** → create a slot → open its embed page → "Open demo site".
3. In an **incognito** window, log in with a **different** email (e.g. `max@demo.com`) as a **sponsor** → open the slot's public page → submit an ad → pay points.
4. Watch the ad go live, and check both wallets.

---

## Under the hood (for developers)
- **Data:** Supabase Postgres via Drizzle. Tables `bms_user`, `bms_slot`, `bms_event`, `bms_txn`
  (see `lib/proto/schema.ts`). Schema is pushed with:
  ```bash
  set -a && . ./.env && set +a && pnpm exec drizzle-kit push --config drizzle.proto.config.ts
  ```
- **Auth:** demo-grade, passwordless. A `jose`-signed `bms_session` cookie holds the user id
  (`lib/proto/session.ts`). Not Better Auth — that's the spec-track plan.
- **Server actions:** `lib/proto/actions.ts` — `signIn`, `signOut`, `createSlot`, `sponsorSlot`
  (the points transfer + creative update runs in one DB transaction).
- **Serving:** `widget.js` (in `public/`) injects an iframe → `/embed/[publicId]` renders the
  creative or CTA and logs a view. `/api/click/[publicId]` logs a click and redirects.
- **Key routes:** `/login`, `/app` (dashboard), `/app/slots/new`, `/app/slots/[id]/embed`,
  `/app/wallet`, `/browse`, `/s/[publicId]`, `/embed/[publicId]`, `/playground?slot=…`.

> This prototype **deliberately deviates** from the phased spec in `CLAUDE.md` (points instead
> of money, demo auth instead of Better Auth, `bms_` tables instead of the org model). See
> CLAUDE.md §11 for the two tracks.
