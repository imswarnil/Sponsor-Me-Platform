import 'server-only';
import { and, asc, desc, eq, gt, gte, inArray, lt, lte, ne, or, sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { activity, bids, bookings, events, messages, payments, profiles, slots } from '@/lib/db/schema';
import { bidRules } from '@/lib/site';

/**
 * EVERY READ IN THE APPLICATION.
 *
 * Two rules hold this file together:
 *
 * 1. RANK IS DERIVED, NEVER STORED. `ORDER BY amount_paise DESC, first_paid_at
 *    ASC` is the definition of the leaderboard, it appears in `rankedBids()`,
 *    and nowhere else is allowed to have an opinion about ordering.
 *
 * 2. A NUMBER IS REAL OR IT IS ABSENT. Nothing here invents a view count, a
 *    reach figure or a placeholder. When there is no data the function returns
 *    zero rows or null, and the UI renders nothing rather than a zero that
 *    reads like a measurement.
 */

/* ── SponsorBid · the leaderboard ───────────────────────────────────────── */

export type RankedBid = {
  rank: number;
  id: string;
  profileId: string;
  amountPaise: number;
  kind: string;
  brand: string;
  headline: string;
  body: string;
  url: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  priceLabel: string | null;
  ctaLabel: string | null;
  firstPaidAt: Date | null;
};

/**
 * The board, in order. Only approved creatives that have actually paid
 * something appear: `amountPaise > 0` excludes the row a sponsor gets the
 * moment they start writing an ad, and `status = 'approved'` means an
 * unreviewed creative cannot put itself in front of the audience by paying.
 *
 * Rank is the array index, assigned here and passed down. No caller recomputes
 * it, so no caller can disagree about who is first.
 */
export async function rankedBids(limit = 50): Promise<RankedBid[]> {
  const rows = await db
    .select()
    .from(bids)
    .where(and(eq(bids.status, 'approved'), gt(bids.amountPaise, 0)))
    .orderBy(desc(bids.amountPaise), asc(bids.firstPaidAt))
    .limit(limit);

  return rows.map((row, i) => ({
    rank: i + 1,
    id: row.id,
    profileId: row.profileId,
    amountPaise: row.amountPaise,
    kind: row.kind,
    brand: row.brand,
    headline: row.headline,
    body: row.body,
    url: row.url,
    imageUrl: row.imageUrl,
    videoUrl: row.videoUrl,
    priceLabel: row.priceLabel,
    ctaLabel: row.ctaLabel,
    firstPaidAt: row.firstPaidAt
  }));
}

/** What the widget renders: the top three, plus how many are behind them. */
export async function boardTop() {
  const all = await rankedBids(bidRules.rendered + 1);
  return {
    top: all.slice(0, bidRules.rendered),
    /** Only ever a count of real rows. */
    more: Math.max(0, (await countBidders()) - bidRules.rendered)
  };
}

export async function countBidders(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bids)
    .where(and(eq(bids.status, 'approved'), gt(bids.amountPaise, 0)));
  return row?.n ?? 0;
}

/** The signed-in sponsor's own bid row, whatever its state. */
export async function myBid(profileId: string) {
  const rows = await db.select().from(bids).where(eq(bids.profileId, profileId)).limit(1);
  return rows[0] ?? null;
}

/**
 * Where this sponsor currently sits, and what it would cost to take the rank
 * above. Returns null when they are not on the board at all.
 *
 * `toBeat` counts everyone strictly above them, so it is a real position among
 * paying sponsors rather than an index into a page of results.
 */
export async function myStanding(profileId: string) {
  const mine = await myBid(profileId);
  if (!mine || mine.amountPaise <= 0 || mine.status !== 'approved') return null;

  const [ahead] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bids)
    .where(
      and(
        eq(bids.status, 'approved'),
        or(
          gt(bids.amountPaise, mine.amountPaise),
          and(
            eq(bids.amountPaise, mine.amountPaise),
            lt(bids.firstPaidAt, mine.firstPaidAt ?? new Date())
          )
        )
      )
    );

  const rank = (ahead?.n ?? 0) + 1;
  const above = rank === 1 ? null : await bidAtRank(rank - 1);

  return {
    bid: mine,
    rank,
    /** Extra paise needed to pass the rank above. Null when already first. */
    toOvertake: above ? Math.max(bidRules.step, above.amountPaise - mine.amountPaise + bidRules.step) : null
  };
}

async function bidAtRank(rank: number) {
  const rows = await db
    .select()
    .from(bids)
    .where(and(eq(bids.status, 'approved'), gt(bids.amountPaise, 0)))
    .orderBy(desc(bids.amountPaise), asc(bids.firstPaidAt))
    .limit(1)
    .offset(Math.max(0, rank - 1));
  return rows[0] ?? null;
}

/** The current top amount, or null when the board is empty. Never a guess. */
export async function topAmount(): Promise<number | null> {
  const rows = await db
    .select({ amount: bids.amountPaise })
    .from(bids)
    .where(and(eq(bids.status, 'approved'), gt(bids.amountPaise, 0)))
    .orderBy(desc(bids.amountPaise))
    .limit(1);
  return rows[0]?.amount ?? null;
}

/**
 * The smallest payment that would put this sponsor at number one.
 *
 * Computed here, on the server, and never accepted from a form: a client that
 * can name its own price is a client that will name ₹1. Callers hand the
 * result to the checkout; the checkout re-reads it rather than trusting it.
 */
export async function minimumToLead(profileId: string | null): Promise<number> {
  const top = await topAmount();
  if (top === null) return bidRules.floor;
  const mine = profileId ? (await myBid(profileId))?.amountPaise ?? 0 : 0;
  return Math.max(bidRules.floor, top - mine + bidRules.step);
}

/* ── Slots · bookable inventory ─────────────────────────────────────────── */

export async function listSlots(opts: { activeOnly?: boolean } = {}) {
  const where = opts.activeOnly ? eq(slots.active, true) : undefined;
  return db.select().from(slots).where(where).orderBy(asc(slots.createdAt));
}

export async function slotByPublicId(publicId: string) {
  const rows = await db.select().from(slots).where(eq(slots.publicId, publicId)).limit(1);
  return rows[0] ?? null;
}

export async function slotById(id: string) {
  const rows = await db.select().from(slots).where(eq(slots.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * The booking running on a slot right now, or null.
 *
 * "Now" is evaluated by the database rather than by JavaScript so that every
 * caller agrees on what time it is, including a Worker whose clock has drifted.
 */
export async function liveBooking(slotId: string) {
  const rows = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.slotId, slotId),
        eq(bookings.status, 'paid'),
        // Paid holds the window; approved is what renders. A booking waiting on
        // review keeps its dates and shows nothing.
        sql`${bookings.approvedAt} is not null`,
        lte(bookings.startsAt, sql`now()`),
        gt(bookings.endsAt, sql`now()`)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Every paid booking on a slot from now on — what's running, then the queue. */
export async function slotSchedule(slotId: string) {
  return db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      months: bookings.months,
      brand: bookings.brand,
      profileId: bookings.profileId
    })
    .from(bookings)
    .where(
      and(eq(bookings.slotId, slotId), eq(bookings.status, 'paid'), gt(bookings.endsAt, sql`now()`))
    )
    .orderBy(asc(bookings.startsAt));
}

/**
 * The earliest moment a new booking on this slot could start.
 *
 * Which is: now, if nothing is booked, otherwise the end of the last booking
 * in the queue. This is what makes a taken slot bookable rather than blocked —
 * the second brand buys the next window instead of losing.
 */
export async function nextAvailableFrom(slotId: string): Promise<Date> {
  const [row] = await db
    .select({ latest: sql<Date | null>`max(${bookings.endsAt})` })
    .from(bookings)
    .where(
      and(eq(bookings.slotId, slotId), eq(bookings.status, 'paid'), gt(bookings.endsAt, sql`now()`))
    );
  const latest = row?.latest ? new Date(row.latest) : null;
  const now = new Date();
  return latest && latest > now ? latest : now;
}

/**
 * Does this window collide with a paid booking?
 *
 * The application-level half of the overlap guarantee — it exists to give a
 * sponsor a sentence instead of a database error. The half that is actually
 * load-bearing is the EXCLUSION constraint in drizzle/manual/002, because two
 * webhooks landing together both pass this check.
 */
export async function windowIsFree(slotId: string, startsAt: Date, endsAt: Date) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(bookings)
    .where(
      and(
        eq(bookings.slotId, slotId),
        eq(bookings.status, 'paid'),
        lt(bookings.startsAt, endsAt),
        gt(bookings.endsAt, startsAt)
      )
    );
  return (row?.n ?? 0) === 0;
}

/** Slots with their current occupancy — what the homepage inventory renders. */
export async function slotsWithAvailability() {
  const list = await listSlots({ activeOnly: true });
  return Promise.all(
    list.map(async (slot) => ({
      slot,
      live: await liveBooking(slot.id),
      availableFrom: await nextAvailableFrom(slot.id)
    }))
  );
}

export async function myBookings(profileId: string) {
  return db
    .select({
      booking: bookings,
      slot: slots
    })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .where(and(eq(bookings.profileId, profileId), ne(bookings.status, 'cancelled')))
    .orderBy(desc(bookings.createdAt));
}

export async function bookingById(id: string) {
  const rows = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Everything the creator moderates: creatives waiting on a decision. */
export async function pendingReview() {
  const pendingBids = await db
    .select({ bid: bids, profile: profiles })
    .from(bids)
    .innerJoin(profiles, eq(bids.profileId, profiles.id))
    .where(and(eq(bids.status, 'pending'), gt(bids.amountPaise, 0)))
    .orderBy(asc(bids.updatedAt));

  // Paid, and not yet decided either way.
  const pendingBookings = await db
    .select({ booking: bookings, slot: slots, profile: profiles })
    .from(bookings)
    .innerJoin(slots, eq(bookings.slotId, slots.id))
    .innerJoin(profiles, eq(bookings.profileId, profiles.id))
    .where(and(eq(bookings.status, 'paid'), sql`${bookings.approvedAt} is null`))
    .orderBy(asc(bookings.paidAt));

  return { bids: pendingBids, bookings: pendingBookings };
}

/* ── Analytics ──────────────────────────────────────────────────────────── */

/**
 * Views and clicks for one sponsor over a window, and the daily series behind
 * them. `days` is inclusive of today.
 *
 * Returns real rows only: a day with no impressions is simply absent, and the
 * caller decides whether to draw a gap or a zero. This function will not
 * fabricate a continuous series.
 */
export async function statsForProfile(profileId: string, days = 30) {
  const since = sql`current_date - ${days - 1}::int`;

  const [totals] = await db
    .select({
      views: sql<number>`coalesce(sum(${events.views}), 0)::int`,
      clicks: sql<number>`coalesce(sum(${events.clicks}), 0)::int`
    })
    .from(events)
    .where(and(eq(events.profileId, profileId), gte(events.day, since)));

  const series = await db
    .select({
      day: events.day,
      views: sql<number>`sum(${events.views})::int`,
      clicks: sql<number>`sum(${events.clicks})::int`
    })
    .from(events)
    .where(and(eq(events.profileId, profileId), gte(events.day, since)))
    .groupBy(events.day)
    .orderBy(asc(events.day));

  return {
    views: totals?.views ?? 0,
    clicks: totals?.clicks ?? 0,
    series
  };
}

/** Platform-wide totals for the studio and the live counter. */
export async function statsOverall(days = 30) {
  const since = sql`current_date - ${days - 1}::int`;
  const [row] = await db
    .select({
      views: sql<number>`coalesce(sum(${events.views}), 0)::int`,
      clicks: sql<number>`coalesce(sum(${events.clicks}), 0)::int`
    })
    .from(events)
    .where(gte(events.day, since));
  return { views: row?.views ?? 0, clicks: row?.clicks ?? 0 };
}

/** Per-slot performance, for the studio's inventory table. */
export async function statsBySlot(days = 30) {
  const since = sql`current_date - ${days - 1}::int`;
  return db
    .select({
      refId: events.refId,
      views: sql<number>`sum(${events.views})::int`,
      clicks: sql<number>`sum(${events.clicks})::int`
    })
    .from(events)
    .where(and(eq(events.placement, 'slot'), gte(events.day, since)))
    .groupBy(events.refId);
}

/* ── Money ──────────────────────────────────────────────────────────────── */

/** Everything actually collected. Only `paid` rows — pending is not revenue. */
export async function earnings() {
  const [all] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int`,
      count: sql<number>`count(*)::int`
    })
    .from(payments)
    .where(eq(payments.status, 'paid'));

  const [month] = await db
    .select({ total: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int` })
    .from(payments)
    .where(and(eq(payments.status, 'paid'), gte(payments.paidAt, sql`date_trunc('month', now())`)));

  const byKind = await db
    .select({
      kind: payments.kind,
      total: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int`
    })
    .from(payments)
    .where(eq(payments.status, 'paid'))
    .groupBy(payments.kind);

  return {
    total: all?.total ?? 0,
    count: all?.count ?? 0,
    thisMonth: month?.total ?? 0,
    byKind
  };
}

export async function myPayments(profileId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.profileId, profileId))
    .orderBy(desc(payments.createdAt))
    .limit(50);
}

export async function recentPayments(limit = 20) {
  return db
    .select({ payment: payments, profile: profiles })
    .from(payments)
    .innerJoin(profiles, eq(payments.profileId, profiles.id))
    .where(eq(payments.status, 'paid'))
    .orderBy(desc(payments.paidAt))
    .limit(limit);
}

/* ── Activity ───────────────────────────────────────────────────────────── */

export async function recentActivity(limit = 20, publicOnly = true) {
  const where = publicOnly ? eq(activity.publicFeed, true) : undefined;
  return db.select().from(activity).where(where).orderBy(desc(activity.createdAt)).limit(limit);
}

/* ── Messages ───────────────────────────────────────────────────────────── */

export async function threadFor(profileId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.profileId, profileId))
    .orderBy(asc(messages.createdAt));
}

/** Every conversation, newest first, for the studio's inbox. */
export async function allThreads() {
  const rows = await db
    .select({
      profileId: messages.profileId,
      name: profiles.name,
      brand: profiles.brand,
      email: profiles.email,
      last: sql<Date>`max(${messages.createdAt})`,
      unread: sql<number>`count(*) filter (where ${messages.readAt} is null and ${messages.fromCreator} = false)::int`
    })
    .from(messages)
    .innerJoin(profiles, eq(messages.profileId, profiles.id))
    .groupBy(messages.profileId, profiles.name, profiles.brand, profiles.email)
    .orderBy(desc(sql`max(${messages.createdAt})`));
  return rows;
}

export async function unreadForCreator(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.fromCreator, false), sql`${messages.readAt} is null`));
  return row?.n ?? 0;
}

export async function unreadForSponsor(profileId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(
      and(
        eq(messages.profileId, profileId),
        eq(messages.fromCreator, true),
        sql`${messages.readAt} is null`
      )
    );
  return row?.n ?? 0;
}

/* ── Sponsors, for the studio ───────────────────────────────────────────── */

export async function allSponsors() {
  return db
    .select({
      profile: profiles,
      bid: bids,
      paid: sql<number>`coalesce((
        select sum(p.amount_paise) from sb_payment p
        where p.profile_id = ${profiles.id} and p.status = 'paid'
      ), 0)::int`
    })
    .from(profiles)
    .leftJoin(bids, eq(bids.profileId, profiles.id))
    .orderBy(desc(profiles.createdAt));
}
