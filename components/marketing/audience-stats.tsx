import { FileText, Users, Youtube, Instagram } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getGhostAdminStats } from '@/lib/ghost';

/** What an advertiser actually cares about: real numbers where they exist, an honest
 *  "not connected yet" where they don't. Never an invented figure — see CLAUDE.md §4. */
export async function AudienceStats() {
  const ghost = await getGhostAdminStats();

  const tiles = [
    ghost
      ? { icon: FileText, label: 'Blog posts', value: ghost.postCount.toLocaleString(), live: true }
      : { icon: FileText, label: 'Blog', value: 'Not connected', live: false },
    ghost
      ? { icon: Users, label: 'Newsletter subscribers', value: ghost.memberCount.toLocaleString(), live: true }
      : { icon: Users, label: 'Newsletter', value: 'Not connected', live: false },
    { icon: Youtube, label: 'YouTube', value: 'Connect to show real numbers', live: false },
    { icon: Instagram, label: 'Instagram', value: 'Connect to show real numbers', live: false }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardContent className="p-5">
            <span className="grid size-8 place-items-center rounded-md bg-pop/12 text-signal">
              <t.icon className="size-4" />
            </span>
            <p
              className={
                t.live
                  ? 'mt-3 font-display text-2xl font-bold tracking-tight'
                  : 'mt-3 text-sm text-muted-foreground'
              }
            >
              {t.value}
            </p>
            <p className="mt-1 font-label text-2xs uppercase tracking-slate text-subtle">
              {t.label}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
