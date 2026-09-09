import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { ads, stats } from '@/lib/db/schema';
import { safeUrl } from '@/lib/creative';

/**
 * THE CLICK HOP: /api/go?ad=<uuid>
 *
 * Counts, then sends the reader on.
 *
 * THE DESTINATION IS READ FROM THE DATABASE, NEVER FROM THE QUERY STRING. A
 * redirector that forwards to a URL in its own parameters is an open redirect,
 * and an open redirect on the creator's domain is a phishing tool with his
 * name on it. The caller says WHICH AD; where it points is ours to look up.
 *
 * The stored URL is re-checked on the way out even though it was checked on
 * the way in — cheap, and it means a row written by any future path still
 * cannot emit a `javascript:` Location header.
 */

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get('ad');

  // Shape-checked here so a malformed id is a 400 rather than a Postgres
  // "invalid input syntax for uuid" surfacing as a 500 anyone can trigger.
  if (!id || !UUID.test(id)) return new Response('bad request', { status: 400 });

  const [ad] = await db.select().from(ads).where(eq(ads.id, id)).limit(1);
  // An ad that is not serving has no click destination.
  if (!ad || ad.status !== 'live') return new Response('not found', { status: 404 });

  const destination = safeUrl(ad.url);
  if (!destination) return new Response('not found', { status: 404 });

  try {
    await db
      .insert(stats)
      .values({ adId: ad.id, day: new Date().toISOString().slice(0, 10), views: 0, clicks: 1 })
      .onConflictDoUpdate({
        target: [stats.adId, stats.day],
        set: { clicks: sql`${stats.clicks} + 1` }
      });
  } catch (err) {
    // Counting is best-effort; the destination is not. A lost tally is a
    // smaller failure than a dead link — but it is logged, because silence
    // here once hid a missing UNIQUE constraint for an entire deploy.
    console.error('[go] click not recorded:', err instanceof Error ? err.message : err);
  }

  redirect(destination);
}
