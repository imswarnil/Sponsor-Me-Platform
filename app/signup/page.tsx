import { AuthForm } from '@/components/auth-form';
import { AuthShell } from '@/components/auth-shell';
import { safeNext } from '@/lib/safe-next';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create an account' };

export default async function SignUp({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Let's go" lead="Email and a password. That's the whole form.">
      <AuthForm mode="signup" next={next ? safeNext(next, '/me') : undefined} />
    </AuthShell>
  );
}
