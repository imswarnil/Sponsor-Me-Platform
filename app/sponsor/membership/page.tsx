import Link from 'next/link';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SponsorWall } from '@/components/marketing/sponsor-wall';
import { requireViewer } from '@/lib/proto/roles';
import { getMyMembership } from '@/lib/proto/member-queries';
import { updateMemberProfile, cancelMembership } from '@/lib/proto/membership';
import { getSponsorTier, formatTierPrice } from '@/lib/ghost-members';
import { site } from '@/lib/site';

export const metadata = { title: 'Membership' };

export default async function MembershipPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; cancelled?: string; e?: string }>;
}) {
  const me = await requireViewer('/sponsor/membership');
  const sp = await searchParams;
  const [membership, tier] = await Promise.all([getMyMembership(me.id), getSponsorTier()]);

  if (!membership || membership.status !== 'active') {
    return (
      <>
        <PageHeader
          title="Membership"
          description="Back the work for a fixed amount and get a place on the sponsor wall."
        />
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {membership
                ? 'Your membership has lapsed. Rejoining puts you straight back on the wall.'
                : `You're not a member yet. Members appear on the sponsor wall and become paid members on ${site.ownerLabel}.`}
            </p>
            <Button asChild className="mt-5">
              <Link href="/members/join">
                {membership ? 'Rejoin' : 'Become a member'}
                {tier && tier.monthlyPrice != null ? ` — ${formatTierPrice(tier)}/mo` : ''}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  // The preview is this member alone, so they see their own card exactly as the
  // public wall draws it rather than a description of it.
  const preview = [
    {
      id: membership.id,
      displayName: membership.displayName,
      avatarUrl: membership.avatarUrl,
      instagramHandle: membership.instagramHandle,
      blurb: membership.blurb,
      linkUrl: membership.linkUrl,
      tierName: membership.tierName
    }
  ];

  return (
    <>
      <PageHeader title="Membership" description="How you appear on the sponsor wall." />

      {sp.ok ? (
        <p className="mb-4 rounded-md bg-success-soft px-3 py-2 text-sm text-success">Saved.</p>
      ) : null}
      {sp.cancelled ? (
        <p className="mb-4 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
          Membership cancelled.
        </p>
      ) : null}

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display font-semibold tracking-tight">{membership.tierName}</p>
              <Badge variant="success">active</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {membership.pricePoints} pts a month · renews{' '}
              {membership.renewsAt.toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <form action={cancelMembership}>
            <Button type="submit" size="sm" variant="ghost">
              Cancel membership
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="mb-8">
        <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
          Your card on the wall
        </h2>
        <Card className="mt-3">
          <CardContent className="p-6">
            <SponsorWall members={preview} layout="full" />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="p-6">
          <form action={updateMemberProfile} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName">Name</Label>
              <Input
                id="displayName"
                name="displayName"
                required
                maxLength={60}
                defaultValue={membership.displayName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagramHandle">Instagram handle</Label>
              <Input
                id="instagramHandle"
                name="instagramHandle"
                maxLength={31}
                defaultValue={membership.instagramHandle ? `@${membership.instagramHandle}` : ''}
                placeholder="@yourhandle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blurb">One line about you</Label>
              <Input
                id="blurb"
                name="blurb"
                maxLength={80}
                defaultValue={membership.blurb ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Photo URL</Label>
              <Input
                id="avatarUrl"
                name="avatarUrl"
                type="url"
                defaultValue={membership.avatarUrl ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkUrl">Link instead of Instagram</Label>
              <Input
                id="linkUrl"
                name="linkUrl"
                type="url"
                defaultValue={membership.linkUrl ?? ''}
              />
            </div>
            <div className="border-t border-line-subtle pt-5">
              <SubmitButton pendingText="Saving…">Save</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
