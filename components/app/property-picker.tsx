'use client';

import * as React from 'react';
import { PROPERTIES, ACROSS_EVERYTHING } from '@/lib/properties';

/**
 * Which of my sites a placement runs on.
 *
 * A plain `<select>` rather than the card grid the channel picker uses: there
 * are a dozen properties and only six channels, and twelve cards would bury the
 * channel choice that actually changes what the sponsor gets.
 *
 * The empty value is "across everything" and is the default — a newsletter
 * issue or a video isn't tied to one site, and forcing a site would be a lie.
 */
export function PropertyPicker({
  name = 'property',
  defaultValue = '',
  disabled
}: {
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = React.useState(defaultValue);
  const selected = PROPERTIES.find((p) => p.key === value);

  return (
    <div>
      {/* A disabled select submits nothing; locked means unchanged, not absent. */}
      {disabled ? <input type="hidden" name={name} value={value} /> : null}
      <select
        name={name}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm outline-none transition-colors focus-visible:border-pop disabled:opacity-45"
      >
        <option value="">{ACROSS_EVERYTHING.label}</option>
        {PROPERTIES.map((p) => (
          <option key={p.key} value={p.key}>
            {p.label} — {p.host}
          </option>
        ))}
      </select>

      <div className="mt-3 rounded-control border border-line-subtle bg-sunken p-3">
        <p className="text-sm">{(selected ?? ACROSS_EVERYTHING).blurb}</p>
        {selected && !selected.live ? (
          <p className="mt-2 font-label text-2xs uppercase tracking-slate text-warning">
            No DNS record yet — listed, but not linked
          </p>
        ) : null}
      </div>
    </div>
  );
}
