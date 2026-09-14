'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';

import { Bookmark, Check, Copy, Eye, Trophy } from '@/components/icons';
import {
  createSlotAction,
  deleteSlotAction,
  reviewAdAction,
  setSlotActiveAction,
  type ActionState
} from '@/lib/actions';
import { site, SHAPES } from '@/lib/site';
import type { Slot } from '@/lib/db/schema';

/* ── Create ─────────────────────────────────────────────────────────────── */

export function NewSlot() {
  const [state, action] = useActionState<ActionState, FormData>(createSlotAction, {});
  const [kind, setKind] = useState<'fixed' | 'bid'>('fixed');

  return (
    <form action={action} className="sp-panel h-fit p-7 sm:p-9">
      <p className="sp-h3 font-semibold">New slot</p>

      {/* The kind is the biggest decision on this form, so it gets the biggest
          control — two tiles, not a line in a dropdown. */}
      <fieldset className="mt-6">
        <legend className="sp-flabel">What kind?</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              {
                k: 'fixed',
                icon: <Bookmark className="size-5" />,
                t: 'Buy it',
                d: 'One price, one buyer.'
              },
              {
                k: 'bid',
                icon: <Trophy className="size-5" />,
                t: 'Bid for it',
                d: 'Highest bid serves.'
              }
            ] as const
          ).map((o) => (
            <label key={o.k} className={`sp-choice ${kind === o.k ? 'sp-choice-on' : ''}`}>
              <input
                type="radio"
                name="kind"
                value={o.k}
                checked={kind === o.k}
                onChange={() => setKind(o.k)}
                className="sr-only"
              />
              <span className={kind === o.k ? 'text-accent-ink' : 'text-secondary'}>
                {o.icon}
              </span>
              <span className="mt-2.5 block text-small font-semibold text-title">{o.t}</span>
              <span className="mt-0.5 block text-tiny leading-tight text-secondary">{o.d}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-col gap-5">
        <L label="Name">
          <input name="name" required maxLength={60} className="sp-field" placeholder="Blog sidebar" />
        </L>

        <L label="One line about it">
          <input name="blurb" maxLength={200} className="sp-field" placeholder="Beside every post" />
        </L>

        <div className="grid gap-5 sm:grid-cols-2">
          <L label="Shape">
            <select name="shape" className="sp-field sp-select" defaultValue="card">
              {Object.entries(SHAPES).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label} · {s.w}×{s.h}
                </option>
              ))}
            </select>
          </L>

          <L label={kind === 'bid' ? 'Floor bid (₹)' : 'Price / month (₹)'}>
            <input
              name="priceRupees"
              type="number"
              min={1}
              required
              className="sp-field sp-num"
              placeholder="2500"
            />
          </L>
        </div>

        {kind === 'bid' ? (
          <L
            label="Step to outbid (₹)"
            hint="How much someone must beat the leader by. Stops one-rupee wars."
          >
            <input
              name="stepRupees"
              type="number"
              min={1}
              defaultValue={100}
              className="sp-field sp-num"
            />
          </L>
        ) : null}

        <L label="Preview URL (optional)">
          <input name="previewUrl" type="url" className="sp-field" placeholder="https://…" />
        </L>
      </div>

      {state.error ? (
        <p className="sp-callout sp-callout-error mt-5 font-semibold text-error">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="sp-callout sp-callout-success mt-5 font-semibold text-success">{state.ok}</p>
      ) : null}

      <Submit label="Create slot" className="sp-btn sp-btn-block mt-6" />
    </form>
  );
}

/* ── The tag ────────────────────────────────────────────────────────────── */

/**
 * The snippet, and a live look at what it renders.
 *
 * The URL is built from `site.self`, never `window.location`, so a tag copied
 * out of a localhost studio still points at production — pasting a localhost
 * URL onto a live site is the mistake this avoids.
 */
export function SlotTag({ slot }: { slot: Slot }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  /* Two things can be embedded from one slot: the winning ad, or the whole
     board. They are different products, so the creator picks which tag. */
  const [view, setView] = useState<'ad' | 'board'>('ad');
  const shape = SHAPES[slot.shape as keyof typeof SHAPES];
  const tag =
    view === 'board'
      ? `<script src="${site.self}/sponsor.js" data-slot="${slot.publicId}" data-view="board" async></script>`
      : `<script src="${site.self}/sponsor.js" data-slot="${slot.publicId}" async></script>`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="sp-eyebrow">Paste this where it should appear</p>

        <div className="flex flex-wrap items-center gap-2">
          {/* Which of the two embeddable things this tag is for. */}
          <div className="sp-seg" role="group" aria-label="What to embed">
            {(['ad', 'board'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className="sp-seg-item capitalize"
              >
                {v}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="sp-btn sp-btn-quiet sp-btn-sm"
          >
            <Eye />
            {open ? 'Hide' : 'Preview'}
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(tag);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              } catch {
                /* clipboard blocked; the code is selectable anyway */
              }
            }}
            className="sp-btn sp-btn-solid sp-btn-sm"
          >
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <pre className="sp-code mt-3">{tag}</pre>

      {open ? (
        <div className="mt-4 overflow-hidden rounded-card bg-surface-100">
          {/* A pretend browser chrome, so it is obvious this is the unit as it
              lands on somebody else's page rather than a design mock. */}
          <div className="flex items-center gap-2 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <i className="size-2 rounded-full bg-surface-300" />
              <i className="size-2 rounded-full bg-surface-300" />
              <i className="size-2 rounded-full bg-surface-300" />
            </span>
            <span className="truncate font-mono text-tiny text-mute">
              {site.ownerLabel}/a-post
            </span>
          </div>
          <div className="bg-surface p-5">
            {/* Previewed at the width it will really occupy — a board in a
                300px rail and a board in a 900px column are different layouts,
                and the point of the preview is to see which one you get. */}
            <iframe
              src={`/embed/${slot.publicId}${view === 'board' ? '?view=board' : ''}`}
              title={`${slot.name} preview`}
              className="mx-auto block w-full"
              style={{
                maxWidth: view === 'board' ? '100%' : (shape?.w ?? 320),
                height: view === 'board' ? 560 : (shape?.h ?? 300) + 30
              }}
              loading="lazy"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Pause / delete ─────────────────────────────────────────────────────── */

export function SlotControls({ slotId, active }: { slotId: string; active: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-tiny font-semibold text-error">
          Delete this slot and every ad in it?
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => void deleteSlotAction(slotId))}
          className="sp-btn sp-btn-sm"
        >
          Yes, delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="sp-btn sp-btn-soft sp-btn-sm"
        >
          Keep
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => void setSlotActiveAction(slotId, !active))}
        className="sp-btn sp-btn-soft sp-btn-sm"
      >
        {active ? 'Pause' : 'Resume'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="sp-btn sp-btn-danger sp-btn-sm"
      >
        Delete
      </button>
    </div>
  );
}

/* ── Approve / reject ───────────────────────────────────────────────────── */

export function ReviewControls({ adId }: { adId: string }) {
  const [note, setNote] = useState('');
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (shown if you reject)"
        aria-label="Review note"
        className="sp-field"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => void reviewAdAction(adId, 'live', note))}
          className="sp-btn sp-btn-sm flex-1"
        >
          <Check />
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => void reviewAdAction(adId, 'rejected', note))}
          className="sp-btn sp-btn-soft sp-btn-sm flex-1"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function L({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="sp-flabel">{label}</span>
      {children}
      {hint ? <span className="sp-hint">{hint}</span> : null}
    </label>
  );
}

function Submit({ label, className }: { label: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? 'Working…' : label}
    </button>
  );
}
