import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmbedSnippet } from '@/components/app/embed-snippet';
import { SponsorWall } from '@/components/marketing/sponsor-wall';
import { requireCreator } from '@/lib/proto/roles';
import {
  expireStaleMembers,
  getAllMembers,
  getActiveWallMembers
} from '@/lib/proto/member-queries';
import { getSponsorTier, formatTierPrice } from '@/lib/ghost-members';

export const metadata = { title: 'Members' };

export default async function StudioMembersPage() {
  await requireCreator('/studio/members');
  await expireStaleMembers();
  const [rows, wall, tier] = await Promise.all([
    getAllMembers(),
    getActiveWallMembers(),
    getSponsorTier()
  ]);

  const active = rows.filter((r) => r.member.status === 'active');

  return (
    <>
      <PageHeader
        title="Members"
        description="People backing the work for a fixed amount. Each one is a comped member on the blog too."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-2xl font-bold tracking-tight">{active.length}</p>
            <p className="mt-1 font-label text-2xs uppercase tracking-slate text-subtle">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-2xl font-bold tracking-tight">
              {active.reduce((n, r) => n + r.member.pricePoints, 0)}
            </p>
            <p className="mt-1 font-label text-2xs uppercase tracking-slate text-subtle">
              Points / month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-2xl font-bold tracking-tight">
              {tier ? formatTierPrice(tier) : '—'}
            </p>
            <p className="mt-1 font-label text-2xs uppercase tracking-slate text-subtle">
              {tier ? `${tier.name} tier` : 'Ghost unreachable'}
            </p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
          Embed the wall
        </h2>
        <p className="mt-2 max-w-lead text-sm text-muted-foreground">
          The same wall in three shapes. Paste onto any of your sites — it needs nothing else.
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
        <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">Everyone</h2>
        {rows.length === 0 ? (
          <Card className="mt-3">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No members yet.
            </CardContent>
          </Card>
        ) : (
          <div className="mt-3 space-y-2">
            {rows.map(({ member, profile }) => (
              <Card key={member.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{member.displayName}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {profile.email}
                      {member.instagramHandle ? ` · @${member.instagramHandle}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-label text-2xs uppercase tracking-slate text-subtle">
                      {member.pricePoints} pts · renews{' '}
                      {member.renewsAt.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <Badge variant={member.status === 'active' ? 'success' : 'default'}>
                      {member.status}
                    </Badge>
                    {member.ghostMemberId ? (
                      <Badge variant="info">on ghost</Badge>
                    ) : (
                      <Badge variant="warning">not synced</Badge>
                    )}
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
