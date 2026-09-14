import Link from 'next/link';

import { Wordmark } from '@/components/chrome';
import { ThemeToggle } from '@/components/theme-toggle';
import { site } from '@/lib/site';

/**
 * The frame around both auth pages: one panel, centred, nothing else.
 *
 * The theme control is here too — signing in is often the first page somebody
 * sees, and a reader who wants the dark theme should not have to authenticate
 * to get it.
 */
export function AuthShell({
  title,
  lead,
  children
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-5 py-14">
      <div className="w-full max-w-[26rem]">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label={site.name}>
            <Wordmark />
          </Link>
          <ThemeToggle />
        </div>

        <div className="sp-panel mt-7 p-7 sm:p-9">
          <h1 className="sp-h2">{title}</h1>
          {lead ? <p className="mt-2 text-small text-secondary">{lead}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
