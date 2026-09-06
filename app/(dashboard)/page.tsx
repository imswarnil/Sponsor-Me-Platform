import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Blocks,
  Coins,
  Eye,
  Handshake,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, Eyebrow } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChannelIcon } from '@/components/marketing/channel-icon';
import { SwarnilWordmark } from '@/components/logo';
import { StartConversationForm } from '@/components/marketing/start-conversation-form';
import { AudienceStats } from '@/components/marketing/audience-stats';
import { channels, site } from '@/lib/site';

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-grid bg-signal-wash relative overflow-hidden border-b border-line-subtle">
        <div className="mx-auto grid max-w-site gap-12 px-gutter py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-32">
          <div className="flex flex-col justify-center">
            <Eyebrow className="mb-5">Advertise with {site.creator} directly</Eyebrow>
            <h1 className="text-balance font-display text-5xl font-bold leading-[1.03] tracking-tighter sm:text-6xl lg:text-7xl">
              Place your brand in front of <span className="text-signal">my audience</span>.
            </h1>
            <p className="mt-6 max-w-lead text-pretty text-md text-muted-foreground">
              I make videos, write a blog and a newsletter, post photos, and ship open source. If
              any of it has been useful to you or your product, you can put your name on it —
              directly, with no middleman taking a cut.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/login?mode=signup&next=/placements">
                  Advertise with me <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/#channels">See what you get</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-signal" /> No third-party cookies
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Handshake className="size-4 text-signal" /> No agency in the middle
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Blocks className="size-4 text-signal" /> Every placement disclosed
              </span>
            </div>
          </div>

          {/* The blog sidebar slot, as an advertiser would actually see it. */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-sm shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-mono">imswarnil.com/travel</span>
                  <Badge variant="outline">Sidebar</Badge>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-3/4 rounded bg-muted" />
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-5/6 rounded bg-muted" />
                </div>
                <div className="relative grid aspect-[300/250] place-items-center overflow-hidden rounded-media border border-dashed border-pop/40 bg-pop/5 text-center">
                  <div className="space-y-1 px-4">
                    <p className="font-display text-sm font-semibold text-signal">
                      Your name could be here
                    </p>
                    <p className="text-xs text-muted-foreground">300 × 250 · on every post</p>
                  </div>
                  <Badge variant="pop" className="fx-pulse absolute right-2 top-2">
                    Open
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Real numbers, not invented ones ─────────────────────────────────── */}
      <section className="mx-auto max-w-site px-gutter py-section-md">
        <SectionHeading
          eyebrow="Your audience"
          title="What you'd actually be reaching"
          sub="Real numbers, pulled live — never a made-up figure."
        />
        <div className="mt-10">
          <AudienceStats />
        </div>
      </section>

      {/* ── The channels ─────────────────────────────────────────────────── */}
      <section id="channels" className="mx-auto max-w-site px-gutter py-section-md">
        <SectionHeading
          eyebrow="The work"
          title="Five places your name can live"
          sub="Advertise on one surface, or take everything for a month. Each one is disclosed as sponsored, every time."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((c) => (
            <Card key={c.key} className="h-full">
              <CardContent className="flex h-full flex-col p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-md bg-pop/12 text-signal">
                    <ChannelIcon name={c.icon} className="size-5" />
                  </span>
                  {c.soon ? <Badge variant="craft">Soon</Badge> : null}
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">{c.label}</h3>
                {/* flex-1 so the rule below lands on the same line across the
                    row, whatever length each blurb happens to be. */}
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.blurb}</p>

                <div className="mt-5 border-t border-line-subtle pt-4">
                  <p className="font-mono text-2xs uppercase tracking-slate text-subtle">
                    What an advertiser gets
                  </p>
                  <p className="mt-1.5 text-sm">{c.placement}</p>
                </div>

                {c.href ? (
                  <a
                    href={c.href}
                    className="mt-4 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Have a look <ArrowUpRight className="size-3.5 text-faint" />
                  </a>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── How it works, from the advertiser's side ─────────────────────── */}
      <section className="border-y border-line-subtle bg-sunken">
        <div className="mx-auto max-w-site px-gutter py-section-md">
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
              body="Every open spot has a public page: which channel it runs on, what it costs, and how it's been performing."
            />
            <StepCard
              n="02"
              icon={<Coins className="size-5" />}
              title="Take it"
              body="Add a headline, an image and your link, then pay the listed price. No auction, no minimum spend, no contract."
            />
            <StepCard
              n="03"
              icon={<Zap className="size-5" />}
              title="It goes live"
              body="Your placement starts running immediately, and you can see its views and clicks on the same public page."
            />
          </div>
          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/how-it-works">
                Read the long version <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
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
        <div
          data-surface="inverse"
          className="rounded-sheet px-6 py-16 text-center"
        >
          <h2 className="text-balance font-display text-4xl font-bold tracking-tighter sm:text-5xl">
            Put your name on the <span className="text-signal">next one</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-lead text-muted-foreground">
            Pick a placement and it runs today. Would rather talk it through first? Start a
            conversation below.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login?mode=signup&next=/placements">
                See open placements <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8">
            <StartConversationForm next="/placements" />
          </div>
          <p className="mt-10 flex items-center justify-center gap-2 font-mono text-2xs uppercase tracking-slate text-subtle">
            Everything here funds the work of <SwarnilWordmark size="xs" />
          </p>
        </div>
      </section>
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
          <span className="font-mono text-2xs uppercase tracking-slate text-faint">{n}</span>
        </div>
        <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
