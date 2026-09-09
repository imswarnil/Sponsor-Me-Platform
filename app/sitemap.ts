import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { listSlots } from '@/lib/queries';

/** The homepage, the two doors, and every open slot. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const slots = await listSlots(true).catch(() => []);
  return [
    { url: site.self, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${site.self}/signup`, lastModified: now, priority: 0.5 },
    ...slots.map((s) => ({
      url: `${site.self}/slot/${s.publicId}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8
    }))
  ];
}
