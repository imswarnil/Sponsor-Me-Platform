import type { MetadataRoute } from 'next';

import { site } from '@/lib/site';

/**
 * The public surface is one page plus the two auth doors. The dashboards, the
 * studio and the embed are all either gated or fragments, so none of them
 * belongs to a crawler — /embed in particular is a piece of somebody else's
 * page and would compete with the real article if it were indexed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: site.self, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${site.self}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${site.self}/signin`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 }
  ];
}
