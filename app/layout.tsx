import './globals.css';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import { RegisterServiceWorker } from '@/components/register-service-worker';
import { NavProgress } from '@/components/nav-progress';
import { site } from '@/lib/site';

/* Two faces — see creator/02-typography.css for the argument.
   Inter sets the headline and the sentence alike: a headline is Inter worn
   large with the tracking closed, and a label is Inter worn small, uppercase
   and tracked open. IBM Plex Mono comes out for code and nothing else, which is
   why it loads a single weight — a mono headline or a mono badge is a bug now.

   Space Grotesk used to set the headlines. Dropping it removes a font from the
   critical path and a second set of metrics from every heading/paragraph pair. */
const body = Inter({
  subsets: ['latin'],
  // 300 for the data voice (small, light, tabular), 600 for headings and labels.
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
  /* Without this every og:image and canonical URL is emitted relative, which
     is meaningless to a crawler and makes Next warn on every build. `site.self`
     is the canonical host — `advertise.imswarnil.com` reaches the same Worker
     but 308s here, so it never appears in a tag. */
  metadataBase: new URL(site.self),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    url: site.self,
    title: 'Sponsor Swarnil — put yourself in front of my audience',
    description: site.description
  },
  twitter: { card: 'summary_large_image' },
  title: {
    default: 'Sponsor Swarnil — put yourself in front of my audience',
    template: '%s · Sponsor Swarnil'
  },
  description: `Sponsor ${site.creator} directly: a placement on any of his sites, or a membership that puts you on the sponsor wall. No ad network, no middleman, no tracking cookies.`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sponsor'
  }
};

export const viewport: Viewport = {
  // --bg-canvas in each theme, so the browser chrome matches the page.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#08080c' }
  ]
};

/* Set data-theme before first paint so there is no flash of the wrong theme.
   Only an explicit choice is written: with no choice the attribute stays off
   and the system's own prefers-color-scheme block decides. */
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
      <body className="min-h-[100dvh]">
        <NavProgress />
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
