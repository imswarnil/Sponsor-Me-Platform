import Link from 'next/link';
import { ArrowRight, Instagram } from 'lucide-react';
import { SponsorWall } from '@/components/marketing/sponsor-wall';
import { PointsNote } from '@/components/marketing/points-note';
import { EmbedSnippet } from '@/components/app/embed-snippet';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { expireStaleMembers, getActiveWallMembers } from '@/lib/proto/member-queries';
import { getSponsorTier, formatTierPrice } from '@/lib/ghost-members';
import { getViewer } from '@/lib/proto/roles';
import { site } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Members',
  description: 'Back the work for a fixed monthly amount and get a place on the sponsor wall.'
};

export default async function MembersPage() {
  await expireStaleMembers();
  const [members, tier, viewer] = await Promise.all([
    getActiveWallMembers(),
    getSponsorTier(),
    getViewer()
  ]);

  return (
    /* Header and footer come from app/(marketing)/layout.tsx — this page used
       to carry its own bar and no footer at all. */
    <div className="bg-grid">
      <div className="mx-auto max-w-narrow px-gutter py-16">
        <Eyebrow className="mb-4">Members</Eyebrow>
        <h1 className="text-balance font-display text-4xl font-bold tracking-tighter">
          Back the work, get a face on the wall
        </h1>
        <p className="mt-4 max-w-lead text-md text-muted-foreground">
          One fixed amount a month. You appear on the sponsor wall below — which {site.creator}{' '}
          embeds across these sites — with your photo, a line of your own, and a link to your
          Instagram. It also makes you a paid member on {site.ownerLabel}.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          {tier && tier.monthlyPrice != null ? (
            <>
              <Button asChild size="lg">
                <Link href="/members/join">
                  Become a member — {formatTierPrice(tier)}/mo <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="font-label text-2xs uppercase tracking-slate text-subtle">
                {tier.name} tier · cancel any time
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Membership pricing is unavailable right now — it is read live from the blog.
            </p>
          )}
        </div>

        <div className="mt-8">
          <PointsNote />
        </div>

        <section className="mt-16">
          <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
            {members.length > 0
              ? `${members.length} ${members.length === 1 ? 'member' : 'members'} right now`
              : 'The wall'}
          </h2>
          <div className="mt-6">
            <SponsorWall members={members} layout="full" />
          </div>
        </section>

        {/* What a member actually gets, stated plainly rather than sold. */}
        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Your face on every site',
              body: 'The wall is embedded across imswarnil.com and the project sites, so it is seen where the work is.'
            },
            {
              title: 'Your Instagram, one click away',
              body: 'Your avatar links straight to your handle — or anywhere else you would rather send people.'
            },
            {
              title: 'A paid membership on the blog',
              body: `Being a member here makes you a paid member on ${site.ownerLabel} for as long as you keep it up.`
            }
          ].map((c) => (
            <Card key={c.title}>
              <CardContent className="p-5">
                <p className="font-display font-semibold tracking-tight">{c.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* The creator's own copy of the embed code. Nobody else needs it, but
            hiding it behind the studio means opening two tabs to fetch it. */}
        {viewer?.role === 'creator' ? (
          <section className="mt-16">
            <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
              Embed this wall
            </h2>
            <p className="mt-2 max-w-lead text-sm text-muted-foreground">
              Drop this on any of your sites. <code className="font-mono">data-wall</code> takes{' '}
              <code className="font-mono">sidebar</code>, <code className="font-mono">inline</code>{' '}
              or <code className="font-mono">full</code>.
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
        ) : null}

        <section className="mt-16 border-t border-line-subtle pt-8">
          <p className="text-sm text-muted-foreground">
            Looking to advertise a product instead?{' '}
            <Link href="/placements" className="text-signal hover:underline">
              See the open placements
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
