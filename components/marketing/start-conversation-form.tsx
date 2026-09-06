import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/ui/submit-button';
import { startThread } from '@/lib/proto/actions';

/** Replaces "reach me externally" links — an in-app request that starts a message
 *  thread. Works whether or not the visitor is signed in yet: `startThread` redirects
 *  to /login with `next` set to come straight back here on success. */
export function StartConversationForm({
  next = '/placements',
  title = "Don't see what you need?",
  description = "Tell me what you had in mind and I'll get back to you."
}: {
  next?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-md rounded-card border border-border bg-card p-6 text-left">
      <p className="font-display font-semibold tracking-tight">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <form action={startThread} className="mt-4 space-y-3">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="type" value="request" />
        <Input name="subject" required maxLength={120} placeholder="What's this about?" />
        <Textarea name="body" required maxLength={2000} placeholder="What did you have in mind?" />
        <SubmitButton className="w-full" pendingText="Sending…">
          Start a conversation
        </SubmitButton>
      </form>
    </div>
  );
}
