import Link from 'next/link';
import { ArrowRight, Globe, Infinity as Forever, Trophy, Wallet } from 'lucide-react';
import { SponsorWall } from '@/components/marketing/sponsor-wall';
import { PointsNote } from '@/components/marketing/points-note';
import { EmbedSnippet } from '@/components/app/embed-snippet';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/badge';
import { getActiveWallMembers, getMyMembership, getWallTotals } from '@/lib/proto/member-queries';
import { getViewer } from '@/lib/proto/roles';
import { membership, site } from '@/lib/site';
import { formatAmount } from '@/lib/money';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'The wall',
  description: `Bid for a spot on ${site.creator}'s sponsor wall — shown on every site he builds. Bid once from ${formatAmount(membership.minPoints)}; the highest bids sit at the top, and a spot is yours until someone bids more.`
};

/**
 * The reader's door, as a page.
 *
 * Built as sections, not paragraphs: the numbers (real or zero), the wall
 * itself, four blocks that say how it works, and one ask. The wall is the
 * argument — it is the proof and the CTA at once, since every card on it is a
 * spot someone else could outbid. Everything a visitor needs to decide is on
 * screen; nothing is a promise about a blog somewhere else.
 */
export default async function MembersPage({
  searchParams
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const { joined } = await searchParams;
  const [members, totals, viewer] = await Promise.all([
    getActiveWallMembers(),
    getWallTotals(),
    getViewer()
  ]);
  const mine = viewer ? await getMyMembership(viewer.id) : null;
  const isMember = mine?.status === 'active';
  const myRank = isMember ? members.findIndex((m) => m.id === mine!.id) + 1 : 0;

  return (
    /* Header and footer come from app/(marketing)/layout.tsx. */
    <div>
      {/* ── The ask, and the numbers ─────────────────────────────────────── */}
      <section className="border-b border-line-subtle">
        <div className="mx-auto max-w-site px-gutter pb-12 pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-end">
            <div>
              <Eyebrow className="mb-4">The wall</Eyebrow>
              <h1 className="text-balance font-display text-4xl font-bold leading-[1.04] tracking-tighter lg:text-5xl">
                Your name on <span className="text-signal">every site</span> I build.
              </h1>
              <p className="mt-5 max-w-lead text-pretty text-lg text-muted-foreground">
                Bid once, from {formatAmount(membership.minPoints)}. You get a spot on the sponsor
                wall — shown here and on every site I run. The highest bids sit at the top, bigger.
                Your spot is yours for good, until someone bids more.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {isMember ? (
                  <>
                    <Button asChild size="lg">
                      <Link href="/sponsor/membership">
                        You&rsquo;re #{myRank} — bid more <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <p className="font-label text-2xs uppercase tracking-slate text-subtle">
                      your bid: {formatAmount(mine!.pricePoints)}
                    </p>
                  </>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link href="/members/join">
                        Bid for a spot — from {formatAmount(membership.minPoints)}
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <a
                      href="#how"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      How the wall works
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* The money. Real, or zero — never a placeholder (CLAUDE.md §4). */}
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-card border border-border bg-line-subtle">
              <Stat label="On the wall" value={String(totals.count)} />
              <Stat label="Bid, together" value={formatAmount(totals.total)} />
              <Stat
                label="Top bid"
                value={totals.topAmount > 0 ? formatAmount(totals.topAmount) : 'Open'}
                accent={totals.topAmount === 0}
              />
            </dl>
          </div>

          {joined ? (
            <p className="mt-8 rounded-card border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
              You&rsquo;re on the wall — for good, until someone bids more. Your card is below, and
              it&rsquo;s already on every site this is embedded on.
            </p>
          ) : null}

          <PointsNote className="mt-8" />
        </div>
      </section>

      {/* ── The wall ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-site px-gutter py-12">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
            {members.length > 0
              ? `${members.length} on the wall, highest bid first`
              : 'The wall'}
          </h2>
          <p className="font-label text-2xs uppercase tracking-slate text-faint">
            1st · 2nd · 3rd on the podium · ties to whoever was first
          </p>
        </div>
        <SponsorWall members={members} layout="full" />
      </section>

      {/* ── How the wall works — four blocks, not a paragraph ────────────── */}
      <section id="how" className="border-y border-line-subtle bg-sunken">
        <div className="mx-auto max-w-site px-gutter py-section-md">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow className="justify-center">How the wall works</Eyebrow>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Four rules. That&rsquo;s the whole thing.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Block
              icon={<Wallet className="size-5" />}
              n="01"
              title="Bid once"
              body={`Any amount from ${formatAmount(membership.minPoints)}. It's yours to choose, and it's printed on your card — nothing on this wall is hidden.`}
            />
            <Block
              icon={<Trophy className="size-5" />}
              n="02"
              title="Highest bid, highest spot"
              body="The wall is ordered by bid. 1st, 2nd and 3rd are the podium — bigger cards, named places. A tie goes to whoever got there first."
            />
            <Block
              icon={<Forever className="size-5" />}
              n="03"
              title="Yours until outbid"
              body="No expiry, no renewal, nothing to keep paying. Your spot holds until someone bids more — and you can bid more any time to move up."
            />
            <Block
              icon={<Globe className="size-5" />}
              n="04"
              title="Seen everywhere I build"
              body="One embed puts this exact wall on every site I run. Your spot travels with it — same place, same size, everywhere."
            />
          </div>
        </div>
      </section>

      {/* ── One ask ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-site px-gutter py-section-md">
        <div data-surface="inverse" className="rounded-sheet px-6 py-14 text-center">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tighter sm:text-4xl">
            {totals.topAmount > 0 ? (
              <>
                The top spot is <span className="text-signal">{formatAmount(totals.topAmount)}</span>.
              </>
            ) : (
              <>
                The top spot is <span className="text-signal">open</span>.
              </>
            )}
          </h2>
          <p className="mx-auto mt-4 max-w-lead text-muted-foreground">
            {totals.topAmount > 0
              ? `Bid more than that and the biggest card on every site I build is yours — for good, until someone beats you. Or take any spot from ${formatAmount(membership.minPoints)}; it's still your name, everywhere.`
              : `Nobody's there yet. It's yours from ${formatAmount(membership.minPoints)} — and it stays yours until someone bids more.`}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href={isMember ? '/sponsor/membership' : '/members/join'}>
                {isMember ? 'Bid more' : 'Bid for a spot'} <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/placements">Advertising instead?</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* The creator's own copy of the embed code. Nobody else needs it, but
          hiding it behind the studio means opening two tabs to fetch it. */}
      {viewer?.role === 'creator' ? (
        <section className="mx-auto max-w-site px-gutter pb-section-md">
          <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
            Embed this wall
          </h2>
          <p className="mt-2 max-w-lead text-sm text-muted-foreground">
            Drop this on any of your sites. <code className="font-mono">data-wall</code> takes{' '}
            <code className="font-mono">sidebar</code>, <code className="font-mono">inline</code>{' '}
            or <code className="font-mono">full</code>.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <EmbedSnippet
              label="Inline band"
              code={'<script src="__ORIGIN__/wall.js" data-wall="inline" async></script>'}
            />
            <EmbedSnippet
              label="Sidebar column"
              code={
                '<script src="__ORIGIN__/wall.js" data-wall="sidebar" data-heading="Sponsors" async></script>'
              }
            />
            <EmbedSnippet
              label="Full grid"
              code={'<script src="__ORIGIN__/wall.js" data-wall="full" async></script>'}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface px-4 py-4">
      <dt className="font-label text-2xs uppercase tracking-slate text-subtle">{label}</dt>
      <dd
        className={`mt-1 truncate font-display text-xl font-bold tabular-nums tracking-tight ${accent ? 'text-signal' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

function Block({
  icon,
  n,
  title,
  body
}: {
  icon: React.ReactNode;
  n: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-card border border-border bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-md bg-pop/12 text-signal">
          {icon}
        </span>
        <span className="font-label text-2xs uppercase tracking-slate text-faint">{n}</span>
      </div>
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-pretty text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
