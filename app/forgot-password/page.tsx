import { AuthShell } from '@/components/auth-shell';
import { ForgotPasswordForm } from '@/components/password-forms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      lead="We will email you a link. It works once, and it expires."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
