/**
 * THE PAGE SHELL — a centred column, and a rule between sections.
 *
 * There is no grid overlay behind this page and nothing snaps to a visible
 * column: the previous design drew twelve hairline columns and asked every
 * component to land on them. This one holds its shape with ONE measurement —
 * `--sponsor-container-wide--width` — and lets tone and space do the rest.
 *
 * `Section` and `Container` share the same padding token, so the rule that
 * starts a section runs the full width of the viewport while its content stays
 * in the column. That difference is the only structural idea here.
 */
export function Container({
  children,
  narrow = false,
  wide = false,
  className = ''
}: {
  children: React.ReactNode;
  /** 700px — for prose and for a single form. */
  narrow?: boolean;
  /** 1280px — for a page holding a leaderboard or a table. */
  wide?: boolean;
  className?: string;
}) {
  const width = narrow ? 'sp-container-narrow' : wide ? 'sp-container-max' : '';
  return <div className={`sp-container ${width} ${className}`}>{children}</div>;
}

/**
 * A section. `rule` draws the hairline that separates it from the one above —
 * off for the first section on a page, where a line under the header would
 * double up.
 */
export function Section({
  children,
  id,
  rule = true,
  tight = false,
  wide = false,
  pattern,
  className = ''
}: {
  children: React.ReactNode;
  id?: string;
  rule?: boolean;
  tight?: boolean;
  wide?: boolean;
  /**
   * A texture behind the section, for rhythm down a long page.
   *
   * WHY NOT A TINTED PLANE. A card in this system IS a tint — one step up
   * from the page — so a section painted that same step makes every card in
   * it disappear, and the reading inverts: the gaps look like panels. A
   * pattern separates sections without spending the one tone the cards need.
   * `.sp-plane` still exists for the two sections whose content is bordered
   * white panels rather than tinted cards.
   */
  pattern?: 'dots' | 'glow';
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden ${rule ? 'sp-rule' : ''} ${
        tight ? 'sp-section-tight' : 'sp-section'
      } ${className}`}
    >
      {pattern ? (
        <div className="sp-backdrop" aria-hidden>
          <div
            className={
              pattern === 'dots'
                ? 'sp-dots sp-fade-b absolute inset-0 opacity-60'
                : 'sp-glow absolute inset-0'
            }
          />
        </div>
      ) : null}

      <Container wide={wide} className={pattern ? 'sp-fore' : ''}>
        {children}
      </Container>
    </section>
  );
}

/**
 * A section's heading: an eyebrow, a line, a lead, and optionally one control
 * pinned to the far end. The eyebrow is small caps rather than mono — mono
 * made every label look like a dimension on a blueprint, which was the old
 * design's joke and is not this one's.
 */
export function SectionHead({
  eyebrow,
  title,
  lead,
  action,
  accent = false
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  action?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 pb-9">
      <div className="max-w-xl">
        <p className={`sp-eyebrow ${accent ? 'sp-eyebrow-accent' : ''}`}>{eyebrow}</p>
        <h2 className="sp-h2 mt-3">{title}</h2>
        {lead ? <p className="mt-3 text-body">{lead}</p> : null}
      </div>
      {action}
    </div>
  );
}

/**
 * A measurement. Rendered only when there is something real to render — the
 * caller decides that, because a zero dressed as a figure is a lie the layout
 * should not be able to tell on its own.
 */
export function Figure({
  label,
  value,
  gold = false
}: {
  label: string;
  value: string | number;
  gold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-4">
      <dt className="text-small text-secondary">{label}</dt>
      <dd className={`sp-num text-2xl font-semibold ${gold ? 'text-gold' : 'text-title'}`}>
        {value}
      </dd>
    </div>
  );
}

/** A figure as a standalone pill, for the rows of them on /me and /studio. */
export function Stat({
  value,
  label,
  gold = false
}: {
  value: string | number;
  label: string;
  gold?: boolean;
}) {
  return (
    <div className={`rounded-card px-5 py-4 ${gold ? 'bg-gold-soft' : 'bg-surface-100'}`}>
      <p className={`sp-num text-2xl font-semibold leading-none ${gold ? 'text-gold' : 'text-title'}`}>
        {value}
      </p>
      <p className="mt-1.5 text-tiny text-secondary">{label}</p>
    </div>
  );
}

/**
 * The empty state. One shape for all of them, because "nothing here yet" is
 * the same thought everywhere and it deserves the same amount of room.
 */
export function Empty({
  title,
  lead,
  icon,
  action
}: {
  title: string;
  lead?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="sp-card sp-card-frame flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon ? <span className="text-mute">{icon}</span> : null}
      <p className="sp-h4 font-semibold">{title}</p>
      {lead ? <p className="max-w-sm text-small text-secondary">{lead}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
