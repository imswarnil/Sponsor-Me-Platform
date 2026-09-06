'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';

export function EmbedSnippet({ publicId }: { publicId: string }) {
  const [copied, setCopied] = React.useState(false);
  const [origin, setOrigin] = React.useState('https://advertise.imswarnil.com');

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const snippet = `<script\n  src="${origin}/widget.js"\n  data-slot="${publicId}"\n  async></script>`;

  function copy() {
    navigator.clipboard?.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    /* The system's own code slab — creator/2-elements/15-syntax.css. */
    <figure className="codebox">
      <figcaption className="codebox__head">
        <span className="codebox__lang">Embed snippet</span>
        <button type="button" className="codebox__copy" onClick={copy} data-copied={copied || undefined}>
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </figcaption>
      <pre className="codebox__pre">
        <code>{snippet}</code>
      </pre>
    </figure>
  );
}
