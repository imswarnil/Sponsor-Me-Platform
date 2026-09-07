import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Named for what this is now, not for the marketplace it started as.
    name: 'Sponsor Swarnil',
    short_name: 'Sponsor',
    description:
      'Back the work directly — a placement on any of Swarnil\u2019s sites, or a membership on the sponsor wall.',
    // `/home` decides where you belong (creator or sponsor) instead of assuming
    // the installer is an advertiser, which /sponsor did.
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f04e2e',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' }
    ]
  };
}
