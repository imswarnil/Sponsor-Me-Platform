'use client';

import { useState, useTransition } from 'react';

import { AdLarge } from '@/components/ad-unit';
import { reviewBidAction, reviewBookingAction } from '@/lib/actions';
import { formatPaise } from '@/lib/money';
import type { Bid, Booking, Profile, Slot } from '@/lib/db/schema';

/**
 * MODERATION.
 *
 * Every creative is shown exactly as it will render — the same component the
 * network uses — because approving a description of an ad is not the same as
 * approving the ad. What the creator sees here is what their readers get.
 *
 * A rejection can carry a note, and that note is shown to the sponsor. A
 * refusal with no reason is a support conversation waiting to happen.
 */
export function ReviewList({
  bids,
  bookings = []
}: {
  bids: { bid: Bid; profile: Profile }[];
  bookings?: { booking: Booking; slot: Slot; profile: Profile }[];
}) {
  if (!bids.length && !bookings.length) {
    return (
      <div className="empty">
        <div className="empty__body">
          <p className="empty__title">Nothing waiting</p>
          <p className="t-small t-muted">Every paid creative has been reviewed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      {bids.map(({ bid, profile }) => (
        <ReviewRow key={bid.id} bid={bid} profile={profile} />
      ))}

      {/* A booking's creative is the same shape as a bid's, so it is reviewed
          the same way — the only difference is which action decides it and
          that the row names the slot the ad will run in. */}
      {bookings.map(({ booking, slot, profile }) => (
        <ReviewRow
          key={booking.id}
          bid={{ ...booking, firstPaidAt: booking.paidAt, status: 'pending', updatedAt: booking.createdAt } as unknown as Bid}
          profile={profile}
          context={`${slot.name} · ${booking.months} month${booking.months === 1 ? '' : 's'}`}
          onDecide={reviewBookingAction}
        />
      ))}
    </div>
  );
}

function ReviewRow({
  bid,
  profile,
  context,
  onDecide = reviewBidAction
}: {
  bid: Bid;
  profile: Profile;
  context?: string;
  onDecide?: (id: string, decision: 'approved' | 'rejected', note?: string) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [pending, startTransition] = useTransition();

  function decide(decision: 'approved' | 'rejected') {
    startTransition(() => {
      void onDecide(bid.id, decision, note);
    });
  }

  return (
    <div className="card">
      <div className="card__body">
        <div className="row gy-4">
          <div className="col-12 col-lg-7">
            <p className="eyebrow">{context ? `As it will run · ${context}` : 'As it will run'}</p>
            {/* The real unit, not a description of it. */}
            <AdLarge
              bid={{
                rank: 1,
                id: bid.id,
                profileId: bid.profileId,
                amountPaise: bid.amountPaise,
                kind: bid.kind,
                brand: bid.brand,
                headline: bid.headline,
                body: bid.body,
                url: bid.url,
                imageUrl: bid.imageUrl,
                videoUrl: bid.videoUrl,
                priceLabel: bid.priceLabel,
                ctaLabel: bid.ctaLabel,
                firstPaidAt: bid.firstPaidAt
              }}
            />
          </div>

          <div className="col-12 col-lg-5">
            <div className="stack stack-sm">
              <dl className="dl dl-lined t-small">
                <div>
                  <dt>Sponsor</dt>
                  <dd>{profile.brand || profile.name || profile.email}</dd>
                </div>
                <div>
                  <dt>Paid</dt>
                  <dd className="t-data live-figure">{formatPaise(bid.amountPaise)}</dd>
                </div>
                <div>
                  <dt>Links to</dt>
                  <dd className="t-break">
                    {bid.url ? (
                      // rel=noreferrer as well as noopener: the creator opening
                      // an unreviewed link should not hand that site a referrer
                      // from their own admin page.
                      <a href={bid.url} target="_blank" rel="noopener noreferrer nofollow">
                        {bid.url}
                      </a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
              </dl>

              <div className="field">
                <label className="field__label" htmlFor={`note-${bid.id}`}>
                  Note to the sponsor
                </label>
                <input
                  className="input input-sm"
                  id={`note-${bid.id}`}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional — shown to them if you reject"
                />
              </div>

              <div className="cluster cluster-sm">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => decide('approved')}
                  disabled={pending}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger-outline"
                  onClick={() => decide('rejected')}
                  disabled={pending}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
