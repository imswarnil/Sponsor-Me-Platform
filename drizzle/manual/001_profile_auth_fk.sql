-- sm_profile.id → neon_auth.user.id
--
-- Not in the generated schema because Neon provisions and migrates the
-- neon_auth tables, and drizzle-kit must never reach them (see
-- lib/db/neon-auth.ts). Applied separately, after db:push.
--
-- ON DELETE CASCADE is deliberate: deleting an account takes its profile and,
-- through the cascades in schema.ts, its ads, payments and stats with it.
--
-- Idempotent. One DO block, because apply-sql.mjs sends each file as a single
-- statement and Postgres refuses multiple commands there.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sm_profile_auth_user_fk') THEN
    ALTER TABLE "sm_profile"
      ADD CONSTRAINT "sm_profile_auth_user_fk"
      FOREIGN KEY ("id") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
  END IF;
END $$;
