import Link from 'next/link';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { MessageThread } from '@/components/message-thread';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { markThreadReadAction } from '@/lib/actions';
import { requireCreator } from '@/lib/roles';
import { threadFor } from '@/lib/queries';

/** One conversation, from the creator's side. */
export const dynamic = 'force-dynamic';

export default async function StudioThreadPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCreator();
  const { id } = await params;

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  if (!profile) notFound();

  const messages = await threadFor(id);
  // Opening the thread is reading it.
  await markThreadReadAction(id);

  return (
    <div className="section">
      <div className="container container-md stack">
        <header className="page-head page-head-sm">
          <div className="page-head__main">
            <p className="page-head__eyebrow">
              <Link href="/studio">← Studio</Link>
            </p>
            <h1 className="page-head__title">{profile.brand || profile.name || profile.email}</h1>
            {profile.email ? <p className="page-head__meta t-fine t-faint">{profile.email}</p> : null}
          </div>
        </header>

        <MessageThread messages={messages} selfIsCreator profileId={profile.id} />
      </div>
    </div>
  );
}
