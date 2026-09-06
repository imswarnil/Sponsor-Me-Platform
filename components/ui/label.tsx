'use client';

import * as React from 'react';
import { Label as LabelPrimitive } from 'radix-ui';

import { cn } from '@/lib/utils';

/** A field label is metadata, so it speaks in the label voice — Inter small,
 *  uppercase and tracked open. Monospace is for code only. */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'flex select-none items-center gap-2 font-label text-2xs font-semibold uppercase leading-none tracking-slate text-subtle',
        'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-45',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-45',
        className
      )}
      {...props}
    />
  );
}

export { Label };
