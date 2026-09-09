-- House ads, and the activity feed.
--
-- Applied by hand because `drizzle-kit push` cannot ALTER this database at all:
-- its diff emits `ALTER TABLE x DROP CONSTRAINT "x_col_not_null"` for every NOT
-- NULL column — named NOT NULL constraints are a Postgres 17 feature this
-- branch does not have — and the whole push aborts with 42P16. Push still
-- creates new tables correctly; it is ALTER that is unusable. See TODO.md.
--
-- One DO block, because setup.mjs sends each file as a single statement and
-- Postgres refuses multiple commands there. plpgsql runs DDL directly.
--
-- Idempotent.

DO $$
BEGIN
  -- A HOUSE AD: the creator's own work, filling inventory nobody has bought.
  -- It costs nothing and is worth nothing — contendersFor() sorts it BELOW
  -- every paying ad, so a real sponsor always takes the spot from it, and it
  -- never appears in earnings. An empty slot showing the creator's own project
  -- is better than an empty slot; a house ad outranking a paying customer
  -- would be fraud.
  ALTER TABLE "sm_ad" ADD COLUMN IF NOT EXISTS "is_house" boolean NOT NULL DEFAULT false;

  -- The public record: somebody paid, somebody's ad went live. Append-only, and
  -- the names are denormalised so the feed still reads correctly after a
  -- sponsor deletes their account.
  CREATE TABLE IF NOT EXISTS "sm_activity" (
    "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "kind"         text NOT NULL,
    "actor"        text NOT NULL DEFAULT '',
    "slot_name"    text NOT NULL DEFAULT '',
    "amount_paise" integer,
    "created_at"   timestamptz NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS "sm_activity_recent_idx"
    ON "sm_activity" ("created_at" DESC);
END $$;
