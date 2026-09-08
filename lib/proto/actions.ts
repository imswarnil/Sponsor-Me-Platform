'use server';

import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from './db';
import { channelConnections, messages, notifications, profiles, slots, sponsorshipHistory, threads, txns } from './schema';
import { getCurrentUserId } from './queries';
import { getCreatorId, requireCreator } from './roles';
import { CHANNEL_KEYS, toChannel } from '@/lib/channels';
import { PROPERTY_KEYS } from '@/lib/properties';
import { AD_TYPE_KEYS, AD_TYPES } from '@/lib/ad-types';
import { formatAmount } from '@/lib/money';

function slotPublicId() {
  return 'sl_' + randomBytes(4).toString('hex');
}

// Only http(s) URLs are ever accepted — blocks javascript:/data:/vbscript: injection.
const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), 'must be an http(s) URL');

// ── Signup (server-side so we can auto-confirm; client then signs in) ────────────
// ── Placements ───────────────────────────────────────────────────────────────
// Only the creator lists placements — this platform funds one person's work.
const optionalText = (max: number) => z.union([z.string().trim().max(max), z.literal('')]).optional();
const optionalPercent = z.union([z.coerce.number().int().min(1).max(90), z.literal('')]).optional();
const optionalDays = z.union([z.coerce.number().int().min(1).max(365), z.literal('')]).optional();

const createSlotSchema = z.object({
  name: z.string().trim().min(1).max(80),
  price: z.coerce.number().int().min(1).max(1_000_000),
  channel: z.enum(CHANNEL_KEYS),
  // '' means "across everything" — a real answer, stored as NULL. See lib/properties.ts.
  property: z
    .union([z.enum(PROPERTY_KEYS as [string, ...string[]]), z.literal('')])
    .optional(),
  brief: optionalText(500),
  adType: z.enum(AD_TYPE_KEYS).optional(),
  previewImageUrl: z.union([httpUrl, z.literal('')]).optional(),
  audience: optionalText(300),
  adSpecs: optionalText(300),
  discountThresholdDays: optionalDays,
  discountPercent: optionalPercent
});

export async function createSlot(formData: FormData) {
  await requireCreator('/studio/placements/new');
  const uid = (await getCurrentUserId())!;

  const parsed = createSlotSchema.safeParse({
    name: formData.get('name'),
    price: formData.get('price'),
    channel: formData.get('channel'),
    property: formData.get('property') || '',
    brief: formData.get('brief') || '',
    adType: formData.get('adType') || undefined,
    previewImageUrl: formData.get('previewImageUrl') || '',
    audience: formData.get('audience') || '',
    adSpecs: formData.get('adSpecs') || '',
    discountThresholdDays: formData.get('discountThresholdDays') || '',
    discountPercent: formData.get('discountPercent') || ''
  });
  if (!parsed.success) redirect('/studio/placements/new?e=invalid');

  // The ad-type preset only sets pixel dimensions for the one embeddable (pixel-rendered)
  // channel — it's purely informational/visual everywhere else.
  const preset = parsed.data.adType ? AD_TYPES[parsed.data.adType] : null;
  const dimensions =
    parsed.data.channel === 'blog' && preset
      ? { width: preset.width, height: preset.height }
      : {};

  // A discount needs both halves — a threshold with no percent (or vice versa) is not a discount.
  const hasDiscount = parsed.data.discountThresholdDays && parsed.data.discountPercent;

  const rows = await db
    .insert(slots)
    .values({
      publicId: slotPublicId(),
      ownerId: uid,
      name: parsed.data.name,
      pricePoints: parsed.data.price,
      // The channel lives in `placement` — see lib/channels.ts for why.
      placement: parsed.data.channel,
      property: parsed.data.property || null,
      brief: parsed.data.brief || null,
      adType: parsed.data.adType || null,
      previewImageUrl: parsed.data.previewImageUrl || null,
      audience: parsed.data.audience || null,
      adSpecs: parsed.data.adSpecs || null,
      discountThresholdDays: hasDiscount ? (parsed.data.discountThresholdDays as number) : null,
      discountPercent: hasDiscount ? (parsed.data.discountPercent as number) : null,
      ...dimensions
    })
    .returning();

  revalidatePath('/studio');
  revalidatePath('/placements');
  redirect(`/studio/placements/${rows[0].id}`);
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid date');
const socialSchema = z.object({
  platform: z.string().trim().min(1).max(40),
  url: httpUrl
});

const sponsorSchema = z.object({
  publicId: z.string().trim().min(1).max(40),
  headline: z.string().trim().min(1).max(80),
  imageUrl: z.union([httpUrl, z.literal('')]).optional(),
  linkUrl: httpUrl,
  ctaLabel: z.union([z.string().trim().max(40), z.literal('')]).optional(),
  startDate: isoDate,
  endDate: isoDate,
  // Repeatable social-link rows (ambassador channel only) travel as a JSON string —
  // FormData has no native way to post an array of objects.
  socials: z.string().optional()
});

/** Midnight UTC for a `YYYY-MM-DD` string, so date-only comparisons never drift on TZ. */
function atUtcMidnight(dateStr: string) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export async function sponsorSlot(formData: FormData) {
  const uid = await getCurrentUserId();
  const publicIdRaw = String(formData.get('publicId') || '');
  if (!uid) redirect(`/login?next=/s/${encodeURIComponent(publicIdRaw)}`);

  const parsed = sponsorSchema.safeParse({
    publicId: formData.get('publicId'),
    headline: formData.get('headline'),
    imageUrl: formData.get('imageUrl') || '',
    linkUrl: formData.get('linkUrl'),
    ctaLabel: formData.get('ctaLabel') || '',
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    socials: formData.get('socials') || undefined
  });
  if (!parsed.success) redirect(`/s/${encodeURIComponent(publicIdRaw)}?e=invalid`);
  const { publicId, headline, imageUrl, linkUrl, ctaLabel, startDate, endDate } = parsed.data;

  const slotRows = await db.select().from(slots).where(eq(slots.publicId, publicId)).limit(1);
  const slot = slotRows[0];
  if (!slot || slot.archived) redirect('/');
  if (slot.status === 'sponsored') redirect(`/s/${publicId}?e=taken`);
  if (slot.ownerId === uid) redirect(`/s/${publicId}?e=own`); // can't sponsor your own slot

  const start = atUtcMidnight(startDate);
  const end = atUtcMidnight(endDate);
  const today = atUtcMidnight(new Date().toISOString().slice(0, 10));
  const days = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  if (start.getTime() < today.getTime() || days < 3 || days > 90) {
    redirect(`/s/${publicId}?e=invalid`);
  }

  // Ambassador placements are the only ones that take social links — parse and
  // cap them here rather than trusting whatever a client posts.
  let socials: { platform: string; url: string }[] | null = null;
  if (toChannel(slot.placement).key === 'ambassador' && parsed.data.socials) {
    try {
      const rawSocials = JSON.parse(parsed.data.socials);
      const socialsParsed = z.array(socialSchema).max(4).safeParse(rawSocials);
      if (socialsParsed.success) socials = socialsParsed.data;
    } catch {
      // Malformed JSON just means no socials were saved — not a hard failure.
    }
  }

  const meRows = await db.select().from(profiles).where(eq(profiles.id, uid)).limit(1);
  const me = meRows[0];
  const base = Math.ceil((slot.pricePoints * days) / 7);
  const qualifiesForDiscount =
    slot.discountThresholdDays && slot.discountPercent && days >= slot.discountThresholdDays;
  const total = qualifiesForDiscount
    ? Math.ceil(base * (1 - slot.discountPercent! / 100))
    : base;
  if (!me || me.points < total) redirect(`/s/${publicId}?e=insufficient`);

  // All of it or none of it. `batch` is the Neon HTTP driver's transaction —
  // one round-trip, committed together server-side. (`db.transaction` throws
  // on this driver: there is no session to hold one open.)
  const dayLabel = days === 1 ? '1 day' : `${days} days`;
  await db.batch([
    db.update(profiles).set({ points: sql`${profiles.points} - ${total}` }).where(eq(profiles.id, uid)),
    db.update(profiles).set({ points: sql`${profiles.points} + ${total}` }).where(eq(profiles.id, slot.ownerId)),
    db.insert(txns).values({ slotId: slot.id, fromId: uid, toId: slot.ownerId, amount: total }),
    db
      .update(slots)
      .set({
        status: 'sponsored',
        sponsorId: uid,
        adHeadline: headline,
        adImageUrl: imageUrl || null,
        adLinkUrl: linkUrl,
        adCtaLabel: ctaLabel || null,
        adSocials: socials,
        sponsoredWeeks: Math.max(1, Math.round(days / 7)),
        sponsoredStart: start,
        sponsoredUntil: end
      })
      .where(eq(slots.id, slot.id)),
    db.insert(sponsorshipHistory).values({
      slotId: slot.id,
      ownerId: slot.ownerId,
      sponsorId: uid,
      slotName: slot.name,
      channel: toChannel(slot.placement).key,
      headline,
      imageUrl: imageUrl || null,
      linkUrl,
      ctaLabel: ctaLabel || null,
      brief: null,
      socials,
      amount: total,
      startAt: start,
      endAt: end
    }),
    // Notify the creator.
    db.insert(notifications).values({
      userId: slot.ownerId,
      type: 'sponsored',
      title: `"${slot.name}" was sponsored`,
      body: `${me.name || 'Someone'} took it for ${dayLabel} (${formatAmount(total)}).`,
      href: `/studio/placements/${slot.id}`
    })
  ]);

  revalidatePath(`/s/${publicId}`);
  revalidatePath('/studio');
  revalidatePath('/placements');
  // Land the sponsor in their own dashboard — the thing they just bought is
  // now theirs to watch, and that is where they watch it.
  redirect(`/sponsor?ok=${encodeURIComponent(publicId)}`);
}

// ── Slot management ────────────────────────────────────────────────────────────
async function ownedSlot(uid: string, slotId: string) {
  if (!z.string().uuid().safeParse(slotId).success) return null;
  const rows = await db.select().from(slots).where(eq(slots.id, slotId)).limit(1);
  const slot = rows[0];
  return slot && slot.ownerId === uid ? slot : null;
}

const editSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  price: z.coerce.number().int().min(1).max(1_000_000),
  channel: z.enum(CHANNEL_KEYS),
  // '' means "across everything" — a real answer, stored as NULL. See lib/properties.ts.
  property: z
    .union([z.enum(PROPERTY_KEYS as [string, ...string[]]), z.literal('')])
    .optional(),
  brief: optionalText(500),
  adType: z.enum(AD_TYPE_KEYS).optional(),
  previewImageUrl: z.union([httpUrl, z.literal('')]).optional(),
  audience: optionalText(300),
  adSpecs: optionalText(300),
  discountThresholdDays: optionalDays,
  discountPercent: optionalPercent
});

export async function updateSlot(formData: FormData) {
  const uid = await getCurrentUserId();
  if (!uid) redirect('/login');
  const parsed = editSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    price: formData.get('price'),
    channel: formData.get('channel'),
    property: formData.get('property') || '',
    brief: formData.get('brief') || '',
    adType: formData.get('adType') || undefined,
    previewImageUrl: formData.get('previewImageUrl') || '',
    audience: formData.get('audience') || '',
    adSpecs: formData.get('adSpecs') || '',
    discountThresholdDays: formData.get('discountThresholdDays') || '',
    discountPercent: formData.get('discountPercent') || ''
  });
  if (!parsed.success) redirect('/studio/placements');
  const slot = await ownedSlot(uid, parsed.data.id);
  if (!slot) redirect('/studio/placements');

  const hasDiscount = parsed.data.discountThresholdDays && parsed.data.discountPercent;
  const infoFields = {
    name: parsed.data.name,
    brief: parsed.data.brief || null,
    previewImageUrl: parsed.data.previewImageUrl || null,
    audience: parsed.data.audience || null,
    adSpecs: parsed.data.adSpecs || null,
    discountThresholdDays: hasDiscount ? (parsed.data.discountThresholdDays as number) : null,
    discountPercent: hasDiscount ? (parsed.data.discountPercent as number) : null
  };

  // Name and the informational fields can always change. Price, channel, and ad type/
  // dimensions are locked while a sponsorship is live — the advertiser bought a specific
  // thing at a specific size and price, and moving it under them would be a bait and switch.
  if (slot.status === 'sponsored') {
    await db.update(slots).set(infoFields).where(eq(slots.id, slot.id));
  } else {
    const preset = parsed.data.adType ? AD_TYPES[parsed.data.adType] : null;
    const dimensions =
      parsed.data.channel === 'blog' && preset
        ? { width: preset.width, height: preset.height }
        : {};
    await db
      .update(slots)
      .set({
        ...infoFields,
        pricePoints: parsed.data.price,
        placement: parsed.data.channel,
        property: parsed.data.property || null,
        adType: parsed.data.adType || null,
        ...dimensions
      })
      .where(eq(slots.id, slot.id));
  }
  revalidatePath(`/studio/placements/${slot.id}`);
  revalidatePath('/studio');
  revalidatePath('/placements');
  redirect(`/studio/placements/${slot.id}?saved=1`);
}

export async function archiveSlot(formData: FormData) {
  const uid = await getCurrentUserId();
  if (!uid) redirect('/login');
  const slot = await ownedSlot(uid, String(formData.get('id') || ''));
  if (!slot) redirect('/studio/placements');
  if (slot.status === 'sponsored') redirect(`/studio/placements/${slot.id}?e=sponsored`);
  await db.update(slots).set({ archived: true }).where(eq(slots.id, slot.id));
  revalidatePath('/studio');
  redirect('/studio/placements');
}

export async function unarchiveSlot(formData: FormData) {
  const uid = await getCurrentUserId();
  if (!uid) redirect('/login');
  const slot = await ownedSlot(uid, String(formData.get('id') || ''));
  if (!slot) redirect('/studio/placements');
  await db.update(slots).set({ archived: false }).where(eq(slots.id, slot.id));
  revalidatePath('/studio');
  redirect(`/studio/placements/${slot.id}`);
}

export async function deleteSlot(formData: FormData) {
  const uid = await getCurrentUserId();
  if (!uid) redirect('/login');
  const slot = await ownedSlot(uid, String(formData.get('id') || ''));
  if (!slot) redirect('/studio/placements');
  if (slot.status === 'sponsored') redirect(`/studio/placements/${slot.id}?e=sponsored`);
  await db.delete(slots).where(eq(slots.id, slot.id)); // events cascade, txns.slotId nulls
  revalidatePath('/studio');
  redirect('/studio/placements');
}

export async function markNotificationsRead() {
  const uid = await getCurrentUserId();
  if (!uid) return;
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, uid), eq(notifications.read, false)));
  revalidatePath('/studio');
}

// ── Channel connections (placeholder — see schema.ts) ────────────────────────────
const CHANNEL_PROVIDERS = ['youtube', 'ghost', 'blog', 'instagram'] as const;
const addChannelConnectionSchema = z.object({
  provider: z.enum(CHANNEL_PROVIDERS),
  label: z.string().trim().min(1).max(80)
});

export async function addChannelConnection(formData: FormData) {
  await requireCreator('/studio/channels');
  const uid = (await getCurrentUserId())!;
  const parsed = addChannelConnectionSchema.safeParse({
    provider: formData.get('provider'),
    label: formData.get('label')
  });
  if (!parsed.success) redirect('/studio/channels?e=invalid');
  await db.insert(channelConnections).values({ ownerId: uid, ...parsed.data });
  revalidatePath('/studio/channels');
  redirect('/studio/channels');
}

// ── Messaging ────────────────────────────────────────────────────────────────
// Simple, DB-backed, not realtime — see lib/proto/queries.ts for the read side.

const startThreadSchema = z.object({
  subject: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
  type: z.enum(['request', 'general']).default('general')
});

/** Where a thread lands for the current viewer — the creator manages from /studio,
 *  everyone else from /sponsor, even though it's the same underlying thread. */
async function threadUrl(threadId: string) {
  const uid = await getCurrentUserId();
  const creatorId = await getCreatorId();
  return uid === creatorId ? `/studio/messages/${threadId}` : `/sponsor/messages/${threadId}`;
}

export async function startThread(formData: FormData) {
  const uid = await getCurrentUserId();
  const next = String(formData.get('next') || '/placements');
  if (!uid) redirect(`/login?next=${encodeURIComponent(next)}`);

  const parsed = startThreadSchema.safeParse({
    subject: formData.get('subject'),
    body: formData.get('body'),
    type: formData.get('type') || 'general'
  });
  if (!parsed.success) redirect(`${next}?e=invalid`);

  const creatorId = await getCreatorId();
  if (!creatorId || uid === creatorId) redirect('/studio/messages');

  const [thread] = await db
    .insert(threads)
    .values({
      subject: parsed.data.subject,
      requesterId: uid,
      creatorId,
      type: parsed.data.type
    })
    .returning();
  await db.insert(messages).values({ threadId: thread.id, senderId: uid, body: parsed.data.body });
  await db.insert(notifications).values({
    userId: creatorId,
    type: 'message',
    title: `New message: ${parsed.data.subject}`,
    body: parsed.data.body.slice(0, 140),
    href: `/studio/messages/${thread.id}`
  });

  redirect(`/sponsor/messages/${thread.id}`);
}

const sendMessageSchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000)
});

export async function sendMessage(formData: FormData) {
  const uid = await getCurrentUserId();
  if (!uid) redirect('/login');

  const parsed = sendMessageSchema.safeParse({
    threadId: formData.get('threadId'),
    body: formData.get('body')
  });
  if (!parsed.success) return;

  const rows = await db.select().from(threads).where(eq(threads.id, parsed.data.threadId)).limit(1);
  const thread = rows[0];
  if (!thread || (thread.requesterId !== uid && thread.creatorId !== uid)) redirect('/studio');

  const recipientId = thread.requesterId === uid ? thread.creatorId : thread.requesterId;

  const href = await threadUrl(thread.id);
  await db.batch([
    db.insert(messages).values({ threadId: thread.id, senderId: uid, body: parsed.data.body }),
    db
      .update(threads)
      .set({ lastMessageAt: new Date(), status: 'active' })
      .where(eq(threads.id, thread.id)),
    db.insert(notifications).values({
      userId: recipientId,
      type: 'message',
      title: `New reply: ${thread.subject}`,
      body: parsed.data.body.slice(0, 140),
      href
    })
  ]);

  revalidatePath(`/studio/messages/${thread.id}`);
  revalidatePath(`/sponsor/messages/${thread.id}`);
  redirect(await threadUrl(thread.id));
}
