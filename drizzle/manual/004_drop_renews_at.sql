-- A spot on the wall is a one-time bid, held until someone bids more — it does
-- not renew and it does not expire (CLAUDE.md §0, lib/site.ts `membership`).
-- So the monthly clock this column kept is meaningless now, and the sweep that
-- read it (`expireStaleMembers`) is gone. Nullable-or-not, dropping a column
-- is a catalog-only change in Postgres — no rewrite, nothing that blocks
-- reads. Idempotent like everything else in this folder.
ALTER TABLE bms_member DROP COLUMN IF EXISTS renews_at;
