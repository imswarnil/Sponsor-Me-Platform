-- sb_profile.id → neon_auth.user.id
--
-- Not in the generated schema because its target is provisioned by Neon Auth
-- rather than by us: the table does not exist until Auth is enabled on the
-- branch, and drizzle-kit must not be able to reach `neon_auth` at all (see
-- lib/db/neon-auth.ts). So this is applied separately, after `db:push`.
--
-- ON DELETE CASCADE is deliberate: deleting an account takes its profile, and
-- through the cascades declared in schema.ts, its bid, bookings, payments,
-- events and messages with it.
--
-- Idempotent: re-running is a no-op, because `db:push` is run many times
-- against the same branch. One DO block, because apply-sql.mjs sends each file
-- as a single statement and Postgres refuses multiple commands there.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sb_profile_auth_user_fk'
  ) THEN
    ALTER TABLE "sb_profile"
      ADD CONSTRAINT "sb_profile_auth_user_fk"
      FOREIGN KEY ("id") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
  END IF;
END $$;
