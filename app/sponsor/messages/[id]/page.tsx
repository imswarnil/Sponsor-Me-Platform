import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ThreadView } from '@/components/app/thread-view';
import { requireSponsor } from '@/lib/proto/roles';
import { getThreadById, getThreadMessages } from '@/lib/proto/queries';
import { site } from '@/lib/site';

export const metadata = { title: 'Conversation' };

export default async function SponsorMessageThreadPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireSponsor('/sponsor/messages');
  const { id } = await params;

  const thread = await getThreadById(id);
  if (!thread || thread.requesterId !== me.id) notFound();

  const msgs = await getThreadMessages(thread.id);

  return (
    <>
      <PageHeader
        title={thread.subject}
        description={`With ${site.creator}`}
        breadcrumb={[
          { label: 'Advertising', href: '/sponsor' },
          { label: 'Messages', href: '/sponsor/messages' },
          { label: thread.subject }
        ]}
      />
      <Card>
        <CardContent className="p-6">
          <ThreadView
            threadId={thread.id}
            messages={msgs}
            meId={me.id}
            senderName={(senderId) => (senderId === me.id ? 'You' : site.creator)}
          />
        </CardContent>
      </Card>
    </>
  );
}
