import type { DayPoint } from '@/lib/queries';

/**
 * CHARTS, DRAWN BY HAND.
 *
 * No charting library: §5 of CLAUDE.md keeps the dependency list to what the
 * product needs, and every chart in this app is one series of daily integers.
 * A library for that is 40kB to draw a polyline.
 *
 * Colour comes from `currentColor` and from tokens, so a chart inherits its
 * surroundings and re-tones in the dark theme with everything else.
 */

/** A day, as a person reads it. */
export function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  });
}

export function sum(series: DayPoint[], metric: 'views' | 'clicks'): number {
  return series.reduce((n, p) => n + p[metric], 0);
}

/**
 * A sparkline: the shape of a series, at the size of a word.
 *
 * `preserveAspectRatio="none"` lets one viewBox stretch to any cell width,
 * and `vector-effect="non-scaling-stroke"` is what stops that stretch from
 * turning the 1.5px line into a 6px wedge.
 *
 * A flat-zero series draws nothing at all rather than a straight line along
 * the floor — a line implies a measurement, and there isn't one.
 */
export function Sparkline({
  series,
  metric = 'views',
  className = 'h-8 w-24'
}: {
  series: DayPoint[];
  metric?: 'views' | 'clicks';
  className?: string;
}) {
  const values = series.map((p) => p[metric]);
  const max = Math.max(...values, 0);
  if (!series.length || max === 0) return null;

  const step = series.length > 1 ? 100 / (series.length - 1) : 0;
  const y = (v: number) => 28 - (v / max) * 26;
  const line = values.map((v, i) => `${i * step},${y(v)}`).join(' ');

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      <polygon
        points={`0,30 ${line} 100,30`}
        fill="currentColor"
        opacity="0.12"
      />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * A share meter — one figure against a total, as a bar.
 *
 * Used where a percentage alone is hard to feel: 3.4% of the leader and 34%
 * of the leader are two characters apart and a completely different position.
 */
export function Meter({
  value,
  max,
  tone = ''
}: {
  value: number;
  max: number;
  tone?: 'sp-track-fill-accent' | 'sp-track-fill-gold' | '';
}) {
  /* A floor of 1.5% so a real-but-tiny value is still visible — but ZERO
     gets nothing. A sliver against an em-dash reads as "a little", and the
     figure beside it says there is none. */
  const pct = value > 0 && max > 0 ? Math.min(100, Math.max(1.5, (value / max) * 100)) : 0;
  return (
    <div className="sp-track" role="presentation">
      <span className={`sp-track-fill ${tone}`} style={{ inlineSize: `${pct}%` }} />
    </div>
  );
}
