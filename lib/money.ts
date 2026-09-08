/**
 * MONEY
 *
 * Every amount in this app is an **integer number of paise**. Not rupees, not
 * a float. `0.1 + 0.2 !== 0.3` is not an acceptable property for a ledger, and
 * the only reliable way to avoid it is never to let a fractional currency
 * value exist in the first place. The database columns are `integer`, the
 * payment provider is handed minor units, and rupees appear exactly once — on
 * the way to a human's eyes, through `formatPaise`.
 *
 * `en-IN` grouping, because the site is priced in rupees for people who read
 * rupees: ₹1,00,000, not ₹100,000.
 */

export const PAISE_PER_RUPEE = 100;

/** Paise → "₹2,500". Fractions are floored; a rendered amount never rounds up. */
export function formatPaise(paise: number): string {
  const rupees = Math.floor(paise / PAISE_PER_RUPEE);
  return `₹${rupees.toLocaleString('en-IN')}`;
}

/** Paise → "₹2,500.50", when the paise genuinely matter (receipts). */
export function formatPaiseExact(paise: number): string {
  return `₹${(paise / PAISE_PER_RUPEE).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Whole rupees → paise. The only accepted input from a human is a whole
 * number of rupees: a bid form that accepts `2500.005` is a rounding bug
 * wearing a text input. Returns null for anything that is not a positive
 * integer, and the caller must treat null as "reject", never as zero.
 */
export function rupeesToPaise(input: unknown): number | null {
  const n = typeof input === 'string' ? Number(input.trim().replace(/[, ₹]/g, '')) : Number(input);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n * PAISE_PER_RUPEE;
}

/** Paise → whole rupees, for prefilling a form the user will type rupees into. */
export function paiseToRupees(paise: number): number {
  return Math.ceil(paise / PAISE_PER_RUPEE);
}
