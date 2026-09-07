import { NextResponse } from 'next/server';
import { verifyDodoWebhook, type DodoMetadata } from '@/lib/dodo';

/**
 * Dodo Payments webhook receiver.
 *
 * Verifies, logs, and stops here — this is the "started using it" milestone
 * (TODO.md), not the finished flow. Wiring a real `payment.succeeded` event
 * into `sponsorSlot` (lib/proto/actions.ts) or `joinAsMember`
 * (lib/proto/membership.ts) needs those functions' checkout-driving UI
 * changed first (redirect to Dodo instead of submitting synchronously, with
 * the profile-form fields carried in this checkout's `metadata` — see
 * lib/dodo.ts DodoMetadata — so this handler has what it needs to finish the
 * job the same way the points path already does, once that's decided).
 *
 * Never trust the request body until `verifyDodoWebhook` has returned
 * successfully — that is the whole point of a signed webhook.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();

  let payload: unknown;
  try {
    payload = verifyDodoWebhook(rawBody, {
      'webhook-id': req.headers.get('webhook-id') ?? '',
      'webhook-timestamp': req.headers.get('webhook-timestamp') ?? '',
      'webhook-signature': req.headers.get('webhook-signature') ?? ''
    });
  } catch (err) {
    console.error('[dodo webhook] signature verification failed', err);
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const event = payload as { type?: string; data?: { metadata?: Partial<DodoMetadata> } };

  if (event.type === 'payment.succeeded') {
    const metadata = event.data?.metadata;
    console.log('[dodo webhook] payment.succeeded', {
      kind: metadata?.kind,
      profileId: metadata?.profileId,
      refId: metadata?.refId
    });
    // TODO(dodo-fulfillment): complete the sponsorship/membership here.
  } else {
    console.log('[dodo webhook] received', event.type);
  }

  return NextResponse.json({ received: true });
}
