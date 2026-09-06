import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Advertise With Me',
    short_name: 'Advertise',
    description: 'Track your advertising placements — views, clicks, and what you have running.',
    start_url: '/sponsor',
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
