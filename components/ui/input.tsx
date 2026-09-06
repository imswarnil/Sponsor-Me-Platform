import * as React from 'react';

import { cn } from '@/lib/utils';

/* An input is the same object as a button: same height ladder, same corner.
   The well is sunken rather than outlined — depth from a line and an inset,
   never a drop shadow. creator/3-components/21-form.css */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-control-md w-full min-w-0 rounded-control border border-input bg-sunken px-3 text-base',
        'text-foreground placeholder:text-faint',
        'transition-[color,border-color,box-shadow] duration-200 ease-out outline-none',
        'hover:border-line-strong',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45',
        'aria-invalid:border-destructive-line',
        'md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Input };
