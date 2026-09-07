import { expireStaleSlots, getSlotByPublicId, logEvent } from '@/lib/proto/queries';

export const dynamic = 'force-dynamic';

export default async function EmbedContent({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  await expireStaleSlots();
  const slot = await getSlotByPublicId(publicId);

  if (!slot || slot.archived) {
    return (
      <div style={{ font: '13px var(--font-body)', padding: 12, color: 'var(--fg-muted)' }}>
        Slot not found.
      </div>
    );
  }

  // Record an impression each time the widget is served.
  await logEvent(slot.id, 'view');

  const w = slot.width;
  const h = slot.height;

  if (slot.status === 'sponsored') {
    return (
      <a
        href={`/api/click/${slot.publicId}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          width: '100%',
          height: '100dvh',
          textDecoration: 'none',
          color: 'inherit',
          overflow: 'hidden',
          // Letterbox behind media is the system's own --bg-media, never a
          // neutral black picked by hand.
          background: slot.adImageUrl ? 'var(--bg-media)' : 'var(--ink-950)'
        }}
      >
        {slot.adImageUrl ? (
          <img
            src={slot.adImageUrl}
            alt={slot.adHeadline ?? 'Sponsored'}
            width={w}
            height={h}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              color: 'var(--ink-50)',
              font: '600 16px/1.4 var(--font-display)',
              letterSpacing: 'var(--tracking-tight)',
              padding: 16
            }}
          >
            <span>
              {slot.adHeadline}
              <span
                style={{
                  display: 'block',
                  marginTop: 8,
                  font: '500 11px var(--font-slate)',
                  letterSpacing: 'var(--tracking-slate)',
                  textTransform: 'uppercase',
                  opacity: 0.6
                }}
              >
                {slot.isSample ? 'Sample — not a real advertiser' : 'Sponsored'}
              </span>
            </span>
          </div>
        )}
      </a>
    );
  }

  // Open slot → "Advertise here" CTA (breaks out of the iframe to the top window).
  return (
    <a
      href={`/s/${slot.publicId}`}
      target="_top"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: '100%',
        height: '100dvh',
        textAlign: 'center',
        textDecoration: 'none',
        boxSizing: 'border-box',
        border: '1px dashed color-mix(in srgb, var(--accent) 45%, transparent)',
        borderRadius: 'var(--radius-media)',
        background: 'var(--accent-soft)',
        font: '13px var(--font-body)',
        color: 'var(--fg-accent)'
      }}
    >
      <span>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: 'var(--tracking-tight)'
          }}
        >
          Advertise here
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 6,
            font: '500 11px var(--font-slate)',
            letterSpacing: 'var(--tracking-slate)',
            textTransform: 'uppercase',
            color: 'var(--fg-subtle)'
          }}
        >
          {w}×{h} · {slot.pricePoints} pts / spot
        </span>
      </span>
    </a>
  );
}
