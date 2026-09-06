import { cn } from '@/lib/utils';

/**
 * One number, labelled. Display face, tabular figures, tight tracking — the
 * `.t-stat` role from the design system, expressed in Tailwind so the number
 * never reflows when the value changes width.
 */
export function StatTile({
  label,
  value,
  sub,
  className
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-card border border-border bg-card p-5', className)}>
      <p className="font-label text-2xs uppercase tracking-slate text-subtle">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tighter tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
