/**
 * The embed's shell: nothing.
 *
 * No header, no footer, no navigation — this renders inside an iframe on
 * somebody else's page, where every one of those is furniture belonging to a
 * site the reader is not on.
 *
 * It deliberately does not read the session, which is what makes the
 * permissive `frame-ancestors *` policy safe.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  /* `min-h-screen` inside an iframe means "the height the host reserved", so
     the unit fills the space it was given instead of leaving a dead gap under
     itself. The flex column is what lets the ad stretch to it. */
  return <div className="flex min-h-screen flex-col bg-transparent">{children}</div>;
}
