-- bms_profile.id → neon_auth.user.id
--
-- Not in the generated schema because its target is provisioned by Neon Auth
-- rather than by us: the table does not exist until Auth is enabled on the
-- branch, and drizzle-kit must not be able to reach `neon_auth` at all (see
-- lib/proto/neon-auth.ts). So this is applied separately, after `db:push`.
--
-- This is the constraint that replaces Supabase's `bms_profile.id REFERENCES
-- auth.users(id)`. ON DELETE CASCADE is deliberate and was the old behaviour:
-- deleting an account takes its profile — and through the existing cascades on
-- bms_slot, bms_txn, bms_notification and the message tables, the rest of its
-- record — with it.
--
-- Idempotent: re-running is a no-op rather than an error, because `db:push`
-- may be run many times against the same branch.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bms_profile_auth_user_fk'
  ) THEN
    ALTER TABLE "bms_profile"
      ADD CONSTRAINT "bms_profile_auth_user_fk"
      FOREIGN KEY ("id") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
  END IF;
END $$;
