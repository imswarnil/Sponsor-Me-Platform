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
 * Two kinds of person: the creator, and everybody else. The creator is
 * whoever matches `CREATOR_EMAIL` in the environment — not a database column —
 * so admin cannot be granted by a stray UPDATE. It takes a deploy.
 */

const CREATOR_EMAIL = process.env.CREATOR_EMAIL?.trim().toLowerCase() || null;

export type Role = 'creator' | 'sponsor';

/**
 * Memoised per request. Every gate and every owner-scoped query calls through
 * here, so without `cache()` one render makes the same round-trip to the auth
 * server five or six times. The cache lives for exactly one request.
 */
const sessionUser = cache(async function sessionUser() {
  if (!isAuthConfigured()) return null;
  try {
    const { data } = await getAuth().getSession();
    return data?.user ?? null;
  } catch {
    /**
     * A stale or revoked cookie must read as "signed out", never as a 500.
     * getSession() rewrites the cookie when its cached data expires, and Next
     * only permits a cookie write inside a Server Action or Route Handler — so
     * from a page render it throws. Anyone holding a revoked cookie would get
     * an error page and could not even reach /signin to fix it.
     *
     * This function's whole contract is "the session, or null", and an
     * unreadable session is null.
     */
    return null;
  }
});

/** The current profile, created on first sight. */
export const getProfile = cache(async function getProfile() {
  const user = await sessionUser();
  if (!user) return null;

  const [existing] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (existing) return existing;

  // onConflictDoNothing, not read-then-write: two requests from the same new
  // account race here and the primary key is the only reliable arbiter.
  const [created] = await db
    .insert(profiles)
    .values({ id: user.id, email: user.email ?? null, name: user.name ?? '' })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  const [row] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  return row ?? null;
});

/**
 * With CREATOR_EMAIL unset this falls back to the oldest account — right for a
 * fresh local install, and it GRANTS ADMIN, so the studio says out loud when
 * it is load-bearing. Set CREATOR_EMAIL in production and it is never reached.
 */
export const getCreator = cache(async function getCreator() {
  if (CREATOR_EMAIL) {
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, CREATOR_EMAIL))
      .limit(1);
    if (row) return row;
  }
  const [first] = await db.select().from(profiles).orderBy(asc(profiles.createdAt)).limit(1);
  return first ?? null;
});

export function creatorEmailConfigured() {
  return CREATOR_EMAIL !== null;
}

export const getViewer = cache(async function getViewer() {
  const profile = await getProfile();
  if (!profile) return null;
  const creator = await getCreator();
  const role: Role = creator && profile.id === creator.id ? 'creator' : 'sponsor';
  return { ...profile, role };
});

export function homeFor(role: Role) {
  return role === 'creator' ? '/studio' : '/me';
}

export async function requireCreator(next = '/studio') {
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=${encodeURIComponent(next)}`);
  if (viewer.role !== 'creator') redirect('/me');
  return viewer;
}

export async function requireSponsor(next = '/me') {
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=${encodeURIComponent(next)}`);
  if (viewer.role === 'creator') redirect('/studio');
  return viewer;
}

export async function requireViewer(next: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return viewer;
}
