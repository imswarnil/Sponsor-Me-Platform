'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { signInAction, signUpAction, type AuthActionState } from '@/lib/auth/actions';

/**
 * Sign in and sign up — one component, because they are the same fields and
 * the same failure modes, and two copies would drift.
 *
 * The password goes straight into a server action. It is never in a fetch this
 * file writes, never in a URL, and the auth client itself is server-only.
 */
export function AuthForm({ mode, next }: { mode: 'signin' | 'signup'; next?: string }) {
  const [state, action] = useActionState<AuthActionState, FormData>(
    mode === 'signup' ? signUpAction : signInAction,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {mode === 'signup' ? (
        <label className="block">
          <span className="text-sm font-bold">Your name</span>
          <input name="name" required maxLength={80} autoComplete="name" className="field-pop mt-1" />
        </label>
      ) : null}

      <label className="block">
        <span className="text-sm font-bold">Email</span>
        <input name="email" type="email" required autoComplete="email" className="field-pop mt-1" />
      </label>

      <label className="block">
        <span className="text-sm font-bold">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          className="field-pop mt-1"
        />
        <span className="mt-1 block text-xs text-ink-500">At least 8 characters.</span>
      </label>

      {state.error ? (
        <p className="rounded-xl border-2 border-signal-500 bg-signal-50 p-3 text-sm font-semibold text-signal-700">
          {state.error}
        </p>
      ) : null}

      <Submit label={mode === 'signup' ? 'Create account' : 'Sign in'} />

      <p className="text-center text-sm text-ink-600">
        {mode === 'signup' ? (
          <>
            Already have one? <Link href="/signin" className="font-bold underline">Sign in</Link>
          </>
        ) : (
          <>
            No account? <Link href="/signup" className="font-bold underline">Make one</Link>
          </>
        )}
      </p>
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-pop w-full bg-signal-500 text-white" disabled={pending}>
      {pending ? 'Working…' : label}
    </button>
  );
}
