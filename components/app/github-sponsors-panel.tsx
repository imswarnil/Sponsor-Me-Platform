import { Github, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getGitHubSponsors } from '@/lib/github-sponsors';

/**
 * GitHub Sponsors, as seen from the studio.
 *
 * Deliberately thin: GitHub owns this relationship — the tiers, the money and
 * the sponsor list all live there, and duplicating them here would just be a
 * second copy to go stale. This is a pointer plus the one number worth seeing
 * next to the on-platform placements.
 *
 * Renders nothing when the listing can't be read, same as the public component.
 */
export async function GitHubSponsorsPanel() {
  const listing = await getGitHubSponsors();
  if (!listing) return null;

  return (
    <section className="mt-10">
      <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">GitHub Sponsors</h2>
      <Card className="mt-3">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-md bg-pop/12 text-signal">
              <Github className="size-4" />
            </span>
            <div>
              <p className="font-display font-semibold tracking-tight">
                {listing.sponsorCount === 0
                  ? 'No sponsors yet'
                  : `${listing.sponsorCount} ${listing.sponsorCount === 1 ? 'sponsor' : 'sponsors'}`}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {listing.tiers.length === 0
                  ? 'No tiers set up yet — nobody can sponsor until there is at least one.'
                  : `${listing.tiers.length} ${listing.tiers.length === 1 ? 'tier' : 'tiers'} live on github.com/sponsors/${listing.login}`}
              </p>
            </div>
          </div>
          <a
            href={listing.sponsorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-label text-2xs uppercase tracking-slate text-subtle hover:text-foreground"
          >
            Manage on GitHub <ExternalLink className="size-3" />
          </a>
        </CardContent>
      </Card>
    </section>
  );
}
