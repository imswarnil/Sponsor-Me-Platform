import Link from 'next/link';

import { Rig } from '@/components/rig';

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
    <>
      <Rig />
      <main className="relative z-10 grid min-h-[100dvh] place-items-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="no-underline">
            <span className="text-lg font-semibold tracking-tight text-ink-900">
              Sponsor<span className="text-signal-500">Me</span>
            </span>
          </Link>

          <div className="panel mt-6 p-7">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {lead ? <p className="mt-1 text-sm text-ink-600">{lead}</p> : null}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </main>
    </>
  );
}
