'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ComponentProps } from 'react';

/** Drop-in for `<Button type="submit">` inside a `<form action={serverAction}>` — shows
 *  the house Loader2 spinner (see components/auth/auth-form.tsx) while the action runs,
 *  since a plain server-action form gives no feedback at all during the round trip. */
export function SubmitButton({
  children,
  pendingText,
  ...props
}: ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
