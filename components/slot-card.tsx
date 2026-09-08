import Link from 'next/link';

import { formatPaise } from '@/lib/money';
import { slotFormatByKey, propertyByKey } from '@/lib/site';
import type { Booking, Slot } from '@/lib/db/schema';

/**
 * One piece of bookable inventory, as a brand sees it before buying.
 *
 * A taken slot is shown as taken AND as bookable, which is the whole point of
 * the queue: the answer to "somebody else has it" is "you can have it from the
 * 14th", not "come back later". A slot that renders as unavailable is a sale
 * the design threw away.
 */
export function SlotCard({
  slot,
  live,
  availableFrom
}: {
  slot: Slot;
  live: Booking | null;
  availableFrom: Date;
}) {
  const format = slotFormatByKey(slot.format);
  const property = propertyByKey(slot.property);
  const free = availableFrom.getTime() <= Date.now() + 60_000;

  return (
    <article className="card card-hover-lift">
      <div className="card__body stack stack-sm">
        <div className="cluster cluster-between">
          <span className="badge badge-quiet">{format.label}</span>
          {free ? (
            <span className="badge badge-success badge-dot">Open now</span>
          ) : (
            <span className="badge badge-warning badge-dot">Booked</span>
          )}
        </div>

        <div>
          <h3 className="card__title">{slot.name}</h3>
          <p className="card__meta t-fine t-faint">
            {property ? property.label : 'Across the network'} · {format.size}
          </p>
        </div>

        {slot.description ? (
          <p className="card__excerpt t-small t-muted t-clamp-3">{slot.description}</p>
        ) : null}

        <dl className="dl dl-lined t-small">
          <div>
            <dt>Price</dt>
            <dd className="t-data live-figure">{formatPaise(slot.pricePaise)} / month</dd>
          </div>
          {/* A view count is rendered only when one was measured. An unmeasured
              slot shows no row at all rather than a zero, which would read as
              "nobody sees this" — a different and false claim. */}
          {slot.monthlyViews !== null ? (
            <div>
              <dt>Views</dt>
              <dd className="t-data live-figure">
                {slot.monthlyViews.toLocaleString('en-IN')} / month
              </dd>
            </div>
          ) : null}
          <div>
            <dt>{free ? 'Available' : 'Free from'}</dt>
            <dd className="t-data">
              {free
                ? 'Immediately'
                : availableFrom.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
            </dd>
          </div>
        </dl>

        {live ? (
          <p className="t-fine t-faint m-0">
            Currently running: <strong className="t-default">{live.brand}</strong>
          </p>
        ) : null}
      </div>

      <div className="card__footer">
        <Link href={`/slot/${slot.publicId}`} className="btn btn-sm btn-primary btn-block">
          {free ? 'Book this slot' : 'Book the next window'}
        </Link>
      </div>
    </article>
  );
}
