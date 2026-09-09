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
  return <div className="min-h-full bg-transparent">{children}</div>;
}
