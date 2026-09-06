import 'server-only';
import { createNeonAuth } from '@neondatabase/auth/next/server';

/**
 * The Neon Auth client.
 *
 * Neon Auth is Better Auth hosted by Neon: the auth server lives at
 * `NEON_AUTH_BASE_URL` and writes users, sessions and accounts into the
 * `neon_auth` schema of *our own* database. Two consequences worth knowing:
 *
 *   - Sessions are rows, not just signed cookies, so revocation is real.
 *   - `bms_profile.id` is a genuine foreign key to `neon_auth.user.id`,
 *     enforced by Postgres — see `drizzle/manual/001_profile_auth_fk.sql`.
 *
 * This replaces Supabase Auth. The one behaviour that did NOT survive the move
 * is the `handle_new_user()` trigger: Supabase let us hang a trigger off
 * `auth.users` to create the matching `bms_profile` row. Neon provisions and
 * migrates the `neon_auth` tables itself, so putting our trigger on them would
 * be writing into someone else's schema. Profile creation is therefore an
 * app-level concern now — `ensureProfile()` in `lib/proto/queries.ts`.
 *
 * ── Why the client is lazy ──────────────────────────────────────────────────
 * Constructing it at module scope looks tidier and breaks the build. `next
 * build` imports every route module to collect page data, so a top-level
 * `createNeonAuth()` runs — and throws — on any machine where the environment
 * is not yet populated. Building should never require credentials; serving
 * should. Deferring construction draws that line in the right place: a missing
 * variable surfaces on a request, naming itself, instead of aborting a deploy.
 *
 * Server-only. Importing this from a client component would put the cookie
 * secret in the browser bundle — go through `lib/auth/actions.ts` instead.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Locally: copy .env.example to .env and fill it in. ` +
        `On a deployment: add it to the environment. See CLAUDE.md §3.`
    );
  }
  return value;
}

let instance: ReturnType<typeof createNeonAuth> | undefined;

/** The memoised client. Constructed on first use, never at import. */
export function getAuth() {
  if (!instance) {
    instance = createNeonAuth({
      baseUrl: required('NEON_AUTH_BASE_URL'),
      cookies: {
        // Must be at least 32 characters; createNeonAuth throws otherwise.
        secret: required('NEON_AUTH_COOKIE_SECRET'),
        sessionDataTtl: 300
      }
    });
  }
  return instance;
}

/** True when this environment is configured enough to authenticate anyone. */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);
}
