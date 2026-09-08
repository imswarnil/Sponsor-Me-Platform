import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { BookingForm } from '@/components/booking-form';
import { SlotPreview } from '@/components/slot-preview';
import { formatPaise } from '@/lib/money';
import { propertyByKey, slotFormatByKey } from '@/lib/site';
import { getViewer } from '@/lib/roles';
import { nextAvailableFrom, slotByPublicId, slotSchedule } from '@/lib/queries';

/**
 * ONE SLOT — see the real page, then book a window.
 *
 * The preview is the reason this page exists. A sponsor deciding where to
 * spend money should be looking at the page their ad lands on, not at a
 * description of it, and not at a mockup somebody drew.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const slot = await slotByPublicId(publicId);
  return { title: slot ? slot.name : 'Slot' };
}

export default async function SlotPage({
  params
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const slot = await slotByPublicId(publicId);
  if (!slot || !slot.active) notFound();

  const [availableFrom, schedule, viewer] = await Promise.all([
    nextAvailableFrom(slot.id),
    slotSchedule(slot.id),
    getViewer()
  ]);

  const format = slotFormatByKey(slot.format);
  const property = propertyByKey(slot.property);
  const free = availableFrom.getTime() <= Date.now() + 60_000;

  return (
    <>
      <SiteHeader />

      <main className="section">
        <div className="container">
          <header className="page-head page-head-sm">
            <div className="page-head__main">
              <p className="page-head__eyebrow">
                <Link href="/#slots">← All slots</Link>
              </p>
              <h1 className="page-head__title">{slot.name}</h1>
              {slot.description ? <p className="page-head__lead">{slot.description}</p> : null}
              {/* A cluster of badges, not `page-head__facts` — that part is a
                  stacked grid built for icon+sentence rows, and these are four
                  short labels that belong on one line. */}
              <div className="cluster cluster-sm mt-3">
                <span className="badge badge-quiet">
                  {format.label} · {format.size}
                </span>
                {property ? <span className="badge badge-quiet">{property.label}</span> : null}
                <span className="badge badge-outline">
                  {formatPaise(slot.pricePaise)} / month
                </span>
                {slot.monthlyViews !== null ? (
                  <span className="badge badge-quiet">
                    {slot.monthlyViews.toLocaleString('en-IN')} views / month
                  </span>
                ) : null}
              </div>
            </div>
          </header>

          <div className="row gy-6">
            <div className="col-12 col-lg-7">
              <SlotPreview slot={slot} />

              {schedule.length ? (
                <div className="mt-6">
                  <p className="eyebrow">Booked</p>
                  <table className="table table-compact">
                    <tbody>
                      {schedule.map((row) => (
                        <tr key={row.id}>
                          <td className="t-small">{row.brand || 'A sponsor'}</td>
                          <td className="t-fine t-faint">
                            {row.startsAt.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short'
                            })}
                            {' → '}
                            {row.endsAt.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="t-fine t-faint">
                    Taken is not closed — you book the window after the last one.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="col-12 col-lg-5">
              <div className="card card-roomy">
                <div className="card__body stack stack-sm">
                  <p className="card__kicker">{free ? 'Available now' : 'Next opening'}</p>
                  <p className="t-h3 live-figure m-0">
                    {availableFrom.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>

                  {viewer ? (
                    viewer.role === 'creator' ? (
                      <p className="t-small t-muted m-0">
                        This is your own slot. <Link href="/studio">Manage it in the studio</Link>.
                      </p>
                    ) : (
                      <BookingForm
                        slotId={slot.id}
                        pricePaise={slot.pricePaise}
                        startsAt={availableFrom.toISOString()}
                      />
                    )
                  ) : (
                    <>
                      <p className="t-small t-muted m-0">
                        Sign in to book this window. It takes an email and a password.
                      </p>
                      <Link
                        href={`/signup?next=${encodeURIComponent(`/slot/${slot.publicId}`)}`}
                        className="btn btn-primary btn-block"
                      >
                        Create an account
                      </Link>
                      <Link
                        href={`/signin?next=${encodeURIComponent(`/slot/${slot.publicId}`)}`}
                        className="btn btn-quiet btn-block btn-sm"
                      >
                        Sign in
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
