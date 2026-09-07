import { getGhostMembersList } from '@/lib/ghost';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

const STATUS_LABEL: Record<string, string> = { free: 'Free', paid: 'Paid', comped: 'Comped' };

/**
 * GHOST MEMBERS WIDGET
 * ====================
 *
 * A standalone module, separate from the sponsor wall (components/marketing/
 * sponsor-wall.tsx): the wall shows people who opted into public display by
 * paying for it; this shows the creator's own raw Ghost newsletter list —
 * everyone who ever subscribed, paid or free. Admin-only by design (see
 * lib/ghost.ts) — never drop this into a page a signed-out visitor can reach.
 */
export async function GhostMembersWidget({ limit = 50 }: { limit?: number }) {
  const members = await getGhostMembersList(limit);

  if (members === null) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Ghost isn't connected — set <code className="font-mono">GHOST_API_URL</code> and{' '}
          <code className="font-mono">GHOST_ADMIN_API_KEY</code> to see your newsletter members
          here.
        </CardContent>
      </Card>
    );
  }

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          No members on {process.env.GHOST_API_URL ?? 'the blog'} yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border">
      <ul className="divide-y divide-line-subtle">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 p-4">
            {m.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.avatarUrl}
                alt=""
                className="size-9 shrink-0 rounded-full border border-line-subtle object-cover"
              />
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line-subtle bg-pop-soft font-label text-xs font-semibold text-pop-soft-foreground">
                {initialsOf(m.name || m.email)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{m.name || m.email}</p>
              <p className="truncate text-xs text-muted-foreground">{m.email}</p>
            </div>
            <Badge
              variant={m.status === 'free' ? 'outline' : m.status === 'paid' ? 'success' : 'pop'}
            >
              {STATUS_LABEL[m.status] ?? m.status}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
