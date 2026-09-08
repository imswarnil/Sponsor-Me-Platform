import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { getAuth, isAuthConfigured } from '@/lib/auth/server';

/**
 * WHO IS WHO.
 *
 * This platform has exactly two kinds of person: the creator, and everybody
 * else. The creator is identified by `CREATOR_EMAIL` in the environment rather
 * than by a column, so administrator access cannot be granted by a bad row or
 * a stray UPDATE — it takes a deploy. That is the single most important
 * sentence in this file.
 */

const CREATOR_EMAIL = process.env.CREATOR_EMAIL?.trim().toLowerCase() || null;

export type Role = 'creator' | 'sponsor';

/**
 * The signed-in Neon Auth session, or null.
 *
 * Memoised per request with React's `cache()`, and that is not a
 * micro-optimisation: every gate below and every owner-scoped query calls
 * through here, so one render otherwise makes the same HTTP round-trip to the
 * auth server five or six times. The cache lives for exactly one request, so
 * no visitor's session can leak into another's render.
 */
const sessionUser = cache(async function sessionUser() {
  // A deployment with no auth configured should render the public page as a
  // signed-out visitor, not crash with a 500.
  if (!isAuthConfigured()) return null;
  try {
    const { data } = await getAuth().getSession();
    return data?.user ?? null;
  } catch {
    /**
     * A stale or revoked cookie must read as "signed out", never as a 500.
     *
     * `getSession()` rewrites the cookie when its cached data expires and
     * clears it when the session behind it is gone. Both are cookie *writes*,
     * which Next only permits inside a Server Action or Route Handler — so
     * from a page render it throws. Anyone holding a revoked cookie would get
     * an error page instead of the signed-out page, and could not reach
     * /signin to fix it, because the header renders there too.
     *
     * Swallowing it is right rather than lazy: this function's whole contract
     * is "the session, or null", and an unreadable session is null. The cookie
     * is left alone until a real Server Action gets to rewrite it, which is
     * where a cookie write belongs.
     */
    return null;
  }
});

export async function getCurrentUserId(): Promise<string | null> {
  return (await sessionUser())?.id ?? null;
}

/**
 * The current user's profile row, created on first sight.
 *
 * Under a hosted auth provider that owns its own schema there is nowhere to
 * hang a trigger, so profile creation is an app-level concern. `onConflictDoNothing`
 * rather than read-then-write: two requests from the same new account can race
 * here and the primary key is the only reliable arbiter.
 */
export const getProfile = cache(async function getProfile() {
  const user = await sessionUser();
  if (!user) return null;

  const existing = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (existing[0]) return existing[0];

  const created = await db
    .insert(profiles)
    .values({ id: user.id, email: user.email ?? null, name: user.name ?? '' })
    .onConflictDoNothing()
    .returning();

  if (created[0]) return created[0];

  // Lost the race — the other request created it; read it back.
  const row = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  return row[0] ?? null;
});

/**
 * The creator's profile.
 *
 * With `CREATOR_EMAIL` unset this falls back to the oldest account, which is
 * right for a fresh single-user install and keeps a new deploy from rendering
 * an empty site. That fallback GRANTS ADMIN, so it is deliberately narrow, and
 * `creatorEmailConfigured()` exists so the studio can say out loud when it is
 * load-bearing. Set CREATOR_EMAIL in production and it is never reached.
 */
export const getCreator = cache(async function getCreator() {
  if (CREATOR_EMAIL) {
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, CREATOR_EMAIL))
      .limit(1);
    if (rows[0]) return rows[0];
  }
  const first = await db.select().from(profiles).orderBy(asc(profiles.createdAt)).limit(1);
  return first[0] ?? null;
});

export function creatorEmailConfigured() {
  return CREATOR_EMAIL !== null;
}

export async function getCreatorId(): Promise<string | null> {
  return (await getCreator())?.id ?? null;
}

/** The signed-in user plus their role, or null when signed out. */
export const getViewer = cache(async function getViewer() {
  const profile = await getProfile();
  if (!profile) return null;
  const creatorId = await getCreatorId();
  const role: Role = profile.id === creatorId ? 'creator' : 'sponsor';
  return { ...profile, role };
});

/** Where a role belongs after signing in. */
export function homeFor(role: Role) {
  return role === 'creator' ? '/studio' : '/dashboard';
}

/** Gate for /studio. A sponsor is sent to their own dashboard, not to a 403. */
export async function requireCreator(next = '/studio') {
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=${encodeURIComponent(next)}`);
  if (viewer.role !== 'creator') redirect('/dashboard');
  return viewer;
}

/** Gate for /dashboard. The creator has the studio instead. */
export async function requireSponsor(next = '/dashboard') {
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=${encodeURIComponent(next)}`);
  if (viewer.role === 'creator') redirect('/studio');
  return viewer;
}

/** Any signed-in user, whatever their role. */
export async function requireViewer(next: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return viewer;
}
