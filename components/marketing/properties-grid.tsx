import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PROPERTIES, type PropertySpec } from '@/lib/properties';

const KIND_LABEL: Record<PropertySpec['kind'], string> = {
  site: 'Site',
  product: 'Product',
  course: 'Course',
  'open-source': 'Open source',
  profile: 'Profile'
};

/**
 * Every site a sponsor would be backing.
 *
 * A property with no DNS record renders as a card without a link rather than a
 * link that 404s — the work is real even when the host isn't up yet.
 */
export function PropertiesGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {PROPERTIES.map((p) => {
        const body = (
          <Card className="h-full transition-colors hover:border-line-strong">
            <CardContent className="flex h-full flex-col gap-2 p-5">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">{KIND_LABEL[p.kind]}</Badge>
                {p.live ? (
                  <ExternalLink className="size-3.5 text-faint" />
                ) : (
                  <Badge variant="warning">Soon</Badge>
                )}
              </div>
              <p className="font-display font-semibold tracking-tight">{p.label}</p>
              <p className="flex-1 text-sm text-muted-foreground">{p.blurb}</p>
              <p className="font-label text-2xs uppercase tracking-slate text-subtle">{p.host}</p>
            </CardContent>
          </Card>
        );

        return p.live ? (
          <a key={p.key} href={p.url} target="_blank" rel="noopener noreferrer">
            {body}
          </a>
        ) : (
          <div key={p.key}>{body}</div>
        );
      })}
    </div>
  );
}
