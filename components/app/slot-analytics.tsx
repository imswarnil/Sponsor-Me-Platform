import { Card, CardContent } from '@/components/ui/card';

type Point = { date: string; views: number; clicks: number };

/* Two series, two of the system's own hues: azure for the passive measure and
   the craft amber for the one that took an action. Both are tokens, so the
   chart follows the theme instead of freezing a light-mode blue into the SVG. */
const C_VIEWS = 'var(--info-line)';
const C_CLICKS = 'var(--craft)';

function fmtDay(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function SlotAnalytics({ data }: { data: Point[] }) {
  const totalViews = data.reduce((n, p) => n + p.views, 0);
  const totalClicks = data.reduce((n, p) => n + p.clicks, 0);
  const ctr = totalViews ? (totalClicks / totalViews) * 100 : 0;

  const W = 720;
  const H = 200;
  const padL = 30;
  const padR = 14;
  const padT = 14;
  const padB = 24;
  const n = data.length;
  const yMax = Math.max(1, ...data.map((p) => p.views), ...data.map((p) => p.clicks));

  const x = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const y = (v: number) => padT + (1 - v / yMax) * (H - padT - padB);
  const line = (key: 'views' | 'clicks') =>
    data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(' ');
  const area = `${line('views')} L ${x(n - 1).toFixed(1)} ${y(0)} L ${x(0).toFixed(1)} ${y(0)} Z`;
  const gridVals = [0, Math.round(yMax / 2), yMax];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-label text-2xs uppercase tracking-slate text-subtle">Last {n} days</p>
            <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: C_VIEWS }} /> Views {totalViews}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: C_CLICKS }} /> Clicks {totalClicks}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold tracking-tighter tabular-nums">
              {ctr.toFixed(1)}%
            </p>
            <p className="font-label text-2xs uppercase tracking-slate text-subtle">
              Click-through rate
            </p>
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Views and clicks over time">
          {gridVals.map((v, i) => (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
              <text x={padL - 6} y={y(v) + 3} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
                {v}
              </text>
            </g>
          ))}

          {/* var() is not valid in an SVG presentation attribute — it has to
              go through CSS, so these stay in `style`. */}
          <path d={area} style={{ fill: C_VIEWS, fillOpacity: 0.08 }} />
          <path
            d={line('views')}
            fill="none"
            style={{ stroke: C_VIEWS }}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={line('clicks')}
            fill="none"
            style={{ stroke: C_CLICKS }}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {data.map((p, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(p.views)} r={2.5} style={{ fill: C_VIEWS }}>
                <title>{fmtDay(p.date)}: {p.views} views</title>
              </circle>
              <circle cx={x(i)} cy={y(p.clicks)} r={2.5} style={{ fill: C_CLICKS }}>
                <title>{fmtDay(p.date)}: {p.clicks} clicks</title>
              </circle>
              {i % 3 === 0 || i === n - 1 ? (
                <text x={x(i)} y={H - 6} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>
                  {fmtDay(p.date)}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
}
