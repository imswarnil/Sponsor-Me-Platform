'use client';

import { ActionForm, SubmitButton } from '@/components/forms';
import { createSlotAction } from '@/lib/actions';
import { properties, slotFormats } from '@/lib/site';

/**
 * Creating a piece of inventory.
 *
 * `previewUrl` is the field that matters most and is the least obvious: it is
 * the real page a prospective sponsor is shown in an iframe before they pay.
 * Filling it in is the difference between selling a description and selling
 * the thing itself.
 */
export function NewSlotForm() {
  return (
    <ActionForm action={createSlotAction}>
      <div className="field">
        <label className="field__label" htmlFor="slot-name">
          Name
        </label>
        <input
          className="input"
          id="slot-name"
          name="name"
          required
          maxLength={80}
          placeholder="Blog sidebar"
        />
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field__label" htmlFor="slot-property">
            Site
          </label>
          <select className="select" id="slot-property" name="property" defaultValue="">
            <option value="">Across the network</option>
            {properties.map((property) => (
              <option key={property.key} value={property.key}>
                {property.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="slot-format">
            Format
          </label>
          <select className="select" id="slot-format" name="format" defaultValue="rect">
            {slotFormats.map((format) => (
              <option key={format.key} value={format.key}>
                {format.label} — {format.size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="field">
          <label className="field__label" htmlFor="slot-price">
            Price per month
          </label>
          <div className="input-group">
            <span className="input-group__text">₹</span>
            <input
              className="input"
              id="slot-price"
              name="priceRupees"
              type="number"
              min={1}
              step={1}
              required
              placeholder="2500"
            />
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="slot-views">
            Views per month
          </label>
          <input
            className="input"
            id="slot-views"
            name="monthlyViews"
            type="number"
            min={0}
            step={1}
            placeholder="Leave empty"
          />
          {/* An empty field means "not measured" and renders as nothing at
              all. It must never become a zero, which would read as a
              measurement — and a wrong one. */}
          <p className="field__hint">Only if you have measured it. Empty shows no figure.</p>
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="slot-preview">
          Preview URL
        </label>
        <input
          className="input"
          id="slot-preview"
          name="previewUrl"
          type="url"
          placeholder="https://imswarnil.com/some-post"
        />
        <p className="field__hint">
          The real page this slot sits on. Sponsors see it in a live frame before they pay.
        </p>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="slot-desc">
          Description
        </label>
        <textarea
          className="input"
          id="slot-desc"
          name="description"
          rows={2}
          maxLength={400}
          placeholder="Above the fold on every article."
        />
      </div>

      <div className="form__actions">
        <SubmitButton label="Create slot" />
      </div>
    </ActionForm>
  );
}
