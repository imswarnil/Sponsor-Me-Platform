import { AuthShell } from '@/components/auth-shell';
import { ResetPasswordForm } from '@/components/password-forms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Choose a new password' };

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell title="Choose a new password" lead="Then sign in with it.">
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="alert alert-danger alert-inline" role="alert">
          <p className="alert__body">
            This link is missing its token. Request a new one from the sign-in page.
          </p>
        </div>
      )}
    </AuthShell>
  );
}
