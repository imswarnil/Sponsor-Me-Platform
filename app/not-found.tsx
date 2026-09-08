import Link from 'next/link';

import { Wordmark } from '@/components/wordmark';

export default function NotFound() {
  return (
    <div className="section section-loose">
      <div className="container container-sm text-center">
        <div className="stack">
          <Wordmark />
          <p className="eyebrow">Error 404</p>
          <h1 className="t-h2">Nothing in this slot</h1>
          <p className="t-lead t-muted">
            The page you asked for has been moved, renamed, or never existed.
          </p>
          <div className="cluster cluster-center">
            <Link href="/" className="btn btn-primary">
              Back to the board
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
