'use client';

import { useActionState, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';

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
    <form action={action} className="panel p-6">
      <p className="text-lg font-semibold">New slot</p>

      {/* The kind is the biggest decision on this form, so it is the biggest
          control — two chunky cards, not a dropdown. */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {(
          [
            { k: 'fixed', emoji: '✨', t: 'Buy it', d: 'One price, one buyer.', tone: 'bg-teal-200' },
            { k: 'bid', emoji: '🏆', t: 'Bid for it', d: 'Highest bid serves.', tone: 'bg-craft-200' }
          ] as const
        ).map((o) => (
          <label
            key={o.k}
            className={`cursor-pointer  border p-3 transition ${
              kind === o.k
                ? `border-ink-900 ${o.tone} `
                : 'border-ink-200 bg-white hover:border-ink-400'
            }`}
          >
            <input
              type="radio"
              name="kind"
              value={o.k}
              checked={kind === o.k}
              onChange={() => setKind(o.k)}
              className="sr-only"
            />
            <span className="text-xl">{o.emoji}</span>
            <span className="block text-sm font-semibold">{o.t}</span>
            <span className="block text-[11px] leading-tight text-ink-500">{o.d}</span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <L label="Name">
          <input name="name" required maxLength={60} className="field" placeholder="Blog sidebar" />
        </L>

        <L label="One line about it">
          <input name="blurb" maxLength={200} className="field" placeholder="Beside every post" />
        </L>

        <div className="grid grid-cols-2 gap-3">
          <L label="Shape">
            <select name="shape" className="field" defaultValue="card">
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
              className="field"
              placeholder="2500"
            />
          </L>
        </div>

        {kind === 'bid' ? (
          <L label="Step to outbid (₹)">
            <input
              name="stepRupees"
              type="number"
              min={1}
              defaultValue={100}
              className="field"
            />
            <span className="mt-1 block text-[11px] text-ink-500">
              How much someone must beat the leader by. Stops one-rupee wars.
            </span>
          </L>
        ) : null}

        <L label="Preview URL (optional)">
          <input name="previewUrl" type="url" className="field" placeholder="https://…" />
        </L>
      </div>

      {state.error ? (
        <p className="mt-4  border-l-2 border-signal-500 bg-signal-50 py-2 pl-3 text-sm font-semibold">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="mt-4  border-l-2 border-mint-500 bg-mint-50 py-2 pl-3 text-sm font-semibold">
          {state.ok}
        </p>
      ) : null}

      <Submit label="Create slot" className="btn mt-4 w-full bg-signal-500 text-white" />
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
  const shape = SHAPES[slot.shape as keyof typeof SHAPES];
  const tag = `<script src="${site.self}/sponsor.js" data-slot="${slot.publicId}" async></script>`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Paste this where it should appear
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-bold"
          >
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
            className="rounded-full border border-ink-200 bg-craft-200 px-3 py-1 text-xs font-bold"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <pre className="mt-2 overflow-x-auto  border border-ink-200 bg-ink-900 p-3 font-mono text-[11px] leading-relaxed text-mint-400">
        {tag}
      </pre>

      {open ? (
        <div className="mt-3 overflow-hidden  border border-ink-200">
          <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-100 px-3 py-1.5">
            <span className="flex gap-1" aria-hidden>
              <i className="h-2 w-2 rounded-full bg-ink-400" />
              <i className="h-2 w-2 rounded-full bg-ink-400" />
              <i className="h-2 w-2 rounded-full bg-ink-400" />
            </span>
            <span className="truncate font-mono text-[10px] text-ink-500">
              {site.ownerLabel}/a-post
            </span>
          </div>
          <div className="bg-white p-4">
            {/* The real widget, live, at the real width. */}
            <iframe
              src={`/embed/${slot.publicId}`}
              title={`${slot.name} preview`}
              className="mx-auto block w-full border-0"
              style={{ maxWidth: shape?.w ?? 320, height: (shape?.h ?? 300) + 30 }}
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
        <span className="text-xs font-bold text-signal-600">
          Delete this slot and every ad in it?
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => void deleteSlotAction(slotId))}
          className="rounded-full border border-ink-200 bg-signal-500 px-3 py-1 text-xs font-bold text-white"
        >
          Yes, delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-bold"
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
        className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-bold"
      >
        {active ? 'Pause' : 'Resume'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full border border-ink-200 px-3 py-1 text-xs font-bold text-ink-500 hover:border-ink-900 hover:text-ink-900"
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
    <div className="flex flex-col gap-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (shown if you reject)"
        className="field text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => void reviewAdAction(adId, 'live', note))}
          className="btn btn-primary btn-sm flex-1"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => void reviewAdAction(adId, 'rejected', note))}
          className="btn btn-quiet btn-sm flex-1"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <div className="mt-1">{children}</div>
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
