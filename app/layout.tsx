import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { site } from '@/lib/site';

/**
 * GEIST, and nothing else. One family for headings, body and controls — the
 * design system names all three, and they all point here.
 */
const sans = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap'
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  metadataBase: new URL(site.self),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
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

/** Both, so the browser chrome matches whichever theme the tokens resolve to. */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' }
  ]
};

/**
 * Applied before the first paint, which is the whole point: the stylesheet
 * resolves its tokens from `data-color-scheme`, so if this ran after hydration
 * a reader who chose dark would get a white flash on every navigation.
 *
 * It writes only the attribute — never a style — so there is nothing to undo
 * and no inline colour to keep in sync with the token file. Wrapped in
 * try/catch because `localStorage` throws outright in a few contexts (private
 * windows with site data blocked, and inside a third-party iframe), and a
 * theme preference is not worth a blank page.
 */
const SCHEME_SCRIPT = `try{var s=localStorage.getItem('sponsor-color-scheme');if(s==='light'||s==='dark')document.documentElement.dataset.colorScheme=s}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /*
     * `suppressHydrationWarning` is required, not cosmetic. The script below
     * rewrites `data-color-scheme` before React boots, so the attribute React
     * finds on the client is deliberately not the one the server sent — and
     * React's only options are to warn about it or to reconcile it back to
     * "system", which would undo the choice and flash the wrong theme. It
     * suppresses one level, so it covers this element's own attributes and
     * nothing inside it.
     */
    <html
      lang="en"
      data-color-scheme="system"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCHEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
