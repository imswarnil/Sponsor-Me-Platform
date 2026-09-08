import Link from 'next/link';
import { ArrowRight, Megaphone, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getOpenPlacements } from '@/lib/proto/queries';
import { getCreatorId } from '@/lib/proto/roles';
import { getWallTotals } from '@/lib/proto/member-queries';
import { membership } from '@/lib/site';
import { formatAmount } from '@/lib/money';

/**
 * THE TWO DOORS
 * =============
 *
 * The whole reason this page exists, stated once: there are exactly two ways to
 * back this work, and they are for two different people.
 *
 *   A BRAND buys a placement — a specific spot, for specific dates, with
 *   creative it supplies. Priced per week.
 *
 *   A READER bids for a spot on the wall — once, from a floor, and holds it
 *   until someone bids more. The wall is ordered and sized by bid
 *   (lib/site.ts `membership`).
 *
 * The homepage used to sell only the first, while the nav offered the second,
 * which left a reader reading an advertiser's pitch and bouncing. Every number
 * on both doors is read live — the cheapest open placement and the wall's
 * totals out of Neon. Where a number cannot be read it is simply absent
 * (CLAUDE.md §4: a figure here is either real or it is not shown). Neither
 * door ever renders a guess.
 */
export async function TwoDoors() {
  const creatorId = await getCreatorId();
  const [open, wall] = await Promise.all([getOpenPlacements(creatorId), getWallTotals()]);

  const cheapest = open.length > 0 ? Math.min(...open.map((s) => s.pricePoints)) : null;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Door
        icon={<Megaphone className="size-5" />}
        eyebrow="For brands"
        title="Buy a placement"
        body="A spot on one of my channels for dates you choose — a blog sidebar, a read-out in a video, a block in a newsletter issue, a logo in a README. You send the creative; it runs disclosed as sponsored."
        meta={
          cheapest !== null
            ? `${open.length} open now · from ${formatAmount(cheapest)} a week`
            : 'Everything is sponsored right now — see what frees up next'
        }
        href="/placements"
        cta="See open placements"
      />
      <Door
        icon={<Users className="size-5" />}
        eyebrow="For readers"
        title="Bid for a spot on the wall"
        body="Bid any amount, once, from the floor. You get a spot on the public sponsor wall — shown on every site I build — and the highest bids sit at the top, bigger. Your spot is yours for good, until someone bids more."
        meta={
          wall.count > 0
            ? `from ${formatAmount(membership.minPoints)}, once · ${wall.count} on the wall · top bid ${formatAmount(wall.topAmount)}`
            : `from ${formatAmount(membership.minPoints)}, once · the top spot is open`
        }
        href="/members"
        cta="See the wall"
      />
    </div>
  );
}

function Door({
  icon,
  eyebrow,
  title,
  body,
  meta,
  href,
  cta
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  meta: string;
  href: string;
  cta: string;
}) {
  return (
    /* The whole card is the target, so the button is decoration over a link
       rather than the only place a click lands. `group` + an absolutely
       positioned overlay link keeps one accessible name for the whole thing. */
    <div className="group relative flex flex-col rounded-card border border-border bg-surface p-7 transition-colors hover:border-line-strong">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-md bg-pop/12 text-signal">
          {icon}
        </span>
        <Badge variant="outline">{eyebrow}</Badge>
      </div>

      <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">{title}</h3>
      <p className="mt-3 flex-1 text-pretty text-sm text-muted-foreground">{body}</p>

      <p className="mt-5 border-t border-line-subtle pt-4 font-label text-2xs uppercase tracking-slate text-subtle">
        {meta}
      </p>

      <div className="mt-5">
        <Button asChild className="w-full">
          <Link href={href}>
            <span className="absolute inset-0 rounded-card" aria-hidden="true" />
            {cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
