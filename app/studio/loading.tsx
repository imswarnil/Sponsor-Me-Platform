import { Skeleton } from '@/components/ui/skeleton';

/** Every studio page reads the session and the database per request (§3), so
 *  a slow query would otherwise be an empty console shell. */
export default function StudioLoading() {
  return (
    <div>
      <Skeleton className="h-3 w-28 rounded-full" />
      <Skeleton className="mt-4 h-8 w-64 rounded-lg" />
      <Skeleton className="mt-3 h-4 w-full max-w-lead rounded-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>
      <Skeleton className="mt-8 h-64 rounded-card" />
    </div>
  );
}
