import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Logo, SwarnilWordmark } from '@/components/logo';
import { GithubStarBadge } from '@/components/marketing/github-star-badge';
import { channels, site } from '@/lib/site';

/** One internal link. There are enough of them now to be worth a component. */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-muted-foreground transition-colors hover:text-foreground">
        {children}
      </Link>
    </li>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="font-label text-2xs uppercase tracking-slate text-subtle">{title}</p>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  );
}

export function SiteFooter() {
  /* Only channels with a public home earn a link — a dead link in a footer is
     worse than no link at all. */
  const linkedChannels = channels.filter((c) => c.href);

  return (
    <footer className="border-t border-line-subtle">
      {/* The two doors are two columns, in the same order as on the homepage,
          so the footer restates the choice rather than flattening it back into
          one undifferentiated list of pages. */}
      <div className="mx-auto grid max-w-site gap-10 px-gutter py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-ui text-sm text-muted-foreground">{site.description}</p>
          <p className="flex items-center gap-2 font-label text-2xs uppercase tracking-slate text-subtle">
            The work of <SwarnilWordmark size="xs" />
          </p>
        </div>

        <FooterColumn title="For brands">
          <FooterLink href="/placements">Open placements</FooterLink>
          <FooterLink href="/#channels">Every channel</FooterLink>
          <FooterLink href="/#sites">Where it runs</FooterLink>
          <FooterLink href="/how-it-works">How it works</FooterLink>
        </FooterColumn>

        <FooterColumn title="For readers">
          <FooterLink href="/members">The sponsor wall</FooterLink>
          <FooterLink href="/members/join">Become a member</FooterLink>
          <li>
            <a
              href={site.githubSponsors}
              className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              GitHub Sponsors
              <ArrowUpRight className="size-3 text-faint" />
            </a>
          </li>
        </FooterColumn>

        <FooterColumn title="Elsewhere">
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
        </FooterColumn>
      </div>

      <div className="border-t border-line-subtle">
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-3 px-gutter py-5 font-label text-2xs uppercase tracking-slate text-subtle">
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
