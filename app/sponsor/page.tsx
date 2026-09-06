import Link from 'next/link';
import { ArrowRight, ExternalLink, Eye, MousePointerClick } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { StatTile, StatRow } from '@/components/app/stat-tile';
import { ChannelBadge } from '@/components/app/channel-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { requireSponsor } from '@/lib/proto/roles';
import {
  expireStaleSlots,
  getSponsorHistory,
  getStatsForSlots,
  getUserSponsorships,
  validityLabel
} from '@/lib/proto/queries';
import { toChannel } from '@/lib/channels';
import { site } from '@/lib/site';

export default async function SponsorOverviewPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const me = await requireSponsor();
  const { ok } = await searchParams;
  await expireStaleSlots();

  const live = await getUserSponsorships(me.id);
  const [stats, history] = await Promise.all([
    getStatsForSlots(live.map((s) => s.id)),
    getSponsorHistory(me.id)
  ]);

  const spent = history.reduce((n, h) => n + h.txn.amount, 0);
  const measurable = live.filter((s) => toChannel(s.placement).embeddable);
  const views = measurable.reduce((n, s) => n + (stats[s.id]?.view ?? 0), 0);
  const clicks = measurable.reduce((n, s) => n + (stats[s.id]?.click ?? 0), 0);

  return (
    <>
      <PageHeader
        title={`Hi, ${me.name.split(' ')[0] || 'there'}`}
        description={`What you're running on ${site.creator}'s channels, and how it's doing.`}
        actions={
          <Button asChild>
            <Link href="/placements">
              Advertise somewhere else <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />

      {ok ? (
        <p className="mb-8 rounded-control bg-success-soft px-4 py-3 text-sm text-success">
          You&rsquo;re live. Your placement started running the moment you paid — it&rsquo;s below.
        </p>
      ) : null}

      <StatRow>
        <StatTile label="Running now" value={live.length} sub="placements" />
        <StatTile label="Spent" value={spent} sub="points, all time" />
        <StatTile label="Views" value={views} sub="on measurable spots" />
        <StatTile label="Clicks" value={clicks} sub="on measurable spots" />
      </StatRow>

      <section className="mt-10">
        <h2 className="mb-3 font-mono text-2xs uppercase tracking-slate text-subtle">
          Running now
        </h2>

        {live.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <p className="max-w-lead text-sm text-muted-foreground">
                You aren&rsquo;t advertising anywhere at the moment. Every open spot is listed with
                its price and its recent performance — nothing is hidden behind a rate card.
              </p>
              <Button asChild>
                <Link href="/placements">
                  See open placements <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {live.map((slot) => {
              const channel = toChannel(slot.placement);
              const t = stats[slot.id];
              return (
                <Card key={slot.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display font-semibold tracking-tight">{slot.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{channel.placement}</p>
                      </div>
                      <Badge variant="craft">{validityLabel(slot.sponsoredUntil)}</Badge>
                    </div>

                    <div className="mt-4 rounded-control border border-line-subtle bg-sunken p-4">
                      <p className="font-mono text-2xs uppercase tracking-slate text-subtle">
                        Your creative
                      </p>
                      <p className="mt-1.5 text-sm font-medium">{slot.adHeadline}</p>
                      {slot.adLinkUrl ? (
                        <a
                          href={slot.adLinkUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                          className="mt-1 inline-flex items-center gap-1 truncate text-xs text-signal hover:underline"
                        >
                          {slot.adLinkUrl} <ExternalLink className="size-3 shrink-0" />
                        </a>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle pt-4">
                      <div className="flex flex-wrap items-center gap-4">
                        <ChannelBadge placement={slot.placement} />
                        {channel.embeddable && t ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
                              <Eye className="size-3.5 text-faint" /> {t.view.toLocaleString()}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
                              <MousePointerClick className="size-3.5 text-faint" />{' '}
                              {t.click.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Placed by hand — ask {site.creator} for the numbers.
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/s/${slot.publicId}`}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Public page
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-10 max-w-measure text-sm text-muted-foreground">
        A sponsorship ends on its own when the weeks you bought run out — the spot reopens and
        your creative stops serving. Nothing renews automatically.
      </p>
    </>
  );
}
