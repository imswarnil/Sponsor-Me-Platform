import { cn } from '@/lib/utils';

/**
 * A placeholder block for content that is still on its way.
 *
 * Deliberately the sunken surface with a pulse rather than a shimmering
 * gradient: the design system has one accent and no decorative gradients
 * (CLAUDE.md §4), and a skeleton that draws the eye harder than the real
 * content it stands in for is a strange thing to build. Stops pulsing under
 * prefers-reduced-motion via Tailwind's own `motion-reduce` variant.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-control bg-sunken motion-reduce:animate-none', className)}
      {...props}
    />
  );
}
