-- sm_ad.tag — what a sponsor does, in a word.
--
-- The leaderboard shows it beside the website, so a reader can tell what a
-- name IS before deciding whether to click it. "Linear" means nothing on its
-- own; "Linear · Issue tracker" means something.
--
-- Applied by hand because `drizzle-kit push` cannot ALTER this database (see
-- CLAUDE.md §2). Nullable with no default, so this is catalog-only: no table
-- rewrite, nothing that blocks reads. Idempotent.

ALTER TABLE "sm_ad" ADD COLUMN IF NOT EXISTS "tag" text;
