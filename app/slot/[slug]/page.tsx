import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';

import { Footer, Header } from '@/components/chrome';
import { AdEmpty, AdRender } from '@/components/ad-render';
import { Board } from '@/components/leaderboard';
import { Container } from '@/components/layout';
import { BuyPanel } from '@/components/buy-panel';
import { ArrowLeft, Bookmark, Check, Trophy } from '@/components/icons';
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
      <Header />

      <main>
        {/* The slot's own header sits on the same bloom the homepage hero uses,
            so arriving here reads as the same place rather than a subpage. */}
        <div className="relative overflow-hidden">
          <div className="sp-backdrop" aria-hidden>
            <div
              className={`absolute inset-0 ${isBid ? 'sp-glow-gold' : 'sp-glow'}`}
            />
            <div className="sp-dots sp-fade-b absolute inset-0 opacity-50" />
          </div>

          <Container className="sp-fore pb-20 pt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-small text-secondary transition-colors hover:text-title"
          >
            <ArrowLeft className="size-4" />
            All slots
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className={`sp-badge ${isBid ? 'sp-badge-gold' : 'sp-badge-quiet'}`}>
              {isBid ? <Trophy /> : <Bookmark />}
              {SLOT_KINDS[isBid ? 'bid' : 'fixed'].label}
            </span>
            <span className="sp-badge sp-badge-quiet">
              {shape?.label ?? slot.shape}
              {shape ? ` · ${shape.w}×${shape.h}` : ''}
            </span>
          </div>

          <h1 className="sp-h1 mt-5">{slot.name}</h1>
          {slot.blurb ? <p className="sp-lead mt-3 max-w-xl">{slot.blurb}</p> : null}
          <p className="mt-2 text-small text-secondary">
            {SLOT_KINDS[isBid ? 'bid' : 'fixed'].tagline}
          </p>

          {/* The rules of THIS kind of slot, said once, before the money. A
              sponsor should not have to infer the no-refund rule from a form. */}
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2">
            {(isBid
              ? [
                  'Your bid is a lifetime total — paying again adds to it',
                  'Highest bid serves; everyone else stays on the board',
                  'No refund for being overtaken'
                ]
              : [
                  'One price, one buyer, for the whole term',
                  'Nobody can outbid you while it runs',
                  '3 months saves 10%, 6 months saves 20%'
                ]
            ).map((rule) => (
              <li key={rule} className="flex items-center gap-2 text-tiny text-secondary">
                <Check className="size-3.5 shrink-0 text-mute" />
                {rule}
              </li>
            ))}
          </ul>

          <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <p className="sp-eyebrow">{winner ? 'Serving right now' : 'Nothing here yet'}</p>
              <div className="mt-4 min-h-[260px]">
                {winner ? (
                  <AdRender ad={winner} shape={slot.shape} />
                ) : (
                  <AdEmpty ask={formatPaise(ask)} kind={slot.kind} slug={slot.publicId} />
                )}
              </div>

              {isBid ? (
                <div className="mt-12">
                  <p className="sp-eyebrow mb-4">The board</p>
                  <Board rows={contenders} mineId={viewer?.id} ask={ask} />
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-5">
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
          </div>
          </Container>
        </div>
      </main>

      <Footer />
    </>
  );
}
