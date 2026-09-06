import Link from 'next/link';
import { Eye, MousePointerClick } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChannelBadge } from '@/components/app/channel-badge';
import { toChannel } from '@/lib/channels';
import { validityLabel } from '@/lib/proto/queries';
import type { Slot } from '@/lib/proto/schema';
import type { Totals } from '@/lib/proto/queries';

/**
 * One placement, as the creator sees it in a list. Telemetry is only shown for
 * channels that actually serve through the widget — printing "0 views" against
 * a YouTube read would be reporting a measurement that was never taken.
 */
export function PlacementCard({ slot, stats }: { slot: Slot; stats?: Totals }) {
  const channel = toChannel(slot.placement);
  const validity = validityLabel(slot.sponsoredUntil);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/studio/placements/${slot.id}`}
              className="truncate font-display font-semibold tracking-tight hover:text-signal"
            >
              {slot.name}
            </Link>
            <p className="mt-1 font-label text-2xs uppercase tracking-slate text-subtle">
              {slot.publicId}
            </p>
          </div>
          {slot.archived ? (
            <Badge>Archived</Badge>
          ) : slot.status === 'sponsored' ? (
            <Badge variant="success">Sponsored</Badge>
          ) : (
            <Badge variant="pop">Open</Badge>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ChannelBadge placement={slot.placement} />
          <span className="font-label text-2xs uppercase tracking-slate text-subtle">
            {slot.pricePoints} pts / wk
          </span>
        </div>

        {channel.embeddable && stats ? (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Eye className="size-3.5 text-faint" /> {stats.view.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <MousePointerClick className="size-3.5 text-faint" /> {stats.click.toLocaleString()}
            </span>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Placed by hand — no automatic view or click counting.
          </p>
        )}

        {slot.status === 'sponsored' && validity ? (
          <p className="mt-3 font-label text-2xs uppercase tracking-slate text-signal">{validity}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
