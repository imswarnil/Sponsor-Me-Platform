'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

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
      <Panel>
        <p className="text-lg font-semibold">This one&rsquo;s yours</p>
        <p className="mt-1 text-sm text-ink-600">
          Manage it, and grab the embed tag, in the studio.
        </p>
        <Link href="/studio" className="btn btn-quiet mt-4 w-full">
          Open studio
        </Link>
      </Panel>
    );
  }

  if (!signedIn) {
    return (
      <Panel>
        <p className="label">{kind === 'bid' ? 'To take first' : 'Price'}</p>
        <p className="tnum mt-1 text-5xl font-semibold">{formatPaise(askPaise)}</p>
        <p className="mt-1 text-sm text-ink-600">
          {kind === 'bid' ? 'or bid whatever you like' : 'per month'}
        </p>
        <Link
          href={`/signup?next=${encodeURIComponent(`/slot/${slug}`)}`}
          className="btn btn-primary mt-6 w-full"
        >
          Make an account →
        </Link>
        <Link
          href={`/signin?next=${encodeURIComponent(`/slot/${slug}`)}`}
          className="mt-3 block text-center text-sm text-ink-600 hover:text-ink-900"
        >
          I already have one
        </Link>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
        <Panel>
          <p className="text-sm text-ink-600">
            Save your ad above, then you can pay for the slot.
          </p>
        </Panel>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="panel h-fit p-6">{children}</div>;
}

/* ── The creative ───────────────────────────────────────────────────────── */

function AdForm({ slotId, existing }: { slotId: string; existing: Ad | null }) {
  const [state, action] = useActionState<ActionState, FormData>(saveAdAction, {});
  const [format, setFormat] = useState(existing?.format ?? 'card');

  return (
    <form action={action} className="panel p-6">
      <input type="hidden" name="slotId" value={slotId} />

      <p className="text-lg font-semibold">Your ad</p>
      {existing?.status === 'rejected' && existing.reviewNote ? (
        <p className="mt-2 rounded-xl border-2 border-signal-500 bg-signal-50 p-3 text-sm">
          Not approved: {existing.reviewNote}
        </p>
      ) : null}

      {/* Four formats, four cells on a hairline grid — the same rig the page
          is drawn on, so the control looks like part of the page. */}
      <div className="mt-4 grid grid-cols-2 gap-px border border-ink-200 bg-ink-200">
        {Object.entries(FORMATS).map(([key, f]) => (
          <label
            key={key}
            className={`cursor-pointer p-3 transition ${
              format === key ? 'bg-signal-50 ring-1 ring-inset ring-signal-500' : 'bg-white hover:bg-ink-50'
            }`}
          >
            <input
              type="radio"
              name="format"
              value={key}
              checked={format === key}
              onChange={() => setFormat(key)}
              className="sr-only"
            />
            <span className="block text-sm font-semibold">{f.label}</span>
            <span className="block text-[11px] leading-tight text-ink-500">{f.note}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand" name="brand" defaultValue={existing?.brand} required maxLength={40} />
          {/* Shown on the leaderboard beside the website, so a reader can tell
              what a name IS before deciding whether to click it. */}
          <Field
            label="What you do"
            name="tag"
            defaultValue={existing?.tag ?? ''}
            maxLength={24}
            placeholder="Issue tracker"
          />
        </div>

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
            <span className="text-sm font-medium">Your HTML</span>
            <textarea
              name="html"
              rows={6}
              maxLength={8000}
              defaultValue={existing?.html ?? ''}
              className="field mt-1 font-mono text-xs"
              placeholder="<div>…</div>"
            />
            {/* Said out loud, because a sponsor pasting a script needs to know
                before they are surprised by it not running. */}
            <span className="mt-1 block text-[11px] text-ink-500">
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
      <Submit label={existing ? 'Save ad' : 'Save ad'} className="btn btn-quiet mt-4 w-full" />
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
    <form action={action} className="panel h-fit p-6">
      <input type="hidden" name="slotId" value={slotId} />

      {kind === 'bid' ? (
        <>
          <p className="label">Your bid</p>
          <div className="mt-2 flex items-center gap-2 border border-ink-300 bg-white px-4 py-3 focus-within:border-signal-500">
            <span className="text-2xl font-normal text-ink-400">₹</span>
            <input
              name="rupees"
              type="number"
              inputMode="numeric"
              min={Math.ceil(askPaise / 100)}
              step={1}
              value={rupees}
              onChange={(e) => setRupees(Number(e.target.value))}
              className="tnum w-full bg-transparent text-3xl font-semibold outline-none"
            />
          </div>
          <p className="mt-2 text-sm text-ink-600">
            {formatPaise(askPaise)} or more takes the top spot. This adds to what you have
            already paid.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 2, 5].map((mult) => {
              const v = Math.ceil((askPaise * mult) / 100);
              return (
                <button
                  key={mult}
                  type="button"
                  onClick={() => setRupees(v)}
                  className="label border border-ink-200 px-2 py-1 hover:border-ink-900 hover:text-ink-900"
                >
                  ₹{v.toLocaleString('en-IN')}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="label">How long?</p>
          <div className="mt-2 grid grid-cols-3 gap-px border border-ink-200 bg-ink-200">
            {TERMS.map((t) => (
              <button
                key={t.months}
                type="button"
                onClick={() => setMonths(t.months)}
                aria-pressed={months === t.months}
                className={`p-3 text-center transition ${
                  months === t.months
                    ? 'bg-signal-50 ring-1 ring-inset ring-signal-500'
                    : 'bg-white hover:bg-ink-50'
                }`}
              >
                <span className="block text-sm font-semibold">{t.months}mo</span>
                {t.off ? (
                  <span className="block text-[10px] font-bold text-mint-600">{t.off}</span>
                ) : null}
              </button>
            ))}
          </div>
          <input type="hidden" name="months" value={months} />
        </>
      )}

      <div className="mt-5 flex items-end justify-between border-t border-ink-200 pt-4">
        <span className="label">Total</span>
        <span className="tnum text-3xl font-semibold">{formatPaise(total)}</span>
      </div>

      <Message state={state} />

      <Submit
        label={kind === 'bid' ? 'Place bid →' : 'Buy this slot →'}
        pendingLabel="Opening checkout…"
        className="btn mt-4 w-full bg-signal-500 text-white"
      />

      <p className="mt-3 text-[11px] leading-snug text-ink-500">
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
      <span className="text-sm font-medium text-ink-700">{label}</span>
      <input name={name} defaultValue={defaultValue ?? ''} className="field mt-1.5" {...rest} />
    </label>
  );
}

function Message({ state }: { state: ActionState }) {
  if (!state.error && !state.ok) return null;
  return (
    <p
      className={`mt-4 border-l-2 py-2 pl-3 text-sm ${
        state.error
          ? 'border-signal-500 bg-signal-50 text-signal-700'
          : 'border-mint-500 bg-mint-50 text-mint-600'
      }`}
    >
      {state.error ?? state.ok}
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
