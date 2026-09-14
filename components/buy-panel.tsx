'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { ArrowRight } from '@/components/icons';
import { saveAdAction, startCheckoutAction, type ActionState } from '@/lib/actions';
import { formatPaise } from '@/lib/money';
import { FORMATS, TERMS, termPrice } from '@/lib/site';
import type { Ad } from '@/lib/db/schema';

/**
 * WRITE THE AD, THEN PAY FOR IT — both halves, in the order they happen.
 *
 * Everything shown here about price is a PREVIEW. The server recomputes the
 * amount from the slot's own row and the live leaderboard in the same call
 * that makes the checkout, so editing anything in this component changes what
 * the buyer *sees*, never what they are charged.
 */
export function BuyPanel({
  slotId,
  slug,
  kind,
  askPaise,
  pricePaise,
  signedIn,
  isCreator,
  existing
}: {
  slotId: string;
  slug: string;
  kind: string;
  askPaise: number;
  pricePaise: number;
  signedIn: boolean;
  isCreator: boolean;
  existing: Ad | null;
}) {
  if (isCreator) {
    return (
      <div className="sp-panel h-fit p-7 sm:p-9">
        <p className="sp-h3 font-semibold">This one&rsquo;s yours</p>
        <p className="mt-2 text-small text-secondary">
          Manage it, and grab the embed tag, in the studio.
        </p>
        <Link href="/studio" className="sp-btn sp-btn-soft sp-btn-block mt-6">
          Open studio
        </Link>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="sp-panel h-fit p-7 sm:p-9">
        <p className="sp-eyebrow">{kind === 'bid' ? 'To take first' : 'Price'}</p>
        <p className="sp-num sp-display mt-3">{formatPaise(askPaise)}</p>
        <p className="mt-2 text-small text-secondary">
          {kind === 'bid' ? 'or bid whatever you like' : 'per month'}
        </p>
        <Link
          href={`/signup?next=${encodeURIComponent(`/slot/${slug}`)}`}
          className="sp-btn sp-btn-block sp-btn-lg mt-8"
        >
          Make an account
          <ArrowRight />
        </Link>
        <Link
          href={`/signin?next=${encodeURIComponent(`/slot/${slug}`)}`}
          className="mt-4 block text-center text-small text-secondary transition-colors hover:text-title"
        >
          I already have one
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AdForm slotId={slotId} existing={existing} />
      {existing?.brand ? (
        <PayForm
          slotId={slotId}
          kind={kind}
          askPaise={askPaise}
          pricePaise={pricePaise}
          existing={existing}
        />
      ) : (
        <div className="sp-callout">
          Save your ad above, and then you can pay for the slot.
        </div>
      )}
    </div>
  );
}

/* ── The creative ───────────────────────────────────────────────────────── */

function AdForm({ slotId, existing }: { slotId: string; existing: Ad | null }) {
  const [state, action] = useActionState<ActionState, FormData>(saveAdAction, {});
  const [format, setFormat] = useState(existing?.format ?? 'card');

  return (
    <form action={action} className="sp-panel p-7 sm:p-9">
      <input type="hidden" name="slotId" value={slotId} />

      <p className="sp-h3 font-semibold">Your ad</p>

      {existing?.status === 'rejected' && existing.reviewNote ? (
        <p className="sp-callout sp-callout-error mt-4">
          <strong className="font-semibold text-error">Not approved:</strong>{' '}
          {existing.reviewNote}
        </p>
      ) : null}

      {/* Four formats, four choosable tiles. The radio stays in the DOM and
          keyboard-reachable; the tile is what gets painted. */}
      <fieldset className="mt-6">
        <legend className="sp-flabel">Format</legend>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(FORMATS).map(([key, f]) => (
            <label key={key} className={`sp-choice ${format === key ? 'sp-choice-on' : ''}`}>
              <input
                type="radio"
                name="format"
                value={key}
                checked={format === key}
                onChange={() => setFormat(key)}
                className="sr-only"
              />
              <span className="block text-small font-semibold text-title">{f.label}</span>
              <span className="mt-0.5 block text-tiny leading-tight text-secondary">
                {f.note}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Brand" name="brand" defaultValue={existing?.brand} required maxLength={40} />
          {/* Shown on the board beside the website, so a reader can tell what
              a name IS before deciding whether to click it. */}
          <Field
            label="What you do"
            name="tag"
            defaultValue={existing?.tag ?? ''}
            maxLength={24}
            placeholder="Issue tracker"
          />
        </div>

        {/* The circular mark on the board. Separate from the ad's own artwork
            below — a wide screenshot makes a poor avatar. */}
        <Field
          label="Logo"
          name="logoUrl"
          type="url"
          defaultValue={existing?.logoUrl ?? ''}
          placeholder="https://…/logo.png"
        />

        {format !== 'html' ? (
          <>
            <Field
              label="Headline"
              name="headline"
              defaultValue={existing?.headline}
              maxLength={80}
              placeholder="The thing you want people to read"
            />
            <Field
              label="One more line"
              name="body"
              defaultValue={existing?.body}
              maxLength={140}
              placeholder="Optional"
            />
          </>
        ) : null}

        <Field
          label="Where it links"
          name="url"
          type="url"
          defaultValue={existing?.url ?? ''}
          required
          placeholder="https://…"
        />

        {format === 'image' || format === 'card' ? (
          <Field
            label={format === 'image' ? 'Image URL' : 'Image (optional)'}
            name="imageUrl"
            type="url"
            defaultValue={existing?.imageUrl ?? ''}
            placeholder="https://…/thing.png"
          />
        ) : null}

        {format === 'video' ? (
          <Field
            label="YouTube link"
            name="videoUrl"
            type="url"
            defaultValue={existing?.videoUrl ?? ''}
            placeholder="https://youtube.com/watch?v=…"
          />
        ) : null}

        {format === 'html' ? (
          <label className="block">
            <span className="sp-flabel">Your HTML</span>
            <textarea
              name="html"
              rows={6}
              maxLength={8000}
              defaultValue={existing?.html ?? ''}
              className="sp-field sp-field-area"
              placeholder="<div>…</div>"
            />
            {/* Said out loud, because a sponsor pasting a script needs to know
                before they are surprised by it not running. */}
            <span className="sp-hint">
              Runs in a sandboxed frame — styles and markup work, scripts do not.
            </span>
          </label>
        ) : null}

        {format !== 'html' ? (
          <Field
            label="Button text"
            name="ctaLabel"
            defaultValue={existing?.ctaLabel ?? ''}
            maxLength={24}
            placeholder="Try it free"
          />
        ) : null}
      </div>

      <Message state={state} />
      <Submit label="Save ad" className="sp-btn sp-btn-soft sp-btn-block mt-6" />
    </form>
  );
}

/* ── The money ──────────────────────────────────────────────────────────── */

function PayForm({
  slotId,
  kind,
  askPaise,
  pricePaise,
  existing
}: {
  slotId: string;
  kind: string;
  askPaise: number;
  pricePaise: number;
  existing: Ad;
}) {
  const [state, action] = useActionState<ActionState, FormData>(startCheckoutAction, {});
  const [months, setMonths] = useState(1);
  const [rupees, setRupees] = useState(Math.ceil(askPaise / 100));

  const total = kind === 'bid' ? rupees * 100 : termPrice(pricePaise, months);

  return (
    <form action={action} className="sp-panel h-fit p-7 sm:p-9">
      <input type="hidden" name="slotId" value={slotId} />

      {kind === 'bid' ? (
        <>
          <label className="sp-flabel" htmlFor="bid-rupees">
            Your bid
          </label>
          <div className="sp-money">
            <span className="text-2xl font-normal text-mute">₹</span>
            <input
              id="bid-rupees"
              name="rupees"
              type="number"
              inputMode="numeric"
              min={Math.ceil(askPaise / 100)}
              step={1}
              value={rupees}
              onChange={(e) => setRupees(Number(e.target.value))}
              /* A mouse wheel over a focused number input silently rewrites
                 it in Chrome. This field is the bid — scrolling past it must
                 not change what somebody is about to pay. */
              onWheel={(e) => e.currentTarget.blur()}
            />
          </div>
          <p className="sp-hint">
            {formatPaise(askPaise)} or more takes the top spot. This adds to what you have
            already paid — a bid is a lifetime total, so nobody is refunded when they are
            overtaken.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 2, 5].map((mult) => {
              const v = Math.ceil((askPaise * mult) / 100);
              return (
                <button
                  key={mult}
                  type="button"
                  onClick={() => setRupees(v)}
                  className="sp-btn sp-btn-soft sp-btn-sm sp-num"
                >
                  ₹{v.toLocaleString('en-IN')}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="sp-flabel">How long?</p>
          <div className="grid grid-cols-3 gap-2">
            {TERMS.map((t) => (
              <button
                key={t.months}
                type="button"
                onClick={() => setMonths(t.months)}
                aria-pressed={months === t.months}
                className={`sp-choice text-center ${months === t.months ? 'sp-choice-on' : ''}`}
              >
                <span className="sp-num block text-small font-semibold text-title">
                  {t.months}mo
                </span>
                {t.off ? (
                  <span className="mt-0.5 block text-[10px] font-semibold text-success">
                    {t.off}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <input type="hidden" name="months" value={months} />
        </>
      )}

      <div className="mt-7 flex items-end justify-between gap-4 border-t border-line pt-5">
        <span className="text-small text-secondary">Total</span>
        <span className="sp-num text-3xl font-semibold text-title">{formatPaise(total)}</span>
      </div>

      <Message state={state} />

      <Submit
        label={kind === 'bid' ? 'Place bid' : 'Buy this slot'}
        pendingLabel="Opening checkout…"
        className="sp-btn sp-btn-block sp-btn-lg mt-5"
      />

      <p className="sp-hint">
        Nothing is charged until the payment provider confirms it, and your ad runs once{' '}
        {existing.status === 'live' ? 'it is approved' : 'I approve it'}.
      </p>
    </form>
  );
}

/* ── Bits ───────────────────────────────────────────────────────────────── */

function Field({
  label,
  name,
  defaultValue,
  ...rest
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="sp-flabel">{label}</span>
      <input name={name} defaultValue={defaultValue ?? ''} className="sp-field" {...rest} />
    </label>
  );
}

function Message({ state }: { state: ActionState }) {
  if (!state.error && !state.ok) return null;
  return (
    <p className={`sp-callout mt-5 ${state.error ? 'sp-callout-error' : 'sp-callout-success'}`}>
      <span className={`font-semibold ${state.error ? 'text-error' : 'text-success'}`}>
        {state.error ?? state.ok}
      </span>
    </p>
  );
}

/** Its own component: `useFormStatus` only reports for a form ABOVE it. */
function Submit({
  label,
  pendingLabel = 'Saving…',
  className
}: {
  label: string;
  pendingLabel?: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
