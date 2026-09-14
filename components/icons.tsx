/**
 * THE ICON SET — eleven glyphs, drawn here, no package.
 *
 * Emoji used to do this job and it made the app read as a toy: an emoji is
 * rendered by the reader's OS, so its weight, colour and size are all outside
 * this design system's control, and none of them match Geist at 20px. These
 * are 24-grid strokes that inherit `currentColor` and the token that set it.
 *
 * `strokeWidth` is 1.75 everywhere: 2 reads chunky beside a 500-weight label,
 * and 1.5 disappears against `--sponsor-color-secondary`.
 */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true
};

type P = { className?: string };

/** Rank, the race, a bid slot. The only icon allowed to be gold. */
export function Trophy({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5.5H4.5V7a3 3 0 0 0 3 3M17 5.5h2.5V7a3 3 0 0 1-3 3" />
      <path d="M12 14v3M8.5 20h7M9.5 20l.5-3h4l.5 3" />
    </svg>
  );
}

/** A fixed slot: one price, one buyer. */
export function Bookmark({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M6 4.5h12v15l-6-4-6 4z" />
    </svg>
  );
}

/** What a sponsor does — the category beside their name. */
export function TagIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M20.6 13.4 12 4.8H4.8V12l8.6 8.6z" />
      <circle cx="8.6" cy="8.6" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Their website. */
export function Globe({ className }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.6 2.4 14.4 0 17M12 3.5c-2.4 2.6-2.4 14.4 0 17" />
    </svg>
  );
}

export function Check({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

export function Plus({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ArrowRight({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 12h15M13 5.5l6.5 6.5L13 18.5" />
    </svg>
  );
}

export function ArrowLeft({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M19.5 12h-15M11 5.5 4.5 12 11 18.5" />
    </svg>
  );
}

/** Leaves this site — on every sponsor's link, so a click is never a surprise. */
export function External({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M14 4.5h5.5V10M19 5l-8 8" />
      <path d="M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
    </svg>
  );
}

export function Copy({ className }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" />
    </svg>
  );
}

export function Eye({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function Play({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M8 5.2v13.6L19 12z" />
    </svg>
  );
}

export function Sun({ className }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </svg>
  );
}

export function Moon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  );
}

export function Monitor({ className }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </svg>
  );
}

export function Menu({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function Close({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/** Paired with `Check` in the "what I will and will not do" list. */
export function Ban({ className }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6.2 17.8 17.8 6.2" />
    </svg>
  );
}

/** The click hop. Used where a click-through is being counted or explained. */
export function Cursor({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M5.5 3.5l13.2 6.6-5.8 1.4-1.4 5.8z" />
      <path d="M13.4 13.4 19 19" />
    </svg>
  );
}

export function Sparkles({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5l1.6 4.4 4.4 1.6-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6z" />
      <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </svg>
  );
}
