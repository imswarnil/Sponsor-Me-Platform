import { signOutAction } from '@/lib/auth/actions';

/**
 * A form, not a link. Signing out is a state change, so it must not be
 * reachable by a GET — an `<a href="/signout">` is triggered by a prefetch, a
 * link scanner, or an `<img>` tag on a hostile page.
 */
export function SignOut() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="sp-btn sp-btn-soft sp-btn-sm">
        Sign out
      </button>
    </form>
  );
}
