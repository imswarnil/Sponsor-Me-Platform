'use client';

import { LogOut } from 'lucide-react';
import { signOutAction } from '@/lib/auth/actions';

/**
 * Sign out through a server action, so the session row is revoked on the auth
 * server rather than the cookie merely being dropped in the browser. Neon Auth
 * sessions are real rows — signing out should actually end one.
 */
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </form>
  );
}
