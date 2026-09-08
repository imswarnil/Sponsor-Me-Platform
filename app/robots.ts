import type { MetadataRoute } from 'next';

import { site } from '@/lib/site';

/**
 * `/embed` is disallowed deliberately. It is a fragment of somebody else's
 * page; indexed on its own it would compete with the article it sits inside
 * and show a search result that is nothing but three ads.
 *
 * The gated routes are listed too. They already redirect a signed-out crawler,
 * but saying so here saves the crawl budget and stops /studio appearing in a
 * site: query as a 307.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/embed/', '/api/', '/studio', '/dashboard']
    },
    sitemap: `${site.self}/sitemap.xml`,
    host: site.self
  };
}
