import { and, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db/client';
import { ads, payments } from '@/lib/db/schema';
import { verifyDodoWebhook } from '@/lib/dodo';

/**
 * THE ONLY PLACE MONEY BECOMES TRUE.
 *
 * Four things this gets right, each of which is a way these are robbed:
 *
 * 1. SIGNATURE FIRST. The raw text is verified before anything in it is
 *    believed. An unverified webhook is a stranger claiming to have paid.
 *
 * 2. THE AMOUNT COMES FROM OUR ROW, NOT THE PAYLOAD. We credit
 *    `payment.amountPaise`, computed by this server when it made the checkout.
 *    A signature proves the sender, not the figure.
 *
 * 3. IDEMPOTENT AT THE DATABASE. `status = 'pending'` in the WHERE means a
 *    redelivery updates zero rows. Providers retry by design.
 *
 * 4. THE AD IS CREDITED IN SQL. `amount + n` rather than read-then-write in
 *    JavaScript: two payments landing together would each read the old total
 *    and the second would erase the first.
 */

export const dynamic = 'force-dynamic';

type DodoEvent = {
  type?: string;
  data?: { payment_id?: string; metadata?: Record<string, string> };
};

const SUCCESS = new Set(['payment.succeeded', 'checkout.session.completed']);

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();

  const headers = {
    'webhook-id': request.headers.get('webhook-id') ?? '',
    'webhook-signature': request.headers.get('webhook-signature') ?? '',
    'webhook-timestamp': request.headers.get('webhook-timestamp') ?? ''
  };

  let event: DodoEvent;
  try {
    event = verifyDodoWebhook(raw, headers) as DodoEvent;
  } catch {
    // Terse on purpose: a detailed rejection tells a prober what to fix.
    return new Response('invalid signature', { status: 401 });
  }

  if (!event.type || !SUCCESS.has(event.type)) {
    // 200, not 4xx — a refund or dispute is a valid event we do not act on
    // yet, and an error would make the provider retry it forever.
    return Response.json({ ok: true, ignored: event.type ?? 'unknown' });
  }

  const paymentId = event.data?.metadata?.paymentId;
  const dodoPaymentId = event.data?.payment_id;
  if (!paymentId || !dodoPaymentId) return Response.json({ ok: true, ignored: 'no metadata' });

  const [payment] = await db
    .update(payments)
    .set({ status: 'paid', paidAt: new Date(), dodoPaymentId })
    .where(and(eq(payments.id, paymentId), eq(payments.status, 'pending')))
    .returning();

  // Already handled, or naming a row that does not exist. A 200 stops retries.
  if (!payment) return Response.json({ ok: true, alreadyHandled: true });

  if (payment.adId) {
    /**
     * Credit the ad and send it for review. `firstPaidAt` is set only if it is
     * null — it is the tie-breaker on a bid slot, and somebody topping up must
     * not lose their seniority to somebody who paid the same later.
     */
    await db
      .update(ads)
      .set({
        amountPaise: sql`${ads.amountPaise} + ${payment.amountPaise}`,
        firstPaidAt: sql`coalesce(${ads.firstPaidAt}, now())`,
        // Paid, but not yet serving. The creator still has to approve it.
        status: sql`case when ${ads.status} = 'live' then 'live' else 'pending' end`,
        updatedAt: new Date()
      })
      .where(eq(ads.id, payment.adId));
  }

  return Response.json({ ok: true });
}
