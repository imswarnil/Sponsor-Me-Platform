'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export function ForgotPasswordForm() {
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const email = String(new FormData(e.currentTarget).get('email') || '').trim();
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`
    });
    // Never reveal whether the address has an account — same message either way.
    if (error) setError('Something went wrong. Try again in a moment.');
    else setSent(true);
    setLoading(false);
  }

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
          {sent ? (
            <p className="text-sm text-muted-foreground">
              If that address has an account, a reset link is on its way — check your inbox.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error ? (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Send reset link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
