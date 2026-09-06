import { Eye, MousePointerClick } from 'lucide-react';
import { ChannelIcon } from '@/components/marketing/channel-icon';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CHANNEL_LIST, toChannel } from '@/lib/channels';
import { PropertyBadge } from '@/components/app/property-badge';
import type { Slot } from '@/lib/proto/schema';

/** Placement cards grouped by channel — shared by /placements (all channels) and
 *  /placements/[channel] (one channel, pre-filtered by the caller). */
export function SlotGrid({
  slots,
  stats,
  cta
}: {
  slots: Slot[];
  stats: Record<string, { view: number; click: number }>;
  cta: (slot: Slot) => React.ReactNode;
}) {
  return (
    <div className="mt-12 space-y-12">
      {CHANNEL_LIST.map((channel) => {
        const inChannel = slots.filter((s) => toChannel(s.placement).key === channel.key);
        if (inChannel.length === 0) return null;

        return (
          <section key={channel.key}>
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-md bg-pop/12 text-signal">
                <ChannelIcon name={channel.icon} className="size-4" />
              </span>
              <div>
                <h3 className="font-display font-semibold tracking-tight">{channel.label}</h3>
                <p className="text-sm text-muted-foreground">{channel.placement}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {inChannel.map((slot) => {
                const t = stats[slot.id];
                return (
                  <Card key={slot.publicId}>
                    <CardContent className="flex h-full flex-col p-5">
                      {slot.previewImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={slot.previewImageUrl}
                          alt=""
                          className="mb-3 h-28 w-full rounded-control object-cover"
                        />
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <p className="truncate font-display font-semibold tracking-tight">
                          {slot.name}
                        </p>
                        <Badge variant="pop">{slot.pricePoints} / wk</Badge>
                      </div>

                      {/* Which site it runs on — the channel is already the section heading. */}
                      <div className="mt-2">
                        <PropertyBadge property={slot.property} />
                      </div>

                      <p className="mt-2 flex-1 text-sm text-muted-foreground">
                        {slot.brief || channel.unit}
                      </p>

                      {slot.audience ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          <span className="text-subtle">Audience:</span> {slot.audience}
                        </p>
                      ) : null}

                      {slot.discountThresholdDays && slot.discountPercent ? (
                        <p className="mt-2 font-label text-2xs uppercase tracking-slate text-signal">
                          {slot.discountPercent}% off for {slot.discountThresholdDays}+ days
                        </p>
                      ) : null}

                      {channel.embeddable && t && t.view > 0 ? (
                        <div className="mt-4 flex items-center gap-4 font-label text-2xs uppercase tracking-slate text-subtle">
                          <span className="inline-flex items-center gap-1.5">
                            <Eye className="size-3" /> {t.view.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MousePointerClick className="size-3" /> {t.click.toLocaleString()}
                          </span>
                        </div>
                      ) : null}

                      {cta(slot)}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
