import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmbedSnippet } from '@/components/app/embed-snippet';
import { SponsorWall } from '@/components/marketing/sponsor-wall';
import { requireCreator } from '@/lib/proto/roles';
import { getAllMembers, getActiveWallMembers, getWallTotals } from '@/lib/proto/member-queries';
import { formatAmount } from '@/lib/money';

export const metadata = { title: 'Members' };

export default async function StudioMembersPage() {
  await requireCreator('/studio/members');
  const [rows, wall, totals] = await Promise.all([
    getAllMembers(),
    getActiveWallMembers(),
    getWallTotals()
  ]);

  return (
    <>
      <PageHeader
        title="Members"
        description="People who bid for a spot on the wall. Highest bid first; a spot holds until someone bids more."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-2xl font-bold tabular-nums tracking-tight">
              {totals.count}
            </p>
            <p className="mt-1 font-label text-2xs uppercase tracking-slate text-subtle">
              On the wall
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-2xl font-bold tabular-nums tracking-tight">
              {formatAmount(totals.total)}
            </p>
            <p className="mt-1 font-label text-2xs uppercase tracking-slate text-subtle">
              Bid, together
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-2xl font-bold tabular-nums tracking-tight">
              {totals.topAmount > 0 ? formatAmount(totals.topAmount) : '—'}
            </p>
            <p className="mt-1 font-label text-2xs uppercase tracking-slate text-subtle">
              Top bid
            </p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
          Embed the wall
        </h2>
        <p className="mt-2 max-w-lead text-sm text-muted-foreground">
          The same wall in three shapes, same order everywhere. Paste onto any of your sites — it
          needs nothing else.
        </p>
        <div className="mt-4 space-y-3">
          <EmbedSnippet
            label="Inline band"
            code={'<script src="__ORIGIN__/wall.js" data-wall="inline" async></script>'}
          />
          <EmbedSnippet
            label="Sidebar column"
            code={
              '<script src="__ORIGIN__/wall.js" data-wall="sidebar" data-heading="Sponsors" async></script>'
            }
          />
          <EmbedSnippet
            label="Full grid"
            code={'<script src="__ORIGIN__/wall.js" data-wall="full" async></script>'}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
          What it looks like
        </h2>
        <Card className="mt-3">
          <CardContent className="p-6">
            <SponsorWall members={wall} layout="inline" />
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
          Everyone, in wall order
        </h2>
        {rows.length === 0 ? (
          <Card className="mt-3">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              Nobody yet.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-3 space-y-2">
            {rows.map(({ member, profile }, i) => (
              <Card key={member.id}>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <span className="w-7 shrink-0 font-label text-2xs tabular-nums text-faint">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {member.displayName}
                      {member.isSample ? (
                        <span className="ml-2 font-label text-2xs uppercase tracking-slate text-faint">
                          sample
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {profile.email}
                      {member.instagramHandle ? ` · @${member.instagramHandle}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatAmount(member.pricePoints)}
                    </span>
                    <span className="font-label text-2xs uppercase tracking-slate text-subtle">
                      bid{' '}
                      {member.startedAt.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <Badge variant={member.status === 'active' ? 'success' : 'default'}>
                      {member.status === 'active' ? 'on the wall' : 'left'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
