import Link from 'next/link';
import { Logo } from '@/components/logo';
import { BackToSite } from '@/components/back-to-site';
import { ThemeToggle } from '@/components/theme-toggle';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { Button } from '@/components/ui/button';

/* A full-bleed bar, not an island: the surface goes edge to edge and only the
   contents are pulled into the site column. No border either — the background
   alone separates it, and a hairline that stops short of the window is just an
   island with square corners.

   Two auth entry points, one real CTA: "Log in" for anyone returning, "Advertise
   with me" (the actual conversion action) for anyone new. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[var(--z-nav)] border-b border-line-subtle bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-site items-center justify-between gap-4 px-gutter">
        <Logo />
        <MarketingNav className="hidden md:flex" />
        <div className="flex items-center gap-2">
          <BackToSite className="hidden sm:inline-flex" />
          <ThemeToggle />
          <Button asChild size="sm" variant="ghost">
            <Link href="/login?next=/placements">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login?mode=signup&next=/placements">Advertise with me</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
