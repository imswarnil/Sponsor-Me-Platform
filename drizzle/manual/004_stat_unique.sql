-- sm_stat UNIQUE(ad_id, day) — the constraint the counter conflicts against.
--
-- WHY THIS EXISTS AS A SEPARATE FILE. It was declared in schema.ts, but the
-- `db push` that would have created it aborted on the 42P16 bug, so it never
-- landed. Counting is best-effort by design — a counter that fails must never
-- stop an ad rendering on somebody else's site — so `recordView` swallowed
-- "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification" on every single impression, and views silently vanished for
-- as long as it was missing.
--
-- The lesson is in lib/track.ts now: a swallowed error still gets logged, so
-- the next time this breaks it is visible in the Worker's logs rather than
-- being indistinguishable from "nobody looked".
--
-- Idempotent.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sm_stat_unique') THEN
    -- Collapse any duplicate (ad, day) rows first: without the constraint,
    -- every impression that DID land inserted its own row.
    DELETE FROM "sm_stat" a USING "sm_stat" b
      WHERE a.ctid < b.ctid AND a."ad_id" = b."ad_id" AND a."day" = b."day";

    ALTER TABLE "sm_stat" ADD CONSTRAINT "sm_stat_unique" UNIQUE ("ad_id", "day");
  END IF;
END $$;
