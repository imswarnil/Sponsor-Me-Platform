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
        <p className="text-lg font-black">This one&rsquo;s yours</p>
        <p className="mt-1 text-sm text-ink-600">
          Manage it, and grab the embed tag, in the studio.
        </p>
        <Link href="/studio" className="btn-pop mt-4 w-full bg-white">
          Open studio
        </Link>
      </Panel>
    );
  }

  if (!signedIn) {
    return (
      <Panel>
        <p className="text-sm font-bold uppercase tracking-wide text-ink-500">
          {kind === 'bid' ? 'To take the crown' : 'Price'}
        </p>
        <p className="tnum mt-1 text-5xl font-black">{formatPaise(askPaise)}</p>
        <p className="mt-1 text-sm text-ink-600">
          {kind === 'bid' ? 'or bid whatever you like' : 'per month'}
        </p>
        <Link
          href={`/signup?next=${encodeURIComponent(`/slot/${slug}`)}`}
          className="btn-pop mt-6 w-full bg-signal-500 text-white"
        >
          Make an account →
        </Link>
        <Link
          href={`/signin?next=${encodeURIComponent(`/slot/${slug}`)}`}
          className="mt-3 block text-center text-sm font-bold text-ink-600 hover:text-ink-900"
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
  return <div className="card-pop card-pop-lg h-fit p-6">{children}</div>;
}

/* ── The creative ───────────────────────────────────────────────────────── */

function AdForm({ slotId, existing }: { slotId: string; existing: Ad | null }) {
  const [state, action] = useActionState<ActionState, FormData>(saveAdAction, {});
  const [format, setFormat] = useState(existing?.format ?? 'card');

  return (
    <form action={action} className="card-pop card-pop-lg p-6">
      <input type="hidden" name="slotId" value={slotId} />

      <p className="text-lg font-black">Your ad</p>
      {existing?.status === 'rejected' && existing.reviewNote ? (
        <p className="mt-2 rounded-xl border-2 border-signal-500 bg-signal-50 p-3 text-sm">
          Not approved: {existing.reviewNote}
        </p>
      ) : null}

      {/* Format picker: chunky toggles, because there are only four and each
          needs a word of explanation. */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {Object.entries(FORMATS).map(([key, f]) => (
          <label
            key={key}
            className={`cursor-pointer rounded-xl border-2 p-3 transition ${
              format === key
                ? 'border-ink-900 bg-craft-100 shadow-[3px_3px_0_0_var(--color-ink-900)]'
                : 'border-ink-200 bg-white hover:border-ink-400'
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
            <span className="text-xl">{f.emoji}</span>
            <span className="block text-sm font-black">{f.label}</span>
            <span className="block text-[11px] leading-tight text-ink-500">{f.note}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Field label="Brand" name="brand" defaultValue={existing?.brand} required maxLength={40} />

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
            <span className="text-sm font-bold">Your HTML</span>
            <textarea
              name="html"
              rows={6}
              maxLength={8000}
              defaultValue={existing?.html ?? ''}
              className="field-pop mt-1 font-mono text-xs"
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
      <Submit label={existing ? 'Save ad' : 'Save ad'} className="btn-pop mt-4 w-full bg-white" />
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
    <form action={action} className="card-pop card-pop-lg h-fit p-6">
      <input type="hidden" name="slotId" value={slotId} />

      {kind === 'bid' ? (
        <>
          <p className="text-sm font-bold uppercase tracking-wide text-ink-500">Your bid</p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border-2 border-ink-900 bg-white px-4 py-3">
            <span className="text-2xl font-black text-ink-400">₹</span>
            <input
              name="rupees"
              type="number"
              inputMode="numeric"
              min={Math.ceil(askPaise / 100)}
              step={1}
              value={rupees}
              onChange={(e) => setRupees(Number(e.target.value))}
              className="tnum w-full bg-transparent text-3xl font-black outline-none"
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
                  className="rounded-full border-2 border-ink-900 bg-white px-3 py-1 text-xs font-bold hover:bg-craft-100"
                >
                  ₹{v.toLocaleString('en-IN')}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-bold uppercase tracking-wide text-ink-500">How long?</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {TERMS.map((t) => (
              <button
                key={t.months}
                type="button"
                onClick={() => setMonths(t.months)}
                aria-pressed={months === t.months}
                className={`rounded-xl border-2 p-3 text-center transition ${
                  months === t.months
                    ? 'border-ink-900 bg-teal-200 shadow-[3px_3px_0_0_var(--color-ink-900)]'
                    : 'border-ink-200 bg-white hover:border-ink-400'
                }`}
              >
                <span className="block text-sm font-black">{t.months}mo</span>
                {t.off ? (
                  <span className="block text-[10px] font-bold text-mint-600">{t.off}</span>
                ) : null}
              </button>
            ))}
          </div>
          <input type="hidden" name="months" value={months} />
        </>
      )}

      <div className="mt-5 flex items-end justify-between border-t-2 border-dashed border-ink-200 pt-4">
        <span className="text-sm font-bold uppercase tracking-wide text-ink-500">Total</span>
        <span className="tnum text-3xl font-black">{formatPaise(total)}</span>
      </div>

      <Message state={state} />

      <Submit
        label={kind === 'bid' ? 'Place bid →' : 'Buy this slot →'}
        pendingLabel="Opening checkout…"
        className="btn-pop mt-4 w-full bg-signal-500 text-white"
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
      <span className="text-sm font-bold">{label}</span>
      <input name={name} defaultValue={defaultValue ?? ''} className="field-pop mt-1" {...rest} />
    </label>
  );
}

function Message({ state }: { state: ActionState }) {
  if (!state.error && !state.ok) return null;
  return (
    <p
      className={`mt-4 rounded-xl border-2 p-3 text-sm font-semibold ${
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
