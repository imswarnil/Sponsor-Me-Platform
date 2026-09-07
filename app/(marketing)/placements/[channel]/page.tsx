import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarClock } from 'lucide-react';
import { ChannelIcon } from '@/components/marketing/channel-icon';
import { AdPreviewShowcase } from '@/components/marketing/ad-preview-showcase';
import { StartConversationForm } from '@/components/marketing/start-conversation-form';
import { SlotGrid } from '@/components/marketing/slot-grid';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  expireStaleSlots,
  getOpenPlacements,
  getPlacementsWithAvailability,
  getStatsForSlots
} from '@/lib/proto/queries';
import { getCreatorId } from '@/lib/proto/roles';
import { CHANNELS, isChannelKey, type ChannelKey } from '@/lib/channels';
import { site } from '@/lib/site';

export async function generateMetadata({ params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  if (!isChannelKey(channel)) return {};
  return { title: `Advertise on ${CHANNELS[channel].label}` };
}

export const dynamic = 'force-dynamic';

export default async function ChannelPlacementsPage({
  params
}: {
  params: Promise<{ channel: string }>;
}) {
  const { channel: channelParam } = await params;
  if (!isChannelKey(channelParam)) notFound();
  const channel = CHANNELS[channelParam as ChannelKey];

  await expireStaleSlots();
  const creatorId = await getCreatorId();
  const [openRows, allRows] = await Promise.all([
    getOpenPlacements(creatorId),
    creatorId ? getPlacementsWithAvailability(creatorId) : Promise.resolve([])
  ]);
  const openHere = openRows.filter((s) => s.placement === channel.key || (channel.key === 'blog' && s.placement === 'sidebar'));
  const sponsoredHere = allRows.filter((s) => s.status === 'sponsored' && s.placement === channel.key);
  const stats = await getStatsForSlots([...openHere, ...sponsoredHere].map((s) => s.id));

  return (
    /* Chrome from app/(marketing)/layout.tsx. */
    <div className="bg-grid">
      <div className="mx-auto max-w-narrow px-gutter py-16">
        <Link
          href="/placements"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> All channels
        </Link>

        <Eyebrow className="mb-4 mt-6">
          <ChannelIcon name={channel.icon} className="size-3" /> {channel.label}
        </Eyebrow>
        <h1 className="text-balance font-display text-4xl font-bold tracking-tighter">
          Advertise on {site.creator}&rsquo;s {channel.label.toLowerCase()}
        </h1>
        <p className="mt-4 max-w-lead text-md text-muted-foreground">{channel.placement}</p>

        <section className="mt-12">
          <AdPreviewShowcase defaultChannel={channel.key} />
        </section>

        <section className="mt-16">
          <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">Open now</h2>
          {openHere.length === 0 ? (
            <Card className="mt-4">
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Nothing open on this channel right now.
              </CardContent>
            </Card>
          ) : (
            <SlotGrid
              slots={openHere}
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

        {sponsoredHere.length > 0 ? (
          <section className="mt-16">
            <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
              Currently sponsored
            </h2>
            <SlotGrid
              slots={sponsoredHere}
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

        <section className="mt-16">
          <StartConversationForm
            next={`/placements/${channel.key}`}
            title={`Want something else on ${channel.label}?`}
          />
        </section>
      </div>
    </div>
  );
}
