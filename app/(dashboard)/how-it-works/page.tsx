import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Coins,
  Eye,
  MousePointerClick,
  Rocket,
  ScrollText,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Eyebrow } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChannelIcon } from '@/components/marketing/channel-icon';
import { StartConversationForm } from '@/components/marketing/start-conversation-form';
import { channels } from '@/lib/site';

export const metadata = {
  title: 'How it works',
  description:
    'How advertising with Swarnil works — pick a placement, send the creative, watch it run. No agency, no auction, no contract.'
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-narrow px-gutter py-16">
      {/* Intro */}
      <div className="max-w-lead">
        <Eyebrow className="mb-4">The whole loop</Eyebrow>
        <h1 className="text-balance font-display text-4xl font-bold tracking-tighter">
          How advertising with me works
        </h1>
        <p className="mt-5 text-pretty text-md text-muted-foreground">
          You pick a placement on one of my channels, send me the creative, and pay the listed
          price. It runs immediately. There is no agency in the middle, no auction, and nothing to
          sign — if a spot is open, it is yours.
        </p>
      </div>

      {/* The loop */}
      <div className="mt-10 grid gap-3 sm:grid-cols-4">
        {[
          { icon: Search, label: 'Pick a placement' },
          { icon: ScrollText, label: 'Send the creative' },
          { icon: Coins, label: 'Pay the listed price' },
          { icon: Rocket, label: 'It goes live' }
        ].map((s, i) => (
          <div key={i} className="relative">
            <Card className="h-full">
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                <span className="grid size-10 place-items-center rounded-md bg-pop/12 text-signal">
                  <s.icon className="size-5" />
                </span>
                <span className="text-xs font-medium">{s.label}</span>
              </CardContent>
            </Card>
            {i < 3 ? (
              <ArrowRight className="absolute -right-2.5 top-1/2 hidden size-4 -translate-y-1/2 text-faint sm:block" />
            ) : null}
          </div>
        ))}
      </div>

      {/* The advertiser's journey — the only journey this site has. */}
      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold tracking-tight">Step by step</h2>
        <ol className="mt-6 space-y-4">
          <Step
            n={1}
            title="Find an open placement"
            body="Every open spot has a public page: which channel it runs on, what it costs, and how many views and clicks it has been getting. Nothing is hidden behind a rate card."
          />
          <Step
            n={2}
            title="Create an account"
            body="An email and a password. Accounts exist so you can manage your own placements and see how they are doing — that is all they are for."
          />
          <Step
            n={3}
            title="Send the creative"
            body="A headline, an optional image, and the link you want people to land on. If a placement needs something written — a newsletter block, a video read — I write it in my own voice and show it to you first."
          />
          <Step
            n={4}
            title="Pay the listed price"
            body="The price on the page is the price. It runs on points today, so you can walk the whole flow before any real money is involved."
          />
          <Step
            n={5}
            title="It goes live, and you can watch it"
            body="Your placement starts running straight away. The same public page then shows its views and clicks, so you are never taking my word for it."
            last
          />
        </ol>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/login?mode=signup&next=/placements">
              See open placements <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/#channels">What the channels are</Link>
          </Button>
        </div>
      </section>

      {/* Where a placement can run */}
      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold tracking-tight">Where it can run</h2>
        <p className="mt-2 max-w-lead text-muted-foreground">
          Five surfaces, each with its own kind of placement. You can take one, or take everything
          for a month.
        </p>
        <div className="mt-6 space-y-3">
          {channels.map((c) => (
            <Card key={c.key}>
              <CardContent className="flex items-start gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-pop/12 text-signal">
                  <ChannelIcon name={c.icon} className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-semibold tracking-tight">{c.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{c.placement}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Money & measurement */}
      <section className="mt-16 grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <span className="grid size-10 place-items-center rounded-md bg-pop/12 text-signal">
              <Coins className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
              How paying works
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal" /> The price listed on
                a placement is the whole price.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal" /> No auction, no
                reserve, no minimum spend, no contract.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal" /> Everything runs on
                points for now, so you can try the flow risk-free.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal" /> Real payments come
                later — nothing you do today costs money.
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <span className="grid size-10 place-items-center rounded-md bg-pop/12 text-signal">
              <BarChart3 className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
              How measuring works
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Eye className="mt-0.5 size-4 shrink-0 text-signal" /> Each time the placement
                loads, it counts a <b className="text-foreground">view</b>.
              </li>
              <li className="flex gap-2">
                <MousePointerClick className="mt-0.5 size-4 shrink-0 text-signal" /> Each tap counts
                a <b className="text-foreground">click</b> and forwards to your link.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal" /> Both are on the
                placement&rsquo;s public page — you see what I see.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal" /> No cookies, and no
                cross-site tracking of my readers.
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold tracking-tight">Good to know</h2>
        <div className="mt-5 space-y-3">
          <Faq
            q="Do you take every advertiser?"
            a="No. I turn down anything I would not use or recommend myself, and anything I could not disclose comfortably. If it is not a fit I will say so quickly rather than leave you waiting."
          />
          <Faq
            q="Is a sponsored placement labelled?"
            a="Always, wherever it appears — in the video, in the issue, on the page. That is not negotiable, and it is the reason any of this is worth advertising in."
          />
          <Faq
            q="Do you write the copy, or do I?"
            a="Either. For a sidebar slot you send the creative. For a video read or a newsletter block I write it in my own voice from your brief, and you see it before it runs."
          />
          <Faq
            q="Is this real money?"
            a="Not yet. The whole flow runs on points so you can walk through it end to end before anything is charged. Real payments are a later phase."
          />
          <Faq
            q="Can I advertise on more than one channel?"
            a="Yes. Take a single spot, or a month across everything — the placements are listed separately so you can mix them however you like."
          />
        </div>
      </section>

      {/* CTA */}
      <div data-surface="inverse" className="mt-16 rounded-sheet px-6 py-12 text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight">Have a look at what&rsquo;s open</h2>
        <p className="mx-auto mt-3 max-w-lead text-muted-foreground">
          If nothing fits, tell me what you had in mind below.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/login?mode=signup&next=/placements">
              See open placements <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-8">
          <StartConversationForm next="/placements" />
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, body, last }: { n: number; title: string; body: string; last?: boolean }) {
  return (
    <li className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pop/12 font-label text-2xs font-semibold text-signal">
          {n}
        </span>
        {!last ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
      </div>
      <div className="pb-2">
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 max-w-measure text-sm text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="font-medium">{q}</p>
        <p className="mt-1.5 max-w-measure text-sm text-muted-foreground">{a}</p>
      </CardContent>
    </Card>
  );
}
