'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Megaphone, Users } from 'lucide-react';
import { marketingNav } from '@/lib/site';
import { cn } from '@/lib/utils';

/* One icon per destination, matching what that door already uses elsewhere
   (two-doors.tsx: Megaphone for brands, Users for readers) so the same
   concept never wears two different icons on one page. */
const NAV_ICON = {
  '/placements': Megaphone,
  '/members': Users,
  '/how-it-works': Compass
} as const;

/**
 * House rule: active is a dot, never a filled pill — and the state lives in
 * `aria-current`, so the stylesheet and the accessibility tree can never
 * disagree with each other. The icon follows the DS's own nav convention
 * (33-nav.css): faint by default, currentcolor on hover/current, so it never
 * needs its own color logic.
 */
export function MarketingNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn('items-center gap-1', className)}>
      {marketingNav.map((item) => {
        // An in-page anchor is never "the current page" — it's a jump.
        const current = !item.href.includes('#') && pathname === item.href;
        const Icon = NAV_ICON[item.href as keyof typeof NAV_ICON];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-1.5 rounded-control px-3 py-2 text-sm text-muted-foreground',
              'transition-colors duration-200 ease-out hover:text-foreground',
              'aria-[current=page]:text-foreground aria-[current=page]:font-medium',
              'aria-[current=page]:before:absolute aria-[current=page]:before:bottom-0.5',
              'aria-[current=page]:before:left-1/2 aria-[current=page]:before:size-1.5',
              'aria-[current=page]:before:-translate-x-1/2 aria-[current=page]:before:rounded-full',
              'aria-[current=page]:before:bg-pop aria-[current=page]:before:content-[""]'
            )}
          >
            {Icon ? (
              <Icon className="size-4 flex-none text-faint transition-colors group-hover:text-current group-aria-[current=page]:text-current" />
            ) : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
