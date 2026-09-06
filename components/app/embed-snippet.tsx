'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * A copyable snippet, on the design system's code slab.
 *
 * Takes either a `publicId` (and builds the ad-widget snippet for it) or a raw
 * `code` string, which is what the sponsor wall needs — its embed has no slot.
 *
 * The origin is read on the client rather than baked in: the same studio page
 * is opened on localhost and on the deployed site, and a snippet copied from
 * one that points at the other is a broken embed nobody notices until it is on
 * a live page.
 */
export function EmbedSnippet({
  publicId,
  code,
  label = 'Embed snippet'
}: {
  publicId?: string;
  code?: string;
  label?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const [origin, setOrigin] = React.useState('https://sponsor.imswarnil.com');

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const snippet = code
    ? code.replace(/__ORIGIN__/g, origin)
    : `<script\n  src="${origin}/widget.js"\n  data-slot="${publicId}"\n  async></script>`;

  function copy() {
    navigator.clipboard?.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    /* creator/22-code.css. These were `.codebox` until the design system
       renamed the whole block to `.codeblock`; the old names style nothing. */
    <figure className="codeblock">
      <figcaption className="codeblock__head">
        <span className="codeblock__lang">{label}</span>
        <button
          type="button"
          className="codeblock__copy"
          onClick={copy}
          data-copied={copied || undefined}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="codeblock__pre">
        <code>{snippet}</code>
      </pre>
    </figure>
  );
}
