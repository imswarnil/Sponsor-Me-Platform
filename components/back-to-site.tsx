import { ArrowUpRight } from 'lucide-react';
import { SwarnilWordmark } from '@/components/logo';
import { site } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * The way back to the main site. Carries the personal wordmark rather than a
 * label, so the relationship reads instantly: this platform belongs to that
 * person. Same record-light tittle, same display face — one identity.
 */
export function BackToSite({ className, label = false }: { className?: string; label?: boolean }) {
  return (
    <a
      href={site.owner}
      className={cn(
        'group inline-flex h-control-sm items-center gap-2 rounded-control border border-border bg-surface px-3',
        'text-sm text-muted-foreground transition-[color,border-color,background-color] duration-200 ease-out',
        'hover:border-line-strong hover:bg-sunken hover:text-foreground',
        className
      )}
    >
      <SwarnilWordmark size="xs" />
      {label ? <span className="hidden font-mono text-2xs uppercase tracking-slate sm:inline">.com</span> : null}
      <ArrowUpRight className="size-3.5 text-faint transition-transform duration-200 ease-out group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-signal" />
      <span className="sr-only">Back to imswarnil.com</span>
    </a>
  );
}
