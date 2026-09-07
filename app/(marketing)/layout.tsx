import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';

/**
 * THE PUBLIC SHELL
 * ================
 *
 * One header and one footer for every page a logged-out visitor can reach:
 * `/`, `/placements`, `/placements/[channel]`, `/members`, `/how-it-works` and
 * `/s/[publicId]`.
 *
 * They used to each roll their own bar — a Logo, a BackToSite and a ThemeToggle
 * copied four times — and three of them had no footer at all, so the site
 * changed shape as you walked through it and the nav vanished the moment you
 * clicked anything. A route group costs nothing at the URL (`/placements` is
 * still `/placements`) and buys one place to change the chrome.
 *
 * `/studio` and `/sponsor` are deliberately NOT in here: a console is a
 * different room, and it has its own shell in components/app/console-shell.tsx.
 */
/**
 * SiteHeader reads the session, so this whole segment is dynamic — the same
 * rule app/studio and app/sponsor state for themselves (CLAUDE.md §3), and for
 * the same reason: get it wrong and Next prerenders a signed-out page and
 * serves it to everyone. Declared on the layout so it cascades, rather than
 * relying on Next noticing the `cookies` call and bailing out of the static
 * render, which it does with a build-time error in the log.
 */
export const dynamic = 'force-dynamic';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
