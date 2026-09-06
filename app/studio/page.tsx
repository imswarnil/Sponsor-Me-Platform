import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { PlacementCard } from '@/components/app/placement-card';
import { GitHubSponsorsPanel } from '@/components/app/github-sponsors-panel';
import { StatTile, StatRow } from '@/components/app/stat-tile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { requireCreator, creatorEmailConfigured } from '@/lib/proto/roles';
import {
  expireStaleSlots,
  getActiveSponsorsOf,
  getEarnings,
  getStatsForSlots,
  getUserSlots,
  getUserSponsorships,
  validityLabel
} from '@/lib/proto/queries';
import { toChannel } from '@/lib/channels';

export const metadata = { title: 'Overview' };

export default async function StudioOverviewPage() {
  const me = await requireCreator();
  await expireStaleSlots();

  const slots = await getUserSlots(me.id);
  const [stats, earnings, sponsors, sponsoring] = await Promise.all([
    getStatsForSlots(slots.map((s) => s.id)),
    getEarnings(me.id),
    getActiveSponsorsOf(me.id),
    // The creator can also be somebody else's sponsor. /sponsor sends them
    // here, so this is the only place that sponsorship is visible — without
    // it, points they spent would simply vanish from the interface.
    getUserSponsorships(me.id)
  ]);

  // Only embeddable placements produce telemetry, so only they may be counted
  // into a "views" figure — otherwise the total silently understates itself.
  const measurable = slots.filter((s) => toChannel(s.placement).embeddable);
  const totalViews = measurable.reduce((n, s) => n + (stats[s.id]?.view ?? 0), 0);
  const live = slots.filter((s) => s.status === 'sponsored').length;
  const open = slots.filter((s) => s.status === 'open').length;

  return (
    <>
      <PageHeader
        title={`Hi, ${me.name.split(' ')[0] || 'there'}`}
        description="Your placements, who is backing them, and what they have earned."
        actions={
          <Button asChild>
            <Link href="/studio/placements/new">
              <Plus className="size-4" /> New placement
            </Link>
          </Button>
        }
      />

      {!creatorEmailConfigured() ? (
        <Card className="mb-8 border-warning-line">
          <CardContent className="p-5">
            <p className="font-medium">CREATOR_EMAIL is not set.</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              The studio is falling back to the oldest account, which is you today but will not
              stay true once someone else signs up. Set <code className="font-mono">CREATOR_EMAIL</code>{' '}
              in the environment to pin it.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <StatRow>
        <StatTile label="Earned" value={earnings.total} sub={`across ${earnings.deals} deals`} />
        <StatTile label="Advertisers" value={earnings.sponsors} sub="all time" />
        <StatTile label="Live now" value={live} sub={`${open} open`} />
        <StatTile
          label="Views"
          value={totalViews}
          sub={measurable.length ? `${measurable.length} measurable` : 'nothing embeddable yet'}
        />
      </StatRow>

      <section className="mt-10">
        <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">Running now</h2>
        {sponsors.length === 0 ? (
          <Card className="mt-3">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nothing is being sponsored right now.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-3 space-y-2">
            {sponsors.map(({ slot, sponsor }) => (
              <Card key={slot.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link
                      href={`/studio/placements/${slot.id}`}
                      className="font-medium hover:text-signal"
                    >
                      {slot.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {sponsor.name || sponsor.email} · {slot.adHeadline}
                    </p>
                  </div>
                  <span className="font-label text-2xs uppercase tracking-slate text-signal">
                    {validityLabel(slot.sponsoredUntil)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Only rendered when it applies — most of the time the creator sponsors
          nobody and this section would just be an empty box. */}
      {sponsoring.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
            You&rsquo;re advertising
          </h2>
          <div className="mt-3 space-y-2">
            {sponsoring.map((slot) => (
              <Card key={slot.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link href={`/s/${slot.publicId}`} className="font-medium hover:text-signal">
                      {slot.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">{slot.adHeadline}</p>
                  </div>
                  <span className="font-label text-2xs uppercase tracking-slate text-signal">
                    {validityLabel(slot.sponsoredUntil)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
            All placements
          </h2>
          <Link
            href="/studio/placements"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Manage
          </Link>
        </div>
        {slots.length === 0 ? (
          <Card className="mt-3">
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                You have not listed anything yet. A placement is one spot on one channel, at one
                price.
              </p>
              <Button asChild>
                <Link href="/studio/placements/new">
                  <Plus className="size-4" /> List your first placement
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {slots.map((slot) => (
              <PlacementCard key={slot.id} slot={slot} stats={stats[slot.id]} />
            ))}
          </div>
        )}
      </section>

      {/* The other sponsorship route. Renders nothing without a GITHUB_TOKEN. */}
      <GitHubSponsorsPanel />
    </>
  );
}
