'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { revalidatePath } from 'next/cache';
import { getAuth, isAuthConfigured } from '@/lib/auth/server';
import { safeNext } from '@/lib/safe-next';
import { getCurrentUserId } from '@/lib/roles';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * The only way a client component is allowed to touch authentication.
 *
 * Everything here runs on the server, so the cookie secret and the auth base
 * URL never reach the browser bundle, and the password never sits in client
 * state longer than the keystroke that produced it.
 *
 * Sign-up needs no admin key to auto-confirm an email: Neon Auth signs the new
 * account straight in, so no key that could read and write every row exists in
 * this app at all.
 */

export interface AuthActionState {
  error?: string;
  /** Set by the reset/forgot flows, which stay on the page instead of redirecting. */
  ok?: string;
}

/**
 * A deployment missing NEON_AUTH_* would otherwise answer sign-in with a 500
 * and no explanation, discoverable only in the server log. Naming the fix on
 * the form turns the commonest deployment mistake into a sentence.
 */
const NOT_CONFIGURED =
  'Authentication is not configured on this deployment. Set NEON_AUTH_BASE_URL ' +
  'and NEON_AUTH_COOKIE_SECRET in the environment, then restart — see CLAUDE.md §3.';

const credentials = z.object({
  email: z.string().email('That does not look like an email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.')
});

const signUpFields = credentials.extend({
  name: z.string().trim().min(1, 'Please enter your name.').max(80)
});

/**
 * Neon Auth's messages are accurate but written for developers. These are the
 * same facts in the product's voice — and deliberately vague about *which*
 * half of the pair was wrong, so the form cannot be used to enumerate accounts.
 */
function readableError(message: string | undefined): string {
  if (!message) return 'Something went wrong. Try again.';
  const m = message.toLowerCase();
  if (m.includes('invalid') || m.includes('credential') || m.includes('password')) {
    return 'That email and password do not match an account.';
  }
  if (m.includes('exists') || m.includes('already')) {
    return 'An account with that email already exists. Try signing in.';
  }
  if (m.includes('not found')) return 'That email and password do not match an account.';
  return message;
}

/**
 * Where to land after signing in.
 *
 * `/studio` and `/dashboard` both bounce a viewer with the wrong role to the
 * other one (lib/roles.ts), so sending everyone to `/dashboard` is enough —
 * the creator is redirected on to the studio. That keeps this action free of
 * any role logic of its own, and therefore free of a second definition of who
 * the admin is.
 */
const AFTER_SIGN_IN = '/dashboard';

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isAuthConfigured()) return { error: NOT_CONFIGURED };

  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await getAuth().signIn.email(parsed.data);
  if (error) return { error: readableError(error.message) };

  // Outside any try/catch: redirect() works by throwing.
  redirect(safeNext(formData.get('next')?.toString(), AFTER_SIGN_IN));
}

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isAuthConfigured()) return { error: NOT_CONFIGURED };

  const parsed = signUpFields.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password')
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await getAuth().signUp.email(parsed.data);
  if (error) return { error: readableError(error.message) };

  redirect(safeNext(formData.get('next')?.toString(), AFTER_SIGN_IN));
}

export async function signOutAction(): Promise<void> {
  if (isAuthConfigured()) await getAuth().signOut();
  redirect('/');
}

/**
 * "Try the demo" — signs the caller into the seeded demo sponsor account.
 *
 * The credentials live only in the server's environment. The browser posts
 * nothing and gets back a session cookie; it never sees, and never needs, the
 * password. That is the whole reason this is a server action rather than a
 * client-side sign-in with a hardcoded password, which would put working
 * credentials for a real account into the JavaScript bundle.
 */
export async function signInAsDemoAction(): Promise<AuthActionState> {
  if (!isAuthConfigured()) return { error: NOT_CONFIGURED };

  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) {
    return {
      error:
        'No demo account is configured here. Set DEMO_EMAIL and DEMO_PASSWORD, then run `npm run db:seed`.'
    };
  }

  const { error } = await getAuth().signIn.email({ email, password });
  if (error) {
    return { error: 'The demo account is unavailable. Has `npm run db:seed` been run?' };
  }

  redirect(AFTER_SIGN_IN);
}

export async function requestPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isAuthConfigured()) return { error: NOT_CONFIGURED };

  const email = z.string().email().safeParse(formData.get('email'));
  // Always the same answer, whether or not the address exists — otherwise this
  // form is an account-enumeration oracle.
  const sent = { ok: 'If that address has an account, a reset link is on its way.' };
  if (!email.success) return sent;

  await getAuth().requestPasswordReset({
    email: email.data,
    redirectTo: '/reset-password'
  });
  return sent;
}

export async function resetPasswordAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isAuthConfigured()) return { error: NOT_CONFIGURED };

  const parsed = z
    .object({
      token: z.string().min(1, 'This reset link is missing its token.'),
      // The field is `password` on the form and `newPassword` in the SDK.
      newPassword: z.string().min(8, 'Password must be at least 8 characters.')
    })
    .safeParse({ token: formData.get('token'), newPassword: formData.get('password') });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await getAuth().resetPassword(parsed.data);
  if (error) {
    return { error: 'That reset link has expired or has already been used.' };
  }

  redirect('/signin?reset=1');
}

/**
 * Update the display name, for a signed-in account.
 *
 * Writes both copies: Neon Auth's own `name` (what a future OAuth provider or
 * the admin console would show) and `sb_profile.name` (what this app actually
 * renders everywhere — the header, the board, the ledger). The two
 * are separate rows by design (see schema.ts); nothing keeps them in sync but
 * this action, so it must always write both.
 */
export async function updateProfileAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isAuthConfigured()) return { error: NOT_CONFIGURED };

  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Sign in to update your profile.' };

  const parsed = z
    .object({ name: z.string().trim().min(1, 'Please enter a name.').max(80) })
    .safeParse({ name: formData.get('name') });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await getAuth().updateUser({ name: parsed.data.name });
  if (error) return { error: readableError(error.message) };

  await db.update(profiles).set({ name: parsed.data.name }).where(eq(profiles.id, userId));
  revalidatePath('/dashboard');
  return { ok: 'Saved.' };
}

const passwordChange = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.')
});

/** Changing a known password while signed in — distinct from the forgot/reset
 *  flow above, which is for someone who cannot sign in at all. */
export async function changePasswordAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  if (!isAuthConfigured()) return { error: NOT_CONFIGURED };

  const parsed = passwordChange.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword')
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await getAuth().changePassword(parsed.data);
  if (error) return { error: readableError(error.message) };

  return { ok: 'Password changed.' };
}
