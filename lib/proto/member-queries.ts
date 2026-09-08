import 'server-only';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { members, profiles } from './schema';

/**
 * Reads for the wall.
 *
 * Separate from membership.ts for the same reason offer-queries.ts is separate
 * from offers.ts: that file is `'use server'`, so anything exported from it is
 * an endpoint the browser can call.
 *
 * There is no lapse sweep here any more. A spot is a one-time bid held until
 * someone bids more (lib/site.ts `membership`) — nothing on the wall is on a
 * clock, so nothing needs sweeping when anybody looks.
 */

export type WallMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  instagramHandle: string | null;
  blurb: string | null;
  linkUrl: string | null;
  tierName: string;
  /** The bid — what the wall is ordered and sized by. */
  amount: number;
  /** Seeded demo row — the wall says so out loud. See scripts/seed-samples.mjs. */
  isSample: boolean;
};

/**
 * Everyone on the wall, in wall order.
 *
 * Highest bid first — that is the whole proposition. Ties go to whoever was
 * there first, so two people at the same bid have a stable, explicable order
 * and nobody leapfrogs without paying more.
 *
 * Only the fields the wall renders — this feeds a public, embeddable widget,
 * so selecting whole rows would put `profileId` a fetch away from anyone who
 * embeds it.
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
      amount: members.pricePoints,
      isSample: members.isSample
    })
    .from(members)
    .where(eq(members.status, 'active'))
    .orderBy(desc(members.pricePoints), asc(members.startedAt))
    .limit(limit);
}

/**
 * The wall's money, in one read: how many people, what their bids add up to,
 * and what the top spot went for. Real or zero — never a placeholder (§4).
 */
export async function getWallTotals(): Promise<{
  count: number;
  total: number;
  topAmount: number;
}> {
  const rows = await db
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${members.pricePoints}), 0)::int`,
      topAmount: sql<number>`coalesce(max(${members.pricePoints}), 0)::int`
    })
    .from(members)
    .where(eq(members.status, 'active'));
  return rows[0] ?? { count: 0, total: 0, topAmount: 0 };
}

/**
 * Where a bid placed *now* would land on the wall — 1 is the top. The bid form
 * shows this next to each preset, and the raise form shows what it would take
 * to reach #1. A tie goes to whoever was there first, so everyone already at
 * the same amount counts as above: matching the top bid reads as "#2".
 * `excludeProfileId` leaves the bidder's own current spot out when they are
 * already on the wall and raising.
 */
export async function rankForAmount(amount: number, excludeProfileId?: string): Promise<number> {
  const rows = await db
    .select({ above: sql<number>`count(*)::int` })
    .from(members)
    .where(
      and(
        eq(members.status, 'active'),
        sql`${members.pricePoints} >= ${amount}`,
        excludeProfileId ? sql`${members.profileId} <> ${excludeProfileId}` : undefined
      )
    );
  return (rows[0]?.above ?? 0) + 1;
}

/** A member's actual place today — the wall's own order, so it can never
 *  disagree with what the public page shows. `null` if not on the wall. */
export async function rankOfMember(memberId: string): Promise<number | null> {
  const wall = await getActiveWallMembers();
  const i = wall.findIndex((m) => m.id === memberId);
  return i === -1 ? null : i + 1;
}

/** The signed-in person's membership, active or lapsed. */
export async function getMyMembership(profileId: string) {
  const rows = await db.select().from(members).where(eq(members.profileId, profileId)).limit(1);
  return rows[0] ?? null;
}

/** Everything the studio needs to see, in wall order. */
export async function getAllMembers() {
  return db
    .select({ member: members, profile: profiles })
    .from(members)
    .innerJoin(profiles, eq(members.profileId, profiles.id))
    .orderBy(desc(members.pricePoints), asc(members.startedAt));
}

export async function countActiveMembers() {
  const rows = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.status, 'active'));
  return rows.length;
}
