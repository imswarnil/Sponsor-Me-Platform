/**
 * Creates the one Dodo Payments product this app charges every checkout
 * against — a one-time, pay-what-you-want price, so this app decides the
 * amount per purchase (a placement's price × weeks, a membership's monthly
 * price) instead of Dodo's own fixed catalogue. See lib/dodo.ts.
 *
 * Run once per environment (test mode, then again against live mode once
 * DODO_PAYMENTS_KEY_LIVE is set). Prints the product id — set it as
 * DODO_PRODUCT_ID. Not idempotent by lookup (the API has no natural key to
 * check against), so don't run it twice against the same key without a
 * reason; running it again just creates a second, unused product.
 *
 *   node scripts/dodo-setup.mjs
 */
import DodoPayments from 'dodopayments';
import { config } from 'dotenv';

config({ path: '.env' });

const { DODO_PAYMENTS_KEY_LIVE, DODO_PAYMENTS_KEY_TEST_MODE } = process.env;
const bearerToken = DODO_PAYMENTS_KEY_LIVE || DODO_PAYMENTS_KEY_TEST_MODE;
if (!bearerToken) {
  console.error('Set DODO_PAYMENTS_KEY_TEST_MODE (or _LIVE) in .env first.');
  process.exit(1);
}

const client = new DodoPayments({
  bearerToken,
  environment: DODO_PAYMENTS_KEY_LIVE ? 'live_mode' : 'test_mode'
});

const product = await client.products.create({
  name: 'Sponsorship',
  price: {
    type: 'one_time_price',
    currency: 'INR',
    // The minimum this product can ever charge — 1 rupee. The real amount is
    // set per checkout session (see lib/dodo.ts createCheckout), which is the
    // whole point of pay_what_you_want here.
    price: 100,
    discount: 0,
    pay_what_you_want: true,
    tax_inclusive: true
  },
  tax_category: 'digital_products'
});

console.log(`Created product ${product.product_id} in ${DODO_PAYMENTS_KEY_LIVE ? 'LIVE' : 'TEST'} mode.`);
console.log(`Set DODO_PRODUCT_ID=${product.product_id} in .env (and as a Worker secret in production).`);
