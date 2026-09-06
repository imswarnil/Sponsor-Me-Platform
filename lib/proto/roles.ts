import 'server-only';
import { redirect } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from './db';
import { profiles } from './schema';
import { getCurrentUser } from './queries';

/**
 * This platform has exactly one creator — the person it exists to fund — and
 * everyone else is a sponsor. The creator is identified by `CREATOR_EMAIL`
 * rather than by a database flag, so admin access cannot be granted by a bad
 * row or a stray update: it takes a deploy.
 */
const CREATOR_EMAIL = process.env.CREATOR_EMAIL?.trim().toLowerCase() || null;

export type Role = 'creator' | 'sponsor';

/**
 * The creator's profile.
 *
 * With `CREATOR_EMAIL` unset we fall back to the oldest account, which is
 * correct for a single-user install and keeps a fresh deploy from rendering an
 * empty site. That fallback grants admin, so it is deliberately narrow: set
 * CREATOR_EMAIL in production and it is never reached.
 */
export async function getCreator() {
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
}

/** Set when the fallback above is load-bearing, so the studio can say so. */
export function creatorEmailConfigured() {
  return CREATOR_EMAIL !== null;
}

export async function getCreatorId(): Promise<string | null> {
  const creator = await getCreator();
  return creator?.id ?? null;
}

export async function isCreator(userId: string | null | undefined) {
  if (!userId) return false;
  return (await getCreatorId()) === userId;
}

/** The signed-in user plus their role, or null when signed out. */
export async function getViewer() {
  const user = await getCurrentUser();
  if (!user) return null;
  const creatorId = await getCreatorId();
  const role: Role = user.id === creatorId ? 'creator' : 'sponsor';
  return { ...user, role };
}

/** Where a given role belongs after signing in. */
export function homeFor(role: Role) {
  return role === 'creator' ? '/studio' : '/sponsor';
}

/** Gate for /studio. Sponsors are sent to their own dashboard, not to a 403. */
export async function requireCreator(next = '/studio') {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (viewer.role !== 'creator') redirect('/sponsor');
  return viewer;
}

/** Gate for /sponsor. The creator has a studio instead. */
export async function requireSponsor(next = '/sponsor') {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (viewer.role === 'creator') redirect('/studio');
  return viewer;
}

/** Any signed-in user, whatever their role. */
export async function requireViewer(next: string) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}
