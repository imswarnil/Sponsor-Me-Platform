'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import {
  requestPasswordResetAction,
  resetPasswordAction,
  type AuthActionState
} from '@/lib/auth/actions';

/**
 * The two halves of the forgot-password flow.
 *
 * The request form ALWAYS reports the same thing, whether or not the address
 * exists. A form that says "no account with that email" is an account
 * enumeration oracle — a way for anyone to test a list of addresses against
 * this platform's membership. The reassuring message is the secure one.
 */
export function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthActionState, FormData>(
    requestPasswordResetAction,
    {}
  );

  return (
    <form action={action} className="form stack-sm">
      <div className="field">
        <label className="field__label" htmlFor="email">
          Email
        </label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>

      {state.ok ? (
        <div className="alert alert-success alert-inline" role="status">
          <p className="alert__body">{state.ok}</p>
        </div>
      ) : null}
      {state.error ? (
        <div className="alert alert-danger alert-inline" role="alert">
          <p className="alert__body">{state.error}</p>
        </div>
      ) : null}

      <Submit label="Send the link" />
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<AuthActionState, FormData>(resetPasswordAction, {});

  return (
    <form action={action} className="form stack-sm">
      <input type="hidden" name="token" value={token} />

      <div className="field">
        <label className="field__label" htmlFor="password">
          New password
        </label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
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

      <Submit label="Change password" />
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
      {pending ? 'Working…' : label}
    </button>
  );
}
