import { useState } from 'react';
import { useBookingFlowStore } from '../../store/bookingFlowStore';
import type { FormTemplate, FormField } from '../../types';

interface DynamicConsultationFormProps {
  template: FormTemplate;
  onComplete: () => void;
}

type AnswerValue = string | string[] | number | boolean | undefined;

function isBlank(value: AnswerValue): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

// Client-side mirror of the checks the backend actually enforces
// (validateAnswersAgainstTemplate in formAnswers.js) — this is UX only,
// so the person sees a clear "answer this" message instead of a generic
// booking failure. The server re-validates everything against the live
// template regardless of what this sends.
function findFirstError(fields: FormField[], answers: Record<string, AnswerValue>): string | null {
  for (const field of fields) {
    const value = answers[String(field.id)];
    if (field.required && isBlank(value)) {
      return `Please answer: "${field.label}"`;
    }
  }
  return null;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
}) {
  const inputId = `cf-${field.id}`;

  switch (field.fieldType) {
    case 'TEXT':
      return (
        <input
          id={inputId}
          type="text"
          className="svc-form__input"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={500}
        />
      );

    case 'TEXTAREA':
      return (
        <textarea
          id={inputId}
          className="svc-form__textarea"
          rows={3}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={5000}
        />
      );

    case 'DATE':
      return (
        <input
          id={inputId}
          type="date"
          className="svc-form__input"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'CHECKBOX':
      return (
        <label className="svc-form__field--inline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            id={inputId}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
          Yes
        </label>
      );

    case 'SIGNATURE':
      return (
        <input
          id={inputId}
          type="text"
          className="svc-form__input consultation-form__signature"
          placeholder="Type your full name to sign"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={200}
        />
      );

    case 'SCALE':
      return (
        <div className="consultation-form__scale" role="radiogroup" aria-labelledby={inputId}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              onClick={() => onChange(n)}
              className={`consultation-form__scale-btn ${value === n ? 'consultation-form__scale-btn--active' : ''}`}
            >
              {n}
            </button>
          ))}
        </div>
      );

    case 'SINGLE_SELECT':
      return (
        <div className="consultation-form__options" role="radiogroup">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="consultation-form__option">
              <input
                type="radio"
                name={inputId}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case 'MULTI_SELECT': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="consultation-form__options">
          {(field.options ?? []).map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label key={opt} className="consultation-form__option">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(checked ? selected.filter((v) => v !== opt) : [...selected, opt])
                  }
                />
                {opt}
              </label>
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
}

export function DynamicConsultationForm({ template, onComplete }: DynamicConsultationFormProps) {
  const { formAnswers, setFormAnswers } = useBookingFlowStore();
  const fields = template.fields ?? [];

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(
    () => (formAnswers as Record<string, AnswerValue>) ?? {},
  );
  const [submitted, setSubmitted] = useState(false);

  function setAnswer(fieldId: number, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [String(fieldId)]: value }));
  }

  const error = submitted ? findFirstError(fields, answers) : null;

  // Group fields by their admin-assigned section, preserving the
  // template's own field order within and across sections.
  const sections: Array<{ heading: string | null; fields: FormField[] }> = [];
  for (const field of fields) {
    const last = sections[sections.length - 1];
    if (last && last.heading === (field.section ?? null)) {
      last.fields.push(field);
    } else {
      sections.push({ heading: field.section ?? null, fields: [field] });
    }
  }

  function handleContinue() {
    setSubmitted(true);
    const firstError = findFirstError(fields, answers);
    if (firstError) return;
    setFormAnswers(answers);
    onComplete();
  }

  return (
    <div className="consultation-form">
      {template.description && <p className="consent-form__intro">{template.description}</p>}

      {sections.map((section, idx) => (
        <div key={idx} className="consultation-form__section">
          {section.heading && <h3 className="consultation-form__section-title">{section.heading}</h3>}
          {section.fields.map((field) => {
            const value = answers[String(field.id)];
            const showError = submitted && field.required && isBlank(value);
            return (
              <div key={field.id} className="svc-form__field consultation-form__field">
                <label htmlFor={`cf-${field.id}`} className="svc-form__label">
                  {field.label}
                  {field.required && <span className="consent-form__required-star" aria-label="required"> *</span>}
                </label>
                {field.helpText && <p className="svc-form__hint">{field.helpText}</p>}
                <FieldInput field={field} value={value} onChange={(v) => setAnswer(field.id, v)} />
                {showError && (
                  <p className="consent-item__error-msg" role="alert">This question is required.</p>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {error && (
        <p className="consent-form__global-error" role="alert">{error}</p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        className="btn btn--primary consent-form__submit"
      >
        Continue
      </button>
    </div>
  );
}
