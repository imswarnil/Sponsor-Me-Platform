import 'server-only';
import { sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { events } from '@/lib/db/schema';

/**
 * COUNTING VIEWS AND CLICKS.
 *
 * One row per day per ad per placement, incremented in place. Not one row per
 * impression: an ad that works produces millions of those, nobody ever asks a
 * question that needs them individually, and the table would become the
 * product's slowest page inside a month.
 *
 * The upsert is a single statement so that concurrent impressions cannot lose
 * each other's increment — `views + 1` is evaluated by Postgres while it holds
 * the row, which a read-then-write in JavaScript cannot promise.
 *
 * WHAT IS DELIBERATELY NOT COLLECTED: no IP address, no user agent, no cookie,
 * no visitor identifier of any kind. The creator's readers did not agree to be
 * profiled because somebody bought an ad, and a counter is all a sponsor was
 * ever sold. This is also why there is no third-party script in the widget.
 */

type Placement = 'bid' | 'slot';

async function bump(
  placement: Placement,
  refId: string,
  profileId: string | null,
  column: 'views' | 'clicks'
) {
  const inc = column === 'views' ? { views: 1, clicks: 0 } : { views: 0, clicks: 1 };

  await db
    .insert(events)
    .values({
      day: sql`current_date`,
      placement,
      refId,
      profileId,
      views: inc.views,
      clicks: inc.clicks
    })
    .onConflictDoUpdate({
      target: [events.day, events.placement, events.refId, events.profileId],
      set:
        column === 'views'
          ? { views: sql`${events.views} + 1` }
          : { clicks: sql`${events.clicks} + 1` }
    });
}

export function recordView(placement: Placement, refId: string, profileId: string | null) {
  return bump(placement, refId, profileId, 'views');
}

export function recordClick(placement: Placement, refId: string, profileId: string | null) {
  return bump(placement, refId, profileId, 'clicks');
}

/**
 * Record several views in one statement — the board renders three ads at once,
 * and three round-trips per impression would make the widget the slowest thing
 * on the host page.
 */
export async function recordViews(
  rows: { placement: Placement; refId: string; profileId: string | null }[]
) {
  if (!rows.length) return;
  await db
    .insert(events)
    .values(
      rows.map((r) => ({
        day: sql`current_date` as unknown as string,
        placement: r.placement,
        refId: r.refId,
        profileId: r.profileId,
        views: 1,
        clicks: 0
      }))
    )
    .onConflictDoUpdate({
      target: [events.day, events.placement, events.refId, events.profileId],
      set: { views: sql`${events.views} + 1` }
    });
}
