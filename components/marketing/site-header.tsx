import Link from 'next/link';
import { Logo } from '@/components/logo';
import { BackToSite } from '@/components/back-to-site';
import { ThemeToggle } from '@/components/theme-toggle';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { Button } from '@/components/ui/button';
import { getViewer, homeFor } from '@/lib/proto/roles';

/* A full-bleed bar, not an island: the surface goes edge to edge and only the
   contents are pulled into the site column. No border either — the background
   alone separates it, and a hairline that stops short of the window is just an
   island with square corners.

   It reads the session, which is why every page under app/(marketing) declares
   `force-dynamic`: a header that says "Log in" to someone who is already signed
   in is the exact failure CLAUDE.md §3 warns about, only cached. Signed in, the
   CTA becomes the way back into your own console; signed out, it is the
   catalogue — the one page that now sells both doors, so it works for a brand
   and for a reader alike. */
export async function SiteHeader() {
  const viewer = await getViewer();

  return (
    <header className="sticky top-0 z-[var(--z-nav)] border-b border-line-subtle bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-site items-center justify-between gap-4 px-gutter">
        <Logo />
        <MarketingNav className="hidden md:flex" />
        <div className="flex items-center gap-2">
          <BackToSite className="hidden sm:inline-flex" />
          <ThemeToggle />
          {viewer ? (
            <Button asChild size="sm">
              <Link href={homeFor(viewer.role)}>
                {viewer.role === 'creator' ? 'Studio' : 'Your dashboard'}
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link href="/login?next=/placements">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/placements">Back the work</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
