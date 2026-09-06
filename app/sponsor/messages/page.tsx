import { PageHeader } from '@/components/app/page-header';
import { ThreadList } from '@/components/app/thread-list';
import { requireSponsor } from '@/lib/proto/roles';
import { archiveInactiveThreads, getThreadsForUser } from '@/lib/proto/queries';
import { site } from '@/lib/site';

export const metadata = { title: 'Messages' };

export default async function SponsorMessagesPage() {
  const me = await requireSponsor('/sponsor/messages');
  await archiveInactiveThreads();
  const threads = await getThreadsForUser(me.id);

  return (
    <>
      <PageHeader
        title="Messages"
        description={`Conversations with ${site.creator}.`}
        breadcrumb={[{ label: 'Advertising', href: '/sponsor' }, { label: 'Messages' }]}
      />
      <ThreadList
        threads={threads}
        basePath="/sponsor/messages"
        otherPartyName={() => site.creator}
        empty="No conversations yet."
      />
    </>
  );
}
