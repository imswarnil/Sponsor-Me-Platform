import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';

import { Footer, Header } from '@/components/chrome';
import { AdEmpty, AdRender } from '@/components/ad-render';
import { EmptyBoard, Field, Podium } from '@/components/leaderboard';
import { Bay, Rig } from '@/components/rig';
import { BuyPanel } from '@/components/buy-panel';
import { db } from '@/lib/db/client';
import { ads } from '@/lib/db/schema';
import { formatPaise } from '@/lib/money';
import { SHAPES, SLOT_KINDS } from '@/lib/site';
import { getViewer } from '@/lib/roles';
import { askFor, contendersFor, slotByPublicId } from '@/lib/queries';

/** One slot: what is serving, who is in the running, and how to take it. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const slot = await slotByPublicId((await params).slug);
  return { title: slot ? slot.name : 'Slot' };
}

export default async function SlotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const slot = await slotByPublicId(slug);
  if (!slot || !slot.active) notFound();

  const [contenders, ask, viewer] = await Promise.all([
    contendersFor(slot.id, 25),
    askFor(slot),
    getViewer()
  ]);

  const isBid = slot.kind === 'bid';
  const winner = contenders[0] ?? null;
  const shape = SHAPES[slot.shape as keyof typeof SHAPES];

  // The signed-in sponsor's own ad in THIS slot, if they have written one.
  const mine = viewer
    ? (
        await db
          .select()
          .from(ads)
          .where(and(eq(ads.slotId, slot.id), eq(ads.profileId, viewer.id)))
          .limit(1)
      )[0] ?? null
    : null;

  return (
    <>
      <Rig />
      <Header />

      <main className="relative z-10">
        <Bay className="py-12">
          <Link href="/" className="text-sm font-bold text-ink-600 hover:text-ink-900">
            ← All slots
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className={"label"}>
              {isBid ? '🏆 Bid slot' : '✨ Buy it'}
            </span>
            <span className="label">{shape?.label ?? slot.shape}</span>
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{slot.name}</h1>
          {slot.blurb ? <p className="mt-2 max-w-xl text-lg text-ink-700">{slot.blurb}</p> : null}
          <p className="mt-1 text-sm text-ink-600">{SLOT_KINDS[isBid ? 'bid' : 'fixed'].tagline}</p>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-600">
                {winner ? 'Serving right now' : 'Nothing here yet'}
              </p>
              <div style={{ minHeight: 260 }}>
                {winner ? (
                  <AdRender ad={winner} shape={slot.shape} />
                ) : (
                  <AdEmpty ask={formatPaise(ask)} kind={slot.kind} slug={slot.publicId} />
                )}
              </div>

              {isBid ? (
                <div className="mt-8">
                  <p className="label pb-3">The race ({contenders.length})</p>
                  {contenders.length ? (
                    <>
                      <Podium rows={contenders} />
                      {contenders.length > 3 ? (
                        <div className="mt-6">
                          <Field rows={contenders} from={3} mineId={viewer?.id} />
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <EmptyBoard ask={ask} />
                  )}
                </div>
              ) : null}
            </div>

            <BuyPanel
              slotId={slot.id}
              slug={slot.publicId}
              kind={slot.kind}
              askPaise={ask}
              pricePaise={slot.pricePaise}
              signedIn={Boolean(viewer)}
              isCreator={viewer?.role === 'creator'}
              existing={mine}
            />
          </div>
        </Bay>
      </main>

      <Footer />
    </>
  );
}
