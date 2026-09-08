import { PageHeader } from '@/components/app/page-header';
import { StatTile, StatRow } from '@/components/app/stat-tile';
import { Ledger, type LedgerRow } from '@/components/app/ledger';
import { requireCreator } from '@/lib/proto/roles';
import { getEarnings, getUserById, getUserTxns } from '@/lib/proto/queries';

export const metadata = { title: 'Earnings' };

export default async function EarningsPage() {
  const me = await requireCreator('/studio/earnings');
  const [txns, earnings] = await Promise.all([getUserTxns(me.id), getEarnings(me.id)]);

  // One lookup per counterparty rather than per row — a busy month is mostly
  // the same handful of sponsors.
  const otherIds = [...new Set(txns.map((t) => (t.toId === me.id ? t.fromId : t.toId)))];
  const names = new Map<string, string>();
  await Promise.all(
    otherIds.map(async (id) => {
      const u = await getUserById(id);
      names.set(id, u?.name || u?.email || 'someone');
    })
  );

  const rows: LedgerRow[] = txns.map((t) => {
    const earned = t.toId === me.id;
    const otherId = earned ? t.fromId : t.toId;
    return {
      id: t.id,
      earned,
      amount: t.amount,
      counterparty: names.get(otherId) ?? 'someone',
      at: t.createdAt
    };
  });

  return (
    <>
      <PageHeader
        title="Earnings"
        description="Your balance, and every movement in or out."
        breadcrumb={[{ label: 'Studio', href: '/studio' }, { label: 'Earnings' }]}
      />

      <StatRow>
        <StatTile label="Balance" value={me.points} sub="points" />
        <StatTile label="Earned" value={earnings.total} sub="all time" />
        <StatTile label="Deals" value={earnings.deals} sub="all time" />
        <StatTile label="Advertisers" value={earnings.sponsors} sub="distinct" />
      </StatRow>

      <div className="mt-6">
        <Ledger rows={rows} empty="No transfers yet." />
      </div>

      <p className="mt-6 max-w-measure text-sm text-muted-foreground">
        Points are the stand-in for money while the flow is being proved out. Nothing here is a
        real balance, and nothing has been charged to anyone.
      </p>
    </>
  );
}
