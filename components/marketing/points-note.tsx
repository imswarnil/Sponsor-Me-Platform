import { Coins } from 'lucide-react';

/**
 * WHAT "POINTS" MEANS, SAID OUT LOUD
 * ==================================
 *
 * Every price on this platform is denominated in points, and no card is ever
 * charged: `sponsorSlot` and `chargeForMembership` move integers between two
 * `bms_profile` rows and nothing else happens. A new account is created with
 * 1,000 points (schema.ts, `profiles.points`), and there is no way to buy more.
 *
 * That has to be on the page rather than only in this comment. A visitor who
 * reads "250 points a week" and quietly assumes it is 250 rupees has been
 * misled by omission, and finding out at checkout is the worst possible moment.
 * The same rule as CLAUDE.md §4's "no audience figures": say the true thing or
 * say nothing, and never let a number imply something it isn't.
 *
 * When Dodo Payments replaces points (TODO.md), this component is the one place
 * that has to change, and its absence will be the signal that it did.
 */
export function PointsNote({ className }: { className?: string }) {
  return (
    <div
      className={`flex gap-3 rounded-card border border-line-subtle bg-sunken p-5 ${className ?? ''}`}
    >
      <Coins className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden="true" />
      <div className="text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Nothing charges a card yet.</p>
        <p className="mt-1.5 max-w-lead text-pretty">
          Prices are in rupees, but this is a preview: every account starts with ₹1,000 of
          credit, and a placement or a spot on the wall spends that — so you can take a spot, see
          it run, and see exactly what it does before real money is ever part of it. Card payments
          come later; until then this is the whole story.
        </p>
      </div>
    </div>
  );
}
