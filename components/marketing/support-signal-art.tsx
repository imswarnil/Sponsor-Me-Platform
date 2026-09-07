/**
 * Pure decoration for the hero's empty right column on desktop — the signal
 * this site is named for, broadcasting outward. No text baked in (the copy
 * already carries the claim), no library: three static rings, one live ping
 * built from Tailwind's own `animate-ping`, switched off under
 * `prefers-reduced-motion` the same way the rest of the site respects it.
 */
export function SupportSignalArt() {
  return (
    <svg
      viewBox="0 0 400 320"
      aria-hidden="true"
      className="h-auto w-full max-w-md text-signal"
      fill="none"
    >
      <circle cx="72" cy="160" r="58" stroke="currentColor" strokeOpacity="0.12" />
      <circle cx="72" cy="160" r="108" stroke="currentColor" strokeOpacity="0.08" />
      <circle cx="72" cy="160" r="158" stroke="currentColor" strokeOpacity="0.05" />
      <circle
        cx="72"
        cy="160"
        r="9"
        fill="currentColor"
        className="origin-[72px_160px] animate-ping opacity-40 motion-reduce:animate-none motion-reduce:opacity-0"
      />
      <circle cx="72" cy="160" r="7" fill="currentColor" />
    </svg>
  );
}
