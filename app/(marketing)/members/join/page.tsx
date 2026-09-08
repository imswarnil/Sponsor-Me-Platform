import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/badge';
import { AmountPicker } from '@/components/marketing/amount-picker';
import { joinAsMember } from '@/lib/proto/membership';
import { getViewer } from '@/lib/proto/roles';
import { getMyMembership, getWallTotals, rankForAmount } from '@/lib/proto/member-queries';
import { membership } from '@/lib/site';
import { formatAmount } from '@/lib/money';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bid for a spot' };

const ERRORS: Record<string, string> = {
  invalid: 'Something in that form was not accepted — check the handle and links.',
  amount: `A bid has to be a whole number from ${formatAmount(membership.minPoints)} up.`,
  insufficient: "That's more than your balance covers."
};

export default async function JoinPage({
  searchParams
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  const viewer = await getViewer();

  // Anyone may read /members; paying is where the account becomes necessary.
  if (!viewer) redirect('/login?next=/members/join');

  const existing = await getMyMembership(viewer.id);
  if (existing?.status === 'active') redirect('/sponsor/membership');

  // Where each preset would land, against the wall as it is right now.
  const [totals, ...ranks] = await Promise.all([
    getWallTotals(),
    ...membership.presets.map((a) => rankForAmount(a))
  ]);
  const presets = membership.presets.map((amount, i) => ({ amount, rank: ranks[i] }));

  return (
    /* Chrome from app/(marketing)/layout.tsx. */
    <div className="bg-grid">
      <div className="mx-auto max-w-prose px-gutter py-16">
        <Eyebrow className="mb-4">Bid for a spot</Eyebrow>
        <h1 className="text-balance font-display text-3xl font-bold tracking-tight">
          Pick your bid. Pick how you look.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          One bid, once. The wall is ordered by it — the higher the bid, the higher and bigger your
          spot, on every site I build. It&rsquo;s yours until someone bids more; bid more yourself
          any time to move up.
        </p>

        {e ? (
          <p className="mt-4 rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">
            {ERRORS[e] ?? 'Something went wrong.'}
          </p>
        ) : null}

        <Card className="mt-8">
          <CardContent className="p-6">
            <form action={joinAsMember} className="space-y-8">
              <fieldset className="space-y-3">
                <legend className="font-label text-2xs uppercase tracking-slate text-subtle">
                  Your bid
                </legend>
                <AmountPicker
                  presets={presets}
                  min={membership.minPoints}
                  max={membership.maxPoints}
                  topAmount={totals.topAmount}
                  defaultAmount={membership.presets[0]}
                />
              </fieldset>

              <div className="space-y-6 border-t border-line-subtle pt-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Name on the wall</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    required
                    maxLength={60}
                    defaultValue={viewer.name ?? ''}
                    placeholder="Your name or your brand"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagramHandle">Instagram handle</Label>
                  <Input
                    id="instagramHandle"
                    name="instagramHandle"
                    maxLength={31}
                    placeholder="@yourhandle"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional. Your card links here — clicking it opens your profile.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blurb">One line about you</Label>
                  <Input
                    id="blurb"
                    name="blurb"
                    maxLength={80}
                    placeholder="Building things in public"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional, 80 characters. Shown under your name.
                  </p>
                </div>

                <details className="group rounded-control border border-line-subtle">
                  <summary className="cursor-pointer list-none px-4 py-3 font-label text-2xs uppercase tracking-slate text-subtle">
                    More options
                  </summary>
                  <div className="space-y-6 border-t border-line-subtle p-4">
                    <div className="space-y-2">
                      <Label htmlFor="avatarUrl">Photo URL</Label>
                      <Input
                        id="avatarUrl"
                        name="avatarUrl"
                        type="url"
                        placeholder="https://…/you.jpg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank and your initials are used.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkUrl">Link instead of Instagram</Label>
                      <Input
                        id="linkUrl"
                        name="linkUrl"
                        type="url"
                        placeholder="https://yoursite.com"
                      />
                    </div>
                  </div>
                </details>
              </div>

              <div className="flex items-center gap-3 border-t border-line-subtle pt-5">
                <SubmitButton pendingText="Placing your bid…">Place my bid</SubmitButton>
                <Link href="/members" className="text-sm text-muted-foreground hover:text-foreground">
                  Cancel
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
