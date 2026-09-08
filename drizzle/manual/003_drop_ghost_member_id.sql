-- Ghost is its own platform now (CLAUDE.md §0): a membership here no longer
-- mirrors into a comped Ghost tier, so the id that mirror wrote is dead data.
-- The column is nullable, so dropping it is a catalog-only change in Postgres
-- — no table rewrite, nothing that blocks reads. Idempotent like everything
-- else in this folder.
ALTER TABLE bms_member DROP COLUMN IF EXISTS ghost_member_id;
