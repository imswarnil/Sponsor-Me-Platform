import { NextResponse } from 'next/server';
import { getSlotByPublicId, logEvent } from '@/lib/proto/queries';

export async function GET(_req: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const slot = await getSlotByPublicId(publicId);
  if (!slot) return NextResponse.redirect(new URL('/', _req.url));

  await logEvent(slot.id, 'click');

  // Send the visitor to the advertiser's link (or the public slot page as a fallback).
  const dest = slot.adLinkUrl && /^https?:\/\//.test(slot.adLinkUrl)
    ? slot.adLinkUrl
    : new URL(`/s/${publicId}`, _req.url).toString();

  return NextResponse.redirect(dest);
}
