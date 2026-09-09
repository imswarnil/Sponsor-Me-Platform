import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-signal-50 px-4 text-center">
      <div>
        <p className="text-7xl">🕳️</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight">Nothing here</h1>
        <p className="mt-1 text-ink-600">That slot moved, sold, or never existed.</p>
        <Link href="/" className="btn-pop mt-6 bg-signal-500 text-white">
          Back home
        </Link>
      </div>
    </main>
  );
}
