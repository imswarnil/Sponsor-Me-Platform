import { Youtube, Newspaper, PenLine, Instagram, Users, FileText } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { SubmitButton } from '@/components/ui/submit-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { requireCreator } from '@/lib/proto/roles';
import { getChannelConnections } from '@/lib/proto/queries';
import { addChannelConnection } from '@/lib/proto/actions';
import { getGhostAdminStats } from '@/lib/ghost';

export const metadata = { title: 'Channels' };

const PROVIDERS = [
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'ghost', label: 'Ghost (blog)', icon: Newspaper },
  { key: 'blog', label: 'Blog / RSS', icon: PenLine },
  { key: 'instagram', label: 'Instagram', icon: Instagram }
] as const;

export default async function ChannelsPage({
  searchParams
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const me = await requireCreator('/studio/channels');
  const { e } = await searchParams;
  const [connections, ghost] = await Promise.all([
    getChannelConnections(me.id),
    getGhostAdminStats()
  ]);

  return (
    <>
      <PageHeader
        title="Channels"
        description="Put your brand in front of my audience — real numbers show up here as each channel connects."
        breadcrumb={[{ label: 'Studio', href: '/studio' }, { label: 'Channels' }]}
      />

      {e ? (
        <p className="mb-6 rounded-control bg-destructive-soft px-3 py-2 text-sm text-destructive">
          Give it a name and pick a provider.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {PROVIDERS.map((p) => {
          const Icon = p.icon;

          if (p.key === 'ghost' && ghost) {
            return (
              <Card key={p.key} className="border-success-line/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-md bg-pop/12 text-signal">
                        <Icon className="size-4" />
                      </span>
                      <p className="font-display font-semibold tracking-tight">{ghost.title}</p>
                    </div>
                    <Badge variant="live">Live</Badge>
                  </div>
                  <div className="mt-4 flex gap-5 font-label text-2xs uppercase tracking-slate text-subtle">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="size-3.5" /> {ghost.postCount.toLocaleString()} posts
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" /> {ghost.memberCount.toLocaleString()} subscribers
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          }

          const existing = connections.filter((c) => c.provider === p.key);
          return (
            <Card key={p.key}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-md bg-pop/12 text-signal">
                    <Icon className="size-4" />
                  </span>
                  <p className="font-display font-semibold tracking-tight">{p.label}</p>
                </div>
                {existing.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Not connected yet — coming soon.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {existing.map((c) => (
                      <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate">{c.label}</span>
                        <Badge variant="outline">Awaiting API integration</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="mb-4 font-label text-2xs uppercase tracking-slate text-subtle">
            Name a channel
          </h2>
          <form action={addChannelConnection} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="provider">Provider</Label>
              <select
                id="provider"
                name="provider"
                className="flex h-control-md rounded-control border border-input bg-sunken px-3 text-sm"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="label">Label</Label>
              <Input id="label" name="label" placeholder="e.g. My travel channel" required maxLength={80} />
            </div>
            <SubmitButton pendingText="Adding…">Add</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
