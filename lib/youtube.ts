import 'server-only';

/**
 * YouTube channel stats, read-only — the same degrade-to-null contract as
 * lib/ghost.ts and lib/github-sponsors.ts: no key, a bad key, a quota error or
 * a network failure all render as "not connected", never a zero or a guess
 * (CLAUDE.md §4).
 *
 * Same two env var names as imswarnil.github.io's Worker (YOUTUBE_API_KEY +
 * YOUTUBE_CHANNEL), so a key already issued for that project works here too.
 */

export type YouTubeStats = { subscriberCount: number; viewCount: number; title: string };

const REVALIDATE_SECONDS = 3600;

export async function getYouTubeStats(): Promise<YouTubeStats | null> {
  const key = process.env.YOUTUBE_API_KEY;
  const channel = process.env.YOUTUBE_CHANNEL;
  if (!key || !channel) return null;

  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.searchParams.set('part', 'statistics,snippet');
    url.searchParams.set('id', channel);
    url.searchParams.set('key', key);

    const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      items?: { statistics?: { subscriberCount?: string; viewCount?: string }; snippet?: { title?: string } }[];
    };
    const item = data.items?.[0];
    if (!item) return null;

    return {
      subscriberCount: Number(item.statistics?.subscriberCount ?? 0),
      viewCount: Number(item.statistics?.viewCount ?? 0),
      title: item.snippet?.title ?? 'YouTube'
    };
  } catch {
    return null;
  }
}
