import { NotificationsBell } from '@/components/app/notifications-bell';
import { ConsoleShell, PointsBadge } from '@/components/app/console-shell';
import type { NavItem } from '@/components/app/console-nav';
import { requireCreator } from '@/lib/proto/roles';
import { getNotifications, getUnreadCount } from '@/lib/proto/queries';

/**
 * Everything under this layout reads the caller's session, and a session lives
 * in a cookie. Without this, Next prerenders these pages at build time — and
 * because the build has no auth environment, it bakes in a signed-out render
 * and serves that to everyone.
 *
 * Under Supabase this never came up: middleware.ts touched cookies on every
 * navigation, which made the whole tree dynamic as a side effect. Deleting the
 * middleware with the Supabase swap removed that accident, so the requirement
 * is now stated where it belongs. Route segment config cascades, so this one
 * declaration covers every page in the segment.
 */
export const dynamic = 'force-dynamic';


export const metadata = { title: 'Studio' };

const nav: NavItem[] = [
  { label: 'Overview', href: '/studio', icon: 'LayoutDashboard', exact: true },
  { label: 'Placements', href: '/studio/placements', icon: 'LayoutTemplate' },
  { label: 'Offers', href: '/studio/offers', icon: 'Gavel' },
  { label: 'Analytics', href: '/studio/analytics', icon: 'BarChart3' },
  { label: 'Channels', href: '/studio/channels', icon: 'Radio' },
  { label: 'Messages', href: '/studio/messages', icon: 'MessageSquare' },
  { label: 'Sponsors', href: '/studio/sponsors', icon: 'Handshake' },
  { label: 'Members', href: '/studio/members', icon: 'Users' },
  { label: 'Earnings', href: '/studio/earnings', icon: 'Coins' },
  { label: 'Account', href: '/account', icon: 'Settings' }
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
