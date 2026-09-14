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
    <form action={action} className="flex flex-col gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {mode === 'signup' ? (
        <label className="block">
          <span className="sp-flabel">Your name</span>
          <input name="name" required maxLength={80} autoComplete="name" className="sp-field" />
        </label>
      ) : null}

      <label className="block">
        <span className="sp-flabel">Email</span>
        <input name="email" type="email" required autoComplete="email" className="sp-field" />
      </label>

      <label className="block">
        <span className="sp-flabel">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          className="sp-field"
        />
        <span className="sp-hint">At least 8 characters.</span>
      </label>

      {state.error ? (
        <p className="sp-callout sp-callout-error font-semibold text-error">{state.error}</p>
      ) : null}

      <Submit label={mode === 'signup' ? 'Create account' : 'Sign in'} />

      <p className="text-center text-small text-secondary">
        {mode === 'signup' ? (
          <>
            Already have one?{' '}
            <Link href="/signin" className="sp-link font-semibold">
              Sign in
            </Link>
          </>
        ) : (
          <>
            No account?{' '}
            <Link href="/signup" className="sp-link font-semibold">
              Make one
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="sp-btn sp-btn-block sp-btn-lg mt-1" disabled={pending}>
      {pending ? 'Working…' : label}
    </button>
  );
}
