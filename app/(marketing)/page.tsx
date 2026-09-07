import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Coins, Eye, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, Eyebrow } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChannelIcon } from '@/components/marketing/channel-icon';
import { SwarnilWordmark } from '@/components/logo';
import { StartConversationForm } from '@/components/marketing/start-conversation-form';
import { AudienceStats } from '@/components/marketing/audience-stats';
import { PropertiesGrid } from '@/components/marketing/properties-grid';
import { GitHubSponsors } from '@/components/marketing/github-sponsors';
import { SponsorWall } from '@/components/marketing/sponsor-wall';
import { TwoDoors } from '@/components/marketing/two-doors';
import { PointsNote } from '@/components/marketing/points-note';
import { Thanks } from '@/components/marketing/thanks';
import { getActiveWallMembers, expireStaleMembers } from '@/lib/proto/member-queries';
import { CHANNEL_LIST } from '@/lib/channels';
import { site } from '@/lib/site';

/* Reads the wall, the open placements and the Ghost tier per request — see
   CLAUDE.md §3. Nothing on this page is a build-time snapshot. */
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await expireStaleMembers();
  const members = await getActiveWallMembers(24);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────
          One claim, no fork yet. The fork is the next section, and putting it
          there rather than in the hero is the whole point of the redesign: the
          headline is the thing both audiences share, and the doors are where
          they part. */}
      <section className="border-b border-line-subtle">
        <div className="mx-auto max-w-site px-gutter py-20 lg:py-28">
          <div className="max-w-3xl">
            <Eyebrow className="mb-5">Sponsor {site.creator} directly</Eyebrow>
            <h1 className="text-balance font-display text-4xl font-bold leading-[1.04] tracking-tighter lg:text-5xl">
              Back the work, not the <span className="text-signal">ad network</span>.
            </h1>
            <p className="mt-5 max-w-lead text-pretty text-lg text-muted-foreground">
              I make videos, write a blog and a newsletter, post photos, and ship open source. If
              any of it has been useful to you or your product, you can put your name on it —
              directly, with nobody in the middle taking a cut and nothing following my readers
              around the internet.
            </p>
            <p className="mt-6 font-label text-2xs uppercase tracking-slate text-faint">
              No third-party cookies · No agency in the middle · Every placement disclosed
            </p>
          </div>

          {/* The fork, immediately — above the fold on anything desktop-sized. */}
          <div className="mt-14">
            <TwoDoors />
          </div>
        </div>
      </section>

      {/* ── Points, before anything quotes a price ───────────────────────────
          Deliberately the first thing after the doors, because the doors are
          the first place a number appears. */}
      <section className="mx-auto max-w-site px-gutter pt-section-md">
        <PointsNote />
      </section>

      {/* ── Real numbers, never invented ones ────────────────────────────── */}
      <section className="mx-auto max-w-site px-gutter py-section-md">
        <SectionHeading
          eyebrow="Your audience"
          title="What you'd actually be reaching"
          sub="Read live from the blog. A channel that isn't connected says so rather than showing a number I made up."
        />
        <div className="mt-10">
          <AudienceStats />
        </div>
      </section>

      {/* ── The channels ─────────────────────────────────────────────────── */}
      <section id="channels" className="mx-auto max-w-site px-gutter py-section-md">
        <SectionHeading
          eyebrow="The work"
          title="Six places your name can live"
          sub="Take one surface, or take everything for a month. Each one is disclosed as sponsored, every time."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CHANNEL_LIST.map((c) => (
            <Card key={c.key} className="h-full">
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-md bg-pop/12 text-signal">
                    <ChannelIcon name={c.icon} className="size-5" />
                  </span>
                  {c.embeddable ? <Badge variant="pop">Live counts</Badge> : null}
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">{c.label}</h3>
                {/* flex-1 so the rule below lands on the same line across the
                    row, whatever length each blurb happens to be. */}
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.placement}</p>

                <div className="mt-5 border-t border-line-subtle pt-4">
                  <p className="font-label text-2xs uppercase tracking-slate text-subtle">
                    What a week buys
                  </p>
                  <p className="mt-1.5 text-sm">{c.unit}</p>
                </div>

                <Link
                  href={`/placements/${c.key}`}
                  className="mt-4 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  See this channel <ArrowUpRight className="size-3.5 text-faint" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Every site a sponsorship covers — see lib/properties.ts ───────── */}
      <section id="sites" className="mx-auto max-w-site px-gutter py-section-md">
        <SectionHeading
          eyebrow="Where it runs"
          title="One sponsorship, everything I build"
          sub="The sites, courses, themes and open-source projects your name would sit beside."
        />
        <div className="mt-12">
          <PropertiesGrid />
        </div>
      </section>

      {/* ── Who's already here ───────────────────────────────────────────────
          The wall and the GitHub listing are the same claim from two sources,
          so they sit together. Both vanish rather than showing a zero: an empty
          wall renders its own "nobody yet" line, and GitHubSponsors returns
          null without a token (CLAUDE.md §10). */}
      <section className="border-y border-line-subtle bg-sunken">
        <div className="mx-auto max-w-site px-gutter py-section-md">
          <SectionHeading
            eyebrow="Already backing this"
            title="The people on the wall"
            sub="Members appear here and on every site I embed the wall on — with their own line and their own link."
          />
          <div className="mt-12">
            <SponsorWall members={members} layout="full" />
            {members.length > 0 ? (
              <div className="mt-10 flex justify-center">
                <Button asChild variant="outline">
                  <Link href="/members">
                    See the whole wall <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
          <div className="mt-12">
            <GitHubSponsors />
          </div>
        </div>
      </section>

      {/* ── How it works, from the sponsor's side ────────────────────────── */}
      <section className="mx-auto max-w-site px-gutter py-section-md">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps, no sales call"
          sub="Pick a placement, send the creative, watch it run. Nothing to negotiate."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <StepCard
            n="01"
            icon={<Eye className="size-5" />}
            title="Pick a placement"
            body="Every open spot has a public page: which channel it runs on, which of my sites it covers, what a week costs, and how it has been performing."
          />
          <StepCard
            n="02"
            icon={<Coins className="size-5" />}
            title="Take it"
            body="Add a headline, an image and your link, choose your dates, and pay the listed price in points. No auction, no minimum, no contract."
          />
          <StepCard
            n="03"
            icon={<Zap className="size-5" />}
            title="It goes live"
            body="Your placement starts running immediately, and the views and clicks it earns show on the same public page you bought it from."
          />
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline">
            <Link href="/how-it-works">
              Read the long version <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Why direct ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-site px-gutter py-section-md">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Why direct"
              title="An ad network would take a cut of this"
              sub="And it would follow my readers around the internet to do it. I would rather know who is backing the work, and have them know exactly where their name ends up."
            />
          </div>
          <ul className="space-y-4">
            {[
              'You deal with me, not an account manager.',
              'The price is the price — no auction, no reserve, no spend minimum.',
              'No third-party cookies and no cross-site tracking of my readers.',
              'Every sponsored placement says so, plainly, wherever it appears.',
              'You can see the views and clicks your placement gets, on a public page.'
            ].map((point) => (
              <li key={point} className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-signal" />
                <span className="text-muted-foreground">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-site px-gutter pb-24">
        <div data-surface="inverse" className="rounded-sheet px-6 py-16 text-center">
          <h2 className="text-balance font-display text-4xl font-bold tracking-tighter sm:text-5xl">
            Put your name on the <span className="text-signal">next one</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-lead text-muted-foreground">
            Pick a placement and it runs today, or join the wall and stay on it. Would rather talk
            it through first? Start a conversation below.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/placements">
                See open placements <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/members">Become a member</Link>
            </Button>
          </div>
          <div className="mt-8">
            <StartConversationForm next="/placements" />
          </div>
          <p className="mt-10 flex items-center justify-center gap-2 font-label text-2xs uppercase tracking-slate text-subtle">
            Everything here funds the work of <SwarnilWordmark size="xs" />
          </p>
        </div>
      </section>

      <Thanks />
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  sub,
  align = 'center'
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-lead'}>
      <Eyebrow className={align === 'center' ? 'justify-center' : undefined}>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {sub ? <p className="mt-4 text-pretty text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function StepCard({
  n,
  icon,
  title,
  body
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="relative h-full">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="grid size-10 place-items-center rounded-md bg-pop/12 text-signal">
            {icon}
          </span>
          <span className="font-label text-2xs uppercase tracking-slate text-faint">{n}</span>
        </div>
        <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
