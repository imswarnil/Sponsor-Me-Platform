import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarClock, Coins, Eye, MousePointerClick } from 'lucide-react';
import { Logo } from '@/components/logo';
import { BackToSite } from '@/components/back-to-site';
import { ThemeToggle } from '@/components/theme-toggle';
import { SponsorForm } from '@/components/app/sponsor-form';
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

  const [owner, stats, me] = await Promise.all([
    getUserById(slot.ownerId),
    getSlotStats(slot.id),
    getCurrentUser()
  ]);

  const isOwner = me?.id === slot.ownerId;
  const isOpen = slot.status === 'open';
  const validity = validityLabel(slot.sponsoredUntil);
  const channel = toChannel(slot.placement);

  return (
    <div className="min-h-[100dvh] bg-grid">
      <header className="flex items-center justify-between border-b border-line-subtle bg-canvas/85 px-gutter py-3 backdrop-blur-md">
        <Logo />
        <div className="flex items-center gap-2">
          {me ? (
            <Badge variant="pop" className="gap-1.5 px-2.5">
              <Coins className="size-3" /> {me.points} pts
            </Badge>
          ) : (
            <Button asChild size="sm" variant="ghost">
              <Link href={`/login?next=/s/${publicId}`}>Log in</Link>
            </Button>
          )}
          <BackToSite className="hidden sm:inline-flex" />
          <ThemeToggle />
        </div>
      </header>

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
              <div className="flex items-center justify-center gap-4 font-mono text-2xs uppercase tracking-slate text-subtle">
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
                <p className="mt-3 font-mono text-2xs uppercase tracking-slate text-subtle">
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
            <p className="mt-2 font-mono text-2xs uppercase tracking-slate text-signal">
              {slot.discountPercent}% off when you book {slot.discountThresholdDays}+ days
            </p>
          ) : null}

          <div className="mt-5 flex items-baseline gap-2 rounded-card border border-border bg-card p-4">
            <Coins className="size-5 self-center text-signal" />
            <span className="font-display text-lg font-bold tabular-nums">
              {slot.pricePoints} points
            </span>
            <span className="font-mono text-2xs uppercase tracking-slate text-subtle">/ week</span>
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
                  {validity ? (
                    <Badge variant="pop" className="gap-1"><CalendarClock className="size-3" /> {validity}</Badge>
                  ) : null}
                </div>
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
          ) : !me ? (
            <Card className="mt-6">
              <CardContent className="flex flex-col items-start gap-3 p-5">
                <p className="text-sm text-muted-foreground">Log in to advertise here with points.</p>
                <Button asChild><Link href={`/login?next=/s/${publicId}`}>Log in to advertise</Link></Button>
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
                <p className="mb-4 text-sm font-medium">Advertise here</p>
                <SponsorForm
                  publicId={slot.publicId}
                  channel={channel.key}
                  pricePerWeek={slot.pricePoints}
                  myPoints={me.points}
                  ownerName={owner?.name ?? site.creator}
                  width={slot.width}
                  height={slot.height}
                  discountThresholdDays={slot.discountThresholdDays}
                  discountPercent={slot.discountPercent}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
