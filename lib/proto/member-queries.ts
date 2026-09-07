import 'server-only';
import { and, asc, desc, eq, lt } from 'drizzle-orm';
import { db } from './db';
import { members, profiles } from './schema';
import { revokeGhostMembership } from '@/lib/ghost-members';

/**
 * Reads for the membership flow, and the lapse sweep.
 *
 * Separate from membership.ts for the same reason offer-queries.ts is separate
 * from offers.ts: that file is `'use server'`, so anything exported from it is
 * an endpoint the browser can call.
 */

export type WallMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  instagramHandle: string | null;
  blurb: string | null;
  linkUrl: string | null;
  tierName: string;
  /** Seeded demo row — the wall says so out loud. See scripts/seed-samples.mjs. */
  isSample: boolean;
};

/**
 * Expire memberships whose paid period has run out.
 *
 * Runs on every read of the wall, the same pattern `expireStaleSlots` uses:
 * there is no scheduler in this app, so "has it lapsed?" is answered whenever
 * anybody looks. Ghost is updated too, so a lapsed member stops being a paid
 * member there without anyone doing it by hand.
 */
export async function expireStaleMembers() {
  const stale = await db
    .select({ id: members.id, ghostMemberId: members.ghostMemberId, email: profiles.email })
    .from(members)
    .innerJoin(profiles, eq(members.profileId, profiles.id))
    .where(and(eq(members.status, 'active'), lt(members.renewsAt, new Date())));

  if (stale.length === 0) return;

  for (const m of stale) {
    if (m.ghostMemberId && m.email) await revokeGhostMembership(m.ghostMemberId, m.email);
    await db.update(members).set({ status: 'lapsed' }).where(eq(members.id, m.id));
  }
}

/**
 * Everyone currently on the wall.
 *
 * Only the fields the wall renders — this feeds a public, embeddable widget, so
 * selecting whole rows would put `ghostMemberId` and `profileId` a fetch away
 * from anyone who embeds it.
 */
export async function getActiveWallMembers(limit = 200): Promise<WallMember[]> {
  return db
    .select({
      id: members.id,
      displayName: members.displayName,
      avatarUrl: members.avatarUrl,
      instagramHandle: members.instagramHandle,
      blurb: members.blurb,
      linkUrl: members.linkUrl,
      tierName: members.tierName,
      isSample: members.isSample
    })
    .from(members)
    .where(eq(members.status, 'active'))
    .orderBy(asc(members.startedAt))
    .limit(limit);
}

/** The signed-in person's membership, active or lapsed. */
export async function getMyMembership(profileId: string) {
  const rows = await db.select().from(members).where(eq(members.profileId, profileId)).limit(1);
  return rows[0] ?? null;
}

/** Everything the studio needs to see, newest first. */
export async function getAllMembers() {
  return db
    .select({ member: members, profile: profiles })
    .from(members)
    .innerJoin(profiles, eq(members.profileId, profiles.id))
    .orderBy(desc(members.startedAt));
}

export async function countActiveMembers() {
  const rows = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.status, 'active'));
  return rows.length;
}
