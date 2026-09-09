-- sm_ad.logo_url — a square brand mark for the leaderboard.
--
-- Deliberately NOT reusing `image_url`: that is the ad's own artwork, and the
-- two want opposite shapes. A wide screenshot makes a poor avatar and a logo
-- makes a poor banner, so a sponsor supplies each for the place it appears.
--
-- Applied by hand because `drizzle-kit push` cannot ALTER this database
-- (CLAUDE.md §2). Nullable, no default — catalog-only, no rewrite. Idempotent.

ALTER TABLE "sm_ad" ADD COLUMN IF NOT EXISTS "logo_url" text;
