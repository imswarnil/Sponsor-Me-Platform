'use client';

import * as React from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AD_TYPE_LIST, type AdTypeKey } from '@/lib/ad-types';

function TypePreview({ type }: { type: AdTypeKey }) {
  if (type === 'video') {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-control bg-inverse">
        <Play className="size-5 text-on-inverse/70" fill="currentColor" />
      </div>
    );
  }
  if (type === 'button') {
    return (
      <div className="grid h-12 w-full place-items-center">
        <span className="rounded-pill bg-pop px-4 py-1.5 text-xs font-semibold text-on-accent">
          Learn more
        </span>
      </div>
    );
  }
  if (type === 'text') {
    return (
      <div className="flex h-12 w-full flex-col justify-center gap-1.5 px-1">
        <div className="h-2 w-4/5 rounded-full bg-sunken" />
        <div className="h-2 w-1/2 rounded-full bg-sunken" />
      </div>
    );
  }
  // banner
  return (
    <div className="grid aspect-[300/250] w-full max-h-16 place-items-center rounded-control border border-dashed border-line-strong bg-pop-soft">
      <span className="text-2xs text-subtle">Image</span>
    </div>
  );
}

/** Replaces raw width/height entry: pick a visual format instead of typing pixels. */
export function AdTypePicker({
  name = 'adType',
  defaultValue = 'banner',
  disabled
}: {
  name?: string;
  defaultValue?: AdTypeKey;
  disabled?: boolean;
}) {
  const [selected, setSelected] = React.useState<AdTypeKey>(defaultValue);

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {/* Disabled radios submit nothing; locked means unchanged, not absent. */}
      {disabled ? <input type="hidden" name={name} value={selected} /> : null}
      {AD_TYPE_LIST.map((t) => {
        const active = t.key === selected;
        return (
          <label
            key={t.key}
            className={cn(
              'flex cursor-pointer flex-col gap-2 rounded-control border p-3 transition-colors duration-200 ease-out',
              active ? 'border-pop bg-pop-soft' : 'border-border bg-surface hover:border-line-strong',
              disabled && 'pointer-events-none opacity-45'
            )}
          >
            <input
              type="radio"
              name={name}
              value={t.key}
              checked={active}
              disabled={disabled}
              onChange={() => setSelected(t.key)}
              className="sr-only"
            />
            <TypePreview type={t.key} />
            <div>
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <p className="mt-1 font-label text-2xs uppercase tracking-slate text-subtle">
                {t.sizeLabel}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
