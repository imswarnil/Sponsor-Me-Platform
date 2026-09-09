-- ONE AD PER SPONSOR PER SLOT.
--
-- lib/actions.ts reads for an existing row and updates it rather than
-- inserting a second, and that check is not sufficient on its own: two
-- requests from the same account arriving together both find nothing and both
-- insert. The result would be a sponsor with two ads in one slot, splitting
-- their own bid between them and losing to somebody who paid less.
--
-- The database is the only arbiter that cannot lose that race.
--
-- Idempotent.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sm_ad_one_per_slot') THEN
    ALTER TABLE "sm_ad"
      ADD CONSTRAINT "sm_ad_one_per_slot" UNIQUE ("slot_id", "profile_id");
  END IF;
END $$;
