'use client';

import * as React from 'react';
import { ChannelPicker } from '@/components/app/channel-picker';
import { AdTypePicker } from '@/components/app/ad-type-picker';
import { SubmitButton } from '@/components/ui/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ChannelKey } from '@/lib/channels';
import { createSlot } from '@/lib/proto/actions';

export function NewPlacementForm() {
  const [channel, setChannel] = React.useState<ChannelKey>('blog');

  return (
    <form action={createSlot} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={80}
          placeholder="Blog sidebar"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          What a sponsor sees on the public page. Be concrete — &ldquo;Newsletter main
          slot&rdquo; beats &ldquo;Slot 2&rdquo;.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Channel</Label>
        <ChannelPicker onChange={setChannel} />
      </div>

      {channel === 'blog' ? (
        <div className="space-y-2">
          <Label>Ad format</Label>
          <AdTypePicker />
          <p className="text-xs text-muted-foreground">
            Sets the exact size reserved on the page — the widget never shifts layout.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="price">Price per week</Label>
        <Input
          id="price"
          name="price"
          type="number"
          min={1}
          max={1000000}
          defaultValue={100}
          required
          className="max-w-40"
        />
        <p className="text-xs text-muted-foreground">
          In points. A sponsor can pick any custom date range — this is what a full week of it
          costs.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="brief">Brief for advertisers (optional)</Label>
        <Textarea
          id="brief"
          name="brief"
          maxLength={500}
          placeholder="What this placement is, who sees it, and anything you'd like an advertiser to know before they buy."
        />
        <p className="text-xs text-muted-foreground">
          Shown on the public page and the advertiser form — the more specific, the fewer
          back-and-forth messages.
        </p>
      </div>

      <details className="group rounded-control border border-line-subtle">
        <summary className="cursor-pointer list-none px-4 py-3 font-mono text-2xs uppercase tracking-slate text-subtle">
          More options
        </summary>
        <div className="space-y-6 border-t border-line-subtle p-4">
          <div className="space-y-2">
            <Label htmlFor="previewImageUrl">Preview image URL (optional)</Label>
            <Input
              id="previewImageUrl"
              name="previewImageUrl"
              type="url"
              placeholder="https://…/example.png"
            />
            <p className="text-xs text-muted-foreground">
              An example creative shown on the public listing before anyone buys it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Audience (optional)</Label>
            <Textarea
              id="audience"
              name="audience"
              maxLength={300}
              placeholder="e.g. Developers and indie founders, mostly India and the US, 25–40."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adSpecs">Ad specs (optional)</Label>
            <Textarea
              id="adSpecs"
              name="adSpecs"
              maxLength={300}
              placeholder="e.g. 1200×630 PNG or JPG, headline under 60 characters."
            />
          </div>

          <div className="space-y-2">
            <Label>Volume discount (optional)</Label>
            <div className="flex items-center gap-3">
              <Input
                name="discountThresholdDays"
                type="number"
                min={1}
                max={365}
                placeholder="28"
                className="max-w-28"
                aria-label="Minimum days"
              />
              <span className="text-sm text-muted-foreground">days or more →</span>
              <Input
                name="discountPercent"
                type="number"
                min={1}
                max={90}
                placeholder="15"
                className="max-w-24"
                aria-label="Discount percent"
              />
              <span className="text-sm text-muted-foreground">% off</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Applied automatically when an advertiser books at least this many days.
            </p>
          </div>
        </div>
      </details>

      <div className="flex gap-2 border-t border-line-subtle pt-5">
        <SubmitButton pendingText="Creating…">Create placement</SubmitButton>
      </div>
    </form>
  );
}
