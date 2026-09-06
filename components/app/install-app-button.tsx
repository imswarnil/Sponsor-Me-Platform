'use client';

import * as React from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari's own flag for "already added to home screen".
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** "Install app" affordance for the sponsor (and studio) console header — lets a
 *  sponsor add the dashboard to their phone's home screen to check on analytics. */
export function InstallAppButton() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTip, setShowIosTip] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (isStandalone()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (dismissed || isStandalone()) return null;

  if (deferred) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          await deferred.prompt();
          await deferred.userChoice;
          setDeferred(null);
        }}
      >
        <Download className="size-3.5" /> Install app
      </Button>
    );
  }

  if (isIos()) {
    if (!showIosTip) {
      return (
        <Button size="sm" variant="outline" onClick={() => setShowIosTip(true)}>
          <Download className="size-3.5" /> Install app
        </Button>
      );
    }
    return (
      <div className="flex items-center gap-2 rounded-control border border-line-subtle bg-sunken px-2.5 py-1.5 text-xs text-muted-foreground">
        <Share className="size-3.5 shrink-0" />
        <span>Tap Share, then &ldquo;Add to Home Screen&rdquo;.</span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-faint hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return null;
}
