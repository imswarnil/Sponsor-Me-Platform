'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { getAuth, isAuthConfigured } from '@/lib/auth/server';
import { safeNext } from '@/lib/safe-next';

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
 * `/studio` and `/me` both bounce a viewer with the wrong role to the
 * other one (lib/roles.ts), so sending everyone to `/me` is enough —
 * the creator is redirected on to the studio. That keeps this action free of
 * any role logic of its own, and therefore free of a second definition of who
 * the admin is.
 */
const AFTER_SIGN_IN = '/me';

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
