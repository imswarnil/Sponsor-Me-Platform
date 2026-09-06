import * as React from 'react';
import { Slot as SlotPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/* One skeleton, six intents, three sizes — creator/3-components/20-button.css.
   Intent picks itself: default = the one thing this screen is for · secondary =
   the other real action · ghost/quiet = navigation-ish · soft = accent without
   weight · destructive = always confirmed.

   The press is a 1px settle, not a scale: a button is a physical key. */
const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'rounded-control border border-transparent font-sans text-sm font-semibold leading-none',
    'cursor-pointer select-none outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out',
    'active:not-disabled:translate-y-px',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45',
    'aria-disabled:pointer-events-none aria-disabled:opacity-45',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    'aria-invalid:border-destructive-line'
  ],
  {
    variants: {
      variant: {
        /* The signal, spent deliberately: one primary button per view. */
        default: 'bg-pop text-on-accent border-pop hover:bg-pop-hover hover:border-pop-hover active:bg-pop-press',
        /* The other real action — ink, not colour. */
        secondary: 'bg-inverse text-on-inverse border-transparent hover:opacity-88',
        /* Navigation-ish: reads as text until you touch it. */
        ghost: 'bg-transparent text-muted-foreground hover:bg-sunken hover:text-foreground',
        quiet: 'bg-transparent text-muted-foreground hover:bg-sunken hover:text-foreground',
        /* A real edge — for the second action beside a primary. */
        outline: 'bg-surface text-foreground border-border hover:border-line-strong hover:bg-sunken',
        /* Accent without weight. */
        soft: 'bg-pop-soft text-pop-soft-foreground border-transparent hover:border-line-accent',
        destructive: 'bg-destructive-line text-white border-transparent hover:brightness-92',
        link: 'text-foreground underline-offset-4 hover:text-signal hover:underline'
      },
      size: {
        sm: 'h-control-sm gap-1.5 px-3',
        default: 'h-control-md px-5',
        lg: 'h-control-lg px-6 text-base',
        icon: 'size-control-md px-0',
        'icon-sm': 'size-control-sm px-0'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? SlotPrimitive.Slot : 'button';

  return (
    <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { Button, buttonVariants };
