import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ThreadView } from '@/components/app/thread-view';
import { requireCreator } from '@/lib/proto/roles';
import { getThreadById, getThreadMessages, getUserById } from '@/lib/proto/queries';

export const metadata = { title: 'Conversation' };

export default async function StudioMessageThreadPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireCreator('/studio/messages');
  const { id } = await params;

  const thread = await getThreadById(id);
  if (!thread || thread.creatorId !== me.id) notFound();

  const [msgs, requester] = await Promise.all([
    getThreadMessages(thread.id),
    getUserById(thread.requesterId)
  ]);
  const requesterName = requester?.name || requester?.email || 'Someone';

  return (
    <>
      <PageHeader
        title={thread.subject}
        description={`With ${requesterName}`}
        breadcrumb={[
          { label: 'Studio', href: '/studio' },
          { label: 'Messages', href: '/studio/messages' },
          { label: thread.subject }
        ]}
      />
      <Card>
        <CardContent className="p-6">
          <ThreadView
            threadId={thread.id}
            messages={msgs}
            meId={me.id}
            senderName={(senderId) => (senderId === me.id ? 'You' : requesterName)}
          />
        </CardContent>
      </Card>
    </>
  );
}
