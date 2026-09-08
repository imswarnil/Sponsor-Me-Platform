'use client';

import { useActionState } from 'react';

import { FormMessage, SubmitButton } from '@/components/forms';
import { sendMessageAction, type ActionState } from '@/lib/actions';
import type { Message } from '@/lib/db/schema';

/**
 * One conversation, between a sponsor and the creator.
 *
 * There is no thread id in the markup when a sponsor is writing: the server
 * derives the thread from who they are. That is what stops a posted uuid from
 * writing into somebody else's conversation. Only the creator names a thread,
 * and only because they have many.
 */
export function MessageThread({
  messages,
  selfIsCreator,
  profileId
}: {
  messages: Message[];
  selfIsCreator: boolean;
  profileId?: string;
}) {
  const [state, action] = useActionState<ActionState, FormData>(sendMessageAction, {});

  return (
    <div className="stack stack-sm">
      {/* The design system's chat pattern: `-user` is its accent side, which
          here means "you", whichever side of the conversation you are on. */}
      {messages.length ? (
        <div className="chat">
          {messages.map((message) => {
            const mine = message.fromCreator === selfIsCreator;
            return (
              <div
                key={message.id}
                className={`chat__msg ${mine ? 'chat__msg-user' : 'chat__msg-ai'}`}
              >
                <div className="chat__bubble">
                  <p className="m-0">{message.body}</p>
                </div>
                <time
                  className="chat__meta"
                  dateTime={new Date(message.createdAt).toISOString()}
                >
                  {new Date(message.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </time>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="t-small t-muted m-0">No messages yet.</p>
      )}

      <form action={action} className="form stack-sm">
        {selfIsCreator && profileId ? (
          <input type="hidden" name="profileId" value={profileId} />
        ) : null}
        <div className="field">
          <label className="u-sr-only" htmlFor={`body-${profileId ?? 'self'}`}>
            Message
          </label>
          <textarea
            className="input"
            id={`body-${profileId ?? 'self'}`}
            name="body"
            rows={3}
            maxLength={2000}
            required
            placeholder={selfIsCreator ? 'Reply…' : 'Ask about a placement…'}
          />
        </div>
        <FormMessage state={state} />
        <div className="form__actions form__actions-end">
          <SubmitButton label="Send" pendingLabel="Sending…" className="btn btn-sm btn-primary" />
        </div>
      </form>
    </div>
  );
}
