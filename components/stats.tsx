import { formatPaise } from '@/lib/money';

/**
 * THE NUMBERS.
 *
 * No charting library, deliberately. The only chart this product needs is
 * thirty columns with a height, a baseline and two gridlines — which is a flex
 * row of divs. Recharts would ship more JavaScript to every dashboard than the
 * entire design system does, to draw bars.
 *
 * The rule every component here obeys: a figure is real or it is absent. None
 * of these will render a zero that could be mistaken for a measurement, and
 * none will interpolate a value it was not given.
 */

/** One cell in an instrument panel. Use inside `.figures`. */
export function Figure({
  value,
  label,
  note,
  accent
}: {
  value: string | number;
  label: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className="figure-cell">
      <span className={`figure-cell__value ${accent ? 'figure-cell__value-accent' : ''}`}>
        {value}
      </span>
      <span className="figure-cell__label">{label}</span>
      {note ? <span className="figure-cell__note">{note}</span> : null}
    </div>
  );
}

export function MoneyFigure({
  label,
  paise,
  note,
  accent
}: {
  label: string;
  paise: number;
  note?: string;
  accent?: boolean;
}) {
  return <Figure label={label} value={formatPaise(paise)} note={note} accent={accent} />;
}

/**
 * Thirty days of views and clicks.
 *
 * A day with no impressions draws a visible floor bar in the line colour, not
 * a gap. A gap reads as "not measured"; a floor reads as "measured, and it was
 * nothing" — which is the true and more useful statement.
 *
 * Renders nothing at all when there is no data anywhere in the window, rather
 * than an empty axis that looks like a measurement of zero.
 */
export function Chart({
  series,
  days = 30
}: {
  series: { day: string; views: number; clicks?: number }[];
  days?: number;
}) {
  if (!series.length) return null;

  const byDay = new Map(series.map((row) => [String(row.day).slice(0, 10), row.views]));
  const today = new Date();
  const cols: { key: string; views: number; label: string }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cols.push({
      key,
      views: byDay.get(key) ?? 0,
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    });
  }

  const peak = Math.max(...cols.map((c) => c.views), 1);

  return (
    <div>
      <div className="chart" role="img" aria-label={`Views over the last ${days} days`}>
        {cols.map((col) => (
          <div key={col.key} className="chart__col" title={`${col.label}: ${col.views} views`}>
            <span
              className={`chart__bar ${
                col.views === 0
                  ? 'chart__bar-zero'
                  : col.views === peak
                    ? 'chart__bar-peak'
                    : ''
              }`}
              style={{ blockSize: `${Math.max(3, (col.views / peak) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="chart__axis">
        <span>{cols[0]?.label}</span>
        <span>{peak.toLocaleString('en-IN')} peak</span>
        <span>{cols[cols.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/**
 * A labelled bar — one row per slot, or per anything with a share of a total.
 * The bar is the comparison; the number is the detail underneath it.
 */
export function MeterRow({
  label,
  value,
  max,
  detail
}: {
  label: string;
  value: number;
  max: number;
  detail?: string;
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="meter-row">
      <span className="t-small truncate-1">{label}</span>
      <span className="t-data-sm live-figure">{detail ?? value.toLocaleString('en-IN')}</span>
      <span className="meter-row__track">
        <span className="meter-row__fill" style={{ inlineSize: `${pct}%` }} />
      </span>
    </div>
  );
}

/** Clicks ÷ views, or null when there is nothing to divide. */
export function ctr(views: number, clicks: number): string | null {
  if (views <= 0) return null;
  return `${((clicks / views) * 100).toFixed(2)}%`;
}
