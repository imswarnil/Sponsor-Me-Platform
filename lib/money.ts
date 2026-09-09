/**
 * Every amount in this app is an **integer number of paise**. Not rupees, not
 * a float. `0.1 + 0.2 !== 0.3` is not an acceptable property for a ledger, and
 * the only reliable way to avoid it is never to let a fractional currency
 * value exist: the columns are `integer`, the payment provider is handed minor
 * units, and rupees appear exactly once — here, on the way to a human's eyes.
 *
 * `en-IN` grouping, because the site is priced in rupees for people who read
 * rupees: ₹1,00,000, not ₹100,000.
 */
export function formatPaise(paise: number): string {
  // Floored: a rendered amount never rounds up into money nobody paid.
  return `₹${Math.floor(paise / 100).toLocaleString('en-IN')}`;
}
