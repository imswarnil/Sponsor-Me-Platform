import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/**
 * `/embed` is disallowed on purpose: it is a fragment of somebody else's page,
 * and indexed on its own it would compete with the article it sits inside.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/embed/', '/api/', '/studio', '/me'] },
    sitemap: `${site.self}/sitemap.xml`
  };
}
