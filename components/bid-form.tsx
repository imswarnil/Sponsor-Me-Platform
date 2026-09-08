'use client';

import { useActionState, useState } from 'react';

import { FormMessage, SubmitButton } from '@/components/forms';
import { startBidCheckoutAction, type ActionState } from '@/lib/actions';
import { formatPaise, paiseToRupees } from '@/lib/money';

/**
 * The bid form.
 *
 * The amount typed here is a REQUEST, not a price. The server re-reads the
 * board in the same call and clamps it against the floor and the ceiling — so
 * everything in this file is a convenience for the person bidding, and none of
 * it is a control. Editing the DOM to send ₹1 gets ₹1 rejected on the server.
 *
 * Rupees in the input, paise on the wire. `rupeesToPaise` on the server is the
 * only conversion, and it refuses anything that is not a whole number — a bid
 * form that accepts ₹2500.005 is a rounding bug wearing a text input.
 */
export function BidForm({
  minimum,
  step,
  floor,
  disabled
}: {
  minimum: number;
  step: number;
  floor: number;
  disabled?: boolean;
}) {
  const [state, action] = useActionState<ActionState, FormData>(startBidCheckoutAction, {});
  const [amount, setAmount] = useState(paiseToRupees(minimum));

  const presets = [minimum, minimum + step * 5, minimum + step * 20].map(paiseToRupees);

  return (
    <form action={action} className="form stack-sm">
      <div className="field">
        <label className="field__label" htmlFor="amount">
          Your bid
        </label>
        <div className="input-group">
          <span className="input-group__text">₹</span>
          <input
            className="input"
            id="amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={paiseToRupees(floor)}
            step={1}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            required
            disabled={disabled}
          />
        </div>
        <p className="field__hint">
          {formatPaise(minimum)} takes first place right now. Less than that still puts you on the
          board, lower down. This adds to what you have already paid.
        </p>
      </div>

      <div className="cluster cluster-sm">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className="btn btn-xs btn-outline"
            onClick={() => setAmount(preset)}
            disabled={disabled}
          >
            ₹{preset.toLocaleString('en-IN')}
          </button>
        ))}
      </div>

      <FormMessage state={state} />

      {disabled ? (
        <p className="t-small t-muted m-0">Write your ad below first — there is nothing to run yet.</p>
      ) : (
        <SubmitButton
          label="Continue to payment"
          pendingLabel="Opening checkout…"
          className="btn btn-primary btn-block"
        />
      )}
    </form>
  );
}
