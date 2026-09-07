import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/**
 * `/embed/*` and `/s/*` are deliberately left crawlable — a placement's public
 * page IS the pitch, and the embed is what runs on other people's sites.
 *
 * What is disallowed is everything behind a session: a crawler cannot sign in,
 * so every one of these is a redirect to /login. Indexing them would put the
 * login page in results under a dozen different titles.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/studio', '/studio/', '/sponsor', '/sponsor/', '/home', '/api/', '/reset-password']
    },
    sitemap: `${site.self}/sitemap.xml`,
    host: site.self
  };
}
