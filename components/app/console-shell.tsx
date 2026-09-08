import Link from 'next/link';
import { formatAmount } from '@/lib/money';
import { Logo } from '@/components/logo';
import { BackToSite } from '@/components/back-to-site';
import { ThemeToggle } from '@/components/theme-toggle';
import { SignOutButton } from '@/components/app/sign-out-button';
import { ConsoleNav, type NavItem } from '@/components/app/console-nav';
import { InstallAppButton } from '@/components/app/install-app-button';
import { Badge } from '@/components/ui/badge';

/**
 * The frame both signed-in areas share: sidebar, sticky bar, content column.
 * The studio and the sponsor dashboard differ only in their nav items and the
 * badge in the corner, so the chrome itself lives in one place.
 */
export function ConsoleShell({
  nav,
  home,
  roleLabel,
  user,
  badge,
  headerExtra,
  children
}: {
  nav: NavItem[];
  home: string;
  roleLabel: string;
  user: { name: string; email: string | null };
  badge?: React.ReactNode;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const initials = (user.name || user.email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-[100dvh]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line-subtle bg-sunken lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-line-subtle px-4">
          <Logo href={home} />
        </div>

        <ConsoleNav items={nav} />

        <div className="space-y-3 border-t border-line-subtle p-3">
          <BackToSite className="w-full justify-center" />
          <div className="flex items-center gap-2.5 px-1">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-inverse font-label text-2xs font-semibold text-on-inverse">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name || 'You'}</span>
              <span className="block truncate font-label text-2xs uppercase tracking-slate text-subtle">
                {roleLabel}
              </span>
            </span>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[var(--z-nav)] flex h-14 items-center justify-between gap-4 border-b border-line-subtle bg-canvas/85 px-gutter backdrop-blur-md">
          <Logo href={home} className="lg:hidden" />
          <div className="hidden flex-1 lg:block" />
          <div className="flex items-center gap-2">
            {badge}
            <Link
              href="/placements"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Placements
            </Link>
            {headerExtra}
            <InstallAppButton />
            <ThemeToggle />
          </div>
        </header>

        {/* The sidebar is desktop-only, so small screens get a scrolling row. */}
        <div className="border-b border-line-subtle bg-sunken lg:hidden">
          <ConsoleNav items={nav} orientation="horizontal" />
        </div>

        <main className="flex-1 px-gutter py-8">
          <div className="mx-auto w-full max-w-narrow">{children}</div>
        </main>
      </div>
    </div>
  );
}

/** The balance chip used in both consoles' headers. */
export function PointsBadge({ points }: { points: number }) {
  return (
    <Badge variant="pop" className="gap-1.5 px-2.5">
      {formatAmount(points)}
    </Badge>
  );
}
