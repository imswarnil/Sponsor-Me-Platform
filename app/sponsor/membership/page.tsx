import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SponsorWall } from '@/components/marketing/sponsor-wall';
import { AmountPicker } from '@/components/marketing/amount-picker';
import { requireViewer } from '@/lib/proto/roles';
import {
  getMyMembership,
  getWallTotals,
  rankForAmount,
  rankOfMember
} from '@/lib/proto/member-queries';
import { updateMemberProfile, leaveWall, raiseBid } from '@/lib/proto/membership';
import { membership as cfg } from '@/lib/site';
import { formatAmount } from '@/lib/money';

export const metadata = { title: 'Your spot' };

const ERRORS: Record<string, string> = {
  invalid: 'Something in that form was not accepted — check the handle and links.',
  amount: 'A bid has to be a whole number.',
  notHigher: 'A new bid has to be higher than your current one — lowering is leaving and rebidding.',
  insufficient: 'The difference is more than your balance covers.'
};

export default async function MembershipPage({
  searchParams
}: {
  searchParams: Promise<{ ok?: string; left?: string; raised?: string; e?: string }>;
}) {
  const me = await requireViewer('/sponsor/membership');
  const sp = await searchParams;
  const [membership, totals] = await Promise.all([getMyMembership(me.id), getWallTotals()]);

  if (!membership || membership.status !== 'active') {
    return (
      <>
        <PageHeader
          title="Your spot"
          description="One bid, once, and a place on the sponsor wall for it — until someone bids more."
        />
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {membership
                ? 'You left the wall. Bidding again puts you straight back on it, at whatever amount you pick.'
                : 'You&rsquo;re not on the wall yet. Members are shown on every site I build — the highest bids sit at the top, and a spot is yours until someone bids more.'}
            </p>
            <Button asChild className="mt-5">
              <Link href="/members/join">
                {membership ? 'Bid again' : 'Bid for a spot'} — from {formatAmount(cfg.minPoints)}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const current = membership.pricePoints;
  const rank = (await rankOfMember(membership.id)) ?? totals.count;
  const isTop = rank === 1;

  // Suggestions for moving up: two steps above now, and whatever beats the
  // top — each with the place it would actually land, against the real wall.
  const candidates = Array.from(
    new Set(
      [current + 1000, current + 5000, totals.topAmount + 1000].filter(
        (a) => a > current && a <= cfg.maxPoints
      )
    )
  ).sort((a, b) => a - b);
  const ranks = await Promise.all(candidates.map((a) => rankForAmount(a, me.id)));
  const presets = candidates.map((amount, i) => ({ amount, rank: ranks[i] }));

  // The preview is this member alone, drawn as the public wall draws them.
  const preview = [
    {
      id: membership.id,
      displayName: membership.displayName,
      avatarUrl: membership.avatarUrl,
      instagramHandle: membership.instagramHandle,
      blurb: membership.blurb,
      linkUrl: membership.linkUrl,
      tierName: membership.tierName,
      amount: current,
      isSample: membership.isSample
    }
  ];

  return (
    <>
      <PageHeader title="Your spot" description="Where you are on the wall, and how to move up." />

      {sp.ok ? (
        <p className="mb-4 rounded-md bg-success-soft px-3 py-2 text-sm text-success">Saved.</p>
      ) : null}
      {sp.raised ? (
        <p className="mb-4 rounded-md bg-success-soft px-3 py-2 text-sm text-success">
          Moved up — you&rsquo;re now #{rank} at {formatAmount(current)}.
        </p>
      ) : null}
      {sp.left ? (
        <p className="mb-4 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
          You&rsquo;ve left the wall.
        </p>
      ) : null}
      {sp.e ? (
        <p className="mb-4 rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">
          {ERRORS[sp.e] ?? 'Something went wrong.'}
        </p>
      ) : null}

      {/* ── Where you are ────────────────────────────────────────────────── */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="font-label text-2xs uppercase tracking-slate text-subtle">Your place</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums tracking-tight">
              #{rank}
              <span className="font-label text-2xs font-normal uppercase tracking-slate text-faint">
                {' '}
                of {totals.count}
              </span>
            </p>
            {isTop ? (
              <Badge variant="pop" className="mt-2">
                1st · Top spot
              </Badge>
            ) : rank <= 3 ? (
              <Badge variant="outline" className="mt-2">
                On the podium
              </Badge>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-label text-2xs uppercase tracking-slate text-subtle">Your bid</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums tracking-tight">
              {formatAmount(current)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Yours until someone bids more.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-label text-2xs uppercase tracking-slate text-subtle">Top bid</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums tracking-tight">
              {formatAmount(totals.topAmount)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {isTop ? "That's you." : `${formatAmount(totals.topAmount - current + 1)} more takes it.`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Bid more ─────────────────────────────────────────────────────── */}
      {presets.length > 0 ? (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-display text-lg font-semibold tracking-tight">Bid more</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a higher bid. You pay the difference now, and that&rsquo;s your bid from here
              on. Only upward — lowering is leaving and bidding again.
            </p>
            <form action={raiseBid} className="mt-5 space-y-5">
              <AmountPicker
                presets={presets}
                min={current + 1}
                max={cfg.maxPoints}
                topAmount={totals.topAmount}
                defaultAmount={presets[0].amount}
              />
              <div className="border-t border-line-subtle pt-5">
                <SubmitButton pendingText="Bidding…">Raise my bid</SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Your card ────────────────────────────────────────────────────── */}
      <section className="mb-6">
        <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
          Your card, as the wall draws it
        </h2>
        <Card className="mt-3">
          <CardContent className="p-6">
            <div className="mx-auto max-w-xs">
              <SponsorWall members={preview} layout="full" />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="mb-6">
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
              <Input id="blurb" name="blurb" maxLength={80} defaultValue={membership.blurb ?? ''} />
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
              <Input id="linkUrl" name="linkUrl" type="url" defaultValue={membership.linkUrl ?? ''} />
            </div>
            <div className="border-t border-line-subtle pt-5">
              <SubmitButton pendingText="Saving…">Save</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <form action={leaveWall} className="text-right">
        <Button type="submit" size="sm" variant="ghost">
          Leave the wall
        </Button>
      </form>
    </>
  );
}
