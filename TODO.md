# TODO — Sponsor Me

## 1 · Put a payment through, end to end

**Before anything else.** The checkout builds a Dodo session and the webhook is
written against Dodo's documented payload and correctly rejects unsigned
deliveries (verified, 401). But **no payment has completed even in test mode**,
so the success path is unexercised.

- [ ] `npm run dodo:setup`, set `DODO_PRODUCT_ID`.
- [ ] Create a webhook endpoint in Dodo, set `DODO_PAYMENTS_WEBHOOK_KEY`.
      Without this key the webhook rejects every delivery and no ad ever goes
      live — the correct failure, but a silent one.
- [ ] Tunnel `/api/webhooks/dodo` (`cloudflared tunnel --url http://localhost:3500`).
- [ ] Buy a fixed slot. Confirm `sm_payment` goes `pending → paid`, the ad moves
      to `pending`, and it only serves after you approve it in `/studio`.
- [ ] Bid on the bid slot twice from one account. Confirm `amount_paise` ADDS
      up and `first_paid_at` is set once, not overwritten.
- [ ] Deliver the same webhook twice — the second must be a no-op.

## 2 · Deploy, in this order

1. [ ] **DNS first** — a Worker Route attaches to a record that already exists.
       Add a **proxied** record for `sponsor` in the `imswarnil.com` zone.
2. [ ] `wrangler secret put` for each name in `.env.example` except the demo
       pair. `CREATOR_EMAIL` must not be skipped.
3. [ ] Trust the production origin in Neon Auth, or sign-in fails in production
       while working perfectly on localhost.
4. [ ] `npm run cf:deploy`, then check the gates answer **307** and not 200.
5. [ ] Point the Dodo webhook at the real URL.

## 3 · `drizzle-kit push` cannot ALTER this database

Its diff emits `ALTER TABLE x DROP CONSTRAINT "x_col_not_null"` for every NOT
NULL column — a Postgres 17 feature this branch lacks — and aborts with 42P16.
Creating tables works; altering them does not. Until fixed, schema changes go
in `drizzle/manual/` and are applied by `npm run db:fk`.

- [ ] Upgrade `drizzle-kit` (0.31.1 → 0.31.10) with **pnpm**, and re-test
      against a Neon *branch*, not the live database.
- [ ] If push still cannot alter, switch to `drizzle-kit generate` + versioned
      migrations, which do not diff.

## 4 · Known gaps

- [ ] **An expired fixed ad still shows on the sponsor's own page.**
      `contendersFor()` correctly stops serving it, but `/me` renders every ad
      the sponsor has without saying "this run has ended". Add the state.
- [ ] **Refunds and disputes** are acknowledged and ignored, so a refunded ad
      keeps serving. Decide the policy before writing the handler.
- [ ] **Email verification** — signup auto-confirms, and no transactional email
      is configured at all, so password resets do not arrive. (There are no
      forgot-password pages in this build.)
- [ ] **Rate limiting** on the actions. Needs Redis/Upstash.
- [ ] **A strict `script-src` CSP.**
- [ ] **Per-slot stats in the studio** — `sm_stat` has the data, the studio only
      shows platform totals.

## 5 · Ideas

- A public JSON feed of a slot, so a theme could render the ad natively instead
  of through an iframe.
- Let a sponsor schedule a bid increase, to defend a rank while asleep.
- Show a sponsor the *second* place amount, so they know how safe they are.
