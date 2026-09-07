'use client';

import * as React from 'react';
import { CHANNEL_LIST, type ChannelKey } from '@/lib/channels';
import { CHANNEL_MOCKS } from '@/components/marketing/channel-mocks';
import { cn } from '@/lib/utils';

/** A generic, placeholder-only preview of how a placement looks per channel —
 *  no real logos or invented numbers, just the shape of the thing. Pick-your-own
 *  version; the homepage hero cycles the same mocks by itself instead. */
export function AdPreviewShowcase({ defaultChannel = 'blog' }: { defaultChannel?: ChannelKey }) {
  const [active, setActive] = React.useState<ChannelKey>(defaultChannel);
  const Mock = CHANNEL_MOCKS[active];

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {CHANNEL_LIST.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActive(c.key)}
            aria-current={active === c.key ? 'page' : undefined}
            className={cn(
              'rounded-pill border px-3 py-1.5 text-sm transition-colors',
              active === c.key
                ? 'border-pop bg-pop-soft text-signal'
                : 'border-border text-muted-foreground hover:border-line-strong'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-4 max-w-md">
        <Mock />
      </div>
    </div>
  );
}
