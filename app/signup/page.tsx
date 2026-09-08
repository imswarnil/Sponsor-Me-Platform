import { AuthForm } from '@/components/auth-form';
import { AuthShell } from '@/components/auth-shell';
import { formatPaise } from '@/lib/money';
import { minimumToLead } from '@/lib/queries';
import { safeNext } from '@/lib/safe-next';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create an account' };

export default async function SignUpPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ next }, minimum] = await Promise.all([searchParams, minimumToLead(null)]);

  return (
    <AuthShell
      title="Create an account"
      lead={`Write your ad, then bid. ${formatPaise(minimum)} takes first place across the network today.`}
    >
      <AuthForm
        mode="signup"
        next={next ? safeNext(next, '/dashboard') : undefined}
        demoAvailable={false}
      />
    </AuthShell>
  );
}
