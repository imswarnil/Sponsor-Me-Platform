import { PageHeader } from '@/components/app/page-header';
import { NewPlacementForm } from '@/components/app/new-placement-form';
import { Card, CardContent } from '@/components/ui/card';
import { requireCreator } from '@/lib/proto/roles';

export const metadata = { title: 'New placement' };

export default async function NewPlacementPage({
  searchParams
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  await requireCreator('/studio/placements/new');
  const { e } = await searchParams;

  return (
    <>
      <PageHeader
        title="New placement"
        description="One spot, on one channel, at one price."
        breadcrumb={[
          { label: 'Studio', href: '/studio' },
          { label: 'Placements', href: '/studio/placements' },
          { label: 'New' }
        ]}
      />

      {e ? (
        <p className="mb-6 rounded-control bg-destructive-soft px-3 py-2 text-sm text-destructive">
          Give it a name and a price of at least 1 point.
        </p>
      ) : null}

      <Card>
        <CardContent className="p-6">
          <NewPlacementForm />
        </CardContent>
      </Card>
    </>
  );
}
