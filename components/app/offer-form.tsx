'use client';

import * as React from 'react';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { makeOffer } from '@/lib/proto/offers';

const DAY = 86_400_000;

function todayUtcIso() {
  return new Date().toISOString().slice(0, 10);
}

function isoPlus(from: string, days: number) {
  return new Date(new Date(`${from}T00:00:00.000Z`).getTime() + days * DAY)
    .toISOString()
    .slice(0, 10);
}

/**
 * Propose a price and a run for a placement.
 *
 * **Usable signed out.** Anyone can pick dates, see what the asking price works
 * out to and write their ad; the account is only demanded when the form is
 * submitted, because that is the first moment the answer has to belong to
 * somebody. `makeOffer` redirects to /login with a `next` back to this page.
 *
 * The price field starts at the asking price rather than empty — an offer box
 * with nothing in it asks the visitor to guess, and most people guess low or
 * give up. The listed price is the anchor; they can go above or below it.
 */
export function OfferForm({
  publicId,
  pricePerWeek,
  signedIn,
  myPoints
}: {
  publicId: string;
  pricePerWeek: number;
  signedIn: boolean;
  myPoints?: number;
}) {
  const today = React.useMemo(todayUtcIso, []);
  const [startDate, setStartDate] = React.useState(today);
  const [endDate, setEndDate] = React.useState(() => isoPlus(today, 7));

  const days = Math.max(
    0,
    Math.round(
      (new Date(`${endDate}T00:00:00.000Z`).getTime() -
        new Date(`${startDate}T00:00:00.000Z`).getTime()) /
        DAY
    )
  );
  const asking = Math.ceil((pricePerWeek * days) / 7);

  // Re-anchor the offer on the asking price whenever the run changes, unless
  // the visitor has already typed a number of their own.
  const [price, setPrice] = React.useState<string>('');
  const [touched, setTouched] = React.useState(false);
  const effective = touched && price !== '' ? Number(price) : asking;

  /**
   * Carry a half-filled offer across the sign-in redirect.
   *
   * Submitting while signed out bounces to /login and back, which would
   * otherwise throw away everything typed — and the form asks for a headline, a
   * link and a note, so that is a real loss and people do not type it twice.
   * sessionStorage survives the round trip, is scoped to this tab, and is
   * cleared the moment it is used.
   */
  const formRef = React.useRef<HTMLFormElement>(null);
  const KEY = `offer-draft:${publicId}`;

  React.useEffect(() => {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch {
      // Private mode, or storage disabled. The form simply starts empty.
    }
    if (!saved || !formRef.current) return;
    try {
      const data = JSON.parse(saved) as Record<string, string>;
      for (const [k, v] of Object.entries(data)) {
        const el = formRef.current.elements.namedItem(k);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.value = v;
      }
      if (data.startDate) setStartDate(data.startDate);
      if (data.endDate) setEndDate(data.endDate);
      if (data.pricePoints) {
        setTouched(true);
        setPrice(data.pricePoints);
      }
    } catch {
      // A malformed draft is not worth failing the page over.
    }
  }, [KEY]);

  function stash() {
    if (signedIn || !formRef.current) return;
    const data: Record<string, string> = {};
    for (const [k, v] of new FormData(formRef.current).entries()) {
      if (typeof v === 'string' && k !== 'publicId') data[k] = v;
    }
    try {
      sessionStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Nothing to do — the offer still submits, it just will not be restored.
    }
  }

  const validRun = days >= 3 && days <= 90;
  const affordable = !signedIn || myPoints === undefined || effective <= myPoints;

  return (
    <form ref={formRef} action={makeOffer} onSubmit={stash} className="space-y-5">
      <input type="hidden" name="publicId" value={publicId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">From</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            min={today}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (e.target.value >= endDate) setEndDate(isoPlus(e.target.value, 7));
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">To</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            required
            min={isoPlus(startDate, 3)}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <p className="font-label text-2xs uppercase tracking-slate text-subtle">
        {validRun ? `${days} days · asking ${asking} pts` : '3 to 90 days'}
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="pricePoints">Your offer</Label>
        <div className="flex items-center gap-2">
          <Input
            id="pricePoints"
            name="pricePoints"
            type="number"
            min={1}
            max={1000000}
            required
            className="max-w-40"
            value={touched ? price : String(asking)}
            onChange={(e) => {
              setTouched(true);
              setPrice(e.target.value);
            }}
          />
          <span className="text-sm text-muted-foreground">points, total</span>
        </div>
        {!affordable ? (
          <p className="text-xs text-destructive">
            That is more than your {myPoints} point balance.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Offer what it&rsquo;s worth to you. Nothing is charged unless it&rsquo;s accepted.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="headline">Ad headline</Label>
        <Input id="headline" name="headline" required maxLength={80} placeholder="What it says" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="linkUrl">Link</Label>
        <Input
          id="linkUrl"
          name="linkUrl"
          type="url"
          required
          placeholder="https://yoursite.com"
        />
      </div>

      <details className="group rounded-control border border-line-subtle">
        <summary className="cursor-pointer list-none px-4 py-3 font-label text-2xs uppercase tracking-slate text-subtle">
          Image, button text, and a note
        </summary>
        <div className="space-y-5 border-t border-line-subtle p-4">
          <div className="space-y-1.5">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://…/ad.png" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ctaLabel">Button text</Label>
            <Input id="ctaLabel" name="ctaLabel" maxLength={24} placeholder="Learn more" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Note to Swarnil</Label>
            <Textarea
              id="message"
              name="message"
              maxLength={500}
              placeholder="Anything that helps him decide — who you are, why this fits."
            />
            <p className="text-xs text-muted-foreground">Not shown publicly.</p>
          </div>
        </div>
      </details>

      <div className="border-t border-line-subtle pt-5">
        <SubmitButton pendingText="Sending…" disabled={!validRun || !affordable}>
          {signedIn ? 'Send offer' : 'Sign in and send offer'}
        </SubmitButton>
        {!signedIn ? (
          <p className="mt-2 text-xs text-muted-foreground">
            You&rsquo;ll be asked to sign in — what you&rsquo;ve typed comes with you.
          </p>
        ) : null}
      </div>
    </form>
  );
}
