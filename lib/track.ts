import 'server-only';
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { stats } from '@/lib/db/schema';

/**
 * COUNTING.
 *
 * One row per ad per day, incremented in place. Not one row per impression: an
 * ad that works produces millions, nobody asks a question that needs them
 * individually, and the table would become the slowest page in the product
 * inside a month.
 *
 * The increment is a single statement so concurrent impressions cannot lose
 * each other — Postgres evaluates `views + 1` while it holds the row, which a
 * read-then-write in JavaScript cannot promise.
 *
 * WHAT IS DELIBERATELY NOT COLLECTED: no IP, no user agent, no cookie, no
 * visitor id of any kind. The creator's readers did not agree to be profiled
 * because somebody bought an ad, and a counter is all a sponsor was sold.
 */

const today = () => new Date().toISOString().slice(0, 10);

export async function recordView(adId: string) {
  await db
    .insert(stats)
    .values({ adId, day: today(), views: 1, clicks: 0 })
    .onConflictDoUpdate({
      target: [stats.adId, stats.day],
      set: { views: sql`${stats.views} + 1` }
    });
}

/** Several at once — a page can carry more than one slot. */
export async function recordViews(adIds: string[]) {
  if (!adIds.length) return;
  const day = today();
  await db
    .insert(stats)
    .values(adIds.map((adId) => ({ adId, day, views: 1, clicks: 0 })))
    .onConflictDoUpdate({
      target: [stats.adId, stats.day],
      set: { views: sql`${stats.views} + 1` }
    });
}
