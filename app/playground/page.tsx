import Link from 'next/link';
import { SwarnilWordmark } from '@/components/logo';
import { WidgetEmbed } from '@/components/widget-embed';

export const metadata = { title: 'Demo site' };

export default async function PlaygroundPage({
  searchParams
}: {
  searchParams: Promise<{ slot?: string }>;
}) {
  const { slot } = await searchParams;

  return (
    <div className="min-h-[100dvh] bg-canvas text-foreground">
      {/* A stand-in for a publisher's page — dressed as the real one. */}
      <div className="border-b border-line-subtle bg-sunken">
        <div className="mx-auto max-w-narrow px-gutter py-2 font-label text-2xs uppercase tracking-slate text-subtle">
          Demo external site · a stand-in for a publisher&rsquo;s page
        </div>
      </div>

      <header className="mx-auto flex max-w-narrow items-baseline gap-2 px-gutter py-6">
        <SwarnilWordmark size="sm" />
        <span className="font-label text-2xs uppercase tracking-slate text-faint">/ travel</span>
      </header>

      <div className="mx-auto grid max-w-narrow gap-10 px-gutter pb-20 md:grid-cols-[1fr_300px]">
        <article>
          <h1 className="font-display text-3xl font-bold tracking-tight">Three days in Vienna</h1>
          <p className="mt-2 font-label text-2xs uppercase tracking-slate text-subtle">
            A short travelogue · 6 min read
          </p>
          <div className="mt-6 max-w-measure space-y-4 text-md leading-relaxed text-muted-foreground">
            <p>
              The train pulled into Wien Hauptbahnhof a little after nine. Vienna in the morning is
              all long shadows and the smell of coffee — and I had exactly seventy-two hours to make
              sense of it.
            </p>
            <p>
              First stop, obviously, was a Kaffeehaus. I A/B tested three of them over the trip, and
              I will die on the hill that the quiet one near the Naschmarkt wins on both latency and
              vibes.
            </p>
            <p>
              The sidebar to your right, by the way, is a live advertising slot served by Advertise
              With Me. It reserves its exact size before it loads, so this paragraph never jumps.
            </p>
            <p>
              By day three I had a system: museums before noon, parks after, and a Sachertorte
              checkpoint whenever morale dipped. Ten out of ten, would deploy again.
            </p>
          </div>
        </article>

        <aside className="space-y-4">
          <p className="font-label text-2xs uppercase tracking-slate text-subtle">Sponsored</p>
          {slot ? (
            <div className="rounded-media border border-border p-2">
              <WidgetEmbed slot={slot} />
            </div>
          ) : (
            <div className="grid h-[250px] w-[300px] place-items-center rounded-media border border-dashed border-line-strong text-center text-sm text-muted-foreground">
              Add <span className="mx-1 font-mono">?slot=sl_…</span> to the URL
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            One <span className="font-mono">&lt;script&gt;</span> tag rendered this. Loading it
            counted a view; a click counts a click.
          </p>
          <Link href="/home" className="inline-block text-xs text-signal hover:underline">
            ← Back to dashboard
          </Link>
        </aside>
      </div>
    </div>
  );
}
