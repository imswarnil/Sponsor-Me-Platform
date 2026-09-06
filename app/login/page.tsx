import { Suspense } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { BackToSite } from '@/components/back-to-site';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-grid">
      <div className="flex items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <BackToSite className="hidden sm:inline-flex" />
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <Suspense>
          <AuthForm />
        </Suspense>
      </div>

      <p className="pb-8 text-center text-sm">
        <Link href="/" className="text-signal hover:underline">← Back to site</Link>
      </p>
    </div>
  );
}
