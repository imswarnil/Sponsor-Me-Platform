/**
 * THE VISIBLE GRID.
 *
 * Twelve hairline columns, fixed behind the whole page at exactly the content
 * width. Everything else sits in a `.bay`, which shares that width and
 * padding — so a panel spanning columns 4–9 visibly starts and ends on a line.
 *
 * Fixed rather than scrolling with the content: the lines are the page's rig,
 * and a rig does not move. It also means one element for the whole document
 * instead of one per section.
 *
 * Purely decorative, so it is hidden from assistive technology entirely.
 */
export function Rig() {
  return (
    <div className="rig" aria-hidden="true">
      <div className="rig__inner">
        {/* 12 cells: 4 on a phone, 8 at md, 12 at lg — the extras are simply
            not painted at narrow widths, which the CSS handles by column
            count rather than by hiding elements. */}
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="rig__col" />
        ))}
      </div>
    </div>
  );
}

/** The content column. Same width and padding as the rig. */
export function Bay({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`bay ${className}`}>{children}</div>;
}

/**
 * A section: a full-width hairline across the page, then content in the bay.
 * The rule is what makes the grid read in both axes.
 */
export function Band({
  children,
  className = '',
  id
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`band ${className}`}>
      <Bay>{children}</Bay>
    </section>
  );
}

/**
 * A section's heading: a mono label, a big line, and an optional lead. The
 * label is annotation on a drawing — which is what the whole page is dressed
 * as — so it is mono and tracked out.
 */
export function Head({
  label,
  title,
  lead,
  right
}: {
  label: string;
  title: string;
  lead?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 pb-10">
      <div className="max-w-xl">
        <p className="label label-accent">{label}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          {title}
        </h2>
        {lead ? <p className="mt-2 text-ink-600">{lead}</p> : null}
      </div>
      {right}
    </div>
  );
}
