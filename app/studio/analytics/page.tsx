import Link from 'next/link';
import { PageHeader } from '@/components/app/page-header';
import { SlotAnalytics } from '@/components/app/slot-analytics';
import { StatTile, StatRow } from '@/components/app/stat-tile';
import { ChannelBadge } from '@/components/app/channel-badge';
import { Card, CardContent } from '@/components/ui/card';
import { requireCreator } from '@/lib/proto/roles';
import {
  expireStaleSlots,
  getDailyStatsForSlots,
  getStatsForSlots,
  getUserSlots,
  toDailySeries
} from '@/lib/proto/queries';
import { toChannel } from '@/lib/channels';

export const metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  const me = await requireCreator('/studio/analytics');
  await expireStaleSlots();

  const all = await getUserSlots(me.id, true);
  // Only embeddable placements emit events, so the chart and the table below
  // are about them alone. Mixing in hand-placed channels would show a row of
  // zeros that looks like failure rather than like "not measured".
  const measurable = all.filter((s) => toChannel(s.placement).embeddable);
  const ids = measurable.map((s) => s.id);

  const [totals, daily] = await Promise.all([
    getStatsForSlots(ids),
    getDailyStatsForSlots(ids, 14)
  ]);
  const series = toDailySeries(daily, 14);

  const views = Object.values(totals).reduce((n, t) => n + t.view, 0);
  const clicks = Object.values(totals).reduce((n, t) => n + t.click, 0);
  const ctr = views ? (clicks / views) * 100 : 0;
  const windowViews = series.reduce((n, d) => n + d.views, 0);

  const ranked = [...measurable].sort(
    (a, b) => (totals[b.id]?.view ?? 0) - (totals[a.id]?.view ?? 0)
  );

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Views and clicks across every placement that serves through the widget."
        breadcrumb={[{ label: 'Studio', href: '/studio' }, { label: 'Analytics' }]}
      />

      {measurable.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing to measure yet. Only blog placements serve through the widget and count
              views and clicks — the other channels are placed by hand.
            </p>
            <Link
              href="/studio/placements/new"
              className="mt-3 inline-block text-sm text-signal hover:underline"
            >
              List a blog placement
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <StatRow>
            <StatTile label="Views" value={views} sub="all time" />
            <StatTile label="Clicks" value={clicks} sub="all time" />
            <StatTile label="Click-through" value={`${ctr.toFixed(1)}%`} sub="clicks ÷ views" />
            <StatTile label="Last 14 days" value={windowViews} sub="views" />
          </StatRow>

          <div className="mt-6">
            <SlotAnalytics data={series} />
          </div>

          <section className="mt-10">
            <h2 className="mb-3 font-label text-2xs uppercase tracking-slate text-subtle">
              By placement
            </h2>
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line-subtle text-left">
                      <th className="px-5 py-3 font-label text-2xs uppercase tracking-slate text-subtle">
                        Placement
                      </th>
                      <th className="px-5 py-3 text-right font-label text-2xs uppercase tracking-slate text-subtle">
                        Views
                      </th>
                      <th className="px-5 py-3 text-right font-label text-2xs uppercase tracking-slate text-subtle">
                        Clicks
                      </th>
                      <th className="px-5 py-3 text-right font-label text-2xs uppercase tracking-slate text-subtle">
                        CTR
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.map((slot) => {
                      const t = totals[slot.id] ?? { view: 0, click: 0 };
                      const rate = t.view ? (t.click / t.view) * 100 : 0;
                      return (
                        <tr key={slot.id} className="border-b border-line-subtle last:border-0">
                          <td className="px-5 py-3">
                            <Link
                              href={`/studio/placements/${slot.id}`}
                              className="font-medium hover:text-signal"
                            >
                              {slot.name}
                            </Link>
                            <div className="mt-1.5">
                              <ChannelBadge placement={slot.placement} />
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {t.view.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {t.click.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                            {rate.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </>
  );
}
