import 'server-only';
import DodoPayments from 'dodopayments';
import { Webhook } from 'standardwebhooks';

/**
 * DODO PAYMENTS
 * =============
 *
 * Real money, replacing the points economy (TODO.md). Test mode today —
 * `DODO_PAYMENTS_KEY_TEST_MODE` is the only key set. When live is ready, set
 * `DODO_PAYMENTS_KEY_LIVE` alongside it; nothing else here changes, the
 * client below picks whichever is present, live winning if both are set.
 *
 * Lazy, memoised construction — same reason `getAuth()` in lib/auth/server.ts
 * is lazy: `next build` imports every route to collect page data, and a
 * top-level `new DodoPayments()` would throw on any machine without the key
 * set yet. Building should never require credentials; serving should.
 */

let instance: DodoPayments | undefined;

export function isDodoConfigured(): boolean {
  return Boolean(process.env.DODO_PAYMENTS_KEY_LIVE || process.env.DODO_PAYMENTS_KEY_TEST_MODE);
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
 * The one reusable product every checkout here charges against — created
 * once by `scripts/dodo-setup.mjs`, its id set as `DODO_PRODUCT_ID`. It is a
 * one-time, pay-what-you-want price: this app decides the amount per
 * checkout (a placement's price × weeks, a membership's monthly price), not
 * Dodo's own catalogue, because both change independently of anything Dodo
 * knows about (CLAUDE.md §2, §3 — a slot's price and a Ghost tier's price
 * are read live, not fixed at product-creation time).
 *
 * Memberships are charged the same way rather than as a Dodo subscription:
 * this app already owns renewal (`renewsAt`, `expireStaleMembers()` in
 * member-queries.ts) — a second, independent renewal clock in Dodo would
 * just be a second source of truth to keep in sync with the first.
 */
export type DodoPurchaseKind = 'placement' | 'membership';

export type DodoMetadata = {
  kind: DodoPurchaseKind;
  /** The buyer's own profile id — never trust a webhook's customer email alone to identify them. */
  profileId: string;
  /** A placement's slot id, or a membership tier name — whatever `kind` needs to fulfil. */
  refId: string;
};

/**
 * Start a checkout for an amount this app already computed and validated
 * server-side. The client never sends a price — see TODO.md's security
 * posture note: this function's caller owns that, not this function.
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
      'DODO_PRODUCT_ID is not set — run scripts/dodo-setup.mjs once and set the id it prints.'
    );
  }

  const session = await getDodo().checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1, amount: params.amountMinorUnits }],
    billing_currency: params.currency,
    return_url: params.returnUrl,
    customer: { email: params.customerEmail, name: params.customerName },
    // Cast: the SDK types metadata as a flat string/number/boolean map, and
    // every value here already is one.
    metadata: params.metadata as unknown as Record<string, string>
  });

  return { sessionId: session.session_id, checkoutUrl: session.checkout_url ?? null };
}

/**
 * Verify and parse an incoming webhook body. Throws on a bad or missing
 * signature — callers must answer 401/400 and do nothing else, never fall
 * back to trusting the payload (TODO.md's Dodo security posture).
 *
 * Uses `standardwebhooks` (Svix's reference implementation of the spec Dodo
 * webhooks follow) rather than hand-rolling the HMAC comparison: this
 * library's `verify()` does the timing-safe comparison and the timestamp
 * tolerance check, both easy to get subtly wrong by hand — the dodopayments
 * SDK itself has no verification helper in this version (2.49.0), confirmed
 * by reading its shipped type definitions rather than assuming one exists.
 */
export function verifyDodoWebhook(rawBody: string, headers: Record<string, string>): unknown {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!secret) throw new Error('DODO_PAYMENTS_WEBHOOK_KEY is not set.');
  return new Webhook(secret).verify(rawBody, headers);
}
