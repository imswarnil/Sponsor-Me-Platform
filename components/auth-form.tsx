'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  signInAction,
  signInAsDemoAction,
  signUpAction,
  type AuthActionState
} from '@/lib/auth/actions';

/**
 * Sign in and sign up — one component, because they are the same four fields
 * and the same failure modes, and two copies would drift.
 *
 * The password never leaves this component except into a server action, so it
 * is never in a fetch this file writes, never in a URL, and never in the
 * client bundle's own configuration. The auth client itself is server-only.
 */
export function AuthForm({
  mode,
  next,
  demoAvailable
}: {
  mode: 'signin' | 'signup';
  next?: string;
  demoAvailable: boolean;
}) {
  const action = mode === 'signup' ? signUpAction : signInAction;
  const [state, formAction] = useActionState<AuthActionState, FormData>(action, {});

  return (
    <div className="stack">
      <form action={formAction} className="form stack-sm">
        {next ? <input type="hidden" name="next" value={next} /> : null}

        {mode === 'signup' ? (
          <div className="field">
            <label className="field__label" htmlFor="name">
              Your name
            </label>
            <input
              className="input"
              id="name"
              name="name"
              autoComplete="name"
              required
              maxLength={80}
            />
          </div>
        ) : null}

        <div className="field">
          <label className="field__label" htmlFor="email">
            Email
          </label>
          <input
            className="input"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="password">
            Password
          </label>
          <input
            className="input"
            id="password"
            name="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={8}
          />
          <p className="field__hint">At least 8 characters.</p>
        </div>

        {state.error ? (
          <div className="alert alert-danger alert-inline" role="alert">
            <p className="alert__body">{state.error}</p>
          </div>
        ) : null}

        <Submit label={mode === 'signup' ? 'Create account' : 'Sign in'} />
      </form>

      {/* Its own form with its own state: the demo action succeeds by
          redirecting and only ever returns when it fails, so its errors have
          nowhere to go unless it is wired up like any other action. */}
      {demoAvailable ? <DemoButton /> : null}

      <p className="t-small t-muted text-center m-0">
        {mode === 'signup' ? (
          <>
            Already have an account? <Link href="/signin">Sign in</Link>
          </>
        ) : (
          <>
            No account yet? <Link href="/signup">Create one</Link> ·{' '}
            <Link href="/forgot-password">Forgot password</Link>
          </>
        )}
      </p>
    </div>
  );
}

function DemoButton() {
  const [state, action] = useActionState<AuthActionState, FormData>(
    () => signInAsDemoAction(),
    {}
  );

  return (
    <form action={action} className="stack-sm">
      <button type="submit" className="btn btn-quiet btn-block btn-sm">
        Explore the demo account
      </button>
      {state.error ? (
        <div className="alert alert-danger alert-inline" role="alert">
          <p className="alert__body">{state.error}</p>
        </div>
      ) : null}
    </form>
  );
}

/**
 * Its own component because `useFormStatus` only reports the status of a form
 * ABOVE it in the tree — called in the same component as the `<form>` it would
 * always read `pending: false`.
 */
function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
      {pending ? <span className="spinner spinner-sm" aria-hidden /> : null}
      {pending ? 'Working…' : label}
    </button>
  );
}
