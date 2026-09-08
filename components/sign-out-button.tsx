import { signOutAction } from '@/lib/auth/actions';

/**
 * A real form posting to a server action, not a link.
 *
 * Signing out is a state change, so it must not be reachable by a GET: a
 * `<a href="/signout">` is signed out by any page that prefetches it, by a
 * link scanner, or by an <img> tag on a hostile page. A POST from a form is
 * the only shape that cannot be triggered from somewhere else.
 */
export function SignOutButton({ className = 'btn btn-sm btn-quiet' }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  );
}
