import { Badge } from '@/components/ui/badge';
import { ChannelIcon } from '@/components/marketing/channel-icon';
import { toChannel } from '@/lib/channels';

/** The channel a placement runs on, read from its stored `placement` value. */
export function ChannelBadge({ placement }: { placement: string | null | undefined }) {
  const channel = toChannel(placement);
  return (
    <Badge variant="outline" className="gap-1.5">
      <ChannelIcon name={channel.icon} className="size-3" />
      {channel.label}
    </Badge>
  );
}
