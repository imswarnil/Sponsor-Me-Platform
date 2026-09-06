'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { requestPasswordResetAction, type AuthActionState } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export function ForgotPasswordForm() {
  const [state, formAction, pending] = React.useActionState<AuthActionState, FormData>(
    requestPasswordResetAction,
    {}
  );

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&rsquo;ll email you a link to set a new one.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          {state.ok ? (
            <p className="text-sm text-muted-foreground">{state.ok} Check your inbox.</p>
          ) : (
            <form action={formAction} className="space-y-4">
              {state.error ? (
                <p className="rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">
                  {state.error}
                </p>
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
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : 'Send reset link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
