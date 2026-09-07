'use client';

import { useFormStatus } from 'react-dom';
import { Loader2, LogOut } from 'lucide-react';
import { signOutAction } from '@/lib/auth/actions';

/**
 * Sign out through a server action, so the session row is revoked on the auth
 * server rather than the cookie merely being dropped in the browser. Neon Auth
 * sessions are real rows — signing out should actually end one.
 */
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SignOutSubmit />
    </form>
  );
}

function SignOutSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      {pending ? 'Signing out...' : 'Sign out'}
    </button>
  );
}
