import * as React from 'react';
import { Slot as SlotPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* A badge is a status, not a link. It speaks in the slate voice — mono,
   uppercase, wide-tracked — so metadata never competes with content.
   creator/2-elements/11-badge.css */
const badgeVariants = cva(
  'inline-flex h-6 w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-pill border border-border bg-surface px-2 font-mono text-2xs font-medium uppercase tracking-slate text-muted-foreground transition-colors [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: '',
        /* The signal, softened — a label, never the loudest thing on screen. */
        pop: 'border-transparent bg-pop-soft text-pop-soft-foreground',
        outline: 'border-border text-foreground',
        craft: 'border-transparent bg-craft-soft text-craft-foreground',
        success: 'border-transparent bg-success-soft text-success',
        warning: 'border-transparent bg-warning-soft text-warning',
        info: 'border-transparent bg-info-soft text-info',
        destructive: 'border-transparent bg-destructive-soft text-destructive',
        inverse: 'border-transparent bg-inverse text-on-inverse',
        /* The loudest label allowed, and only ever one per surface. */
        live: 'border-pop bg-pop text-on-accent'
      }
    },
    defaultVariants: { variant: 'default' }
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? SlotPrimitive.Slot : 'span';
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** The line above a heading: a signal dot, then the slate voice. */
function Eyebrow({ className, children, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="eyebrow"
      className={cn(
        'inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-slate text-subtle',
        'before:size-1.5 before:shrink-0 before:rounded-full before:bg-pop before:content-[""]',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export { Badge, Eyebrow, badgeVariants };
