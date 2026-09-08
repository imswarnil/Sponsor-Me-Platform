-- sb_booking.approved_at — approval, as an axis separate from payment.
--
-- Paying HOLDS the window (and the exclusion constraint in 002 is scoped to
-- `status = 'paid'` to enforce that). Approval decides whether the creative
-- RENDERS. Folding the two into one column would mean an approved booking
-- leaving the `paid` state, and the moment it did, 002 would stop guarding its
-- window and the slot could be sold twice.
--
-- Applied by hand rather than through `drizzle-kit push` because that command
-- cannot currently ALTER this database at all: its diff emits
-- `ALTER TABLE x DROP CONSTRAINT "x_col_not_null"` for every NOT NULL column in
-- the schema — named NOT NULL constraints are a Postgres 17 feature this branch
-- does not have — and the whole push aborts with 42P16. `push` still creates
-- new tables correctly; it is ALTER that is unusable. See TODO.md.
--
-- Adding a nullable column with no default is catalog-only in Postgres: no
-- table rewrite, nothing that blocks reads. Idempotent.

ALTER TABLE "sb_booking" ADD COLUMN IF NOT EXISTS "approved_at" timestamptz;
