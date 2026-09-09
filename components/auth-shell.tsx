import Link from 'next/link';

/** The frame around both auth pages: one playful card, nothing else. */
export function AuthShell({
  title,
  lead,
  children
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-signal-50 px-4 py-16">
      <span
        aria-hidden
        className="absolute -left-10 top-20 h-40 w-40 rotate-12 rounded-3xl border-2 border-ink-900 bg-teal-200 opacity-60"
      />
      <span
        aria-hidden
        className="absolute -right-12 bottom-24 h-48 w-48 -rotate-12 rounded-full border-2 border-ink-900 bg-iris-200 opacity-60"
      />

      <div className="relative mx-auto max-w-md">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-ink-900 bg-signal-500 text-lg shadow-[3px_3px_0_0_var(--color-ink-900)]">
            👋
          </span>
          <span className="text-lg font-black tracking-tight">
            Sponsor<span className="text-signal-500">&nbsp;Me</span>
          </span>
        </Link>

        <div className="card-pop card-pop-lg mt-6 p-7">
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          {lead ? <p className="mt-1 text-ink-600">{lead}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
