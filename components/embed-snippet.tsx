'use client';

import { useState } from 'react';

import { site, slotFormatByKey } from '@/lib/site';
import type { Slot } from '@/lib/db/schema';

/**
 * THE WIDGET, AS IT WILL LOOK, AND THE TAG THAT PUTS IT THERE.
 *
 * The preview is the point. "Here is a line of HTML" is not an answer to "what
 * will this look like on my site" — so the real widget is loaded, live, inside
 * a drawn browser window at the width the chosen format actually occupies.
 * What is in the frame is the same URL the tag loads.
 *
 * The URL is built from `site.self`, never `window.location`, so a snippet
 * copied out of a localhost studio still points at production. Pasting a
 * localhost URL onto a live site is the mistake this prevents.
 */

/** The width each format really occupies, so the preview is not a lie about size. */
const WIDTHS: Record<string, number> = {
  leader: 728,
  rect: 300,
  sky: 300,
  card: 420,
  inline: 640
};

const HEIGHTS: Record<string, number> = {
  leader: 190,
  rect: 560,
  sky: 900,
  card: 320,
  inline: 320
};

export function EmbedSnippet({ slot }: { slot?: Slot }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const format = slot ? slot.format : 'inline';
  const label = slot ? slotFormatByKey(slot.format).label : 'The board';
  const width = WIDTHS[format] ?? 640;
  const height = HEIGHTS[format] ?? 320;

  const snippet = `<script src="${site.self}/sponsorbid.js" data-format="${format}" async></script>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some contexts. The code is selectable anyway,
      // so there is nothing to recover from.
    }
  }

  return (
    <div className="stack stack-sm">
      <div className="cluster cluster-between">
        <p className="eyebrow m-0">
          {label} · {width}px wide
        </p>
        <div className="cluster cluster-sm">
          <button
            type="button"
            className="btn btn-xs btn-quiet"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? 'Hide preview' : 'Preview'}
          </button>
          <button type="button" className="btn btn-xs btn-outline" onClick={copy}>
            {copied ? 'Copied' : 'Copy tag'}
          </button>
        </div>
      </div>

      {open ? (
        <div className="viewport">
          <div className="viewport__bar">
            <span className="viewport__dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span className="viewport__url">{site.ownerLabel}/a-post</span>
          </div>
          <div className="viewport__body">
            {/* The real widget, live, at the real width. Not a screenshot and
                not a mock — this is the same URL the script tag loads. */}
            <iframe
              className="viewport__frame"
              src={`/embed/board?format=${encodeURIComponent(format)}`}
              title={`${label} preview`}
              style={{ maxInlineSize: width, blockSize: height, marginInline: 'auto' }}
              loading="lazy"
            />
          </div>
        </div>
      ) : null}

      <div className="codeblock codeblock-sm codeblock-wrap">
        <pre className="codeblock__pre">
          <code>
            <span className="tok-punc">&lt;</span>
            <span className="tok-tag">script</span>{' '}
            <span className="tok-attr">src</span>
            <span className="tok-punc">=</span>
            <span className="tok-str">&quot;{site.self}/sponsorbid.js&quot;</span>{' '}
            <span className="tok-attr">data-format</span>
            <span className="tok-punc">=</span>
            <span className="tok-str">&quot;{format}&quot;</span>{' '}
            <span className="tok-attr">async</span>
            <span className="tok-punc">&gt;&lt;/</span>
            <span className="tok-tag">script</span>
            <span className="tok-punc">&gt;</span>
          </code>
        </pre>
      </div>
    </div>
  );
}
