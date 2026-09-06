import 'server-only';
import { and, desc, eq, gte, inArray, lt, ne, sql } from 'drizzle-orm';
import { db } from './db';
import {
  channelConnections,
  events,
  messages,
  notifications,
  profiles,
  slots,
  sponsorshipHistory,
  threads,
  txns
} from './schema';
import { cache } from 'react';
import { getAuth, isAuthConfigured } from '@/lib/auth/server';

/**
 * The signed-in Neon Auth session, or null.
 *
 * **Memoised per request** with React's `cache()`, and that is not a
 * micro-optimisation: every gate in roles.ts and every owner-scoped query calls
 * through here, so one render was making the same HTTP round-trip to the auth
 * server five or six times. Deduped it asks once. The cache lives for exactly
 * one request, so no visitor's session can leak into another's render.
 */
const getSessionUser = cache(async function getSessionUser() {
  // A deployment with no auth configured should render the public pages as a
  // signed-out visitor rather than crash with a 500.
  if (!isAuthConfigured()) return null;
  const { data } = await getAuth().getSession();
  return data?.user ?? null;
});

/** The current `neon_auth.user.id`, or null. */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}

/**
 * The current user's profile row (name, points, role), or null.
 *
 * Creates the row on first sight. Under Supabase this was a `handle_new_user()`
 * trigger on `auth.users`; Neon provisions and migrates the `neon_auth` tables
 * itself, so hanging our trigger off them would mean writing into a schema we
 * do not own. Doing it here instead means the profile appears on the new
 * account's first authenticated request rather than at the instant of signup —
 * a distinction with no user-visible difference, since the first thing every
 * signed-up account does is load a page.
 */
export async function getCurrentUser() {
  const user = await getSessionUser();
  if (!user) return null;

  const rows = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (rows[0]) return rows[0];

  return ensureProfile(user.id, user.email ?? null, user.name ?? '');
}

/**
 * Create the profile for a freshly authenticated account, and tell the creator
 * a new sponsor has arrived.
 *
 * `onConflictDoNothing` rather than a read-then-write: two requests from the
 * same new account can race here, and the primary key is the only reliable
 * arbiter. The notification is only inserted when this call actually created
 * the row, so a race cannot announce the same sponsor twice.
 */
export async function ensureProfile(id: string, email: string | null, name: string) {
  const inserted = await db
    .insert(profiles)
    .values({ id, email, name })
    .onConflictDoNothing()
    .returning();

  if (inserted[0]) {
    const creatorEmail = process.env.CREATOR_EMAIL?.trim().toLowerCase() ?? null;
    const isCreator = creatorEmail !== null && email?.toLowerCase() === creatorEmail;

    if (!isCreator) {
      // Same signal the old DB trigger raised: the creator's bell, not email.
      const creator = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.email, creatorEmail ?? ''))
        .limit(1);
      if (creator[0]) {
        await db.insert(notifications).values({
          userId: creator[0].id,
          type: 'system',
          title: `New sponsor: ${name || email || 'someone'}`,
          body: 'They just created an account.',
          href: '/studio/sponsors'
        });
      }
    }
    return inserted[0];
  }

  const existing = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return existing[0] ?? null;
}

export async function getUserById(id: string) {
  const rows = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getUserSlots(ownerId: string, includeArchived = false) {
  const where = includeArchived
    ? eq(slots.ownerId, ownerId)
    : and(eq(slots.ownerId, ownerId), eq(slots.archived, false));
  return db.select().from(slots).where(where).orderBy(desc(slots.createdAt));
}

export async function getSlotById(id: string) {
  const rows = await db.select().from(slots).where(eq(slots.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Daily view/click counts for the last N days (for the analytics chart). */
export async function getSlotDailyStats(slotId: string, days = 14) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${events.createdAt}), 'YYYY-MM-DD')`,
      type: events.type,
      count: sql<number>`count(*)::int`
    })
    .from(events)
    .where(and(eq(events.slotId, slotId), gte(events.createdAt, since)))
    .groupBy(sql`1`, events.type);
}

/** Slots the given user is currently sponsoring. */
export async function getUserSponsorships(userId: string) {
  return db
    .select()
    .from(slots)
    .where(and(eq(slots.sponsorId, userId), eq(slots.status, 'sponsored')))
    .orderBy(desc(slots.sponsoredUntil));
}

// ── Bulk stats ───────────────────────────────────────────────────────────────
// A dashboard shows many placements at once, so these take an array of ids and
// return one row per id. Calling getSlotStats() in a loop would be an N+1.

export type Totals = { view: number; click: number };

/** Lifetime view/click totals for several slots at once, keyed by slot id. */
export async function getStatsForSlots(slotIds: string[]): Promise<Record<string, Totals>> {
  const out: Record<string, Totals> = {};
  for (const id of slotIds) out[id] = { view: 0, click: 0 };
  if (slotIds.length === 0) return out;

  const rows = await db
    .select({ slotId: events.slotId, type: events.type, count: sql<number>`count(*)::int` })
    .from(events)
    .where(inArray(events.slotId, slotIds))
    .groupBy(events.slotId, events.type);

  for (const r of rows) {
    if (!out[r.slotId]) out[r.slotId] = { view: 0, click: 0 };
    if (r.type === 'view') out[r.slotId].view = r.count;
    if (r.type === 'click') out[r.slotId].click = r.count;
  }
  return out;
}

/** Daily view/click counts summed across several slots — the studio chart. */
export async function getDailyStatsForSlots(slotIds: string[], days = 14) {
  if (slotIds.length === 0) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${events.createdAt}), 'YYYY-MM-DD')`,
      type: events.type,
      count: sql<number>`count(*)::int`
    })
    .from(events)
    .where(and(inArray(events.slotId, slotIds), gte(events.createdAt, since)))
    .groupBy(sql`1`, events.type);
}

/**
 * Fill a daily series so the chart has a point for every day, including the
 * quiet ones. Without this a gap in the data reads as a dip to zero in the
 * wrong place — or, worse, as a straight line between two distant days.
 */
export function toDailySeries(
  rows: { day: string; type: string; count: number }[],
  days = 14
): { date: string; views: number; clicks: number }[] {
  const byDay = new Map<string, { views: number; clicks: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    byDay.set(d.toISOString().slice(0, 10), { views: 0, clicks: 0 });
  }
  for (const r of rows) {
    const entry = byDay.get(r.day);
    if (!entry) continue; // outside the window
    if (r.type === 'view') entry.views = r.count;
    if (r.type === 'click') entry.clicks = r.count;
  }
  return [...byDay.entries()].map(([date, v]) => ({ date, ...v }));
}

// ── Sponsorships ─────────────────────────────────────────────────────────────

/** Everything the given user has ever sponsored, newest first, with the slot. */
export async function getSponsorHistory(userId: string, limit = 50) {
  return db
    .select({
      txn: txns,
      slot: slots
    })
    .from(txns)
    .leftJoin(slots, eq(slots.id, txns.slotId))
    .where(eq(txns.fromId, userId))
    .orderBy(desc(txns.createdAt))
    .limit(limit);
}

/** Who is sponsoring the creator right now, with the placement they took. */
export async function getActiveSponsorsOf(ownerId: string) {
  return db
    .select({ slot: slots, sponsor: profiles })
    .from(slots)
    .innerJoin(profiles, eq(profiles.id, slots.sponsorId))
    .where(and(eq(slots.ownerId, ownerId), eq(slots.status, 'sponsored')))
    .orderBy(desc(slots.sponsoredUntil));
}

/** Everyone who has ever paid the creator, most recent first. */
export async function getSponsorLedger(ownerId: string, limit = 50) {
  return db
    .select({ txn: txns, slot: slots, sponsor: profiles })
    .from(txns)
    .leftJoin(slots, eq(slots.id, txns.slotId))
    .innerJoin(profiles, eq(profiles.id, txns.fromId))
    .where(and(eq(txns.toId, ownerId), ne(txns.fromId, ownerId)))
    .orderBy(desc(txns.createdAt))
    .limit(limit);
}

/** Lifetime points earned by the creator, and the number of distinct sponsors. */
export async function getEarnings(ownerId: string) {
  const rows = await db
    .select({
      total: sql<number>`coalesce(sum(${txns.amount}), 0)::int`,
      sponsors: sql<number>`count(distinct ${txns.fromId})::int`,
      deals: sql<number>`count(*)::int`
    })
    .from(txns)
    .where(and(eq(txns.toId, ownerId), ne(txns.fromId, ownerId)));
  return rows[0] ?? { total: 0, sponsors: 0, deals: 0 };
}

/** Open, unarchived placements belonging to the creator — the public catalogue. */
export async function getOpenPlacements(ownerId: string | null) {
  const base = and(eq(slots.status, 'open'), eq(slots.archived, false));
  return db
    .select()
    .from(slots)
    .where(ownerId ? and(base, eq(slots.ownerId, ownerId)) : base)
    .orderBy(desc(slots.createdAt));
}

export async function getNotifications(userId: string, limit = 12) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadCount(userId: string) {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return rows[0]?.n ?? 0;
}

export async function getSlotByPublicId(publicId: string) {
  const rows = await db.select().from(slots).where(eq(slots.publicId, publicId)).limit(1);
  return rows[0] ?? null;
}

export async function getSlotStats(slotId: string) {
  const rows = await db
    .select({ type: events.type, count: sql<number>`count(*)::int` })
    .from(events)
    .where(eq(events.slotId, slotId))
    .groupBy(events.type);
  const stats = { view: 0, click: 0 };
  for (const r of rows) {
    if (r.type === 'view') stats.view = r.count;
    if (r.type === 'click') stats.click = r.count;
  }
  return stats;
}

export async function getUserTxns(userId: string) {
  return db
    .select()
    .from(txns)
    .where(sql`${txns.fromId} = ${userId} or ${txns.toId} = ${userId}`)
    .orderBy(desc(txns.createdAt))
    .limit(25);
}

export async function logEvent(slotId: string, type: 'view' | 'click') {
  await db.insert(events).values({ slotId, type });
}

/** Reopen any sponsored slots whose validity has elapsed. Cheap; call before reads. */
export async function expireStaleSlots() {
  await db
    .update(slots)
    .set({
      status: 'open',
      sponsorId: null,
      adHeadline: null,
      adImageUrl: null,
      adLinkUrl: null,
      adCtaLabel: null,
      adSocials: null,
      sponsoredWeeks: null,
      sponsoredStart: null,
      sponsoredUntil: null
    })
    .where(and(eq(slots.status, 'sponsored'), lt(slots.sponsoredUntil, new Date())));
}

/** Open AND currently-sponsored placements — sponsored ones carry `sponsoredUntil` as their
 *  next-available date, so a prospective sponsor can see when to check back. */
export async function getPlacementsWithAvailability(ownerId: string | null) {
  const base = eq(slots.archived, false);
  return db
    .select()
    .from(slots)
    .where(ownerId ? and(base, eq(slots.ownerId, ownerId)) : base)
    .orderBy(desc(slots.createdAt));
}

/** Every sponsorship the creator has ever had, newest-ended first — survives a slot's live
 *  ad fields being cleared on expiry, since it's written once at booking time and never touched. */
export async function getPastSponsors(ownerId: string, limit = 50) {
  return db
    .select()
    .from(sponsorshipHistory)
    .where(eq(sponsorshipHistory.ownerId, ownerId))
    .orderBy(desc(sponsorshipHistory.endAt))
    .limit(limit);
}

/** Placeholder channel records a creator has named — no live sync, see schema.ts. */
export async function getChannelConnections(ownerId: string) {
  return db
    .select()
    .from(channelConnections)
    .where(eq(channelConnections.ownerId, ownerId))
    .orderBy(desc(channelConnections.createdAt));
}

/** Human validity label, e.g. "6 days left" / "expires today" / null when not sponsored. */
export function validityLabel(sponsoredUntil: Date | null): string | null {
  if (!sponsoredUntil) return null;
  const ms = new Date(sponsoredUntil).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (days === 1) return 'expires today';
  return `${days} days left`;
}

// ── Messaging ────────────────────────────────────────────────────────────────
// Simple DB-backed threads, not realtime — pages refresh on navigation, new messages
// notify via the existing bms_notification bell (see sendMessage/startThread in actions.ts).

const THREAD_ARCHIVE_DAYS = 30;

/** Auto-archive (hide, never delete) threads gone quiet — same opportunistic-update
 *  pattern as expireStaleSlots(); call before reading a thread list. */
export async function archiveInactiveThreads() {
  const cutoff = new Date(Date.now() - THREAD_ARCHIVE_DAYS * 24 * 60 * 60 * 1000);
  await db
    .update(threads)
    .set({ status: 'archived' })
    .where(and(eq(threads.status, 'active'), lt(threads.lastMessageAt, cutoff)));
}

/** Every thread a user is party to (either side), most recently active first. */
export async function getThreadsForUser(userId: string) {
  return db
    .select()
    .from(threads)
    .where(sql`${threads.requesterId} = ${userId} or ${threads.creatorId} = ${userId}`)
    .orderBy(desc(threads.lastMessageAt));
}

export async function getThreadById(id: string) {
  const rows = await db.select().from(threads).where(eq(threads.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getThreadMessages(threadId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(messages.createdAt);
}
