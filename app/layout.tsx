import './swarnil-design.css';
import './app.css';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';

import { site } from '@/lib/site';

/**
 * TWO FACES, and the design system's argument for why.
 *
 * Inter sets the headline and the sentence alike: a heading is Inter worn
 * large with the tracking closed, a label is Inter worn small, uppercase and
 * tracked open, a figure is Inter small, light and tabular. IBM Plex Mono
 * comes out for code and nothing else, which is why it loads a single weight —
 * a mono badge or a mono price is a bug here.
 *
 * The variables are what the vendored stylesheet's `--font-body` /
 * `--font-mono` tokens resolve to, so `next/font` self-hosts both and no
 * request ever leaves for a font CDN.
 */
const body = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap'
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-plex-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  /* Without this, every canonical and og:image is emitted relative — meaningless
     to a crawler, and Next warns on every build. */
  metadataBase: new URL(site.self),
  alternates: { canonical: '/' },
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`
  },
  description: site.description,
  openGraph: {
    type: 'website',
    siteName: site.name,
    url: site.self,
    title: `${site.name} — ${site.tagline}`,
    description: site.description
  },
  twitter: { card: 'summary_large_image' }
};

export const viewport: Viewport = {
  // --bg-canvas in each theme, so the browser chrome matches the page.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#08080c' }
  ]
};

/**
 * Set data-theme before first paint, so there is no flash of the wrong theme.
 * Only an explicit choice is written: with no choice the attribute stays off
 * and the design system's own prefers-color-scheme block decides.
 */
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // The design system sets `scroll-behavior: smooth` on <html>; this tells
      // Next so a route change still lands at the top instantly.
      data-scroll-behavior="smooth"
      className={`${body.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
