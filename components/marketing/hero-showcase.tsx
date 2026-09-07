'use client';

import * as React from 'react';
import { CHANNEL_LIST, type ChannelKey } from '@/lib/channels';
import { CHANNEL_MOCKS } from '@/components/marketing/channel-mocks';
import { ChannelIcon } from '@/components/marketing/channel-icon';
import { cn } from '@/lib/utils';
import styles from './hero-showcase.module.css';

const CYCLE_MS = 3400;

/**
 * The hero's right-hand column: the six places a placement can run, cycling
 * on their own.
 *
 * This is the answer to "what even is this site" — a visitor sees an ad slot
 * appear in a blog sidebar, then a video, then an inbox, then a README,
 * before they have read a word. The mocks are the same placeholder ones
 * /placements uses (components/marketing/channel-mocks.tsx); only the
 * choosing differs.
 *
 * Stops advancing when hovered or focused inside — nobody should be racing a
 * timer to click a channel they wanted a longer look at — and never starts
 * under prefers-reduced-motion, where it renders as a plain, clickable
 * picker instead.
 */
export function HeroShowcase() {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const advancing = !paused && !reducedMotion;

  React.useEffect(() => {
    if (!advancing) return;
    const timer = window.setTimeout(
      () => setIndex((i) => (i + 1) % CHANNEL_LIST.length),
      CYCLE_MS
    );
    return () => window.clearTimeout(timer);
    // `index` is a dependency so each mock gets its own full interval —
    // without it the timer would keep the phase of whichever render set it.
  }, [advancing, index]);

  const channel = CHANNEL_LIST[index];
  const Mock = CHANNEL_MOCKS[channel.key];

  return (
    <div
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* One height for every mock — the phone is capped in the module CSS,
          which explains why it cannot be a Tailwind utility. */}
      <div className={cn('grid min-h-[26rem] items-center', styles.row)}>
        {/* key: remounting is what replays the entry animation on change. */}
        <div key={channel.key} className={styles.mock}>
          <Mock />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2">
        {CHANNEL_LIST.map((c, i) => {
          const current = i === index;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setIndex(i)}
              aria-current={current ? 'true' : undefined}
              aria-label={`Show ${c.label} placement`}
              className={cn(
                'group relative flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-2xs transition-colors',
                current
                  ? 'border-pop text-signal'
                  : 'border-transparent text-faint hover:text-muted-foreground'
              )}
            >
              <ChannelIcon name={c.icon} className="size-3.5" />
              <span className="font-label uppercase tracking-slate">{c.label}</span>
              {current ? (
                <span
                  key={`${c.key}-${index}`}
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-x-1 bottom-0 h-px rounded-full bg-pop',
                    advancing && styles.bar
                  )}
                  style={{ '--cycle': `${CYCLE_MS}ms` } as React.CSSProperties}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
