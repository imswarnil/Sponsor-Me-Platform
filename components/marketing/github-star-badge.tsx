import { Star } from 'lucide-react';

const REPO = 'imswarnil/Sponsor-Me-Platform';

async function getStarCount(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}`, {
      next: { revalidate: 3600 }, // GitHub's unauthenticated rate limit is 60/hr
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

/** This project is open source — a quiet invite to star/fork it, not a growth gimmick. */
export async function GithubStarBadge() {
  const stars = await getStarCount();
  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
    >
      <Star className="size-3.5" />
      Star on GitHub{stars !== null ? ` · ${stars.toLocaleString()}` : ''}
    </a>
  );
}
