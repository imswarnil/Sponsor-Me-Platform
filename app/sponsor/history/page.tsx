import { PageHeader } from '@/components/app/page-header';
import { StatTile, StatRow } from '@/components/app/stat-tile';
import { Ledger, type LedgerRow } from '@/components/app/ledger';
import { requireSponsor } from '@/lib/proto/roles';
import { getSponsorHistory } from '@/lib/proto/queries';
import { site } from '@/lib/site';

export const metadata = { title: 'History' };

export default async function SponsorHistoryPage() {
  const me = await requireSponsor('/sponsor/history');
  const history = await getSponsorHistory(me.id);

  const spent = history.reduce((n, h) => n + h.txn.amount, 0);

  const rows: LedgerRow[] = history.map(({ txn, slot }) => ({
    id: txn.id,
    earned: false,
    amount: txn.amount,
    counterparty: site.creator,
    subject: slot?.name ?? 'a placement since removed',
    at: txn.createdAt
  }));

  return (
    <>
      <PageHeader
        title="History"
        description="Everywhere you have advertised, and what it cost."
        breadcrumb={[{ label: 'Advertising', href: '/sponsor' }, { label: 'History' }]}
      />

      <StatRow>
        <StatTile label="Balance" value={me.points} sub="points" />
        <StatTile label="Spent" value={spent} sub="all time" />
        <StatTile label="Placements" value={history.length} sub="all time" />
      </StatRow>

      <div className="mt-6">
        <Ledger rows={rows} empty="You haven't advertised anywhere yet." />
      </div>

      <p className="mt-6 max-w-measure text-sm text-muted-foreground">
        Points are the stand-in for money while the flow is being proved out — nothing here has
        been charged to a card.
      </p>
    </>
  );
}
