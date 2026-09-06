import Link from 'next/link';
import { cn } from '@/lib/utils';

/* The identity, straight out of creator/1-foundation/09-logo.css:
   the record light is the mark. On the personal wordmark it sits where the
   tittle of the "i" belongs; here it sits in the top-right of the slot, which
   is exactly where a camera puts its REC light. Same dot, same argument. */

/** The Advertise With Me mark: a slot canvas with the signal dot in the corner. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative grid size-7 shrink-0 place-items-center rounded-md bg-inverse text-on-inverse',
        className
      )}
      aria-hidden
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect
          x="2"
          y="3.5"
          width="12"
          height="9"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.75"
        />
      </svg>
      <span className="absolute right-1 top-1 size-1.5 rounded-full bg-pop" />
    </span>
  );
}

/** The Advertise With Me wordmark. One accent, and the mark already spends it. */
export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 font-display text-base font-bold tracking-[-0.045em] text-foreground',
        className
      )}
    >
      <LogoMark />
      <span>Advertise With Me</span>
    </Link>
  );
}

/**
 * The personal wordmark — "Swarnıl" with the tittle drawn as the record light.
 * The "i" is the dotless Turkish ı (U+0131) because a font's own tittle can't
 * be recoloured; the dot is a separate element, so it never drifts.
 */
export function SwarnilWordmark({ className, size = 'sm' }: { className?: string; size?: 'xs' | 'sm' | 'md' }) {
  return (
    /* `normal-case` is not decoration: the mark is often placed inside slate-voice
       text, which is uppercased — and an uppercase "I" has no tittle to replace,
       so the dot would float over a letter that never had one. */
    <span className={cn('logo', `logo-${size}`, 'normal-case', className)}>
      Swarn
      <span className="logo__i">
        {'ı'}
        <i className="logo__tittle" />
      </span>
      l
    </span>
  );
}
