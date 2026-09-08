import { AuthForm } from '@/components/auth-form';
import { AuthShell } from '@/components/auth-shell';
import { safeNext } from '@/lib/safe-next';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const { next, reset } = await searchParams;

  return (
    <AuthShell title="Sign in" lead="Back to your board and your numbers.">
      {reset ? (
        <div className="alert alert-success alert-inline" role="status">
          <p className="alert__body">Password changed. Sign in with the new one.</p>
        </div>
      ) : null}
      <AuthForm
        mode="signin"
        next={next ? safeNext(next, '/dashboard') : undefined}
        demoAvailable={Boolean(process.env.DEMO_EMAIL && process.env.DEMO_PASSWORD)}
      />
    </AuthShell>
  );
}
