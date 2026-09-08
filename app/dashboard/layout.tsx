import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { requireSponsor } from '@/lib/roles';

/**
 * EVERY ROUTE UNDER /dashboard READS THE SESSION, so the whole segment is
 * dynamic — declared here once, cascading to the children.
 *
 * Get this wrong and Next prerenders a signed-out dashboard and serves it to
 * everybody who asks.
 */
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // The gate. A signed-out visitor is redirected to /signin, and the creator
  // is sent to their studio.
  await requireSponsor();

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
