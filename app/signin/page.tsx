import { AuthForm } from '@/components/auth-form';
import { AuthShell } from '@/components/auth-shell';
import { safeNext } from '@/lib/safe-next';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };

export default async function SignIn({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Welcome back" lead="Your ads are where you left them.">
      <AuthForm mode="signin" next={next ? safeNext(next, '/me') : undefined} />
    </AuthShell>
  );
}
