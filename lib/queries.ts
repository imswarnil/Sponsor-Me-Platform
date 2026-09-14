import 'server-only';
import { and, asc, desc, eq, gt, gte, or, sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { activity, ads, payments, profiles, slots, stats } from '@/lib/db/schema';

/**
 * EVERY READ.
 *
 * Two rules:
 *
 * 1. WHO GETS SERVED IS ONE QUERY. `winnerFor()` is the only function that
 *    decides it, for both kinds of slot. Rank is never stored — a stored rank
 *    is a cache of one ORDER BY that four code paths must remember to
 *    invalidate, and the first one that forgets sells the top spot twice.
 *
 * 2. A NUMBER IS REAL OR IT IS ABSENT. Nothing here invents a count. No data
 *    means zero rows or null, and the UI renders nothing rather than a zero
 *    that reads like a measurement.
 */

export type LiveAd = {
  id: string;
  slotId: string;
  profileId: string;
  rank: number;
  format: string;
  brand: string;
  tag: string | null;
  logoUrl: string | null;
  headline: string;
  body: string;
  url: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  ctaLabel: string | null;
  html: string | null;
  amountPaise: number;
  isHouse: boolean;
};

function toLive(row: typeof ads.$inferSelect, rank: number): LiveAd {
  return {
    id: row.id,
    slotId: row.slotId,
    profileId: row.profileId,
    rank,
    format: row.format,
    brand: row.brand,
    tag: row.tag,
    logoUrl: row.logoUrl,
    headline: row.headline,
    body: row.body,
    url: row.url,
    imageUrl: row.imageUrl,
    videoUrl: row.videoUrl,
    ctaLabel: row.ctaLabel,
    html: row.html,
    amountPaise: row.amountPaise,
    isHouse: row.isHouse
  };
}

/**
 * The ads in the running for a slot, best first.
 *
 * `status = 'live'` means the creator approved it: money alone never puts
 * anything in front of the audience. `amountPaise > 0` excludes the row a
 * sponsor gets the moment they start writing.
 *
 * On a **bid** slot this is the leaderboard. On a **fixed** slot there is
 * normally exactly one, and the same ordering harmlessly picks the biggest
 * payer if two ever overlap.
 */
export async function contendersFor(slotId: string, limit = 50): Promise<LiveAd[]> {
  const rows = await db
    .select()
    .from(ads)
    .where(
      and(
        eq(ads.slotId, slotId),
        eq(ads.status, 'live'),
        // A house ad has paid nothing and still belongs in the running; a
        // sponsor's ad has to have paid to be there at all.
        or(gt(ads.amountPaise, 0), eq(ads.isHouse, true)),
        /**
         * A run that has ended is out.
         *
         * `endsAt IS NULL` means "no end", which is every bid — a bid is held
         * until somebody outbids it, so it has no clock. A fixed slot bought
         * for a month has a date, and once it passes the ad simply stops being
         * a contender and the slot goes back to open.
         *
         * "Now" is evaluated by the database rather than in JavaScript, so
         * every caller agrees what time it is — including a Worker whose clock
         * has drifted.
         */
        or(sql`${ads.endsAt} is null`, gt(ads.endsAt, sql`now()`))
      )
    )
    /**
     * House ads sort LAST, whatever they are worth — `isHouse` ascending puts
     * false before true. So a paying sponsor always outranks the creator's own
     * filler, and on an empty slot the house ad is simply what is left.
     */
    .orderBy(asc(ads.isHouse), desc(ads.amountPaise), asc(ads.firstPaidAt))
    .limit(limit);
  return rows.map(toLive);
}

/** The single ad a slot serves right now, or null when nobody has won it. */
export async function winnerFor(slotId: string): Promise<LiveAd | null> {
  const [first] = await contendersFor(slotId, 1);
  return first ?? null;
}

/* ── Slots ──────────────────────────────────────────────────────────────── */

export async function listSlots(activeOnly = true) {
  return db
    .select()
    .from(slots)
    .where(activeOnly ? eq(slots.active, true) : undefined)
    .orderBy(asc(slots.createdAt));
}

export async function slotByPublicId(publicId: string) {
  const [row] = await db.select().from(slots).where(eq(slots.publicId, publicId)).limit(1);
  return row ?? null;
}

export async function slotById(id: string) {
  const [row] = await db.select().from(slots).where(eq(slots.id, id)).limit(1);
  return row ?? null;
}

/**
 * Every slot with who is winning it and how many are in the running — one
 * round-trip per slot, which is fine at this scale and honest about what it
 * costs.
 */
export async function slotsWithState(activeOnly = true) {
  const list = await listSlots(activeOnly);
  return Promise.all(
    list.map(async (slot) => {
      const contenders = await contendersFor(slot.id, 20);
      return {
        slot,
        winner: contenders[0] ?? null,
        contenders,
        // Via askFor, never inline. This used to derive the price itself and
        // drifted from askFor the moment house ads existed: it read the house
        // ad as the leader and quoted step-above-zero instead of the floor.
        askPaise: askPrice(slot, contenders)
      };
    })
  );
}

/**
 * WHAT IT COSTS TO TAKE THIS SLOT, and the only place that decides.
 *
 *   fixed: the asking price. There is nothing to outbid.
 *   bid:   beat the leader by the step — or the floor, if the only thing in
 *          the slot is a house ad. A house ad is not something you outbid; it
 *          is unsold inventory wearing the creator's own project, and quoting
 *          "the leader plus a step" against it would price the slot off zero.
 */
function askPrice(slot: typeof slots.$inferSelect, contenders: LiveAd[]): number {
  if (slot.kind !== 'bid') return slot.pricePaise;
  const leader = contenders.find((c) => !c.isHouse);
  return leader ? leader.amountPaise + slot.stepPaise : slot.pricePaise;
}

/** The ask for one slot. Never trust a form for this. */
export async function askFor(slot: typeof slots.$inferSelect): Promise<number> {
  if (slot.kind !== 'bid') return slot.pricePaise;
  return askPrice(slot, await contendersFor(slot.id, 20));
}

/* ── A sponsor's own things ─────────────────────────────────────────────── */

export async function myAds(profileId: string) {
  return db
    .select({ ad: ads, slot: slots })
    .from(ads)
    .innerJoin(slots, eq(ads.slotId, slots.id))
    .where(eq(ads.profileId, profileId))
    .orderBy(desc(ads.updatedAt));
}

export async function adById(id: string) {
  const [row] = await db.select().from(ads).where(eq(ads.id, id)).limit(1);
  return row ?? null;
}

/**
 * Where this ad stands in its slot, and what it would take to lead.
 * Null when it is not in the running at all.
 */
export async function standingFor(adId: string) {
  const ad = await adById(adId);
  if (!ad || ad.amountPaise <= 0 || ad.status !== 'live') return null;

  const slot = await slotById(ad.slotId);
  if (!slot) return null;

  const contenders = await contendersFor(ad.slotId, 100);
  const rank = contenders.findIndex((c) => c.id === adId) + 1;
  if (rank === 0) return null;

  // Only paying ads count as competition for "what would it take to lead".
  const leader = contenders.find((c) => !c.isHouse) ?? contenders[0];
  return {
    rank,
    total: contenders.length,
    // Extra paise needed to pass the leader. Zero when already leading.
    toLead:
      rank === 1 ? 0 : leader.amountPaise - ad.amountPaise + slot.stepPaise
  };
}

/* ── Counting ───────────────────────────────────────────────────────────── */

/** Views and clicks for one ad, plus the daily series behind them. */
export async function statsForAd(adId: string, days = 30) {
  const [totals] = await db
    .select({
      views: sql<number>`coalesce(sum(${stats.views}), 0)::int`,
      clicks: sql<number>`coalesce(sum(${stats.clicks}), 0)::int`
    })
    .from(stats)
    .where(eq(stats.adId, adId));

  const series = await db
    .select({ day: stats.day, views: stats.views, clicks: stats.clicks })
    .from(stats)
    .where(eq(stats.adId, adId))
    .orderBy(asc(stats.day))
    .limit(days);

  return { views: totals?.views ?? 0, clicks: totals?.clicks ?? 0, series };
}

/** Totals for a set of ads — a sponsor's dashboard header. */
export async function statsForProfile(profileId: string) {
  const [row] = await db
    .select({
      views: sql<number>`coalesce(sum(${stats.views}), 0)::int`,
      clicks: sql<number>`coalesce(sum(${stats.clicks}), 0)::int`
    })
    .from(stats)
    .innerJoin(ads, eq(stats.adId, ads.id))
    .where(eq(ads.profileId, profileId));
  return { views: row?.views ?? 0, clicks: row?.clicks ?? 0 };
}

export async function statsOverall() {
  const [row] = await db
    .select({
      views: sql<number>`coalesce(sum(${stats.views}), 0)::int`,
      clicks: sql<number>`coalesce(sum(${stats.clicks}), 0)::int`
    })
    .from(stats);
  return { views: row?.views ?? 0, clicks: row?.clicks ?? 0 };
}

/* ── Daily series ───────────────────────────────────────────────────────────
 *
 * `sm_stat.day` is an ISO `YYYY-MM-DD` string, which sorts and range-compares
 * lexicographically — so a window is a plain string `>=` and needs no date
 * casting in the query.
 *
 * ZERO-FILLING AND RULE 1. A chart is zero-filled across its window, and that
 * does not break "a number is real or it is absent": a day inside the window
 * with no row is a day on which nothing was counted, which is a measured zero.
 * What would break the rule is drawing the chart at all when NOTHING has been
 * counted, so every caller checks a real total first and renders the empty
 * state instead. The series alone never claims an audience.
 */

export type DayPoint = { day: string; views: number; clicks: number };

/** The window, oldest first, as ISO days ending today. */
function windowDays(days: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    out.push(new Date(now - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

/** Sparse rows → one point per day in the window, in order. */
function fill(days: number, rows: DayPoint[]): DayPoint[] {
  const found = new Map(rows.map((r) => [r.day, r]));
  return windowDays(days).map(
    (day) => found.get(day) ?? { day, views: 0, clicks: 0 }
  );
}

const since = (days: number) =>
  new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);

/** Every ad on the platform, by day. The studio's chart. */
export async function dailyOverall(days = 30): Promise<DayPoint[]> {
  const rows = await db
    .select({
      day: stats.day,
      views: sql<number>`coalesce(sum(${stats.views}), 0)::int`,
      clicks: sql<number>`coalesce(sum(${stats.clicks}), 0)::int`
    })
    .from(stats)
    .where(gte(stats.day, since(days)))
    .groupBy(stats.day)
    .orderBy(asc(stats.day));
  return fill(days, rows);
}

/** One sponsor's ads, by day. Their own chart on /me. */
export async function dailyForProfile(profileId: string, days = 30): Promise<DayPoint[]> {
  const rows = await db
    .select({
      day: stats.day,
      views: sql<number>`coalesce(sum(${stats.views}), 0)::int`,
      clicks: sql<number>`coalesce(sum(${stats.clicks}), 0)::int`
    })
    .from(stats)
    .innerJoin(ads, eq(stats.adId, ads.id))
    .where(and(eq(ads.profileId, profileId), gte(stats.day, since(days))))
    .groupBy(stats.day)
    .orderBy(asc(stats.day));
  return fill(days, rows);
}

/** One ad, by day — the sparkline on its card. */
export async function dailyForAd(adId: string, days = 30): Promise<DayPoint[]> {
  const rows = await db
    .select({ day: stats.day, views: stats.views, clicks: stats.clicks })
    .from(stats)
    .where(and(eq(stats.adId, adId), gte(stats.day, since(days))))
    .orderBy(asc(stats.day));
  return fill(days, rows);
}

/**
 * PER-SLOT PERFORMANCE — the studio used to show platform totals only, so the
 * one question a creator actually has ("which slot is worth anything?") had no
 * answer on the page that sells them.
 *
 * `count(distinct)` on the ad id because the stats join fans a slot's row out
 * once per ad-day; revenue is a correlated subquery for the same reason —
 * summing payments across that fan-out would multiply it by the number of
 * days counted.
 */
export async function perSlotStats(days = 30) {
  const totals = await db
    .select({
      slotId: slots.id,
      publicId: slots.publicId,
      name: slots.name,
      kind: slots.kind,
      active: slots.active,
      views: sql<number>`coalesce(sum(${stats.views}), 0)::int`,
      clicks: sql<number>`coalesce(sum(${stats.clicks}), 0)::int`,
      adCount: sql<number>`count(distinct ${ads.id})::int`,
      paid: sql<number>`coalesce((
        select sum(p.amount_paise) from sm_payment p
        join sm_ad a on a.id = p.ad_id
        where a.slot_id = ${slots.id} and p.status = 'paid'
      ), 0)::int`
    })
    .from(slots)
    .leftJoin(ads, eq(ads.slotId, slots.id))
    .leftJoin(stats, eq(stats.adId, ads.id))
    .groupBy(slots.id, slots.publicId, slots.name, slots.kind, slots.active)
    .orderBy(desc(sql`coalesce(sum(${stats.views}), 0)`));

  // The sparkline behind each row, in one query rather than one per slot.
  const points = await db
    .select({
      slotId: ads.slotId,
      day: stats.day,
      views: sql<number>`coalesce(sum(${stats.views}), 0)::int`,
      clicks: sql<number>`coalesce(sum(${stats.clicks}), 0)::int`
    })
    .from(stats)
    .innerJoin(ads, eq(stats.adId, ads.id))
    .where(gte(stats.day, since(days)))
    .groupBy(ads.slotId, stats.day)
    .orderBy(asc(stats.day));

  const bySlot = new Map<string, DayPoint[]>();
  for (const row of points) {
    const list = bySlot.get(row.slotId) ?? [];
    list.push({ day: row.day, views: row.views, clicks: row.clicks });
    bySlot.set(row.slotId, list);
  }

  return totals.map((row) => ({
    ...row,
    series: fill(days, bySlot.get(row.slotId) ?? [])
  }));
}

/* ── Money ──────────────────────────────────────────────────────────────── */

export async function earnings() {
  const [all] = await db
    .select({
      total: sql<number>`coalesce(sum(${payments.amountPaise}), 0)::int`,
      count: sql<number>`count(*)::int`
    })
    .from(payments)
    .where(eq(payments.status, 'paid'));
  return { total: all?.total ?? 0, count: all?.count ?? 0 };
}

export async function myPayments(profileId: string) {
  return db
    .select()
    .from(payments)
    .where(eq(payments.profileId, profileId))
    .orderBy(desc(payments.createdAt))
    .limit(30);
}

/* ── Activity ───────────────────────────────────────────────────────────── */

export async function recentActivity(limit = 8) {
  return db.select().from(activity).orderBy(desc(activity.createdAt)).limit(limit);
}

/* ── The creator's view ─────────────────────────────────────────────────── */

/** Paid, waiting on a decision. Nothing serves until this queue is cleared. */
export async function pendingReview() {
  return db
    .select({ ad: ads, slot: slots, profile: profiles })
    .from(ads)
    .innerJoin(slots, eq(ads.slotId, slots.id))
    .innerJoin(profiles, eq(ads.profileId, profiles.id))
    .where(and(eq(ads.status, 'pending'), gt(ads.amountPaise, 0), eq(ads.isHouse, false)))
    .orderBy(asc(ads.updatedAt));
}

export async function allSponsors() {
  return db
    .select({
      profile: profiles,
      paid: sql<number>`coalesce((
        select sum(p.amount_paise) from sm_payment p
        where p.profile_id = ${profiles.id} and p.status = 'paid'
      ), 0)::int`,
      adCount: sql<number>`(
        select count(*) from sm_ad a where a.profile_id = ${profiles.id}
      )::int`
    })
    .from(profiles)
    .orderBy(desc(profiles.createdAt));
}
