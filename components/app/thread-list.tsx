import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Thread } from '@/lib/proto/schema';

const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** Shared list of message threads — used by both /studio/messages and /sponsor/messages,
 *  which differ only in whose name is shown as "the other party" and the base href. */
export function ThreadList({
  threads,
  otherPartyName,
  basePath,
  empty
}: {
  threads: Thread[];
  otherPartyName: (thread: Thread) => string;
  basePath: string;
  empty: string;
}) {
  if (threads.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">{empty}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((t) => (
        <Link key={t.id} href={`${basePath}/${t.id}`}>
          <Card className="transition-colors hover:border-line-strong">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="truncate font-display font-semibold tracking-tight">{t.subject}</p>
                <p className="mt-1 text-sm text-muted-foreground">{otherPartyName(t)}</p>
              </div>
              <div className="flex items-center gap-2">
                {t.status === 'archived' ? <Badge variant="outline">Archived</Badge> : null}
                {t.type === 'request' ? <Badge variant="craft">Request</Badge> : null}
                <span className="font-label text-2xs uppercase tracking-slate text-subtle">
                  {fmtDate(t.lastMessageAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
