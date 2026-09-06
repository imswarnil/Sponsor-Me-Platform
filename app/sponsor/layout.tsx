import { ConsoleShell, PointsBadge } from '@/components/app/console-shell';
import type { NavItem } from '@/components/app/console-nav';
import { requireSponsor } from '@/lib/proto/roles';

export const metadata = { title: 'Your advertising' };

const nav: NavItem[] = [
  { label: 'Overview', href: '/sponsor', icon: 'LayoutDashboard', exact: true },
  { label: 'Messages', href: '/sponsor/messages', icon: 'MessageSquare' },
  { label: 'History', href: '/sponsor/history', icon: 'Receipt' }
];

export default async function SponsorLayout({ children }: { children: React.ReactNode }) {
  const me = await requireSponsor();

  return (
    <ConsoleShell
      nav={nav}
      home="/sponsor"
      roleLabel="Advertiser"
      user={{ name: me.name, email: me.email }}
      badge={<PointsBadge points={me.points} />}
    >
      {children}
    </ConsoleShell>
  );
}
