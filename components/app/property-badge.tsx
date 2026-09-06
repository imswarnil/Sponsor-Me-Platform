import { Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toProperty } from '@/lib/properties';

/**
 * Which site a placement runs on, read from its stored `property` value.
 *
 * A slot with no property means "across everything" — that is a real answer,
 * not a missing one, so it gets a badge like any other.
 */
export function PropertyBadge({ property }: { property: string | null | undefined }) {
  const site = toProperty(property);
  return (
    <Badge variant="outline" className="gap-1.5">
      <Globe className="size-3" />
      {site.label}
    </Badge>
  );
}
