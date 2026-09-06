import './globals.css';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Inter, Space_Grotesk } from 'next/font/google';
import { RegisterServiceWorker } from '@/components/register-service-worker';
import { site } from '@/lib/site';

/* Three faces, three jobs — see creator/02-typography.css.
   display → Space Grotesk (headlines, stats) · body → Inter (everything you
   actually read) · slate → IBM Plex Mono (the metadata voice: labels, counts,
   timecodes, code). */
const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap'
});
const body = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const slate = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: {
    default: 'Advertise With Me — back the work, not the ad network',
    template: '%s · Advertise With Me'
  },
  description: `Advertise with ${site.creator} directly: a video, a newsletter issue, a blog slot, a post, or an open-source project. No ad network, no middleman, no tracking cookies.`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Advertise'
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
      className={`${display.variable} ${body.variable} ${slate.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-[100dvh]">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
