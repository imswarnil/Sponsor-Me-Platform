import Link from 'next/link';
import { formatAmount } from '@/lib/money';
import { Check, X } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { SubmitButton } from '@/components/ui/submit-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChannelBadge } from '@/components/app/channel-badge';
import { requireCreator } from '@/lib/proto/roles';
import { getPendingOffersForCreator } from '@/lib/proto/offer-queries';
import { acceptOffer, declineOffer } from '@/lib/proto/offers';

export const metadata = { title: 'Offers' };

function days(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

const NOTES: Record<string, string> = {
  accepted: 'Offer accepted — the placement is live.',
  declined: 'Offer declined.',
  taken: 'That placement was already sponsored.',
  gone: 'That offer is no longer pending.',
  insufficient: "That sponsor's balance no longer covers their offer."
};

export default async function OffersPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; e?: string }>;
}) {
  const me = await requireCreator('/studio/offers');
  const sp = await searchParams;
  const rows = await getPendingOffersForCreator(me.id);

  return (
    <>
      <PageHeader
        title="Offers"
        description="What people have proposed for your placements. You decide which to take."
      />

      {sp.ok || sp.e ? (
        <p
          className={
            sp.e
              ? 'mb-4 rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive'
              : 'mb-4 rounded-md bg-success-soft px-3 py-2 text-sm text-success'
          }
        >
          {NOTES[sp.e ?? sp.ok ?? ''] ?? ''}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No offers waiting. They appear here the moment someone proposes one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map(({ offer, slot, sponsor }) => {
            const run = days(offer.startDate, offer.endDate);
            // What the slot itself asks for the same run, so the offer can be
            // judged against something rather than in the abstract.
            const asking = Math.ceil((slot.pricePoints * run) / 7);
            const over = offer.pricePoints - asking;

            return (
              <Card key={offer.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/studio/placements/${slot.id}`}
                          className="font-display font-semibold tracking-tight hover:text-signal"
                        >
                          {slot.name}
                        </Link>
                        <ChannelBadge placement={slot.placement} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {sponsor.name || sponsor.email} ·{' '}
                        {offer.startDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                        {' → '}
                        {offer.endDate.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}{' '}
                        ({run} days)
                      </p>
                      {offer.message ? (
                        <p className="mt-3 border-l-2 border-line-subtle pl-3 text-sm">
                          {offer.message}
                        </p>
                      ) : null}
                      <p className="mt-3 text-sm">
                        <span className="text-subtle">Ad:</span> {offer.adHeadline}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-display text-2xl font-bold tracking-tight">
                        {formatAmount(offer.pricePoints)}
                      </p>
                      <p className="mt-1 font-label text-2xs uppercase tracking-slate text-subtle">
                        asking {asking}
                      </p>
                      {over !== 0 ? (
                        <Badge variant={over > 0 ? 'success' : 'warning'} className="mt-2">
                          {over > 0 ? `+${over}` : over}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-line-subtle pt-4">
                    <form action={acceptOffer}>
                      <input type="hidden" name="offerId" value={offer.id} />
                      <SubmitButton size="sm" pendingText="Accepting...">
                        <Check className="size-4" /> Accept
                      </SubmitButton>
                    </form>
                    <form action={declineOffer}>
                      <input type="hidden" name="offerId" value={offer.id} />
                      <SubmitButton size="sm" variant="ghost" pendingText="Declining...">
                        <X className="size-4" /> Decline
                      </SubmitButton>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
