import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/app/page-header';
import { formatAmount } from '@/lib/money';
import { SlotAnalytics } from '@/components/app/slot-analytics';
import { EmbedSnippet } from '@/components/app/embed-snippet';
import { ChannelPicker } from '@/components/app/channel-picker';
import { PropertyPicker } from '@/components/app/property-picker';
import { AdTypePicker } from '@/components/app/ad-type-picker';
import { ChannelBadge } from '@/components/app/channel-badge';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/ui/submit-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { requireCreator } from '@/lib/proto/roles';
import {
  getSlotById,
  getSlotDailyStats,
  getUserById,
  toDailySeries,
  validityLabel
} from '@/lib/proto/queries';
import { archiveSlot, deleteSlot, unarchiveSlot, updateSlot } from '@/lib/proto/actions';
import { toChannel } from '@/lib/channels';
import type { AdTypeKey } from '@/lib/ad-types';

export const metadata = { title: 'Placement' };

export default async function ManagePlacementPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; e?: string }>;
}) {
  const { id } = await params;
  const { saved, e } = await searchParams;
  const me = await requireCreator();

  const slot = await getSlotById(id);
  if (!slot || slot.ownerId !== me.id) notFound();

  const channel = toChannel(slot.placement);
  const sponsored = slot.status === 'sponsored';
  const validity = validityLabel(slot.sponsoredUntil);
  const sponsor = slot.sponsorId ? await getUserById(slot.sponsorId) : null;
  const series = channel.embeddable ? toDailySeries(await getSlotDailyStats(slot.id, 14)) : null;

  return (
    <>
      <PageHeader
        title={slot.name}
        description={channel.placement}
        breadcrumb={[
          { label: 'Studio', href: '/studio' },
          { label: 'Placements', href: '/studio/placements' },
          { label: slot.name }
        ]}
        actions={
          <Button asChild variant="outline">
            <Link href={`/s/${slot.publicId}`}>
              Public page <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {slot.archived ? (
          <Badge>Archived</Badge>
        ) : sponsored ? (
          <Badge variant="success">Sponsored</Badge>
        ) : (
          <Badge variant="pop">Open</Badge>
        )}
        <ChannelBadge placement={slot.placement} />
        <Badge variant="outline">{formatAmount(slot.pricePoints)} / wk</Badge>
        {channel.embeddable ? (
          <Badge variant="outline">
            {slot.width}×{slot.height}
          </Badge>
        ) : null}
        {sponsored && validity ? <Badge variant="craft">{validity}</Badge> : null}
      </div>

      {saved ? (
        <p className="mb-6 rounded-control bg-success-soft px-3 py-2 text-sm text-success">
          Changes saved.
        </p>
      ) : null}
      {e === 'sponsored' ? (
        <p className="mb-6 rounded-control bg-destructive-soft px-3 py-2 text-sm text-destructive">
          You can&rsquo;t archive or delete a placement while it is sponsored.
        </p>
      ) : null}

      <div className="space-y-6">
        {/* Who has it right now */}
        {sponsored ? (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
                Current advertiser
              </h2>
              <p className="mt-3 font-display text-lg font-semibold tracking-tight">
                {sponsor?.name || sponsor?.email || 'Someone'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{slot.adHeadline}</p>
              {slot.adLinkUrl ? (
                <a
                  href={slot.adLinkUrl}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-signal hover:underline"
                  rel="noopener noreferrer nofollow"
                  target="_blank"
                >
                  {slot.adCtaLabel || slot.adLinkUrl} <ExternalLink className="size-3" />
                </a>
              ) : null}
              {slot.adSocials && slot.adSocials.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {slot.adSocials.map((s, i) => (
                    <li key={i}>
                      <a
                        href={s.url}
                        className="rounded-control border border-line-subtle px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        rel="noopener noreferrer nofollow"
                        target="_blank"
                      >
                        {s.platform}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-3 font-label text-2xs uppercase tracking-slate text-subtle">
                {slot.sponsoredStart
                  ? new Date(slot.sponsoredStart).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })
                  : '—'}
                {' – '}
                {slot.sponsoredUntil
                  ? new Date(slot.sponsoredUntil).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    })
                  : '—'}{' '}
                · {validity}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Performance — only where there is telemetry to show */}
        {series ? (
          <SlotAnalytics data={series} />
        ) : (
          <Card>
            <CardContent className="p-6">
              <h2 className="font-label text-2xs uppercase tracking-slate text-subtle">
                Performance
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {channel.label} placements are put in by hand, so there is nothing to count
                automatically. Report the numbers to your advertiser from {channel.label}&rsquo;s own
                analytics.
              </p>
            </CardContent>
          </Card>
        )}

        {/* The snippet, for the channels that serve one */}
        {channel.embeddable ? (
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-1 font-label text-2xs uppercase tracking-slate text-subtle">
                Embed
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Paste this where the spot should appear. It reserves the exact size before it
                loads, so the page never jumps.
              </p>
              <EmbedSnippet publicId={slot.publicId} />
            </CardContent>
          </Card>
        ) : null}

        {/* Settings */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-5 font-label text-2xs uppercase tracking-slate text-subtle">
              Settings
            </h2>
            <form action={updateSlot} className="space-y-6">
              <input type="hidden" name="id" value={slot.id} />

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={slot.name} required maxLength={80} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brief">Brief for advertisers</Label>
                <Textarea
                  id="brief"
                  name="brief"
                  maxLength={500}
                  defaultValue={slot.brief ?? ''}
                  placeholder="What this placement is, who sees it, and anything you'd like an advertiser to know before they buy."
                />
              </div>

              <div className="space-y-2">
                <Label>Channel</Label>
                <ChannelPicker defaultValue={channel.key} disabled={sponsored} />
                {sponsored ? (
                  <p className="text-xs text-muted-foreground">
                    Locked while sponsored — moving it would change what your advertiser paid for.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="property">Site</Label>
                <PropertyPicker defaultValue={slot.property ?? ''} disabled={sponsored} />
                {sponsored ? (
                  <p className="text-xs text-muted-foreground">
                    Locked while sponsored — moving it would change what your advertiser paid for.
                  </p>
                ) : null}
              </div>

              {channel.key === 'blog' ? (
                <div className="space-y-2">
                  <Label>Ad format</Label>
                  <AdTypePicker
                    defaultValue={(slot.adType as AdTypeKey) ?? 'banner'}
                    disabled={sponsored}
                  />
                  {sponsored ? (
                    <p className="text-xs text-muted-foreground">Locked while sponsored.</p>
                  ) : null}
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
                  defaultValue={slot.pricePoints}
                  disabled={sponsored}
                  className="max-w-40"
                />
                {/* Disabled inputs submit nothing; carry the locked price explicitly. */}
                {sponsored ? (
                  <input type="hidden" name="price" value={slot.pricePoints} />
                ) : null}
                {sponsored ? (
                  <p className="text-xs text-muted-foreground">Locked while sponsored.</p>
                ) : null}
              </div>

              <details className="group rounded-control border border-line-subtle">
                <summary className="cursor-pointer list-none px-4 py-3 font-label text-2xs uppercase tracking-slate text-subtle">
                  More options
                </summary>
                <div className="space-y-6 border-t border-line-subtle p-4">
                  <div className="space-y-2">
                    <Label htmlFor="previewImageUrl">Preview image URL</Label>
                    <Input
                      id="previewImageUrl"
                      name="previewImageUrl"
                      type="url"
                      defaultValue={slot.previewImageUrl ?? ''}
                      placeholder="https://…/example.png"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audience">Audience</Label>
                    <Textarea
                      id="audience"
                      name="audience"
                      maxLength={300}
                      defaultValue={slot.audience ?? ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adSpecs">Ad specs</Label>
                    <Textarea
                      id="adSpecs"
                      name="adSpecs"
                      maxLength={300}
                      defaultValue={slot.adSpecs ?? ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Volume discount</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        name="discountThresholdDays"
                        type="number"
                        min={1}
                        max={365}
                        defaultValue={slot.discountThresholdDays ?? ''}
                        className="max-w-28"
                        aria-label="Minimum days"
                      />
                      <span className="text-sm text-muted-foreground">days or more →</span>
                      <Input
                        name="discountPercent"
                        type="number"
                        min={1}
                        max={90}
                        defaultValue={slot.discountPercent ?? ''}
                        className="max-w-24"
                        aria-label="Discount percent"
                      />
                      <span className="text-sm text-muted-foreground">% off</span>
                    </div>
                  </div>
                </div>
              </details>

              <div className="border-t border-line-subtle pt-5">
                <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Danger zone */}
        <Card className="border-destructive-line/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="max-w-lead">
              <p className="font-medium">
                {slot.archived ? 'Restore placement' : 'Archive or delete'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {slot.archived
                  ? 'Bring it back so it can be listed and sponsored again.'
                  : 'Archiving takes it off the public list and stops it serving. Deleting also removes its view and click history, permanently.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {slot.archived ? (
                <form action={unarchiveSlot}>
                  <input type="hidden" name="id" value={slot.id} />
                  <SubmitButton variant="outline" pendingText="Restoring…">
                    Restore
                  </SubmitButton>
                </form>
              ) : (
                <form action={archiveSlot}>
                  <input type="hidden" name="id" value={slot.id} />
                  <SubmitButton variant="outline" disabled={sponsored} pendingText="Archiving…">
                    Archive
                  </SubmitButton>
                </form>
              )}
              <form action={deleteSlot}>
                <input type="hidden" name="id" value={slot.id} />
                <SubmitButton variant="destructive" disabled={sponsored} pendingText="Deleting…">
                  <Trash2 className="size-4" /> Delete
                </SubmitButton>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
