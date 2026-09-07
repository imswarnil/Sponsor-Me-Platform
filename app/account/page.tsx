import Link from 'next/link';
import { Logo } from '@/components/logo';
import { BackToSite } from '@/components/back-to-site';
import { ThemeToggle } from '@/components/theme-toggle';
import { AccountSettingsForm } from '@/components/auth/account-settings-form';
import { requireViewer, homeFor } from '@/lib/proto/roles';

export const metadata = { title: 'Account' };

/* Reads the session, same reason every gated page does (CLAUDE.md §3). One
   page for both roles rather than a copy under /studio and /sponsor each —
   a name and a password are not creator-specific or sponsor-specific. */
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const viewer = await requireViewer('/account');

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <div className="flex items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <BackToSite className="hidden sm:inline-flex" />
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-16">
        <h1 className="font-display text-2xl font-bold tracking-tight">Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <Link href={homeFor(viewer.role)} className="text-signal hover:underline">
            ← Back to {viewer.role === 'creator' ? 'the studio' : 'your dashboard'}
          </Link>
        </p>
        <div className="mt-8">
          <AccountSettingsForm name={viewer.name} email={viewer.email} />
        </div>
      </div>
    </div>
  );
}
