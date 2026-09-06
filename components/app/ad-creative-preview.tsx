/**
 * Renders exactly what `app/embed/[publicId]/page.tsx` renders for a sponsored
 * slot — same tokens, same layout — so a sponsor filling out the form sees the
 * real thing, not an approximation. Kept as its own component so both stay in
 * sync deliberately, not by accident.
 */
export function AdCreativePreview({
  headline,
  imageUrl,
  ctaLabel,
  width = 300,
  height = 250,
  ambassador = false,
  socials = []
}: {
  headline: string;
  imageUrl?: string;
  ctaLabel?: string;
  width?: number;
  height?: number;
  ambassador?: boolean;
  socials?: { platform: string; url: string }[];
}) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: width,
        aspectRatio: `${width}/${height}`,
        overflow: 'hidden',
        borderRadius: 'var(--radius-media)',
        background: imageUrl ? 'var(--bg-media)' : 'var(--ink-950)'
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={headline || 'Sponsored'}
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
            {headline || 'Your headline goes here'}
            {ctaLabel ? (
              <span
                style={{
                  display: 'inline-block',
                  marginLeft: 8,
                  font: '600 11px var(--font-slate)',
                  color: 'var(--ink-50)',
                  opacity: 0.85
                }}
              >
                {ctaLabel} →
              </span>
            ) : null}
            {ambassador ? (
              <span
                style={{
                  display: 'block',
                  marginTop: 10,
                  font: '500 10px/1.4 var(--font-slate)',
                  letterSpacing: 'var(--tracking-slate)',
                  opacity: 0.75
                }}
              >
                One of my subscribers/readers sponsored me for my work — you can do it too.
              </span>
            ) : null}
            {socials.length > 0 ? (
              <span
                style={{
                  display: 'block',
                  marginTop: 8,
                  font: '500 10px var(--font-slate)',
                  letterSpacing: 'var(--tracking-slate)',
                  textTransform: 'uppercase',
                  opacity: 0.6
                }}
              >
                {socials.map((s) => s.platform).join(' · ')}
              </span>
            ) : null}
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
              Sponsored
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
