import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/badge';
import { joinAsMember } from '@/lib/proto/membership';
import { getSponsorTier, formatTierPrice } from '@/lib/ghost-members';
import { getViewer } from '@/lib/proto/roles';
import { getMyMembership } from '@/lib/proto/member-queries';
import { site } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Become a member' };

const ERRORS: Record<string, string> = {
  invalid: 'Something in that form was not accepted — check the handle and links.',
  insufficient: "That's more points than your balance covers.",
  unavailable: 'Membership pricing could not be read from the blog just now. Try again shortly.'
};

export default async function JoinPage({
  searchParams
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  const [viewer, tier] = await Promise.all([getViewer(), getSponsorTier()]);

  // Anyone may read /members; paying is where the account becomes necessary.
  if (!viewer) redirect('/login?next=/members/join');

  const existing = await getMyMembership(viewer.id);
  if (existing?.status === 'active') redirect('/sponsor/membership');

  return (
    /* Chrome from app/(marketing)/layout.tsx. */
    <div className="bg-grid">
      <div className="mx-auto max-w-prose px-gutter py-16">
        <Eyebrow className="mb-4">Membership</Eyebrow>
        <h1 className="text-balance font-display text-3xl font-bold tracking-tight">
          How you&rsquo;ll appear on the wall
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {tier && tier.monthlyPrice != null ? (
            <>
              {formatTierPrice(tier)} a month on the <strong>{tier.name}</strong> tier. It also
              makes you a paid member on {site.ownerLabel}. Cancel any time.
            </>
          ) : (
            'Membership pricing is read live from the blog and is unavailable right now.'
          )}
        </p>

        {e ? (
          <p className="mt-4 rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">
            {ERRORS[e] ?? 'Something went wrong.'}
          </p>
        ) : null}

        <Card className="mt-8">
          <CardContent className="p-6">
            <form action={joinAsMember} className="space-y-6">
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
                  Optional. Your avatar links here — clicking it opens your profile.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blurb">One line about you</Label>
                <Input id="blurb" name="blurb" maxLength={80} placeholder="Building things in public" />
                <p className="text-xs text-muted-foreground">
                  Optional, 80 characters. Shown under your name on the wall.
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
                      Leave blank and your blog avatar is used, or your initials.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkUrl">Link instead of Instagram</Label>
                    <Input id="linkUrl" name="linkUrl" type="url" placeholder="https://yoursite.com" />
                  </div>
                </div>
              </details>

              <div className="flex items-center gap-3 border-t border-line-subtle pt-5">
                <SubmitButton pendingText="Joining…">
                  {tier && tier.monthlyPrice != null
                    ? `Join — ${Math.round(tier.monthlyPrice / 100)} pts`
                    : 'Join'}
                </SubmitButton>
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
