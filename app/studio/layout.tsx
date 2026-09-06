import { NotificationsBell } from '@/components/app/notifications-bell';
import { ConsoleShell, PointsBadge } from '@/components/app/console-shell';
import type { NavItem } from '@/components/app/console-nav';
import { requireCreator } from '@/lib/proto/roles';
import { getNotifications, getUnreadCount } from '@/lib/proto/queries';

export const metadata = { title: 'Studio' };

const nav: NavItem[] = [
  { label: 'Overview', href: '/studio', icon: 'LayoutDashboard', exact: true },
  { label: 'Placements', href: '/studio/placements', icon: 'LayoutTemplate' },
  { label: 'Analytics', href: '/studio/analytics', icon: 'BarChart3' },
  { label: 'Channels', href: '/studio/channels', icon: 'Radio' },
  { label: 'Messages', href: '/studio/messages', icon: 'MessageSquare' },
  { label: 'Advertisers', href: '/studio/sponsors', icon: 'Handshake' },
  { label: 'Earnings', href: '/studio/earnings', icon: 'Coins' }
];

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const me = await requireCreator();
  const [notifs, unread] = await Promise.all([getNotifications(me.id), getUnreadCount(me.id)]);

  return (
    <ConsoleShell
      nav={nav}
      home="/studio"
      roleLabel="Creator"
      user={{ name: me.name, email: me.email }}
      badge={<PointsBadge points={me.points} />}
      headerExtra={<NotificationsBell items={notifs} unread={unread} />}
    >
      {children}
    </ConsoleShell>
  );
}
