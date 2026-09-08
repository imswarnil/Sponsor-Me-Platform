/**
 * The one place a number becomes an amount.
 *
 * Points are rupees, 1:1. The original membership code converted the Ghost
 * tier's ₹2,000 to 2,000 points and back again, and every account's starting
 * balance was 1,000 either way — so the figure has always meant rupees, and
 * the site now says so. components/marketing/points-note.tsx says, everywhere
 * a price appears, that nothing is charged yet. When Dodo Payments takes over
 * (TODO.md) that note goes; this function does not change.
 *
 * `en-IN` grouping: ₹1,00,000, not ₹100,000 — the site is priced in rupees for
 * people who read rupees.
 */
export function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
