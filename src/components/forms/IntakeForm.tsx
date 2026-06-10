// components/forms/IntakeForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateClient } from '../../hooks/useClients';
import { useUIStore } from '../../stores/uiStore';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';

// ─── Schema ───────────────────────────────────────────────────────────────────

const HAIR_TYPES = ['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C', '4A', '4B', '4C'] as const;
const SCALP_CONDITIONS = ['Normal', 'Dry', 'Oily', 'Sensitive', 'Dandruff', 'Alopecia', 'Other'] as const;
const PRODUCT_PREFS = ['No preference', 'Natural/organic only', 'Fragrance-free', 'No sulphates', 'No parabens'] as const;
const VISIT_REASONS = ['Protective style', 'Special occasion', 'Regular maintenance', 'Treatment', 'First visit', 'Other'] as const;

const intakeSchema = z.object({
  hairType: z.enum(HAIR_TYPES, { required_error: 'Please select your hair type.' }),
  scalpCondition: z.enum(SCALP_CONDITIONS, { required_error: 'Please select your scalp condition.' }),
  productPreference: z.enum(PRODUCT_PREFS),
  visitReason: z.enum(VISIT_REASONS, { required_error: 'Please select a reason for your visit.' }),
  lastChemicalTreatment: z.string().optional(),
  allergies: z.string().max(500, 'Please keep this under 500 characters.').optional(),
  currentProducts: z.string().max(500).optional(),
  goals: z.string().max(500, 'Please keep this under 500 characters.').optional(),
  notes: z.string().max(1000).optional(),
});

type IntakeFormValues = z.infer<typeof intakeSchema>;

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SelectFieldProps {
  label: string;
  name: keyof IntakeFormValues;
  options: readonly string[];
  register: ReturnType<typeof useForm<IntakeFormValues>>['register'];
  error?: string;
  required?: boolean;
}

function SelectField({ label, name, options, register, error, required }: SelectFieldProps) {
  return (
    <div className="intake-form__field">
      <label htmlFor={name} className="intake-form__label">
        {label}
        {required && <span className="intake-form__required" aria-label="required"> *</span>}
      </label>
      <select
        id={name}
        {...register(name)}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-err` : undefined}
        className={`intake-form__select ${error ? 'intake-form__select--error' : ''}`}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {error && (
        <p id={`${name}-err`} className="intake-form__error" role="alert">{error}</p>
      )}
    </div>
  );
}

interface TextareaFieldProps {
  label: string;
  name: keyof IntakeFormValues;
  placeholder?: string;
  hint?: string;
  register: ReturnType<typeof useForm<IntakeFormValues>>['register'];
  error?: string;
  rows?: number;
}

function TextareaField({ label, name, placeholder, hint, register, error, rows = 3 }: TextareaFieldProps) {
  return (
    <div className="intake-form__field">
      <label htmlFor={name} className="intake-form__label">{label}</label>
      {hint && <p className="intake-form__hint">{hint}</p>}
      <textarea
        id={name}
        {...register(name)}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-err` : undefined}
        className={`intake-form__textarea ${error ? 'intake-form__textarea--error' : ''}`}
      />
      {error && (
        <p id={`${name}-err`} className="intake-form__error" role="alert">{error}</p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface IntakeFormProps {
  clientId: number;
  /** Pre-fill from existing client preferences */
  defaultValues?: Partial<IntakeFormValues>;
  onSuccess?: () => void;
}

export function IntakeForm({ clientId, defaultValues, onSuccess }: IntakeFormProps) {
  const { addToast } = useUIStore();
  const updateClient = useUpdateClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: defaultValues ?? {},
  });

  async function onSubmit(values: IntakeFormValues) {
    try {
      await updateClient.mutateAsync({
        id: clientId,
        data: {
          preferences: {
            hairType: values.hairType,
            scalpCondition: values.scalpCondition,
            productPreference: values.productPreference,
            visitReason: values.visitReason,
            lastChemicalTreatment: values.lastChemicalTreatment,
            currentProducts: values.currentProducts,
            goals: values.goals,
          },
          notes: [
            values.allergies ? `Allergies/sensitivities: ${values.allergies}` : null,
            values.notes ? `Notes: ${values.notes}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
        },
      });
      addToast({ type: 'success', message: 'Intake form saved.' });
      onSuccess?.();
    } catch {
      addToast({ type: 'error', message: 'Failed to save intake form. Please try again.' });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Client intake form"
      className="intake-form"
    >
      <p className="intake-form__intro">
        Help us give you the best experience. Your answers are saved to your profile and shared only with your stylist.
      </p>

      {/* ── Hair profile ── */}
      <fieldset className="intake-form__section">
        <legend className="intake-form__section-title">Hair profile</legend>
        <div className="intake-form__row">
          <SelectField
            label="Hair type"
            name="hairType"
            options={HAIR_TYPES}
            register={register}
            error={errors.hairType?.message}
            required
          />
          <SelectField
            label="Scalp condition"
            name="scalpCondition"
            options={SCALP_CONDITIONS}
            register={register}
            error={errors.scalpCondition?.message}
            required
          />
        </div>

        <div className="intake-form__field">
          <label htmlFor="lastChemicalTreatment" className="intake-form__label">
            Last chemical treatment
          </label>
          <p className="intake-form__hint">e.g. relaxer, colour, keratin — leave blank if none</p>
          <Input
            id="lastChemicalTreatment"
            type="text"
            placeholder="e.g. Relaxer — 3 months ago"
            {...register('lastChemicalTreatment')}
          />
        </div>

        <TextareaField
          label="Known allergies or sensitivities"
          name="allergies"
          placeholder="List any products, chemicals, or ingredients you react to…"
          hint="This is important for your safety. Include patch-test reactions if known."
          register={register}
          error={errors.allergies?.message}
        />

        <TextareaField
          label="Products currently in your hair"
          name="currentProducts"
          placeholder="e.g. Shea Moisture Leave-in, coconut oil…"
          register={register}
          error={errors.currentProducts?.message}
        />
      </fieldset>

      {/* ── Visit details ── */}
      <fieldset className="intake-form__section">
        <legend className="intake-form__section-title">Visit details</legend>
        <div className="intake-form__row">
          <SelectField
            label="Reason for visit"
            name="visitReason"
            options={VISIT_REASONS}
            register={register}
            error={errors.visitReason?.message}
            required
          />
          <SelectField
            label="Product preference"
            name="productPreference"
            options={PRODUCT_PREFS}
            register={register}
            error={errors.productPreference?.message}
          />
        </div>

        <TextareaField
          label="Hair goals"
          name="goals"
          placeholder="What would you like to achieve? e.g. grow out, retain length, moisturise…"
          register={register}
          error={errors.goals?.message}
        />

        <TextareaField
          label="Additional notes for your stylist"
          name="notes"
          placeholder="Anything else we should know before your appointment…"
          register={register}
          error={errors.notes?.message}
          rows={4}
        />
      </fieldset>

      <div className="intake-form__actions">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="btn btn--primary"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" />
              Saving…
            </>
          ) : (
            'Save intake form'
          )}
        </button>
      </div>

      
    </form>
  );
}