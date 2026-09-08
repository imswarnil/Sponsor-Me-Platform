import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { activity, bids, bookings, payments, profiles } from '@/lib/db/schema';
import { verifyDodoWebhook } from '@/lib/dodo';

/**
 * THE ONLY PLACE MONEY BECOMES TRUE.
 *
 * A sponsor's ad goes live here and nowhere else. Not on the return URL — a
 * browser arriving at `/dashboard?paid=1` proves only that somebody typed a
 * URL. Not in the checkout action, which writes `pending` and stops. Here,
 * after a signature check, or not at all.
 *
 * FOUR THINGS THIS HANDLER GETS RIGHT, each of which is a way these are robbed:
 *
 * 1. SIGNATURE FIRST, BODY SECOND. The raw text is verified before anything in
 *    it is believed. An unverified webhook is a stranger claiming to have paid.
 *
 * 2. THE AMOUNT COMES FROM OUR ROW, NOT FROM THE PAYLOAD. We credit
 *    `payment.amountPaise`, which this server computed when it made the
 *    checkout. Even a correctly-signed webhook is not allowed to tell us how
 *    much was paid, because the signature proves the sender, not the figure.
 *
 * 3. IDEMPOTENT AT THE DATABASE. `dodo_payment_id` is UNIQUE, and a redelivery
 *    loses that race rather than crediting twice. Providers retry by design;
 *    this is not a rare path.
 *
 * 4. THE PENDING ROW IS THE ONLY THING FULFILLED. `metadata.paymentId` names a
 *    row we created for this profile. A payload that names someone else's row,
 *    or an already-paid one, fulfils nothing.
 */

export const dynamic = 'force-dynamic';

type DodoEvent = {
  type?: string;
  data?: {
    payment_id?: string;
    status?: string;
    metadata?: Record<string, string>;
  };
};

/** Events that mean "the money arrived". Everything else is acknowledged and ignored. */
const SUCCESS = new Set(['payment.succeeded', 'checkout.session.completed']);

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();

  // The three `webhook-*` headers the Standard Webhooks spec defines. Passed
  // through verbatim; `verify` needs the exact bytes it signed.
  const headers: Record<string, string> = {
    'webhook-id': request.headers.get('webhook-id') ?? '',
    'webhook-signature': request.headers.get('webhook-signature') ?? '',
    'webhook-timestamp': request.headers.get('webhook-timestamp') ?? ''
  };

  let event: DodoEvent;
  try {
    event = verifyDodoWebhook(raw, headers) as DodoEvent;
  } catch {
    // Deliberately terse: a detailed rejection tells a prober what to fix.
    return new Response('invalid signature', { status: 401 });
  }

  if (!event.type || !SUCCESS.has(event.type)) {
    // 200, not 4xx: a refund or a dispute is a valid event we simply do not
    // act on yet, and answering an error would make the provider retry it
    // forever.
    return Response.json({ ok: true, ignored: event.type ?? 'unknown' });
  }

  const paymentId = event.data?.metadata?.paymentId;
  const dodoPaymentId = event.data?.payment_id;
  if (!paymentId || !dodoPaymentId) {
    return Response.json({ ok: true, ignored: 'no metadata' });
  }

  /**
   * Claim the payment. The WHERE clause carries the whole guarantee:
   * `status = 'pending'` means a second delivery updates zero rows and falls
   * straight through to the idempotent exit below.
   */
  const claimed = await db
    .update(payments)
    .set({ status: 'paid', paidAt: new Date(), dodoPaymentId })
    .where(and(eq(payments.id, paymentId), eq(payments.status, 'pending')))
    .returning();

  const payment = claimed[0];
  if (!payment) {
    // Already handled, or naming a row that does not exist. Either way there is
    // nothing to do, and saying so with a 200 stops the retries.
    return Response.json({ ok: true, alreadyHandled: true });
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, payment.profileId))
    .limit(1);
  const actor = profile?.brand || profile?.name || 'A sponsor';

  if (payment.kind === 'bid' && payment.refId) {
    /**
     * Add to the lifetime total. `amount + n` in SQL rather than read-then-
     * write in JavaScript: two payments from the same sponsor landing together
     * would otherwise each read the old total and the second would erase the
     * first. The database does the addition, so both are counted.
     *
     * `first_paid_at` is set only if it is null — it is the leaderboard's
     * tie-breaker, and a sponsor who tops up must not lose their seniority.
     */
    await db.batch([
      db
        .update(bids)
        .set({
          amountPaise: sql`${bids.amountPaise} + ${payment.amountPaise}`,
          firstPaidAt: sql`coalesce(${bids.firstPaidAt}, now())`,
          updatedAt: new Date()
        })
        .where(eq(bids.id, payment.refId)),
      db.insert(activity).values({
        kind: 'bid.paid',
        profileId: payment.profileId,
        actor,
        amountPaise: payment.amountPaise
      })
    ]);
  } else if (payment.kind === 'booking' && payment.refId) {
    /**
     * A booking becomes real. The EXCLUSION constraint in drizzle/manual/002
     * fires here if this window was sold in the meantime — the write throws,
     * this handler 500s, and the provider retries. That is the correct
     * outcome: the money is captured, the booking is not, and it surfaces as a
     * failure somebody looks at rather than as two brands in one slot.
     */
    await db.batch([
      db
        .update(bookings)
        .set({ status: 'paid', paidAt: new Date() })
        .where(eq(bookings.id, payment.refId)),
      db.insert(activity).values({
        kind: 'booking.paid',
        profileId: payment.profileId,
        actor,
        amountPaise: payment.amountPaise
      })
    ]);
  }

  return Response.json({ ok: true });
}
