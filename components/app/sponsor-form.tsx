'use client';

import * as React from 'react';
import { CalendarClock, Coins, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdCreativePreview } from '@/components/app/ad-creative-preview';
import { sponsorSlot } from '@/lib/proto/actions';
import type { ChannelKey } from '@/lib/channels';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_DAYS = 3;
const MAX_DAYS = 90;

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Today's UTC calendar date as `YYYY-MM-DD` — matches the server's own UTC-anchored
 *  validation (see `atUtcMidnight` in lib/proto/actions.ts). Building this from a
 *  locally-midnight'd Date and then calling toISOString() would shift the date by a
 *  day in any timezone ahead of UTC, so this reads UTC fields directly instead. */
function todayUtcIso() {
  return new Date().toISOString().slice(0, 10);
}

type Social = { platform: string; url: string };

export function SponsorForm({
  publicId,
  channel,
  pricePerWeek,
  myPoints,
  ownerName,
  width,
  height,
  discountThresholdDays,
  discountPercent
}: {
  publicId: string;
  channel: ChannelKey;
  pricePerWeek: number;
  myPoints: number;
  ownerName: string;
  width: number;
  height: number;
  discountThresholdDays?: number | null;
  discountPercent?: number | null;
}) {
  const todayIso = React.useMemo(todayUtcIso, []);
  const [startDate, setStartDate] = React.useState(todayIso);
  const [endDate, setEndDate] = React.useState(
    toIsoDate(new Date(new Date(`${todayIso}T00:00:00.000Z`).getTime() + 7 * DAY_MS))
  );
  const [headline, setHeadline] = React.useState('');
  const [imageUrl, setImageUrl] = React.useState('');
  const [ctaLabel, setCtaLabel] = React.useState('');
  const [socials, setSocials] = React.useState<Social[]>([{ platform: '', url: '' }]);

  const isAmbassador = channel === 'ambassador';

  const days = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / DAY_MS);
  const validRange = days >= MIN_DAYS && days <= MAX_DAYS;
  const base = validRange ? Math.ceil((pricePerWeek * days) / 7) : 0;
  const discountApplies = Boolean(
    discountThresholdDays && discountPercent && days >= discountThresholdDays
  );
  const total = discountApplies ? Math.ceil(base * (1 - discountPercent! / 100)) : base;
  const canAfford = validRange && myPoints >= total;

  const endLabel = new Date(endDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const cleanSocials = socials.filter((s) => s.platform.trim() && s.url.trim());

  return (
    <form action={sponsorSlot} className="space-y-4">
      <input type="hidden" name="publicId" value={publicId} />
      <input type="hidden" name="startDate" value={startDate} />
      <input type="hidden" name="endDate" value={endDate} />
      {isAmbassador ? (
        <input type="hidden" name="socials" value={JSON.stringify(cleanSocials)} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="headline">{isAmbassador ? 'Your message' : 'Ad headline'}</Label>
            <Input
              id="headline"
              name="headline"
              placeholder={isAmbassador ? 'Why you back this work' : 'Nomad Coffee — 20% off'}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              required
            />
          </div>

          {!isAmbassador ? (
            <div className="space-y-1.5">
              <Label htmlFor="imageUrl">Image or logo URL (optional)</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://…/banner.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="linkUrl">
              {isAmbassador ? 'Link to your post' : 'Destination link'}
            </Label>
            <Input
              id="linkUrl"
              name="linkUrl"
              type="url"
              placeholder={isAmbassador ? 'https://instagram.com/you/p/…' : 'https://your-site.com'}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ctaLabel">CTA button text (optional)</Label>
            <Input
              id="ctaLabel"
              name="ctaLabel"
              maxLength={40}
              placeholder="Learn more"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
            />
          </div>

          {isAmbassador ? (
            <div className="space-y-2">
              <Label>Your social links</Label>
              {socials.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Instagram"
                    value={s.platform}
                    className="max-w-32"
                    onChange={(e) => {
                      const next = [...socials];
                      next[i] = { ...next[i], platform: e.target.value };
                      setSocials(next);
                    }}
                  />
                  <Input
                    placeholder="https://instagram.com/you"
                    value={s.url}
                    onChange={(e) => {
                      const next = [...socials];
                      next[i] = { ...next[i], url: e.target.value };
                      setSocials(next);
                    }}
                  />
                  {socials.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSocials(socials.filter((_, j) => j !== i))}
                    >
                      <X className="size-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
              {socials.length < 4 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSocials([...socials, { platform: '', url: '' }])}
                >
                  <Plus className="size-3.5" /> Add another
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-[220px] space-y-1.5 sm:mx-0">
          <p className="font-mono text-2xs uppercase tracking-slate text-subtle">Preview</p>
          <AdCreativePreview
            headline={headline}
            imageUrl={imageUrl}
            ctaLabel={ctaLabel}
            width={width}
            height={height}
            ambassador={isAmbassador}
            socials={cleanSocials}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Dates</Label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="Start date"
            value={startDate}
            min={todayIso}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            aria-label="End date"
            value={endDate}
            min={toIsoDate(new Date(new Date(startDate).getTime() + MIN_DAYS * DAY_MS))}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {!validRange ? (
          <p className="text-xs text-destructive">Pick a range between 3 and 90 days.</p>
        ) : null}
        {!discountApplies && discountThresholdDays && discountPercent ? (
          <p className="text-xs text-signal">
            Book {discountThresholdDays}+ days for {discountPercent}% off.
          </p>
        ) : null}
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Coins className="size-4" /> Total
          </span>
          <span className="font-semibold">
            {discountApplies ? (
              <>
                <span className="mr-1.5 text-xs text-muted-foreground line-through">{base}</span>
                {total} points
              </>
            ) : (
              `${total} points`
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarClock className="size-4" /> Runs until
          </span>
          <span className="font-medium">{endLabel}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {pricePerWeek} pts/week, prorated for {days} day{days === 1 ? '' : 's'}
          {discountApplies ? `, ${discountPercent}% volume discount applied` : ''}. Transfers to{' '}
          {ownerName}; the slot reopens when it ends.
        </p>
      </div>

      <SubmitButton className="w-full" disabled={!canAfford} pendingText="Processing…">
        {!validRange ? 'Pick valid dates' : canAfford ? `Pay ${total} points & go live` : 'Not enough points'}
      </SubmitButton>
      <p className="text-center text-xs text-muted-foreground">You have {myPoints} points.</p>
    </form>
  );
}
