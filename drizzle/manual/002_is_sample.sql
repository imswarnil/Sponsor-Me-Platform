-- Marks seeded demo rows so the UI can badge them "Sample" instead of passing
-- invented people and sponsorships off as real ones (CLAUDE.md §4, and
-- lib/proto/schema.ts where both columns are documented).
--
-- Applied by hand rather than through `drizzle-kit push`: push wanted to drop
-- a NOT NULL on a primary-key column at the same time (PostgresError 42P16,
-- "column id is in a primary key") — pre-existing drift between the schema
-- file and the live database that has nothing to do with these two columns,
-- and not something to let loose on a live database as a side effect of
-- adding a boolean. Idempotent, like everything else in this folder.
--
-- One DO block rather than two ALTERs because apply-sql.mjs sends each file as
-- a single prepared statement, and Postgres refuses multiple commands there.

DO $$
BEGIN
  ALTER TABLE bms_member ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;
  ALTER TABLE bms_slot   ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;
END
$$;
