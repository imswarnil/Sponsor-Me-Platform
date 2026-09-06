'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Coins,
  Handshake,
  LayoutDashboard,
  LayoutTemplate,
  MessageSquare,
  Radio,
  Receipt,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  LayoutTemplate,
  BarChart3,
  Handshake,
  Coins,
  Receipt,
  Radio,
  MessageSquare
};

export type NavItem = { label: string; href: string; icon: string; exact?: boolean };

/**
 * The signed-in side nav, shared by the studio and the sponsor dashboard.
 *
 * Active is a 2px rule hung off `aria-current` — never a filled pill, and never
 * a class the accessibility tree can disagree with.
 */
export function ConsoleNav({
  items,
  orientation = 'vertical'
}: {
  items: NavItem[];
  /** Horizontal is the small-screen form: one scrolling row, rule underneath. */
  orientation?: 'vertical' | 'horizontal';
}) {
  const pathname = usePathname();
  const horizontal = orientation === 'horizontal';

  return (
    <nav
      className={cn(
        horizontal
          ? 'flex gap-1 overflow-x-auto px-gutter py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
          : 'flex-1 space-y-0.5 px-3 py-3'
      )}
    >
      {items.map((item) => {
        const Icon = icons[item.icon] ?? LayoutDashboard;
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex items-center gap-3 whitespace-nowrap text-sm transition-colors duration-200 ease-out',
              'before:absolute before:rounded-full before:bg-transparent before:content-[""]',
              horizontal
                ? 'gap-2 px-3 py-3 before:inset-x-2 before:bottom-0 before:h-0.5'
                : [
                    'rounded-control py-2 pl-4 pr-3',
                    'before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2'
                  ],
              active
                ? 'font-medium text-foreground before:bg-pop'
                : cn(
                    'text-muted-foreground hover:text-foreground',
                    horizontal ? '' : 'hover:bg-sunken'
                  )
            )}
          >
            <Icon className={cn('size-4', active ? 'text-signal' : 'text-faint')} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
