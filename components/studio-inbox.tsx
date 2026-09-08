import Link from 'next/link';

import { RelativeTime } from '@/components/marketing';

/**
 * Every conversation, newest first.
 *
 * A summary rather than a mailbox: each row opens the thread on its own page,
 * because a reply box per row on a page that already carries the whole studio
 * would be a lot of mounted forms for something used once a week.
 */
export function StudioInbox({
  threads
}: {
  threads: {
    profileId: string;
    name: string;
    brand: string | null;
    email: string | null;
    last: Date;
    unread: number;
  }[];
}) {
  if (!threads.length) {
    return <p className="t-small t-muted m-0">No messages yet.</p>;
  }

  return (
    <ul className="list list-flush">
      {threads.map((thread) => (
        <li key={thread.profileId} className="list__item">
          <div className="list__body">
            <p className="list__title truncate-1">
              <Link href={`/studio/messages/${thread.profileId}`}>
                {thread.brand || thread.name || thread.email || 'Sponsor'}
              </Link>
            </p>
            <p className="list__desc t-fine t-faint">
              <RelativeTime date={thread.last} />
            </p>
          </div>
          {thread.unread > 0 ? (
            <span className="list__end badge badge-accent">{thread.unread}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
