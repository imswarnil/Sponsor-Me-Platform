import { redirect } from 'next/navigation';
import { getViewer, homeFor } from '@/lib/proto/roles';

export const dynamic = 'force-dynamic';

/**
 * "Wherever I belong." The client cannot know whether someone is the creator or
 * a sponsor — only the server can — so sign-in sends everyone here and this
 * decides. Also handy as a stable link from anywhere that just means "my area".
 */
export default async function HomeRedirect() {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  redirect(homeFor(viewer.role));
}
