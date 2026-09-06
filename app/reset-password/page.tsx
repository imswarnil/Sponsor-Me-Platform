import Link from 'next/link';
import { Logo } from '@/components/logo';
import { BackToSite } from '@/components/back-to-site';
import { ThemeToggle } from '@/components/theme-toggle';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = { title: 'Set new password' };

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-grid">
      <div className="flex items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <BackToSite className="hidden sm:inline-flex" />
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <ResetPasswordForm />
      </div>

      <p className="pb-8 text-center text-sm">
        <Link href="/login" className="text-signal hover:underline">← Back to log in</Link>
      </p>
    </div>
  );
}
