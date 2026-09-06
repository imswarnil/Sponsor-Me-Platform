import { PageHeader } from '@/components/app/page-header';
import { ThreadList } from '@/components/app/thread-list';
import { requireCreator } from '@/lib/proto/roles';
import { archiveInactiveThreads, getThreadsForUser, getUserById } from '@/lib/proto/queries';

export const metadata = { title: 'Messages' };

export default async function StudioMessagesPage() {
  const me = await requireCreator('/studio/messages');
  await archiveInactiveThreads();
  const threads = await getThreadsForUser(me.id);

  const requesterNames = await Promise.all(
    threads.map(async (t) => {
      const user = await getUserById(t.requesterId);
      return [t.id, user?.name || user?.email || 'Someone'] as const;
    })
  );
  const nameById = new Map(requesterNames);

  return (
    <>
      <PageHeader
        title="Messages"
        description="Conversations with advertisers — including anyone asking for something not listed."
        breadcrumb={[{ label: 'Studio', href: '/studio' }, { label: 'Messages' }]}
      />
      <ThreadList
        threads={threads}
        basePath="/studio/messages"
        otherPartyName={(t) => nameById.get(t.id) ?? 'Someone'}
        empty="No conversations yet."
      />
    </>
  );
}
