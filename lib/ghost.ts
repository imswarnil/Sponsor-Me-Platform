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

export type GhostMember = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  status: 'free' | 'paid' | 'comped';
  createdAt: string;
};

/**
 * The raw Ghost newsletter member list — names, emails, subscription status.
 *
 * Admin-only data: never render this on a public page. Real subscribers never
 * agreed to have their email shown to visitors just for signing up for a
 * newsletter — that consent only exists for people who chose to appear on the
 * sponsor wall (a members.ts row, not this). This is for /studio's own use,
 * the same way the creator would read it in the Ghost admin itself.
 */
export async function getGhostMembersList(limit = 100): Promise<GhostMember[] | null> {
  const baseUrl = process.env.GHOST_API_URL;
  if (!baseUrl) return null;

  try {
    const token = await ghostAdminToken();
    if (!token) return null;
    const headers = { Authorization: `Ghost ${token}`, 'Accept-Version': 'v5.0' };

    const res = await fetch(
      `${baseUrl}/ghost/api/admin/members/?limit=${limit}&order=created_at%20desc`,
      { headers, next: { revalidate: 300 } }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      members?: {
        id: string;
        name: string | null;
        email: string;
        avatar_image: string | null;
        status: 'free' | 'paid' | 'comped';
        created_at: string;
      }[];
    };

    return (data.members ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatarUrl: m.avatar_image,
      status: m.status,
      createdAt: m.created_at
    }));
  } catch {
    return null;
  }
}
