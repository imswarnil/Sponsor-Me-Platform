import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-24 w-full rounded-control border border-input bg-sunken px-3 py-2 text-base',
        'text-foreground placeholder:text-faint',
        'transition-[color,border-color,box-shadow] duration-200 ease-out outline-none',
        'hover:border-line-strong',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45',
        'aria-invalid:border-destructive-line',
        'md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
