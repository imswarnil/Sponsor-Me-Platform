import Link from 'next/link';
import { Logo } from '@/components/logo';
import { BackToSite } from '@/components/back-to-site';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-grid">
      <div className="flex items-center justify-between px-gutter py-5">
        <Logo />
        <BackToSite />
      </div>

      <div className="flex flex-1 items-center justify-center px-gutter pb-24">
        <div className="max-w-lead space-y-6 text-center">
          {/* The dot, alone: the mark degrades to this and nothing less. */}
          <span className="logo-dot mx-auto block text-3xl" aria-hidden />
          <p className="font-mono text-2xs uppercase tracking-slate text-subtle">Error 404</p>
          <h1 className="font-display text-4xl font-bold tracking-tighter">Nothing in this slot</h1>
          <p className="text-md text-muted-foreground">
            The page you are looking for might have been removed, had its name changed, or is
            temporarily unavailable.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/placements">Open placements</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
