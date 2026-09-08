import 'server-only';
import { SignJWT } from 'jose';

/**
 * Ghost Admin API auth: a 5-minute HS256 JWT signed with the key's secret half,
 * `kid` set to the key's id half. Ghost's own SDK (`@tryghost/admin-api`) does the same
 * thing under the hood — this avoids adding a dependency, since `jose` covers HS256
 * signing on its own. (`jose` is here for this and nothing else.)
 */
async function ghostAdminToken(): Promise<string | null> {
  const key = process.env.GHOST_ADMIN_API_KEY;
  if (!key || !key.includes(':')) return null;
  const [id, secret] = key.split(':');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256', kid: id })
    .setIssuedAt()
    .setExpirationTime('5m')
    .setAudience('/admin/')
    .sign(Buffer.from(secret, 'hex'));
}

export type GhostStats = { title: string; postCount: number; memberCount: number };

/**
 * Live post/member counts from the creator's own Ghost instance. Returns null on any
 * failure (missing keys, network error, API shape change) — a stats card degrading to
 * "not connected" is fine; a page render throwing is not.
 */
export async function getGhostAdminStats(): Promise<GhostStats | null> {
  const baseUrl = process.env.GHOST_API_URL;
  if (!baseUrl) return null;

  try {
    const token = await ghostAdminToken();
    if (!token) return null;
    const headers = { Authorization: `Ghost ${token}`, 'Accept-Version': 'v5.0' };

    // Revalidated every 5 minutes rather than fetched live on every request — three
    // sequential-feeling Ghost API round trips otherwise add real latency to page loads.
    const cacheOpt = { next: { revalidate: 300 } } as const;
    const [siteRes, postsRes, membersRes] = await Promise.all([
      fetch(`${baseUrl}/ghost/api/admin/site/`, { headers, ...cacheOpt }),
      fetch(`${baseUrl}/ghost/api/admin/posts/?limit=1&filter=status:published`, {
        headers,
        ...cacheOpt
      }),
      fetch(`${baseUrl}/ghost/api/admin/members/?limit=1`, { headers, ...cacheOpt })
    ]);
    if (!siteRes.ok || !postsRes.ok || !membersRes.ok) return null;

    const [site, posts, members] = await Promise.all([
      siteRes.json(),
      postsRes.json(),
      membersRes.json()
    ]);

    return {
      title: site?.site?.title ?? 'Ghost',
      postCount: posts?.meta?.pagination?.total ?? 0,
      memberCount: members?.meta?.pagination?.total ?? 0
    };
  } catch {
    return null;
  }
}

/*
 * That is the whole file on purpose. Ghost is read here for two numbers an
 * advertiser cares about — how many posts, how many subscribers — and nothing
 * else: no member list, no tier, no mirroring. Membership on this site is this
 * site's own (CLAUDE.md §0); Ghost is an independent platform it does not
 * write to and does not depend on.
 */
