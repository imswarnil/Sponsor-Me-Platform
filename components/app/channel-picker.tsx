'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChannelIcon } from '@/components/marketing/channel-icon';
import { CHANNEL_LIST, type ChannelKey } from '@/lib/channels';

/**
 * Which surface a placement runs on. A radio group under the hood, so keyboard
 * and form semantics come free — the visual is only a label around the input.
 */
export function ChannelPicker({
  name = 'channel',
  defaultValue = 'blog',
  disabled,
  onChange
}: {
  name?: string;
  defaultValue?: ChannelKey;
  disabled?: boolean;
  onChange?: (key: ChannelKey) => void;
}) {
  const [selected, setSelected] = React.useState<ChannelKey>(defaultValue);
  const channel = CHANNEL_LIST.find((c) => c.key === selected);

  function select(key: ChannelKey) {
    setSelected(key);
    onChange?.(key);
  }

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {CHANNEL_LIST.map((c) => {
          const active = c.key === selected;
          return (
            <label
              key={c.key}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-control border p-3 transition-colors duration-200 ease-out',
                active
                  ? 'border-pop bg-pop-soft'
                  : 'border-border bg-surface hover:border-line-strong',
                disabled && 'pointer-events-none opacity-45'
              )}
            >
              <input
                type="radio"
                name={name}
                value={c.key}
                checked={active}
                disabled={disabled}
                onChange={() => select(c.key)}
                className="sr-only"
              />
              <ChannelIcon
                name={c.icon}
                className={cn('size-4 shrink-0', active ? 'text-signal' : 'text-faint')}
              />
              <span className="text-sm font-medium">{c.label}</span>
            </label>
          );
        })}
      </div>

      {channel ? (
        <div className="mt-3 rounded-control border border-line-subtle bg-sunken p-3">
          <p className="text-sm">{channel.placement}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">{channel.unit}</p>
          <p className="mt-2 font-mono text-2xs uppercase tracking-slate text-subtle">
            {channel.embeddable
              ? 'Serves through the widget · views and clicks counted'
              : 'Placed by hand · no automatic counting'}
          </p>
        </div>
      ) : null}
    </div>
  );
}
