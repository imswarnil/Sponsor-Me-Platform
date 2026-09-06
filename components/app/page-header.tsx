import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      {breadcrumb ? (
        <nav className="mb-3 flex items-center gap-1.5 font-label text-2xs uppercase tracking-slate text-subtle">
          {breadcrumb.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 ? <ChevronRight className="size-3 text-faint" /> : null}
              {c.href ? (
                <Link href={c.href} className="transition-colors hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-lead text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {/* The 2px rule under a page title is the system's own full stop. */}
      <hr className="mt-5 h-px border-0 bg-border" />
    </div>
  );
}
