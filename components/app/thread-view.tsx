import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/ui/submit-button';
import { sendMessage } from '@/lib/proto/actions';
import type { Message } from '@/lib/proto/schema';

const fmtTime = (d: Date) =>
  new Date(d).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });

/** Message bubbles + a reply form — shared by /studio/messages/[id] and
 *  /sponsor/messages/[id]. `meId` decides which side each bubble aligns to. */
export function ThreadView({
  threadId,
  messages,
  meId,
  senderName
}: {
  threadId: string;
  messages: Message[];
  meId: string;
  senderName: (senderId: string) => string;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {messages.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-control border px-4 py-2.5 text-sm',
                  mine
                    ? 'border-transparent bg-inverse text-on-inverse'
                    : 'border-line-subtle bg-surface'
                )}
              >
                {m.body}
              </div>
              <p className="mt-1 font-mono text-2xs uppercase tracking-slate text-subtle">
                {senderName(m.senderId)} · {fmtTime(m.createdAt)}
              </p>
            </div>
          );
        })}
      </div>

      <form action={sendMessage} className="space-y-2 border-t border-line-subtle pt-5">
        <input type="hidden" name="threadId" value={threadId} />
        <Textarea name="body" required maxLength={2000} placeholder="Write a reply…" />
        <div className="flex justify-end">
          <SubmitButton pendingText="Sending…">Send</SubmitButton>
        </div>
      </form>
    </div>
  );
}
