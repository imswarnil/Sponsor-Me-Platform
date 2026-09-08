import 'server-only';
import DodoPayments from 'dodopayments';
import { Webhook } from 'standardwebhooks';

/**
 * DODO PAYMENTS — the only thing in this codebase that touches real money.
 *
 * Test mode today: `DODO_PAYMENTS_KEY_TEST_MODE` is the key that is set. When
 * live is ready, set `DODO_PAYMENTS_KEY_LIVE` alongside it and nothing here
 * changes — the client picks whichever is present, live winning if both are.
 *
 * Lazy, memoised construction, for the same reason `getAuth()` is lazy: `next
 * build` imports every route to collect page data, and a top-level
 * `new DodoPayments()` would throw on any machine without the key. Building
 * should never require credentials; serving should.
 */

let instance: DodoPayments | undefined;

export function isDodoConfigured(): boolean {
  return Boolean(process.env.DODO_PAYMENTS_KEY_LIVE || process.env.DODO_PAYMENTS_KEY_TEST_MODE);
}

/** True only when the key in use is a live one. The UI says so out loud. */
export function isLiveMode(): boolean {
  return Boolean(process.env.DODO_PAYMENTS_KEY_LIVE);
}

export function getDodo(): DodoPayments {
  if (!instance) {
    const live = process.env.DODO_PAYMENTS_KEY_LIVE;
    const test = process.env.DODO_PAYMENTS_KEY_TEST_MODE;
    const bearerToken = live || test;
    if (!bearerToken) {
      throw new Error(
        'Neither DODO_PAYMENTS_KEY_LIVE nor DODO_PAYMENTS_KEY_TEST_MODE is set. See .env.example.'
      );
    }
    instance = new DodoPayments({
      bearerToken,
      environment: live ? 'live_mode' : 'test_mode',
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY
    });
  }
  return instance;
}

/**
 * One reusable pay-what-you-want product, created once by
 * scripts/dodo-setup.mjs and named by `DODO_PRODUCT_ID`.
 *
 * This app decides every amount, not Dodo's catalogue: a bid is whatever the
 * sponsor is willing to pay above the current leader, and a booking is a slot
 * price times a number of months. Neither is a fixed figure Dodo could hold,
 * and a catalogue of one product per price would be a second source of truth
 * for money — the worst possible thing to keep in two places.
 */
export type DodoPurchaseKind = 'bid' | 'booking';

export type DodoMetadata = {
  kind: DodoPurchaseKind;
  /** Our own payment row. The webhook fulfils this id and nothing else. */
  paymentId: string;
  /** The buyer's profile — never trust a webhook's customer email to identify them. */
  profileId: string;
};

/**
 * Start a checkout for an amount the caller has ALREADY computed and validated
 * server-side.
 *
 * This function does not price anything, on purpose. Its callers in
 * lib/actions.ts read the current leader or the slot's own price out of the
 * database and derive the figure there; nothing that arrives from a browser
 * reaches this argument. A checkout that accepts a client-supplied amount is a
 * shop where the customer writes the price tag.
 */
export async function createCheckout(params: {
  amountMinorUnits: number;
  currency: DodoPayments.Misc.Currency;
  metadata: DodoMetadata;
  returnUrl: string;
  customerEmail: string;
  customerName: string;
}): Promise<{ sessionId: string; checkoutUrl: string | null }> {
  const productId = process.env.DODO_PRODUCT_ID;
  if (!productId) {
    throw new Error(
      'DODO_PRODUCT_ID is not set — run `npm run dodo:setup` once and set the id it prints.'
    );
  }

  const session = await getDodo().checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1, amount: params.amountMinorUnits }],
    billing_currency: params.currency,
    return_url: params.returnUrl,
    customer: { email: params.customerEmail, name: params.customerName },
    // Cast: the SDK types metadata as a flat string map, and every value is one.
    metadata: params.metadata as unknown as Record<string, string>
  });

  return { sessionId: session.session_id, checkoutUrl: session.checkout_url ?? null };
}

/**
 * Verify and parse an incoming webhook body. THROWS on a bad or missing
 * signature, and the caller must answer 401 and do nothing else — never fall
 * back to trusting the payload. An unverified webhook is an unauthenticated
 * stranger telling you they have paid.
 *
 * Uses `standardwebhooks`, the reference implementation of the spec Dodo
 * follows, rather than a hand-rolled HMAC: `verify()` does the timing-safe
 * comparison and the timestamp-tolerance check, both easy to get subtly and
 * silently wrong. The dodopayments SDK has no verification helper in this
 * version (2.49.0) — confirmed by reading its shipped type definitions.
 */
export function verifyDodoWebhook(rawBody: string, headers: Record<string, string>): unknown {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) throw new Error('DODO_PAYMENTS_WEBHOOK_KEY is not set.');
  return new Webhook(secret).verify(rawBody, headers);
}
