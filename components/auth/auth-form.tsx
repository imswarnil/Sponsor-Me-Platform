'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  signInAction,
  signUpAction,
  signInAsDemoAction,
  type AuthActionState
} from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { safeNext } from '@/lib/safe-next';

/**
 * Sign in / sign up, on Neon Auth.
 *
 * Every credential goes to a server action; nothing here ever holds an auth
 * client. That is the point — the previous Supabase version signed in from the
 * browser, which put the auth endpoint and the flow in the client bundle.
 *
 * There is no "Continue with Google" button. There was one, but the provider
 * was never actually enabled, so it had only ever produced an error — a control
 * that cannot work is worse than an absent one. Re-add it via
 * `getAuth().signIn.social` once a provider is configured in the Neon console.
 */
export function AuthForm({ demoEmail }: { demoEmail?: string }) {
  const params = useSearchParams();
  const next = safeNext(params.get('next'), '/sponsor');
  const justReset = params.get('reset') === '1';

  const [mode, setMode] = React.useState<'signin' | 'signup'>(
    params.get('mode') === 'signup' ? 'signup' : 'signin'
  );

  const isSignUp = mode === 'signup';
  const action = isSignUp ? signUpAction : signInAction;

  const [state, formAction, pending] = React.useActionState<AuthActionState, FormData>(action, {});
  const [demoState, demoAction, demoPending] = React.useActionState<AuthActionState, FormData>(
    async () => signInAsDemoAction(),
    {}
  );

  const error = state.error ?? demoState.error;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignUp ? (
            <>
              An account is how you manage your sponsorships and see how they are doing. New
              ones start with <span className="font-medium text-signal">₹1,000</span> of preview credit.
            </>
          ) : (
            'Sign in to manage your sponsorships.'
          )}
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {justReset ? (
            <p className="mb-4 rounded-md bg-success-soft px-3 py-2 text-sm text-success">
              Password changed. Sign in with your new one.
            </p>
          ) : null}

          {error ? (
            <p className="mb-4 rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {/* The demo account exists so the platform can be looked at without
              anyone inventing a password. Only rendered when one is seeded. */}
          {demoEmail && !isSignUp ? (
            <>
              <form action={demoAction}>
                <Button type="submit" variant="outline" className="w-full" disabled={demoPending}>
                  {demoPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    'Explore the demo account'
                  )}
                </Button>
              </form>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Signs you in as {demoEmail} — no password needed.
              </p>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                or
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          ) : null}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />

            {isSignUp ? (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Your name" required autoComplete="name" />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {!isSignUp ? (
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-signal hover:underline"
                  >
                    Forgot password?
                  </Link>
                ) : null}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              {isSignUp ? (
                <p className="text-xs text-muted-foreground">At least 8 characters.</p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isSignUp ? (
                'Create account'
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
        <button
          type="button"
          onClick={() => setMode(isSignUp ? 'signin' : 'signup')}
          className="font-medium text-signal hover:underline"
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </div>
  );
}
