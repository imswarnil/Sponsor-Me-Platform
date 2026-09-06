'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { resetPasswordAction, type AuthActionState } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Neon Auth puts the reset token in the URL rather than establishing a session
 * first, which is why this carries it in a hidden field. Under Supabase the
 * emailed link created a recovery session and `updateUser` worked off that —
 * hence the deleted /auth/callback route.
 */
export function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [state, formAction, pending] = React.useActionState<AuthActionState, FormData>(
    resetPasswordAction,
    {}
  );

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight">Set a new password</h1>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-6">
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="token" value={token} />
            {state.error ? (
              <p className="rounded-md bg-destructive-soft px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
