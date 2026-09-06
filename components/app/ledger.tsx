import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type LedgerRow = {
  id: string;
  /** True when points came in, false when they went out. */
  earned: boolean;
  amount: number;
  /** The other party's display name. */
  counterparty: string;
  /** What the movement was for — usually a placement name. */
  subject?: string | null;
  at: Date;
};

/** Every points movement, in or out. Shared by the studio and the sponsor side. */
export function Ledger({ rows, empty }: { rows: LedgerRow[]; empty: string }) {
  return (
    <Card>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-full',
                      r.earned ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {r.earned ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {r.subject ?? (r.earned ? 'Payment received' : 'Payment sent')}
                    </p>
                    <p className="truncate font-mono text-2xs uppercase tracking-slate text-subtle">
                      {r.earned ? 'from' : 'to'} {r.counterparty} ·{' '}
                      {new Date(r.at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'shrink-0 font-display font-bold tabular-nums',
                    r.earned ? 'text-success' : 'text-muted-foreground'
                  )}
                >
                  {r.earned ? '+' : '−'}
                  {r.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
