import { Footer, Header } from '@/components/chrome';
import { AdRender } from '@/components/ad-render';
import { SignOut } from '@/components/sign-out';
import { NewSlot, ReviewControls, SlotControls, SlotTag } from '@/components/slot-admin';
import { formatPaise } from '@/lib/money';
import { SHAPES } from '@/lib/site';
import { creatorEmailConfigured, requireCreator } from '@/lib/roles';
import { allSponsors, earnings, pendingReview, slotsWithState, statsOverall } from '@/lib/queries';

/**
 * THE STUDIO — make slots, get tags, approve ads, see the money.
 *
 * One page, because the question being asked is "what is happening", and that
 * answer should not be spread across five navigations.
 */
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Studio' };

export default async function Studio() {
  const viewer = await requireCreator();
  const [slots, money, stats, queue, sponsors] = await Promise.all([
    slotsWithState(false),
    earnings(),
    statsOverall(),
    pendingReview(),
    allSponsors()
  ]);

  return (
    <>
      <Header />

      <main className="min-h-[60vh] bg-mint-50 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="sticker -rotate-1 bg-mint-300">Studio</span>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                {viewer.name || 'Your slots'}
              </h1>
              <p className="text-sm text-ink-600">{viewer.email}</p>
            </div>
            <SignOut />
          </div>

          {/*
            Without CREATOR_EMAIL set, admin falls back to the oldest account —
            correct for a fresh local install, dangerous in production. Said out
            loud rather than left to be discovered.
          */}
          {!creatorEmailConfigured() ? (
            <div className="card-pop mt-6 bg-craft-100 p-5">
              <p className="font-black">⚠️ CREATOR_EMAIL is not set</p>
              <p className="text-sm text-ink-700">
                Admin is currently granted to the oldest account in the database — this one by
                accident, not by configuration. Set it before this is public.
              </p>
            </div>
          ) : null}

          {/* ── Money ─────────────────────────────────────────────────── */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Chip value={formatPaise(money.total)} label="collected" tone="bg-craft-200" />
            <Chip value={money.count} label="payments" tone="bg-white" />
            {stats.views > 0 ? (
              <Chip value={stats.views.toLocaleString('en-IN')} label="views" tone="bg-white" />
            ) : null}
            {stats.clicks > 0 ? (
              <Chip value={stats.clicks.toLocaleString('en-IN')} label="clicks" tone="bg-white" />
            ) : null}
            <Chip value={sponsors.length} label="sponsors" tone="bg-white" />
          </div>

          {/* ── Waiting on you ────────────────────────────────────────── */}
          <section className="mt-12">
            <h2 className="text-2xl font-black tracking-tight">
              Waiting on you {queue.length ? `(${queue.length})` : ''}
            </h2>
            <p className="text-sm text-ink-600">
              Paid, but nothing runs on your sites until you approve it.
            </p>

            {queue.length ? (
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {queue.map(({ ad, slot, profile }) => (
                  <div key={ad.id} className="card-pop card-pop-lg p-5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black">{slot.name}</p>
                      <span className="tnum text-sm font-black text-craft-600">
                        {formatPaise(ad.amountPaise)}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500">
                      {profile.brand || profile.name || profile.email}
                    </p>

                    <div className="my-4" style={{ minHeight: 200 }}>
                      {/* The real unit — approving a description of an ad is
                          not the same as approving the ad. */}
                      <AdRender
                        ad={{
                          id: ad.id,
                          slotId: ad.slotId,
                          profileId: ad.profileId,
                          rank: 1,
                          format: ad.format,
                          brand: ad.brand,
                          headline: ad.headline,
                          body: ad.body,
                          url: ad.url,
                          imageUrl: ad.imageUrl,
                          videoUrl: ad.videoUrl,
                          ctaLabel: ad.ctaLabel,
                          html: ad.html,
                          amountPaise: ad.amountPaise
                        }}
                        shape={slot.shape}
                      />
                    </div>

                    {ad.url ? (
                      <p className="mb-3 truncate text-xs text-ink-500">
                        →{' '}
                        {/* noreferrer as well: opening an unreviewed link should
                            not hand that site a referrer from this admin page. */}
                        <a
                          href={ad.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="underline"
                        >
                          {ad.url}
                        </a>
                      </p>
                    ) : null}

                    <ReviewControls adId={ad.id} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-pop mt-5 p-10 text-center">
                <p className="text-4xl">✅</p>
                <p className="mt-2 font-black">All clear</p>
                <p className="text-sm text-ink-600">Nothing is waiting.</p>
              </div>
            )}
          </section>

          {/* ── Slots ─────────────────────────────────────────────────── */}
          <section className="mt-14 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Your slots</h2>
              <p className="text-sm text-ink-600">
                Make one, paste the tag, and it starts selling itself.
              </p>

              {slots.length ? (
                <div className="mt-5 flex flex-col gap-5">
                  {slots.map(({ slot, winner, contenders, askPaise }) => (
                    <div key={slot.id} className="card-pop p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`sticker text-[10px] ${
                                slot.kind === 'bid' ? 'bg-craft-300' : 'bg-teal-300'
                              }`}
                            >
                              {slot.kind === 'bid' ? '🏆 Bid' : '✨ Buy'}
                            </span>
                            <span
                              className={`sticker text-[10px] ${
                                slot.active ? 'bg-mint-200' : 'bg-ink-100'
                              }`}
                            >
                              {slot.active ? 'Live' : 'Paused'}
                            </span>
                          </div>
                          <p className="mt-2 text-lg font-black">{slot.name}</p>
                          <p className="text-xs text-ink-500">
                            {SHAPES[slot.shape as keyof typeof SHAPES]?.label ?? slot.shape} ·{' '}
                            {formatPaise(askPaise)}
                            {slot.kind === 'bid' ? ' to lead' : ' / month'} ·{' '}
                            {contenders.length} in the running
                          </p>
                        </div>
                        <SlotControls slotId={slot.id} active={slot.active} />
                      </div>

                      {winner ? (
                        <p className="mt-3 text-xs text-ink-600">
                          Serving: <strong>{winner.brand}</strong>
                        </p>
                      ) : null}

                      <div className="mt-4">
                        <SlotTag slot={slot} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card-pop mt-5 p-10 text-center">
                  <p className="text-4xl">🪧</p>
                  <p className="mt-2 font-black">No slots yet</p>
                  <p className="text-sm text-ink-600">Make your first one →</p>
                </div>
              )}
            </div>

            <NewSlot />
          </section>

          {/* ── Sponsors ──────────────────────────────────────────────── */}
          {sponsors.length ? (
            <section className="mt-14">
              <h2 className="text-2xl font-black tracking-tight">Sponsors</h2>
              <div className="card-pop mt-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-ink-900 bg-ink-50">
                    <tr>
                      <th className="p-3 text-left font-black">Who</th>
                      <th className="p-3 text-left font-black">Ads</th>
                      <th className="p-3 text-right font-black">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsors.map(({ profile, paid, adCount }) => (
                      <tr key={profile.id} className="border-b-2 border-dashed border-ink-100">
                        <td className="p-3">
                          <span className="font-bold">
                            {profile.brand || profile.name || '—'}
                          </span>
                          <br />
                          <span className="text-xs text-ink-500">{profile.email}</span>
                        </td>
                        <td className="p-3">{adCount}</td>
                        <td className="tnum p-3 text-right font-black">{formatPaise(paid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <Footer />
    </>
  );
}

function Chip({
  value,
  label,
  tone
}: {
  value: string | number;
  label: string;
  tone: string;
}) {
  return (
    <div className={`card-pop px-5 py-3 ${tone}`}>
      <p className="tnum text-2xl font-black leading-none">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{label}</p>
    </div>
  );
}
