import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { PlacementCard } from '@/components/app/placement-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { requireCreator } from '@/lib/proto/roles';
import { expireStaleSlots, getStatsForSlots, getUserSlots } from '@/lib/proto/queries';
import { CHANNEL_LIST, toChannel } from '@/lib/channels';
import { ChannelIcon } from '@/components/marketing/channel-icon';

export const metadata = { title: 'Placements' };

export default async function PlacementsPage() {
  const me = await requireCreator('/studio/placements');
  await expireStaleSlots();

  const slots = await getUserSlots(me.id, true); // archived included, shown last
  const stats = await getStatsForSlots(slots.map((s) => s.id));

  const active = slots.filter((s) => !s.archived);
  const archived = slots.filter((s) => s.archived);

  return (
    <>
      <PageHeader
        title="Placements"
        description="Everything you offer, grouped by the channel it runs on."
        breadcrumb={[{ label: 'Studio', href: '/studio' }, { label: 'Placements' }]}
        actions={
          <Button asChild>
            <Link href="/studio/placements/new">
              <Plus className="size-4" /> New placement
            </Link>
          </Button>
        }
      />

      {active.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <p className="text-sm text-muted-foreground">Nothing listed yet.</p>
            <Button asChild>
              <Link href="/studio/placements/new">
                <Plus className="size-4" /> List your first placement
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-10">
          {CHANNEL_LIST.map((channel) => {
            const inChannel = active.filter((s) => toChannel(s.placement).key === channel.key);
            if (inChannel.length === 0) return null;
            return (
              <section key={channel.key}>
                <div className="mb-3 flex items-center gap-2">
                  <ChannelIcon name={channel.icon} className="size-4 text-signal" />
                  <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
                    {channel.label}
                  </h2>
                  <span className="font-label text-2xs tracking-data tabular-nums text-faint">
                    {inChannel.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {inChannel.map((slot) => (
                    <PlacementCard key={slot.id} slot={slot} stats={stats[slot.id]} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {archived.length > 0 ? (
        <section className="mt-12 border-t border-line-subtle pt-8">
          <h2 className="mb-3 font-label text-2xs uppercase tracking-slate text-subtle">
            Archived
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {archived.map((slot) => (
              <PlacementCard key={slot.id} slot={slot} stats={stats[slot.id]} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
