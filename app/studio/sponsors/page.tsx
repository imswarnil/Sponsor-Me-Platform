import Link from 'next/link';
import { formatAmount } from '@/lib/money';
import { PageHeader } from '@/components/app/page-header';
import { StatTile, StatRow } from '@/components/app/stat-tile';
import { ChannelBadge } from '@/components/app/channel-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { requireCreator } from '@/lib/proto/roles';
import {
  expireStaleSlots,
  getActiveSponsorsOf,
  getEarnings,
  getPastSponsors,
  getSponsorLedger,
  validityLabel
} from '@/lib/proto/queries';

export const metadata = { title: 'Advertisers' };

const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default async function SponsorsPage() {
  const me = await requireCreator('/studio/sponsors');
  await expireStaleSlots();

  const [active, ledger, earnings, history] = await Promise.all([
    getActiveSponsorsOf(me.id),
    getSponsorLedger(me.id),
    getEarnings(me.id),
    getPastSponsors(me.id)
  ]);
  const past = history.filter((h) => new Date(h.endAt) < new Date());

  return (
    <>
      <PageHeader
        title="Advertisers"
        description="Who is backing the work, what they took, and what they paid."
        breadcrumb={[{ label: 'Studio', href: '/studio' }, { label: 'Advertisers' }]}
      />

      <StatRow>
        <StatTile label="Running now" value={active.length} sub="live placements" />
        <StatTile label="Advertisers" value={earnings.sponsors} sub="all time" />
        <StatTile label="Deals" value={earnings.deals} sub="all time" />
        <StatTile label="Earned" value={formatAmount(earnings.total)} sub="all time" />
      </StatRow>

      <section className="mt-10">
        <h2 className="mb-3 font-label text-2xs uppercase tracking-slate text-subtle">
          Running now
        </h2>
        {active.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nothing running right now. Everything you have listed is open.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {active.map(({ slot, sponsor }) => (
              <Card key={slot.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-semibold tracking-tight">
                        {sponsor.name || sponsor.email}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        on{' '}
                        <Link
                          href={`/studio/placements/${slot.id}`}
                          className="text-foreground hover:text-signal"
                        >
                          {slot.name}
                        </Link>
                      </p>
                    </div>
                    <Badge variant="craft">{validityLabel(slot.sponsoredUntil)}</Badge>
                  </div>

                  <div className="mt-4 border-t border-line-subtle pt-4">
                    <p className="font-label text-2xs uppercase tracking-slate text-subtle">
                      Their creative
                    </p>
                    <p className="mt-1.5 text-sm">{slot.adHeadline}</p>
                    {slot.adLinkUrl ? (
                      <a
                        href={slot.adLinkUrl}
                        rel="noopener noreferrer nofollow"
                        target="_blank"
                        className="mt-1 block truncate text-xs text-signal hover:underline"
                      >
                        {slot.adLinkUrl}
                      </a>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <ChannelBadge placement={slot.placement} />
                    <span className="font-label text-2xs uppercase tracking-slate text-subtle">
                      {slot.sponsoredStart ? fmtDate(slot.sponsoredStart) : '—'} –{' '}
                      {slot.sponsoredUntil ? fmtDate(slot.sponsoredUntil) : '—'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 font-label text-2xs uppercase tracking-slate text-subtle">
            Past advertisers
          </h2>
          <div className="space-y-3">
            {past.map((h) => (
              <Card key={h.id}>
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display font-semibold tracking-tight">{h.headline}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {h.slotName} · {fmtDate(h.startAt)} – {fmtDate(h.endAt)}
                      </p>
                    </div>
                    <span className="font-label text-2xs uppercase tracking-slate text-subtle">
                      {formatAmount(h.amount)}
                    </span>
                  </div>
                  {h.brief ? (
                    <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                      {h.brief}
                    </p>
                  ) : null}
                  {h.linkUrl ? (
                    <a
                      href={h.linkUrl}
                      rel="noopener noreferrer nofollow"
                      target="_blank"
                      className="mt-2 inline-block truncate text-xs text-signal hover:underline"
                    >
                      {h.ctaLabel || h.linkUrl}
                    </a>
                  ) : null}
                  {h.socials && h.socials.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {h.socials.map((s, i) => (
                        <li key={i}>
                          <a
                            href={s.url}
                            className="rounded-control border border-line-subtle px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                            rel="noopener noreferrer nofollow"
                            target="_blank"
                          >
                            {s.platform}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-3 font-label text-2xs uppercase tracking-slate text-subtle">
          Everyone who has advertised
        </h2>
        {ledger.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Nobody yet. Share a placement&rsquo;s public page to get the first one.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line-subtle text-left">
                    <th className="px-5 py-3 font-label text-2xs uppercase tracking-slate text-subtle">
                      Advertiser
                    </th>
                    <th className="px-5 py-3 font-label text-2xs uppercase tracking-slate text-subtle">
                      Placement
                    </th>
                    <th className="px-5 py-3 font-label text-2xs uppercase tracking-slate text-subtle">
                      When
                    </th>
                    <th className="px-5 py-3 text-right font-label text-2xs uppercase tracking-slate text-subtle">
                      Paid
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map(({ txn, slot, sponsor }) => (
                    <tr key={txn.id} className="border-b border-line-subtle last:border-0">
                      <td className="px-5 py-3 font-medium">{sponsor.name || sponsor.email}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {slot ? (
                          <Link
                            href={`/studio/placements/${slot.id}`}
                            className="hover:text-foreground"
                          >
                            {slot.name}
                          </Link>
                        ) : (
                          <span className="text-faint">deleted placement</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{fmtDate(txn.createdAt)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {txn.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
}
