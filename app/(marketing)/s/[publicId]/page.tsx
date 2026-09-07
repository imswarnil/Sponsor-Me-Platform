import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarClock, Coins, Eye, MousePointerClick } from 'lucide-react';
import { OfferForm } from '@/components/app/offer-form';
import { countPendingOffers } from '@/lib/proto/offer-queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChannelBadge } from '@/components/app/channel-badge';
import { ChannelIcon } from '@/components/marketing/channel-icon';
import { toChannel } from '@/lib/channels';
import { site } from '@/lib/site';
import {
  expireStaleSlots,
  getCurrentUser,
  getSlotByPublicId,
  getSlotStats,
  getUserById,
  validityLabel
} from '@/lib/proto/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Advertise here' };

const errors: Record<string, string> = {
  insufficient: "You don't have enough points for this spot.",
  own: "You can't advertise on your own slot.",
  taken: 'This spot has just been taken by someone else.'
};

export default async function SponsorPage({
  params,
  searchParams
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ e?: string; ok?: string }>;
}) {
  const { publicId } = await params;
  const { e, ok } = await searchParams;

  await expireStaleSlots();
  const slot = await getSlotByPublicId(publicId);
  if (!slot || slot.archived) notFound();

  const [owner, stats, me, pendingOffers] = await Promise.all([
    getUserById(slot.ownerId),
    getSlotStats(slot.id),
    getCurrentUser(),
    // Shown publicly: knowing two people are already bidding is the single most
    // useful thing a visitor can learn before naming a number.
    countPendingOffers(slot.id)
  ]);

  const isOwner = me?.id === slot.ownerId;
  const isOpen = slot.status === 'open';
  const validity = validityLabel(slot.sponsoredUntil);
  const channel = toChannel(slot.placement);

  return (
    /* Header and footer come from app/(marketing)/layout.tsx. The one thing
       this page's old bespoke bar carried that the shared one cannot — what you
       have left to spend, right where you are about to spend it — moved into
       the page as a strip rather than being lost with the duplicate chrome. */
    <div className="bg-grid">
      <div className="mx-auto max-w-narrow px-gutter pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line-subtle bg-sunken px-5 py-3">
          <p className="text-sm text-muted-foreground">
            Placements are priced in points, not money — nothing charges a card.
          </p>
          {me ? (
            <Badge variant="pop" className="gap-1.5 px-2.5">
              <Coins className="size-3" /> {me.points.toLocaleString()} pts to spend
            </Badge>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href={`/login?next=/s/${publicId}`}>Log in to take this spot</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-narrow gap-8 px-gutter py-16 md:grid-cols-[300px_1fr]">
        {/* What the placement actually looks like, where there is something to
            show. A hand-placed channel has no widget to preview, so it gets a
            plain description of the surface instead of a fake mock-up. */}
        <div className="space-y-3">
          {channel.embeddable ? (
            <>
              <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-media border border-border shadow-sm">
                <iframe
                  src={`/embed/${slot.publicId}`}
                  width={slot.width}
                  height={slot.height}
                  className="block w-full"
                  style={{ aspectRatio: `${slot.width}/${slot.height}` }}
                />
              </div>
              <div className="flex items-center justify-center gap-4 font-label text-2xs uppercase tracking-slate text-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="size-3" /> {stats.view.toLocaleString()} views
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MousePointerClick className="size-3" /> {stats.click.toLocaleString()} clicks
                </span>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-5">
                <span className="grid size-10 place-items-center rounded-md bg-pop/12 text-signal">
                  <ChannelIcon name={channel.icon} className="size-5" />
                </span>
                <p className="mt-4 font-display font-semibold tracking-tight">{channel.label}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{channel.placement}</p>
                <p className="mt-3 font-label text-2xs uppercase tracking-slate text-subtle">
                  Placed by hand · no automatic counting
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Details + action */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isOpen ? (
              <Badge variant="pop">Available</Badge>
            ) : (
              <Badge variant="success">Sponsored</Badge>
            )}
            <ChannelBadge placement={slot.placement} />
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">{slot.name}</h1>
          <p className="mt-3 max-w-lead text-muted-foreground">
            {channel.placement} {channel.unit} It is labelled as sponsored wherever it appears, and
            the price below is the whole price.
          </p>
          {slot.brief ? (
            <p className="mt-3 max-w-lead whitespace-pre-line text-sm text-muted-foreground">
              {slot.brief}
            </p>
          ) : null}
          {slot.audience ? (
            <p className="mt-3 max-w-lead text-sm text-muted-foreground">
              <span className="text-subtle">Audience:</span> {slot.audience}
            </p>
          ) : null}
          {slot.adSpecs ? (
            <p className="mt-2 max-w-lead text-sm text-muted-foreground">
              <span className="text-subtle">Ad specs:</span> {slot.adSpecs}
            </p>
          ) : null}
          {slot.discountThresholdDays && slot.discountPercent ? (
            <p className="mt-2 font-label text-2xs uppercase tracking-slate text-signal">
              {slot.discountPercent}% off when you book {slot.discountThresholdDays}+ days
            </p>
          ) : null}

          <div className="mt-5 flex items-baseline gap-2 rounded-card border border-border bg-card p-4">
            <Coins className="size-5 self-center text-signal" />
            <span className="font-display text-lg font-bold tabular-nums">
              {slot.pricePoints} points
            </span>
            <span className="font-label text-2xs uppercase tracking-slate text-subtle">/ week</span>
          </div>

          {ok ? (
            <p className="mt-5 rounded-control bg-success-soft px-3 py-2 text-sm text-success">
              You&rsquo;re now advertising here — it&rsquo;s live.
            </p>
          ) : null}
          {e && errors[e] ? (
            <p className="mt-5 rounded-control bg-destructive-soft px-3 py-2 text-sm text-destructive">
              {errors[e]}
            </p>
          ) : null}

          {/* States */}
          {!isOpen ? (
            <Card className="mt-6">
              <CardContent className="p-5 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">This spot is currently sponsored.</p>
                  <div className="flex items-center gap-2">
                    {slot.isSample ? <Badge variant="outline">Sample</Badge> : null}
                    {validity ? (
                      <Badge variant="pop" className="gap-1"><CalendarClock className="size-3" /> {validity}</Badge>
                    ) : null}
                  </div>
                </div>
                {slot.isSample ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sample data while the site is being built — there is no real advertiser here.
                  </p>
                ) : null}
                {slot.adLinkUrl ? (
                  <a href={slot.adLinkUrl} className="mt-1 inline-block text-signal hover:underline">
                    {slot.adHeadline || 'Visit advertiser'} {slot.adCtaLabel ? `— ${slot.adCtaLabel}` : ''} →
                  </a>
                ) : (
                  <p className="mt-1 text-muted-foreground">{slot.adHeadline}</p>
                )}
                {slot.sponsoredUntil ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Valid until {new Date(slot.sponsoredUntil).toLocaleDateString()} — the slot reopens automatically after that.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : isOwner ? (
            <Card className="mt-6">
              <CardContent className="flex flex-col items-start gap-3 p-5">
                <p className="text-sm text-muted-foreground">
                  This is your placement. Share this link and it is the whole pitch.
                </p>
                <Button asChild variant="outline">
                  <Link href={`/studio/placements/${slot.id}`}>Manage it</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-6">
              <CardContent className="p-5">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium">Make an offer</p>
                  {pendingOffers > 0 ? (
                    <span className="font-label text-2xs uppercase tracking-slate text-subtle">
                      {pendingOffers} {pendingOffers === 1 ? 'offer' : 'offers'} in
                    </span>
                  ) : null}
                </div>
                <OfferForm
                  publicId={slot.publicId}
                  pricePerWeek={slot.pricePoints}
                  signedIn={Boolean(me)}
                  myPoints={me?.points}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
