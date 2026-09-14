import Link from 'next/link';

import { ArrowLeft } from '@/components/icons';
import { Wordmark } from '@/components/chrome';

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-5 text-center">
      <div className="flex flex-col items-center">
        <Wordmark />
        <p className="sp-num mt-10 text-[5rem] font-semibold leading-none text-surface-300">
          404
        </p>
        <h1 className="sp-h1 mt-6">Nothing here</h1>
        <p className="mt-3 max-w-sm text-secondary">
          That slot moved, sold, or never existed.
        </p>
        <Link href="/" className="sp-btn sp-btn-lg mt-9">
          <ArrowLeft />
          Back home
        </Link>
      </div>
    </main>
  );
}
