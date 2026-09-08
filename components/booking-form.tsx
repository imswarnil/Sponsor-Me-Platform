'use client';

import { useActionState, useState } from 'react';

import { CreativeFields, FormMessage, SubmitButton } from '@/components/forms';
import { startBookingCheckoutAction, type ActionState } from '@/lib/actions';
import { formatPaise } from '@/lib/money';
import { bookingTerms } from '@/lib/site';

/**
 * Book a window on a slot.
 *
 * The total shown here is a preview for the person paying. The server
 * recomputes it from the slot's own row and the whitelisted month count, and
 * that recomputation — not this arithmetic — is what is charged. The start
 * date is not submitted at all: the server takes the slot's next free moment,
 * so a posted date cannot claim a window somebody already bought.
 */
export function BookingForm({
  slotId,
  pricePaise,
  startsAt
}: {
  slotId: string;
  pricePaise: number;
  startsAt: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(startBookingCheckoutAction, {});
  const [months, setMonths] = useState(1);

  const start = new Date(startsAt);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);

  return (
    <form action={action} className="form stack-sm">
      <input type="hidden" name="slotId" value={slotId} />

      <fieldset className="fieldset">
        <legend className="field__label">How long?</legend>
        <div className="btn-group btn-group-segmented">
          {bookingTerms.map((term) => (
            <button
              key={term.months}
              type="button"
              className={`btn btn-sm ${months === term.months ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setMonths(term.months)}
              aria-pressed={months === term.months}
            >
              {term.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="months" value={months} />
      </fieldset>

      <dl className="dl dl-lined t-small">
        <div>
          <dt>Runs</dt>
          <dd className="t-data">
            {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} →{' '}
            {end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd className="t-data live-figure">{formatPaise(pricePaise * months)}</dd>
        </div>
      </dl>

      <details className="acc acc-boxed">
        <summary className="acc__label">Your ad</summary>
        <div className="acc__body">
          <CreativeFields />
        </div>
      </details>

      <FormMessage state={state} />

      <SubmitButton
        label={`Pay ${formatPaise(pricePaise * months)}`}
        pendingLabel="Opening checkout…"
        className="btn btn-primary btn-block"
      />

      <p className="t-fine t-faint m-0">
        Your ad runs once {`it's`} approved. Nothing is charged until the payment provider confirms
        it.
      </p>
    </form>
  );
}
