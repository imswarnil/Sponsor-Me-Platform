'use client';

import * as React from 'react';
import { Play } from 'lucide-react';
import { CHANNEL_LIST, type ChannelKey } from '@/lib/channels';
import { cn } from '@/lib/utils';
import styles from './ad-preview-showcase.module.css';

const TABS: { key: ChannelKey; label: string }[] = CHANNEL_LIST.map((c) => ({
  key: c.key,
  label: c.label
}));

function Lines({ n = 3, className }: { n?: number; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className={cn('h-2 rounded-full bg-sunken', i === n - 1 ? 'w-3/5' : 'w-full')}
        />
      ))}
    </div>
  );
}

function BlogMock() {
  return (
    <div className="win win-browser">
      <div className="win__bar">
        <span className="win__dots">
          <span />
          <span />
          <span />
        </span>
        <span className="win-browser__url">imswarnil.com/travel/kyoto-in-3-days</span>
      </div>
      <div className="win__body grid grid-cols-[1fr_120px] gap-4 p-4">
        <div className="space-y-3">
          <div className="h-3 w-2/3 rounded-full bg-sunken" />
          <Lines n={4} />
          <Lines n={3} />
        </div>
        <div
          className={cn(
            'flex h-28 flex-col items-center justify-center rounded-control border border-dashed border-line-strong bg-pop-soft p-2 text-center',
            styles.pulse
          )}
        >
          <p className="font-mono text-2xs uppercase tracking-slate text-subtle">Sponsored</p>
          <p className="mt-1 text-2xs font-semibold">Your ad here</p>
        </div>
      </div>
    </div>
  );
}

function YoutubeMock() {
  return (
    <div className="win win-browser">
      <div className="win__bar">
        <span className="win__dots">
          <span />
          <span />
          <span />
        </span>
        <span className="win-browser__url">youtube.com/watch?v=demo</span>
      </div>
      <div className="win__body p-4">
        <div className="grid h-24 place-items-center rounded-control bg-inverse">
          <Play className="size-8 text-on-inverse/70" fill="currentColor" />
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2.5 w-1/2 rounded-full bg-sunken" />
          <p className={cn('text-2xs text-muted-foreground', styles.fadeInUp)}>
            This video is sponsored — thanks to today&rsquo;s advertiser for backing the channel.
          </p>
        </div>
      </div>
    </div>
  );
}

function NewsletterMock() {
  return (
    <div className="win win-mac">
      <div className="win__bar">
        <span className="win__dots win__dots-color">
          <span />
          <span />
          <span />
        </span>
        <span className="win__title">Inbox</span>
      </div>
      <div className="win__body p-4">
        <div className="h-3 w-1/2 rounded-full bg-sunken" />
        <div className="mt-3">
          <Lines n={3} />
        </div>
        <div
          className={cn(
            'mt-4 rounded-control border border-line-subtle bg-pop-soft p-3',
            styles.sweepIn
          )}
        >
          <p className="font-mono text-2xs uppercase tracking-slate text-subtle">
            Today&rsquo;s issue is brought to you by
          </p>
          <p className="mt-1 text-sm font-semibold">Your name here</p>
        </div>
      </div>
    </div>
  );
}

function InstagramMock() {
  return (
    <div className="win win-phone mx-auto">
      <div className="win__body relative flex h-full flex-col">
        <div className="flex-1 bg-sunken" />
        <div
          className={cn(
            'absolute left-3 top-3 rounded-pill bg-inverse/80 px-2 py-1 font-mono text-2xs uppercase tracking-slate text-on-inverse',
            styles.fadeInUp
          )}
        >
          Sponsored
        </div>
        <div className="space-y-1.5 p-3">
          <div className="h-2 w-1/3 rounded-full bg-sunken" />
          <div className="h-2 w-2/3 rounded-full bg-sunken" />
        </div>
      </div>
    </div>
  );
}

function OpenSourceMock() {
  return (
    <div className="win win-code">
      <div className="win-code__tabs">
        <span className="win-code__tab" aria-selected="true">
          README.md
        </span>
      </div>
      <div className="win-code__body">
        <div className="win-code__gutter">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="win-code__lines">
          <div>
            <span className="tok-key"># </span>
            <span className="tok-fn">my-project</span>
          </div>
          <div className="tok-com"># Advertisers</div>
          <div className={styles.sweepIn}>
            <span className="tok-punc">[</span>
            <span className="tok-str">Your logo here</span>
            <span className="tok-punc">]</span>
            <span className="tok-punc">(</span>
            <span className="tok-fn">your-link</span>
            <span className="tok-punc">)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AmbassadorMock() {
  return (
    <div className="win win-phone mx-auto">
      <div className="win__body flex h-full flex-col justify-center gap-3 p-5">
        <div className="flex items-center gap-2">
          <div className="size-8 shrink-0 rounded-full bg-sunken" />
          <div className="h-2 w-20 rounded-full bg-sunken" />
        </div>
        <p className="text-sm">
          &ldquo;This creator&rsquo;s work has genuinely helped me — happy to back it.&rdquo;
        </p>
        <p className={cn('font-mono text-2xs uppercase tracking-slate text-subtle', styles.fadeInUp)}>
          One of my subscribers/readers sponsored me for my work — you can do it too.
        </p>
      </div>
    </div>
  );
}

const MOCKS: Record<ChannelKey, React.ComponentType> = {
  blog: BlogMock,
  youtube: YoutubeMock,
  newsletter: NewsletterMock,
  instagram: InstagramMock,
  'open-source': OpenSourceMock,
  ambassador: AmbassadorMock
};

/** A generic, placeholder-only preview of how a placement looks per channel —
 *  no real logos or invented numbers, just the shape of the thing. */
export function AdPreviewShowcase({ defaultChannel = 'blog' }: { defaultChannel?: ChannelKey }) {
  const [active, setActive] = React.useState<ChannelKey>(defaultChannel);
  const Mock = MOCKS[active];

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            aria-current={active === t.key ? 'page' : undefined}
            className={cn(
              'rounded-pill border px-3 py-1.5 text-sm transition-colors',
              active === t.key
                ? 'border-pop bg-pop-soft text-signal'
                : 'border-border text-muted-foreground hover:border-line-strong'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4 max-w-md">
        <Mock />
      </div>
    </div>
  );
}
