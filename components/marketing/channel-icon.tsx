import {
  Github,
  Instagram,
  Mail,
  Megaphone,
  PenLine,
  Radio,
  Youtube,
  type LucideIcon
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  Youtube,
  Instagram,
  Mail,
  PenLine,
  Github,
  Radio,
  Megaphone
};

/** Resolves a channel's icon name from lib/site.ts. Falls back to the record
 *  light rather than rendering nothing, so a new channel is never invisible. */
export function ChannelIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Radio;
  return <Icon className={className} />;
}
