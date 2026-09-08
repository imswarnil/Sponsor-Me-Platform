# TODO — SponsorBid

The real, current open list. `CLAUDE.md` explains how anything here works.

## 1 · Put a payment through, end to end

**This is the one thing that matters before anything else.** The checkout
actions build a Dodo session and redirect; the webhook handler is written
against Dodo's documented payload and correctly rejects unsigned deliveries
(verified, 401). But **no payment has been completed even in test mode**, so the
success path is unexercised.

- [ ] `npm run dodo:setup`, set `DODO_PRODUCT_ID`.
- [ ] Create a webhook endpoint in the Dodo dashboard, set `DODO_PAYMENTS_WEBHOOK_KEY`.
      Without this key the webhook rejects every delivery and no ad ever goes
      live — the correct failure, but a silent one.
- [ ] Tunnel `/api/webhooks/dodo` to localhost (`cloudflared tunnel --url http://localhost:3500`).
- [ ] Place a test bid. Confirm: `sb_payment` goes `pending → paid`;
      `sb_bid.amount_paise` increases by exactly the payment; `first_paid_at` is
      set once and not overwritten by a second top-up; the ad appears on the
      board only after approval in `/studio`.
- [ ] Deliver the same webhook twice. The second must be a no-op — the UNIQUE on
      `dodo_payment_id` is what enforces it, so this is testing the database as
      much as the code.
- [ ] Book a slot, then try to book an overlapping window from a second account.
      The EXCLUSION constraint should refuse it.

## 2 · Deploy — in this order, it does not work out of order

1. [ ] **DNS first.** A Worker Route attaches to a record that already exists.
       Add a **proxied** (orange-cloud) record for `sponsor` in the
       `imswarnil.com` zone. It did not resolve as of 2026-09-09.
2. [ ] `wrangler secret put` for each name in `.env.example` except the demo
       pair. `CREATOR_EMAIL` must not be skipped (CLAUDE.md §3).
3. [ ] Trust the production origin in Neon Auth, or every sign-in fails in
       production while working perfectly on localhost.
4. [ ] `npm run cf:deploy`, then check the gates answer **307** and not 200 —
       that is the PPR trap described in CLAUDE.md §8.
5. [ ] Point the Dodo webhook at the real URL.

## 3 · `drizzle-kit push` cannot ALTER this database

**`db:push` creates new tables fine and cannot change an existing one.** Its
diff emits `ALTER TABLE x DROP CONSTRAINT "x_col_not_null"` for *every* NOT NULL
column in the schema — named NOT NULL constraints are a Postgres 17 feature this
branch does not have — and the whole push aborts with 42P16, "column id is in a
primary key". Adding `.notNull()` to the primary key does not help; the
statements are emitted for every column, not just that one.

Until it is fixed, **schema changes to existing tables go in `drizzle/manual/`**
and are applied by `npm run db:fk` (see `004_booking_approved_at.sql`, which is
exactly this situation).

- [ ] Upgrade `drizzle-kit` (0.31.1 → 0.31.10) and `drizzle-orm` (0.43.1 →
      current) and re-test `npm run db:push` against a Neon **branch**, not the
      live database. An `npm install` of the pair needs `--legacy-peer-deps`: an
      optional `@op-engineering/op-sqlite` → `react-native` peer chain conflicts
      with React 19 and has nothing to do with this app.
- [ ] If push still cannot alter, drop it for `drizzle-kit generate` +
      versioned migrations, which do not diff.

## 4 · Known gaps

- [ ] **Refunds and disputes are acknowledged and ignored.** `payment.refunded`
      and a dispute event return 200 and do nothing, so a refunded bid keeps its
      rank. Decide the policy first — the model says a rank is never taken away,
      which makes a refund a genuine product question, not just a handler.
- [ ] **Email verification.** Signup auto-confirms. Also: no transactional email
      is configured at all, so **password reset emails do not arrive**.
- [ ] **Rate limiting** on the actions. Needs Redis/Upstash; nothing else in the
      stack can hold a counter.
- [ ] **A strict `script-src` CSP.**
- [ ] **`sb_activity` is only written on payment and approval.** The homepage
      ticker is therefore quiet even when slots are being booked.

## 5 · Ideas, not commitments

- A public JSON feed of the board, so the widget could be rendered by a theme
  directly instead of through an iframe.
- Per-property counting: `sb_event` records which *ad* was seen but not which
  site it was seen on. The column would be cheap to add and would answer "which
  of my sites actually converts".
- Let a sponsor schedule a bid increase, so they can defend a rank while asleep.
