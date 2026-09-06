import { Github, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getGitHubSponsors } from '@/lib/github-sponsors';

/**
 * The recurring, no-negotiation way to sponsor: GitHub Sponsors.
 *
 * Renders nothing at all when the listing can't be read (no token, GitHub down,
 * listing private) — see lib/github-sponsors.ts. Every number here comes off the
 * API; there is no placeholder tier and no example sponsor.
 */
export async function GitHubSponsors() {
  const listing = await getGitHubSponsors();
  if (!listing) return null;

  const { tiers, sponsors, sponsorCount, goal } = listing;

  return (
    <Card>
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="grid size-8 place-items-center rounded-md bg-pop/12 text-signal">
              <Github className="size-4" />
            </span>
            <h3 className="mt-3 font-display text-xl font-bold tracking-tight">
              Sponsor me on GitHub
            </h3>
            <p className="mt-2 max-w-lead text-sm text-muted-foreground">
              {listing.shortDescription ??
                'A recurring way to back the open-source half of this work — no brief, no dates, no ad to design.'}
            </p>
          </div>
          <Button asChild>
            <a href={listing.sponsorUrl} target="_blank" rel="noopener noreferrer">
              <Heart className="size-4" /> Sponsor
            </a>
          </Button>
        </div>

        {/* A goal only exists if it has been set — never a fabricated target. */}
        {goal ? (
          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm">{goal.title}</p>
              <p className="font-label text-2xs uppercase tracking-slate text-subtle">
                {goal.percentComplete}%
              </p>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-pill bg-sunken"
              role="progressbar"
              aria-valuenow={goal.percentComplete}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={goal.title}
            >
              <div className="h-full bg-pop" style={{ width: `${goal.percentComplete}%` }} />
            </div>
          </div>
        ) : null}

        {tiers.length > 0 ? (
          <div className="mt-6">
            <h4 className="font-label text-2xs uppercase tracking-slate text-subtle">Tiers</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tiers.map((tier) => (
                <a
                  key={tier.name}
                  href={listing.sponsorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-control border border-line-subtle bg-surface p-4 transition-colors hover:border-line-strong"
                >
                  <p className="font-display font-semibold tracking-tight">
                    ${tier.monthlyPriceInDollars}
                    <span className="text-sm font-normal text-muted-foreground">
                      {tier.isOneTime ? ' once' : ' / month'}
                    </span>
                  </p>
                  <p className="mt-1 text-sm">{tier.name}</p>
                  {tier.description ? (
                    <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                      {tier.description}
                    </p>
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {/* Public sponsors only — private ones come back unnamed and stay that way. */}
        {sponsors.length > 0 ? (
          <div className="mt-6">
            <h4 className="font-label text-2xs uppercase tracking-slate text-subtle">
              Current sponsors
              <Badge variant="outline" className="ml-2">
                {sponsorCount}
              </Badge>
            </h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {sponsors.map((s) => (
                <a
                  key={s.login}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-control border border-line-subtle bg-surface px-3 py-2 text-sm hover:border-line-strong"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.avatarUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 rounded-full object-cover"
                  />
                  <span className="text-muted-foreground">{s.name ?? s.login}</span>
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
