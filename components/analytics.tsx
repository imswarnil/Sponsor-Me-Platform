'use client';

import { useMemo, useState } from 'react';

import { dayLabel, sum } from '@/components/charts';
import { Eye } from '@/components/icons';
import type { DayPoint } from '@/lib/queries';

/**
 * THE ANALYTICS PANEL — one series at a time, and a readout.
 *
 * WHY ONE METRIC AND NOT BOTH AT ONCE. Views and clicks differ by two orders
 * of magnitude, so drawn on a shared axis the clicks are a flat line on the
 * floor and drawn on two axes the chart is a lie about their relationship.
 * Tabs make the axis honest, and the hover readout gives both figures for the
 * day being pointed at — which is when anyone actually wants them together.
 *
 * NOTHING HERE IS INVENTED. Days inside the window with no row are measured
 * zeroes (the counter ran; nobody looked), but the whole panel is only
 * rendered when something real has been counted — the caller checks that, and
 * `EmptyAnalytics` below is what stands in until then.
 */

type Metric = 'views' | 'clicks' | 'rate';

const METRICS: { key: Metric; label: string }[] = [
  { key: 'views', label: 'Views' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'rate', label: 'Click rate' }
];

/** The value being plotted, per day, for the chosen metric. */
function valueOf(p: DayPoint, metric: Metric): number {
  if (metric === 'rate') return p.views > 0 ? (p.clicks / p.views) * 100 : 0;
  return p[metric];
}

function show(value: number, metric: Metric): string {
  return metric === 'rate'
    ? `${value.toFixed(1)}%`
    : Math.round(value).toLocaleString('en-IN');
}

export function Analytics({
  series,
  title = 'Analytics',
  lead
}: {
  series: DayPoint[];
  title?: string;
  lead?: string;
}) {
  const [metric, setMetric] = useState<Metric>('views');
  const [range, setRange] = useState<7 | 30>(30);
  const [at, setAt] = useState<number | null>(null);

  const window = useMemo(() => series.slice(-range), [series, range]);

  const values = window.map((p) => valueOf(p, metric));
  const max = Math.max(...values, metric === 'rate' ? 1 : 1);

  const views = sum(window, 'views');
  const clicks = sum(window, 'clicks');

  /** The headline figure: a total for counts, the period rate for a rate. */
  const headline =
    metric === 'rate'
      ? views > 0
        ? `${((clicks / views) * 100).toFixed(1)}%`
        : '—'
      : show(metric === 'views' ? views : clicks, metric);

  /**
   * SECOND HALF AGAINST THE FIRST — a trend without pretending to know what
   * happened before the window. A change from zero is not a percentage, so it
   * is rendered as nothing rather than as an infinity or a misleading +100%.
   */
  const half = Math.floor(window.length / 2);
  const older = window.slice(0, half);
  const newer = window.slice(half);
  const delta = useMemo(() => {
    if (metric === 'rate' || !older.length) return null;
    const a = sum(older, metric);
    const b = sum(newer, metric);
    if (a === 0) return null;
    return Math.round(((b - a) / a) * 100);
  }, [metric, older, newer]);

  const point = at !== null ? window[at] : null;

  return (
    <div className="sp-card sp-card-frame overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6 pb-0 sm:p-8 sm:pb-0">
        <div>
          <p className="sp-eyebrow">{title}</p>
          {lead ? <p className="mt-2 max-w-sm text-small text-secondary">{lead}</p> : null}
        </div>

        <div className="sp-seg" role="group" aria-label="Range">
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRange(r);
                setAt(null);
              }}
              aria-pressed={range === r}
              className="sp-seg-item sp-num"
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 px-6 pt-6 sm:px-8">
        <div>
          <div className="flex items-baseline gap-3">
            <p className="sp-num text-4xl font-semibold leading-none text-title">{headline}</p>
            {delta !== null ? (
              <span
                className={`sp-badge ${delta >= 0 ? 'sp-badge-success' : 'sp-badge-quiet'} sp-num`}
              >
                {delta >= 0 ? '+' : ''}
                {delta}%
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-tiny text-secondary">
            {METRICS.find((m) => m.key === metric)?.label.toLowerCase()} · last {range} days
            {delta !== null ? ' · against the period before' : ''}
          </p>
        </div>

        <div className="sp-seg" role="tablist" aria-label="Metric">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={metric === m.key}
              aria-pressed={metric === m.key}
              onClick={() => setMetric(m.key)}
              className="sp-seg-item"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* THE CHART. One column per day, each its own hit area — pointing at a
          3px bar is not a target, so the column is the full height of the plot
          and the bar sits inside it. */}
      <div className="px-6 pt-8 sm:px-8">
        <div className="relative h-44">
          <div className="sp-chart-rules" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} />
            ))}
          </div>

          <div
            className="relative flex h-full items-stretch gap-px"
            onMouseLeave={() => setAt(null)}
          >
            {window.map((p, i) => {
              const v = valueOf(p, metric);
              const h = max > 0 ? Math.max(v > 0 ? 3 : 1, (v / max) * 100) : 1;
              return (
                <button
                  key={p.day}
                  type="button"
                  className="sp-col"
                  data-on={at === i}
                  onMouseEnter={() => setAt(i)}
                  onFocus={() => setAt(i)}
                  onBlur={() => setAt(null)}
                  /* The readout above is the visible answer; this is the one a
                     screen reader gets, and the one a browser tooltip shows. */
                  title={`${dayLabel(p.day)} — ${p.views.toLocaleString('en-IN')} views, ${p.clicks.toLocaleString('en-IN')} clicks`}
                  aria-label={`${dayLabel(p.day)}: ${show(v, metric)}`}
                >
                  <span
                    /* `mute` and not `surface-300` for views: the chart sits
                       on a tinted card, and a bar one step off its own
                       background is a bar nobody can read. */
                    className={`sp-col-bar ${
                      metric === 'clicks'
                        ? 'bg-accent'
                        : metric === 'rate'
                          ? 'bg-gold-fill'
                          : 'bg-mute'
                    } ${v === 0 ? 'opacity-40' : ''}`}
                    style={{ blockSize: `${h}%` }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* The readout. Fixed height, so hovering the chart never reflows the
            page under the cursor. */}
        <div className="mt-4 flex h-10 items-center justify-between gap-4 border-t border-line pt-3">
          {point ? (
            <>
              <span className="sp-num text-small font-semibold text-title">
                {dayLabel(point.day)}
              </span>
              <span className="flex flex-wrap items-center gap-x-4 text-tiny text-secondary">
                <span>
                  <span className="sp-num font-semibold text-title">
                    {point.views.toLocaleString('en-IN')}
                  </span>{' '}
                  views
                </span>
                <span>
                  <span className="sp-num font-semibold text-title">
                    {point.clicks.toLocaleString('en-IN')}
                  </span>{' '}
                  clicks
                </span>
                {point.views > 0 ? (
                  <span className="sp-num">
                    {((point.clicks / point.views) * 100).toFixed(1)}%
                  </span>
                ) : null}
              </span>
            </>
          ) : (
            <>
              <span className="sp-num text-tiny text-mute">{dayLabel(window[0]!.day)}</span>
              <span className="text-tiny text-mute">
                Point at a day for its figures
              </span>
              <span className="sp-num text-tiny text-mute">
                {dayLabel(window[window.length - 1]!.day)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="mt-2 px-6 pb-6 sm:px-8 sm:pb-8">
        <p className="text-tiny leading-relaxed text-secondary">
          Counted per day, per ad. No cookies, no visitor ids, nothing about the reader —
          a counter is all a sponsor was sold.
        </p>
      </div>
    </div>
  );
}

/**
 * What stands in before anything has been counted.
 *
 * It describes the panel rather than drawing an empty one: a chart of zeroes
 * reads as "nobody looked", and until an ad has served even once that is not
 * what is true — nothing has been measured at all.
 */
export function EmptyAnalytics({ lead }: { lead: string }) {
  return (
    <div className="sp-card sp-card-frame relative overflow-hidden">
      <div className="sp-backdrop sp-dots sp-fade-t" aria-hidden />
      <div className="sp-fore flex flex-col items-center gap-3 px-6 py-16 text-center">
        <Eye className="size-7 text-mute" />
        <p className="sp-h4 font-semibold">Nothing counted yet</p>
        <p className="max-w-sm text-small text-secondary">{lead}</p>
      </div>
    </div>
  );
}
