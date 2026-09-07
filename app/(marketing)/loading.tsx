import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shown while a marketing page's server work is still running. Every page in
 * this segment is `force-dynamic` and reads Neon (and often Ghost, YouTube or
 * GitHub) per request — without this, a slow upstream is a blank white page
 * for as long as it takes.
 *
 * Shaped like the hero it replaces rather than a generic spinner, so the
 * layout does not jump when the real thing arrives.
 */
export default function MarketingLoading() {
  return (
    <div className="mx-auto max-w-site px-gutter py-16 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div>
          <Skeleton className="h-3 w-40 rounded-full" />
          <Skeleton className="mt-5 h-11 w-full max-w-xl rounded-lg" />
          <Skeleton className="mt-3 h-11 w-3/4 max-w-lg rounded-lg" />
          <Skeleton className="mt-6 h-4 w-full max-w-lead rounded-full" />
          <Skeleton className="mt-2 h-4 w-5/6 max-w-lead rounded-full" />
          <Skeleton className="mt-2 h-4 w-2/3 max-w-lead rounded-full" />
        </div>
        <Skeleton className="h-[19rem] w-full rounded-card sm:h-[21rem]" />
      </div>

      <div className="mt-16 grid gap-5 md:grid-cols-2">
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    </div>
  );
}
