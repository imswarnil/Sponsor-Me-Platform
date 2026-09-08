'use client';

import { useState, useTransition } from 'react';

import { deleteSlotAction, setSlotActiveAction } from '@/lib/actions';

/**
 * Pause, resume, or delete a slot.
 *
 * Delete asks first, inline, rather than through `confirm()`. A native dialog
 * blocks the whole page and — in the automated contexts this admin gets driven
 * from — freezes it entirely. An inline two-step is also the honest shape: the
 * question and the consequence are visible at the same time as the button.
 *
 * Pausing is the option that should be reached for. It is offered first and
 * styled as the ordinary action, because a slot with a booking history should
 * almost never be deleted — the bookings cascade with it.
 */
export function SlotControls({ slotId, active }: { slotId: string; active: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="cluster cluster-sm">
        <span className="t-fine t-muted">
          Delete this slot and every booking on it? This cannot be undone.
        </span>
        <button
          type="button"
          className="btn btn-xs btn-danger"
          disabled={pending}
          onClick={() => startTransition(() => void deleteSlotAction(slotId))}
        >
          Delete
        </button>
        <button
          type="button"
          className="btn btn-xs btn-quiet"
          onClick={() => setConfirming(false)}
        >
          Keep
        </button>
      </div>
    );
  }

  return (
    <div className="cluster cluster-sm">
      <button
        type="button"
        className="btn btn-xs btn-outline"
        disabled={pending}
        onClick={() => startTransition(() => void setSlotActiveAction(slotId, !active))}
      >
        {active ? 'Pause' : 'Resume'}
      </button>
      <button type="button" className="btn btn-xs btn-quiet" onClick={() => setConfirming(true)}>
        Delete
      </button>
    </div>
  );
}
