// components/forms/ConsentForm.tsx
import { useState } from 'react';
import { useBookingFlowStore } from '../../stores/bookingFlowStore';
import './styles/layout/FormStyles/ConsentForm.css'
interface ConsentItem {
  id: string;
  required: boolean;
  label: string;
  body: string;
}

const CONSENT_ITEMS: ConsentItem[] = [
  {
    id: 'service_consent',
    required: true,
    label: 'Service agreement',
    body:
      'I understand the nature of the hair service I have selected, including the estimated duration and any preparation requirements. I confirm that the information I have provided is accurate.',
  },
  {
    id: 'allergy_consent',
    required: true,
    label: 'Allergen & sensitivity disclosure',
    body:
      'I acknowledge that Locs Allure uses professional hair products that may contain chemicals including dyes, relaxers, and adhesives. I have disclosed any known allergies or scalp sensitivities in my intake form or notes. Locs Allure is not liable for reactions arising from undisclosed conditions.',
  },
  {
    id: 'cancellation_policy',
    required: true,
    label: 'Cancellation & no-show policy',
    body:
      'I understand that appointments must be cancelled at least 24 hours in advance. Cancellations within 24 hours or no-shows may incur a fee. Repeated no-shows may result in a deposit requirement for future bookings.',
  },
  {
    id: 'photo_consent',
    required: false,
    label: 'Photography consent (optional)',
    body:
      'I give Locs Allure permission to photograph the completed style for portfolio or promotional use on social media. My personal details will not be published without my explicit consent.',
  },
];

interface ConsentFormProps {
  onComplete?: (consents: Record<string, boolean>) => void;
}

export function ConsentForm({ onComplete }: ConsentFormProps) {
  const { consentData, setConsentData } = useBookingFlowStore();

  const [checked, setChecked] = useState<Record<string, boolean>>(
    consentData ??
      Object.fromEntries(CONSENT_ITEMS.map((c) => [c.id, false]))
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const allRequired = CONSENT_ITEMS.filter((c) => c.required).every(
    (c) => checked[c.id]
  );

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      setConsentData(next);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSubmit() {
    setSubmitted(true);
    if (!allRequired) return;
    onComplete?.(checked);
  }

  return (
    <div className="consent-form">
      <p className="consent-form__intro">
        Before we confirm your appointment, please review and accept the following.
        Items marked <span aria-label="required" className="consent-form__required-star">*</span> are required.
      </p>

      <div className="consent-form__items">
        {CONSENT_ITEMS.map((item) => {
          const isExpanded = expanded[item.id] ?? false;
          const isChecked = !!checked[item.id];
          const showError = submitted && item.required && !isChecked;

          return (
            <div
              key={item.id}
              className={`consent-item ${isChecked ? 'consent-item--checked' : ''} ${showError ? 'consent-item--error' : ''}`}
            >
              <div className="consent-item__top">
                <label className="consent-item__label" htmlFor={item.id}>
                  <span className="consent-item__checkbox-wrap">
                    <input
                      type="checkbox"
                      id={item.id}
                      checked={isChecked}
                      onChange={() => toggle(item.id)}
                      aria-describedby={`${item.id}-body`}
                      className="consent-item__checkbox"
                    />
                    <span className="consent-item__checkbox-custom" aria-hidden="true">
                      {isChecked && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                  </span>
                  <span className="consent-item__label-text">
                    {item.label}
                    {item.required && (
                      <span className="consent-form__required-star" aria-label="required"> *</span>
                    )}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`${item.id}-body`}
                  className="consent-item__expand-btn"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>

              {isExpanded && (
                <p id={`${item.id}-body`} className="consent-item__body">
                  {item.body}
                </p>
              )}

              {showError && (
                <p className="consent-item__error-msg" role="alert">
                  You must accept this to continue.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {submitted && !allRequired && (
        <p className="consent-form__global-error" role="alert">
          Please accept all required items before continuing.
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        className="btn btn--primary consent-form__submit"
      >
        Accept &amp; continue
      </button>

      
    </div>
  );
}