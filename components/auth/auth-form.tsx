'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { signUpAction } from '@/lib/proto/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { safeNext } from '@/lib/safe-next';

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  // /home is a server redirect that knows the role — the client does not.
  const next = safeNext(params.get('next'));

  const [mode, setMode] = React.useState<'signin' | 'signup'>(
    params.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onGoogle() {
    setGoogleLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` }
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success the browser navigates away to Google, so no further state change here.
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    const supabase = createClient();

    try {
      if (mode === 'signup') {
        const name = String(fd.get('name') || '').trim();
        const { error } = await signUpAction({ email, password, name });
        if (error) throw new Error(error);
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw new Error(signInError.message);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error('Invalid email or password');
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  const isSignUp = mode === 'signup';

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSignUp ? (
            <>
              An account is how you manage your placements and see how they are doing. New ones
              start with <span className="font-medium text-signal">1000 points</span>.
            </>
          ) : (
            'Sign in to manage your placements.'
          )}
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {error ? (
            <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={googleLoading}
            onClick={onGoogle}
          >
            {googleLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <GoogleIcon className="size-4" /> Continue with Google
              </>
            )}
          </Button>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {isSignUp ? (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Your name" required autoComplete="name" />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
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
              {isSignUp ? <p className="text-xs text-muted-foreground">At least 8 characters.</p> : null}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : isSignUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(isSignUp ? 'signin' : 'signup');
            setError(null);
          }}
          className="font-medium text-signal hover:underline"
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.26a12 12 0 0 0 0 10.73l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.63l4.01 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
