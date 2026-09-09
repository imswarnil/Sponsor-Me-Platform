import { signOutAction } from '@/lib/auth/actions';

/**
 * A form, not a link. Signing out is a state change, so it must not be
 * reachable by a GET — an `<a href="/signout">` is triggered by a prefetch, a
 * link scanner, or an `<img>` tag on a hostile page.
 */
export function SignOut() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="btn-pop bg-white text-sm">
        Sign out
      </button>
    </form>
  );
}
