'use client';

import { ActionForm, CreativeFields, SubmitButton } from '@/components/forms';
import { saveBookingCreativeAction, saveBrandAction } from '@/lib/actions';
import type { Booking } from '@/lib/db/schema';

/**
 * Edit the creative on one booking.
 *
 * Collapsed by default: a sponsor with four bookings should not be handed four
 * open forms. `<details>` rather than state, so it works before hydration and
 * the browser remembers nothing it should not.
 *
 * The booking id is a hidden field, but it is not the authorisation — the
 * action re-checks ownership in its WHERE clause, so a hand-edited id updates
 * nothing.
 */
export function BookingCreative({ booking, slotName }: { booking: Booking; slotName: string }) {
  return (
    <details className="acc acc-boxed">
      <summary className="acc__label">
        Edit the ad running in {slotName}
        {booking.reviewNote ? (
          <span className="badge badge-warning badge-sm ms-2">Note from the creator</span>
        ) : null}
      </summary>
      <div className="acc__body">
        {booking.reviewNote ? (
          <div className="alert alert-warning alert-inline mb-4">
            <p className="alert__body">{booking.reviewNote}</p>
          </div>
        ) : null}

        <ActionForm action={saveBookingCreativeAction}>
          <input type="hidden" name="bookingId" value={booking.id} />
          <CreativeFields defaults={booking} />
          <div className="form__actions">
            <SubmitButton label="Save this ad" />
          </div>
        </ActionForm>
      </div>
    </details>
  );
}

/**
 * The brand name shown beside every ad and on the leaderboard.
 *
 * Separate from the creative on purpose: it is who the sponsor *is*, not what
 * any one ad says, and changing it must not send every creative back for
 * review.
 */
export function BrandForm({ name, brand }: { name: string; brand: string | null }) {
  return (
    <ActionForm action={saveBrandAction}>
      <div className="form-row">
        <div className="field">
          <label className="field__label" htmlFor="profile-name">
            Your name
          </label>
          <input
            className="input"
            id="profile-name"
            name="name"
            defaultValue={name}
            maxLength={80}
            required
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="profile-brand">
            Brand
          </label>
          <input
            className="input"
            id="profile-brand"
            name="brand"
            defaultValue={brand ?? ''}
            maxLength={40}
            placeholder="Acme"
          />
          <p className="field__hint">Shown on the leaderboard. Falls back to your name.</p>
        </div>
      </div>
      <div className="form__actions">
        <SubmitButton label="Save" />
      </div>
    </ActionForm>
  );
}
