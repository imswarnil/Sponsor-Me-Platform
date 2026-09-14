'use client';

import Link from 'next/link';
import { useState } from 'react';

import { AdEmpty, AdRender } from '@/components/ad-render';
import { SHAPES, type Shape } from '@/lib/site';
import type { LiveAd } from '@/lib/queries';

/**
 * THE UNIT, AT THE SIZES IT ACTUALLY SHIPS IN.
 *
 * A sponsor's first question is "what am I buying" and the honest answer is a
 * picture, not a paragraph. So this renders the REAL winning ad — no mock, no
 * placeholder copy — inside a pretend host page, and lets the reader switch
 * between the three shapes at their true pixel dimensions.
 *
 * Switching the shape does not lie about the slot: the caption says which
 * shape this slot is sold at, and the others are shown as what the same
 * creative looks like elsewhere. Anything else would be quoting a rail and
 * delivering a banner.
 */
export function HeroShowcase({
  ad,
  slotShape,
  slotName,
  slug,
  ask
}: {
  ad: LiveAd | null;
  slotShape: string;
  slotName: string;
  slug: string;
  ask: string;
}) {
  const initial = (slotShape in SHAPES ? slotShape : 'card') as Shape;
  const [shape, setShape] = useState<Shape>(initial);
  const spec = SHAPES[shape];

  return (
    <div className="sp-panel relative overflow-hidden">
      {/* A pretend browser bar, so it is obvious this is the unit landing on
          somebody else's page rather than a component in a design file. */}
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <i className="size-2 rounded-full bg-surface-300" />
          <i className="size-2 rounded-full bg-surface-300" />
          <i className="size-2 rounded-full bg-surface-300" />
        </span>
        <span className="truncate font-mono text-tiny text-mute">imswarnil.com/a-post</span>
        <span className="ml-auto shrink-0">
          <span className="sp-badge sp-badge-quiet">{ad ? 'Live' : 'Open'}</span>
        </span>
      </div>

      <div className="relative">
        <div className="sp-backdrop sp-dots" aria-hidden />

        <div className="sp-fore p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="sp-seg" role="group" aria-label="Shape">
              {(Object.keys(SHAPES) as Shape[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setShape(key)}
                  aria-pressed={shape === key}
                  className="sp-seg-item"
                >
                  {SHAPES[key].label}
                </button>
              ))}
            </div>
            <span className="sp-num text-tiny text-secondary">
              {spec.w} × {spec.h}
            </span>
          </div>

          {/* The stage. Its height is the shape's height, so switching shapes
              changes the picture and not the page around it. */}
          <div
            className="mx-auto flex w-full items-stretch transition-[max-width] duration-300"
            style={{ maxWidth: spec.w, minHeight: spec.h }}
          >
            {ad ? (
              <div className="w-full">
                <AdRender ad={ad} shape={shape} />
              </div>
            ) : (
              <div className="w-full">
                <AdEmpty ask={ask} kind="bid" slug={slug} />
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-tiny text-secondary">
              {spec.note}
              {shape === initial ? (
                <>
                  {' '}
                  <span className="text-title">
                    &middot; this is how {slotName} is sold
                  </span>
                </>
              ) : null}
            </p>
            <Link
              href={`/slot/${slug}`}
              className="text-tiny font-semibold text-accent-ink hover:underline"
            >
              {ad ? 'Take this spot' : `Open — ${ask}`}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
