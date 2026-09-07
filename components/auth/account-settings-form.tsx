'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { updateProfileAction, changePasswordAction, type AuthActionState } from '@/lib/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Two independent forms, two independent server actions — a typo in your new
 * password should never risk your name, and vice versa.
 */
export function AccountSettingsForm({ name, email }: { name: string; email: string | null }) {
  const [profileState, profileAction, profilePending] = React.useActionState<
    AuthActionState,
    FormData
  >(updateProfileAction, {});
  const [passwordState, passwordAction, passwordPending] = React.useActionState<
    AuthActionState,
    FormData
  >(changePasswordAction, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {email ?? 'No email on file'} — email is managed by sign-in, not editable here.
          </p>
          <form action={profileAction} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={name} required maxLength={80} />
            </div>
            {profileState.error ? (
              <p className="text-sm text-destructive">{profileState.error}</p>
            ) : profileState.ok ? (
              <p className="text-sm text-signal">{profileState.ok}</p>
            ) : null}
            <Button type="submit" disabled={profilePending}>
              {profilePending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save name
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-display text-lg font-semibold tracking-tight">Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Forgot your current one instead? <a href="/forgot-password" className="text-signal hover:underline">Reset it by email</a>.
          </p>
          <form action={passwordAction} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            {passwordState.error ? (
              <p className="text-sm text-destructive">{passwordState.error}</p>
            ) : passwordState.ok ? (
              <p className="text-sm text-signal">{passwordState.ok}</p>
            ) : null}
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Change password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
