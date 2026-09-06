import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Logo, SwarnilWordmark } from '@/components/logo';
import { GithubStarBadge } from '@/components/marketing/github-star-badge';
import { channels, site } from '@/lib/site';

export function SiteFooter() {
  /* Only channels with a public home earn a link — a dead link in a footer is
     worse than no link at all. */
  const linkedChannels = channels.filter((c) => c.href);

  return (
    <footer className="border-t border-line-subtle">
      <div className="mx-auto grid max-w-site gap-10 px-gutter py-16 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-ui text-sm text-muted-foreground">{site.description}</p>
          <p className="flex items-center gap-2 font-mono text-2xs uppercase tracking-slate text-subtle">
            The work of <SwarnilWordmark size="xs" />
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-mono text-2xs uppercase tracking-slate text-subtle">Advertise</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/placements"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Open placements
              </Link>
            </li>
            <li>
              <Link
                href="/how-it-works"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                How it works
              </Link>
            </li>
            <li>
              <Link
                href="/#channels"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                The work
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="font-mono text-2xs uppercase tracking-slate text-subtle">Elsewhere</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={site.owner}
                className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                {site.ownerLabel}
                <ArrowUpRight className="size-3 text-faint" />
              </a>
            </li>
            {linkedChannels.map((c) => (
              <li key={c.key}>
                <a
                  href={c.href!}
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {c.label}
                  <ArrowUpRight className="size-3 text-faint" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line-subtle">
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-3 px-gutter py-5 font-mono text-2xs uppercase tracking-slate text-subtle">
          <span>
            © {new Date().getFullYear()} {site.creatorFull} · Built for the web, not for ad
            networks.
          </span>
          <div className="flex items-center gap-4">
            <GithubStarBadge />
            {/* The way in, kept quiet: this is the creator's own admin, not a
                product signup. */}
            <Link href="/home" className="transition-colors hover:text-foreground">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
