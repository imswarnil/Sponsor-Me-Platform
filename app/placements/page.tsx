import Link from 'next/link';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { Logo } from '@/components/logo';
import { BackToSite } from '@/components/back-to-site';
import { ThemeToggle } from '@/components/theme-toggle';
import { ChannelIcon } from '@/components/marketing/channel-icon';
import { AdPreviewShowcase } from '@/components/marketing/ad-preview-showcase';
import { StartConversationForm } from '@/components/marketing/start-conversation-form';
import { SlotGrid } from '@/components/marketing/slot-grid';
import { AudienceStats } from '@/components/marketing/audience-stats';
import { Button } from '@/components/ui/button';
import { Badge, Eyebrow } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  expireStaleSlots,
  getOpenPlacements,
  getPastSponsors,
  getPlacementsWithAvailability,
  getStatsForSlots
} from '@/lib/proto/queries';
import { getCreatorId, getViewer, homeFor } from '@/lib/proto/roles';
import { CHANNEL_LIST } from '@/lib/channels';
import { site } from '@/lib/site';
import { getGhostAdminStats } from '@/lib/ghost';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Open placements',
  description: 'Advertising placements on my channels — open now, taken, or worth asking about.'
};

export default async function PlacementsPage() {
  await expireStaleSlots();

  const [viewer, creatorId] = await Promise.all([getViewer(), getCreatorId()]);
  const [openRows, allRows, pastSponsors, ghost] = await Promise.all([
    getOpenPlacements(creatorId),
    creatorId ? getPlacementsWithAvailability(creatorId) : Promise.resolve([]),
    creatorId ? getPastSponsors(creatorId) : Promise.resolve([]),
    getGhostAdminStats()
  ]);
  const sponsoredRows = allRows.filter((s) => s.status === 'sponsored');
  const stats = await getStatsForSlots([...openRows, ...sponsoredRows].map((s) => s.id));

  return (
    <div className="min-h-[100dvh] bg-grid">
      <header className="flex items-center justify-between border-b border-line-subtle bg-canvas/85 px-gutter py-3 backdrop-blur-md">
        <Logo />
        <div className="flex items-center gap-2">
          {viewer ? (
            <Button asChild size="sm" variant="ghost">
              <Link href={homeFor(viewer.role)}>
                {viewer.role === 'creator' ? 'Studio' : 'Your advertising'}
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="ghost">
              <Link href="/login?next=/placements">Log in</Link>
            </Button>
          )}
          <BackToSite className="hidden sm:inline-flex" />
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-narrow px-gutter py-16">
        <Eyebrow className="mb-4">Advertising placements</Eyebrow>
        <h1 className="text-balance font-display text-4xl font-bold tracking-tighter">
          Every way to advertise with {site.creator}
        </h1>
        <p className="mt-4 max-w-lead text-md text-muted-foreground">
          Each one runs on a channel of mine and is disclosed as sponsored wherever it appears.
          The listed price is the whole price, and you can pick any custom date range.
        </p>

        <section className="mt-10">
          <h2 className="font-mono text-2xs uppercase tracking-slate text-subtle">
            What you&rsquo;d be reaching
          </h2>
          <div className="mt-4">
            <AudienceStats />
          </div>
        </section>

        {/* What it actually looks like, per channel */}
        <section className="mt-12">
          <h2 className="font-mono text-2xs uppercase tracking-slate text-subtle">
            See it in action
          </h2>
          <div className="mt-4">
            <AdPreviewShowcase />
          </div>
        </section>

        {/* Every channel that exists, even ones nothing is open on right now */}
        <section className="mt-16">
          <h2 className="font-mono text-2xs uppercase tracking-slate text-subtle">
            Every way to advertise
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHANNEL_LIST.map((channel) => (
              <Link key={channel.key} href={`/placements/${channel.key}`}>
                <Card className="h-full transition-colors hover:border-line-strong">
                  <CardContent className="flex h-full flex-col gap-2 p-5">
                    <span className="grid size-8 place-items-center rounded-md bg-pop/12 text-signal">
                      <ChannelIcon name={channel.icon} className="size-4" />
                    </span>
                    <p className="font-display font-semibold tracking-tight">{channel.label}</p>
                    <p className="flex-1 text-sm text-muted-foreground">{channel.placement}</p>
                    {channel.key === 'blog' && ghost ? (
                      <p className="font-mono text-2xs uppercase tracking-slate text-subtle">
                        {ghost.postCount.toLocaleString()} posts ·{' '}
                        {ghost.memberCount.toLocaleString()} subscribers
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Open now */}
        <section className="mt-16">
          <h2 className="font-mono text-2xs uppercase tracking-slate text-subtle">Open now</h2>
          {openRows.length === 0 ? (
            <div className="mt-4 space-y-6">
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  Nothing open right now — everything is currently sponsored.
                </CardContent>
              </Card>
              <StartConversationForm
                next="/placements"
                title="Want to know what frees up next?"
                description="Tell me what you had in mind and I'll let you know."
              />
            </div>
          ) : (
            <SlotGrid
              slots={openRows}
              stats={stats}
              cta={(slot) => (
                <Button asChild className="mt-5 w-full" variant="outline">
                  <Link href={`/s/${slot.publicId}`}>
                    View &amp; advertise <ArrowRight className="size-4" />
                  </Link>
                </Button>
              )}
            />
          )}
        </section>

        {/* Currently sponsored — with a next-available date */}
        {sponsoredRows.length > 0 ? (
          <section className="mt-16">
            <h2 className="font-mono text-2xs uppercase tracking-slate text-subtle">
              Currently sponsored
            </h2>
            <SlotGrid
              slots={sponsoredRows}
              stats={stats}
              cta={(slot) => (
                <div className="mt-5 flex items-center justify-between gap-2 border-t border-line-subtle pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" /> Next available:{' '}
                    {slot.sponsoredUntil
                      ? new Date(slot.sponsoredUntil).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })
                      : '—'}
                  </span>
                  <Link
                    href={`/s/${slot.publicId}`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Details
                  </Link>
                </div>
              )}
            />
          </section>
        ) : null}

        {/* Past advertisers — social proof, no amounts */}
        {pastSponsors.length > 0 ? (
          <section className="mt-16">
            <h2 className="font-mono text-2xs uppercase tracking-slate text-subtle">
              Past advertisers
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {pastSponsors.map((p) => (
                <a
                  key={p.id}
                  href={p.linkUrl ?? undefined}
                  target={p.linkUrl ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-control border border-line-subtle bg-surface px-3 py-2 text-sm hover:border-line-strong"
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="size-6 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-6 place-items-center rounded-full bg-sunken font-mono text-2xs">
                      {p.headline?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  )}
                  <span className="text-muted-foreground">{p.headline ?? p.channel}</span>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-16">
          <StartConversationForm next="/placements" />
        </section>
      </div>
    </div>
  );
}
