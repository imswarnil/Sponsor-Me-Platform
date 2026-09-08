-- TWO BRANDS MUST NEVER HOLD THE SAME SLOT AT THE SAME TIME.
--
-- lib/queries.ts checks for an overlap before it starts a checkout, and that
-- check is not sufficient on its own: two sponsors whose webhooks land in the
-- same instant both read a free window, both pass, and both write. The only
-- arbiter that cannot lose that race is the database.
--
-- An EXCLUSION constraint is exactly this problem's shape — "no two rows where
-- slot_id matches AND the time ranges overlap" — and it is enforced by the
-- same index that answers the query, so it costs nothing to keep.
--
-- Scoped to status='paid': a pending checkout holds no inventory (someone who
-- opens a payment page and wanders off must not block the slot for everybody
-- else), and a rejected or cancelled booking holds none either.
--
-- `[)` bounds — start inclusive, end exclusive — so a booking ending at
-- midnight on the 1st and one starting at midnight on the 1st do not collide.
--
-- Requires btree_gist, which supplies the `=` operator for uuid inside an
-- exclusion constraint. It ships with Postgres and Neon allows it.

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS btree_gist;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sb_booking_no_overlap'
  ) THEN
    ALTER TABLE "sb_booking"
      ADD CONSTRAINT "sb_booking_no_overlap"
      EXCLUDE USING gist (
        "slot_id" WITH =,
        tstzrange("starts_at", "ends_at", '[)') WITH &&
      )
      WHERE (status = 'paid');
  END IF;
END $$;
