'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';

import type { ActionState } from '@/lib/actions';
import { adKinds } from '@/lib/site';

/**
 * The shared form pieces for both consoles.
 *
 * All of them post to a server action, so none of them holds a price, a rank
 * or an amount that the server does not recompute. What a form here submits is
 * an *intent*; the server decides what it costs.
 */

export function SubmitButton({
  label,
  pendingLabel = 'Saving…',
  className = 'btn btn-primary'
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <div className="alert alert-danger alert-inline" role="alert">
        <p className="alert__body">{state.error}</p>
      </div>
    );
  }
  if (state.ok) {
    return (
      <div className="alert alert-success alert-inline" role="status">
        <p className="alert__body">{state.ok}</p>
      </div>
    );
  }
  return null;
}

/**
 * THE CREATIVE EDITOR.
 *
 * Used for both a leaderboard bid and a slot booking — the same ad, in two
 * places, so the same form. Which fields matter depends on the kind, and the
 * kind is a radio rather than a select because there are five and they each
 * need a sentence of explanation.
 */
export function CreativeFields({
  defaults
}: {
  defaults?: {
    kind?: string;
    brand?: string;
    headline?: string;
    body?: string;
    url?: string | null;
    imageUrl?: string | null;
    videoUrl?: string | null;
    priceLabel?: string | null;
    ctaLabel?: string | null;
  };
}) {
  const [kind, setKind] = useState(defaults?.kind ?? 'link');

  return (
    <div className="stack stack-sm">
      <fieldset className="fieldset">
        <legend className="field__label">What are you promoting?</legend>
        <div className="row gy-2">
          {adKinds.map((option) => (
            <div key={option.key} className="col-12 col-sm-6">
              <label className="choice choice-card">
                <input
                  type="radio"
                  name="kind"
                  value={option.key}
                  className="radio"
                  checked={kind === option.key}
                  onChange={() => setKind(option.key)}
                />
                <span>
                  <span className="choice__desc t-default">{option.label}</span>
                  <span className="choice__desc t-fine t-faint">{option.blurb}</span>
                </span>
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="form-row">
        <div className="field">
          <label className="field__label" htmlFor="brand">
            Brand
          </label>
          <input
            className="input"
            id="brand"
            name="brand"
            defaultValue={defaults?.brand ?? ''}
            maxLength={40}
            required
            placeholder="Acme"
          />
          <p className="field__hint">Shown under the ad and on the leaderboard.</p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="ctaLabel">
            Button text
          </label>
          <input
            className="input"
            id="ctaLabel"
            name="ctaLabel"
            defaultValue={defaults?.ctaLabel ?? ''}
            maxLength={24}
            placeholder="Try it free"
          />
          <p className="field__hint">Optional. Only the top-ranked ad shows a button.</p>
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="headline">
          Headline
        </label>
        <input
          className="input"
          id="headline"
          name="headline"
          defaultValue={defaults?.headline ?? ''}
          maxLength={80}
          required
          placeholder="The fastest way to ship a changelog"
        />
        <p className="field__hint">Up to 80 characters — the unit reserves a fixed height.</p>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="body">
          One more line
        </label>
        <textarea
          className="input"
          id="body"
          name="body"
          rows={2}
          maxLength={140}
          defaultValue={defaults?.body ?? ''}
          placeholder="Write the release, we post it everywhere."
        />
        <p className="field__hint">Optional, up to 140 characters.</p>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="url">
          Where it links
        </label>
        <input
          className="input"
          id="url"
          name="url"
          type="url"
          inputMode="url"
          defaultValue={defaults?.url ?? ''}
          required
          placeholder="https://example.com"
        />
        <p className="field__hint">Must start with https://</p>
      </div>

      {/* Shown only when the kind needs it, so nobody is asked for a video URL
          to promote a course. */}
      {kind === 'video' ? (
        <div className="field">
          <label className="field__label" htmlFor="videoUrl">
            YouTube link
          </label>
          <input
            className="input"
            id="videoUrl"
            name="videoUrl"
            type="url"
            defaultValue={defaults?.videoUrl ?? ''}
            placeholder="https://youtube.com/watch?v=…"
          />
          <p className="field__hint">
            The thumbnail is used — no third-party player is loaded on the reader&rsquo;s page.
          </p>
        </div>
      ) : null}

      <div className="form-row">
        <div className="field">
          <label className="field__label" htmlFor="imageUrl">
            Image
          </label>
          <input
            className="input"
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={defaults?.imageUrl ?? ''}
            placeholder="https://…/logo.png"
          />
          <p className="field__hint">Optional. 4:3 or 16:9 reads best.</p>
        </div>

        {kind === 'product' || kind === 'course' ? (
          <div className="field">
            <label className="field__label" htmlFor="priceLabel">
              Price
            </label>
            <input
              className="input"
              id="priceLabel"
              name="priceLabel"
              defaultValue={defaults?.priceLabel ?? ''}
              maxLength={24}
              placeholder="₹1,999"
            />
            <p className="field__hint">Written exactly as you want it shown.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** A form wrapper that wires an action to its message area. */
export function ActionForm({
  action,
  children,
  className = 'form stack-sm'
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});
  return (
    <form action={formAction} className={className}>
      {children}
      <FormMessage state={state} />
    </form>
  );
}
