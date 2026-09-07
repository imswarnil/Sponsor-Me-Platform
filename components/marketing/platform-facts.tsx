import { getCreatorId } from '@/lib/proto/roles';
import { getEarnings } from '@/lib/proto/queries';
import { countActiveMembers } from '@/lib/proto/member-queries';
import { getGitHubSponsors } from '@/lib/github-sponsors';

/**
 * The platform's own traction, in the same data voice the design system's
 * `.hero__facts` uses: tabular, small-caps, a hairline above it. Each figure
 * is independent — a slow or missing source just drops its own fact rather
 * than blanking the whole line (same rule as everywhere else: CLAUDE.md §4).
 */
export async function PlatformFacts() {
  const creatorId = await getCreatorId();
  const [earnings, memberCount, gh] = await Promise.all([
    creatorId ? getEarnings(creatorId) : Promise.resolve({ total: 0, sponsors: 0, deals: 0 }),
    countActiveMembers(),
    getGitHubSponsors()
  ]);

  const facts = [
    earnings.deals > 0
      ? { value: earnings.deals, label: earnings.deals === 1 ? 'placement run' : 'placements run' }
      : null,
    earnings.sponsors > 0
      ? { value: earnings.sponsors, label: earnings.sponsors === 1 ? 'sponsor so far' : 'sponsors so far' }
      : null,
    memberCount > 0
      ? { value: memberCount, label: memberCount === 1 ? 'member on the wall' : 'members on the wall' }
      : null,
    gh && gh.sponsorCount > 0 ? { value: gh.sponsorCount, label: 'GitHub sponsors' } : null
  ].filter((f): f is { value: number; label: string } => f !== null);

  if (facts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-line-subtle pt-6 font-label text-2xs uppercase tracking-slate text-faint">
      {facts.map((f) => (
        <span key={f.label} className="inline-flex items-baseline gap-2">
          <strong className="font-mono text-lg font-semibold normal-case tracking-normal text-foreground tabular-nums">
            {f.value.toLocaleString()}
          </strong>
          {f.label}
        </span>
      ))}
    </div>
  );
}
