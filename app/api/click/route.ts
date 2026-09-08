import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { bids, bookings } from '@/lib/db/schema';
import { recordClick } from '@/lib/track';
import { safeUrl } from '@/lib/creative';

/**
 * THE CLICK HOP: /api/click?p=bid&id=<uuid>
 *
 * Counts the click, then sends the reader to the destination.
 *
 * THE DESTINATION IS READ FROM THE DATABASE, NEVER FROM THE QUERY STRING. A
 * redirector that forwards to a URL in its own parameters is an open redirect,
 * and an open redirect on the creator's own domain is a phishing tool with his
 * name on it. The only thing the caller supplies is *which ad*; where that ad
 * points is ours to look up.
 *
 * The stored URL is re-checked with `safeUrl` on the way out even though it
 * was checked on the way in. Cheap, and it means a row edited by any future
 * path — a migration, a fixture, a console — still cannot emit a
 * `javascript:` Location header.
 */

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const placement = params.get('p');
  const id = params.get('id');

  /**
   * The id is shape-checked here rather than left to Postgres. `uuid = 'x'`
   * raises `invalid input syntax for type uuid`, which surfaces as a 500 — an
   * error page for what is simply a malformed link, and a 500 that a prober
   * can trigger at will. A 400 is both the honest status and the quiet one.
   */
  const isUuid =
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (!isUuid || (placement !== 'bid' && placement !== 'slot')) {
    return new Response('bad request', { status: 400 });
  }

  let destination: string | null = null;
  let profileId: string | null = null;

  if (placement === 'bid') {
    const [row] = await db.select().from(bids).where(eq(bids.id, id)).limit(1);
    // An unapproved ad has no click destination, because it is not running.
    if (row && row.status === 'approved') {
      destination = safeUrl(row.url);
      profileId = row.profileId;
    }
  } else {
    const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (row && row.status === 'paid') {
      destination = safeUrl(row.url);
      profileId = row.profileId;
    }
  }

  if (!destination) return new Response('not found', { status: 404 });

  // Counted before the hop. If the write fails the reader still gets where they
  // were going — a lost tally is a smaller failure than a dead link.
  try {
    await recordClick(placement, id, profileId);
  } catch {
    /* counting is best-effort; the destination is not */
  }

  redirect(destination);
}
