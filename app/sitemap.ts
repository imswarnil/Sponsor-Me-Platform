import type { MetadataRoute } from 'next';
import { CHANNEL_KEYS } from '@/lib/channels';
import { site } from '@/lib/site';

/**
 * The public pages, and one entry per channel.
 *
 * Individual placements (`/s/[publicId]`) are NOT listed. They come and go as
 * slots are created and archived, and a sitemap that promises URLs which 404 a
 * week later is worse than a short one. They are reachable from /placements,
 * which is listed, and that is how a crawler should find them.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths = [
    '/',
    '/placements',
    '/members',
    '/how-it-works',
    ...CHANNEL_KEYS.map((k) => `/placements/${k}`)
  ];

  return paths.map((path) => ({
    url: `${site.self}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency: path === '/placements' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : 0.7
  }));
}
