import { ConsoleShell, PointsBadge } from '@/components/app/console-shell';
import type { NavItem } from '@/components/app/console-nav';
import { requireSponsor } from '@/lib/proto/roles';

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


export const metadata = { title: 'Your advertising' };

const nav: NavItem[] = [
  { label: 'Overview', href: '/sponsor', icon: 'LayoutDashboard', exact: true },
  { label: 'Membership', href: '/sponsor/membership', icon: 'Users' },
  { label: 'Messages', href: '/sponsor/messages', icon: 'MessageSquare' },
  { label: 'History', href: '/sponsor/history', icon: 'Receipt' },
  { label: 'Account', href: '/account', icon: 'Settings' }
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
