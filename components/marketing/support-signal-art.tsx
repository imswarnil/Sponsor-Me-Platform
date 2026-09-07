import { Megaphone } from 'lucide-react';

/**
 * Pure decoration for the hero's empty right column on desktop — a small
 * illustration of the site's actual claim: one signal, reaching people
 * directly, nothing in between. The megaphone is the real lucide icon (the
 * same one two-doors.tsx uses for "For brands") laid over hand-drawn rings
 * and supporter dots — sidestepping hand-drawn icon geometry, which is easy
 * to get backwards without a live renderer to check it against. One color
 * throughout (the system's own accent), no library beyond what's already a
 * dependency. The ping is Tailwind's own `animate-ping`, switched off under
 * `prefers-reduced-motion` the same way the rest of the site does.
 */
export function SupportSignalArt() {
  return (
    <div className="relative aspect-[400/320] w-96 text-signal">
      <svg viewBox="0 0 400 320" aria-hidden="true" className="absolute inset-0 size-full" fill="none">
        {/* The three broadcast rings. */}
        <circle cx="80" cy="160" r="58" stroke="currentColor" strokeOpacity="0.14" />
        <circle cx="80" cy="160" r="108" stroke="currentColor" strokeOpacity="0.09" />
        <circle cx="80" cy="160" r="158" stroke="currentColor" strokeOpacity="0.06" />

        {/* The supporters, sitting on the rings the signal actually reaches. */}
        <circle cx="118" cy="106" r="5" fill="currentColor" fillOpacity="0.35" />
        <circle cx="168" cy="230" r="6" fill="currentColor" fillOpacity="0.45" />
        <circle cx="223" cy="95" r="4" fill="currentColor" fillOpacity="0.3" />

        {/* The live pulse — one supporter arriving right now. */}
        <circle
          cx="80"
          cy="160"
          r="9"
          fill="currentColor"
          className="origin-[80px_160px] animate-ping opacity-40 motion-reduce:animate-none motion-reduce:opacity-0"
        />
      </svg>

      <Megaphone
        aria-hidden="true"
        className="absolute size-9"
        style={{ left: '20%', top: '50%', transform: 'translate(-50%, -50%)' }}
      />
    </div>
  );
}
