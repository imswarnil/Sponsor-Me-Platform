/**
 * The embed's own shell.
 *
 * No header, no footer, no navigation, no theme toggle — this renders inside
 * an iframe on somebody else's page and every one of those would be furniture
 * belonging to a site the reader is not on.
 *
 * It deliberately does NOT read the session. `frame-ancestors *` lets any site
 * frame these routes, and a page that is both framable by anyone and aware of
 * who is signed in is a clickjacking surface. Keeping the session out of this
 * subtree is what makes the permissive frame policy safe.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
