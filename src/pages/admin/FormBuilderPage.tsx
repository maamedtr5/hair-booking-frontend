import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import {
  useFormTemplate,
  useUpdateFormTemplate,
  useAddFormField,
  useUpdateFormField,
  useDeleteFormField,
  useReorderFormFields,
} from '../../hooks/useFormTemplates';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useUiStore } from '../../store/uiStore';
import type { FormField, FormFieldType } from '../../types';
import {
  formTemplateSchema,
  formFieldSchema,
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
} from '../../validators/formTemplateValidator';
import type { FormTemplateFormValues } from '../../validators/formTemplateValidator';

const OPTION_TYPES = new Set<FormFieldType>(['SINGLE_SELECT', 'MULTI_SELECT']);

// ============================================================
// Edit the template's own name/description/active state
// ============================================================
function TemplateDetailsModal({
  templateId,
  name,
  description,
  isActive,
  onClose,
}: {
  templateId: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  onClose: () => void;
}) {
  const { addToast } = useUiStore();
  const updateMutation = useUpdateFormTemplate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormTemplateFormValues>({
      resolver: zodResolver(formTemplateSchema) as Resolver<FormTemplateFormValues>,
      defaultValues: { name, description: description ?? '', isActive },
    });

  async function onSubmit(values: FormTemplateFormValues) {
    try {
      await updateMutation.mutateAsync({ id: templateId, payload: values });
      onClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to save.' });
    }
  }

  return (
    <Modal open title="Edit form details" onClose={onClose} size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="svc-form">
        <div className="svc-form__field">
          <label htmlFor="tpl-name" className="svc-form__label">Form name *</label>
          <input id="tpl-name" {...register('name')}
            className={`svc-form__input ${errors.name ? 'svc-form__input--error' : ''}`} />
          {errors.name && <p className="svc-form__error">{errors.name.message}</p>}
        </div>
        <div className="svc-form__field">
          <label htmlFor="tpl-desc" className="svc-form__label">Description</label>
          <textarea id="tpl-desc" {...register('description')} rows={2} className="svc-form__textarea" />
        </div>
        <div className="svc-form__field svc-form__field--inline">
          <label className="svc-form__label">
            <input type="checkbox" {...register('isActive')} style={{ marginRight: 8 }} />
            Active (an inactive form is never required, even if a category still points to it)
          </label>
        </div>
        <div className="svc-form__actions">
          <button type="button" onClick={onClose} className="btn btn--ghost">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn btn--primary">
            {isSubmitting ? <><Spinner size="sm" />Saving…</> : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// Add / edit one question. fieldType + options are managed as
// local state rather than through react-hook-form, since the
// option list's shape changes with the selected type — validated
// against the same Zod schema the backend mirrors, just before
// submit.
// ============================================================
function FieldFormModal({
  formTemplateId,
  field,
  onClose,
}: {
  formTemplateId: number;
  field?: FormField;
  onClose: () => void;
}) {
  const { addToast } = useUiStore();
  const addMutation = useAddFormField();
  const updateMutation = useUpdateFormField();
  const isEdit = !!field;

  const [fieldType, setFieldType] = useState<FormFieldType>(field?.fieldType ?? 'TEXT');
  const [options, setOptions] = useState<string[]>(field?.options ?? []);
  const [optionDraft, setOptionDraft] = useState('');
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{
    label: string;
    section?: string;
    helpText?: string;
    required: boolean;
  }>({
    defaultValues: {
      label: field?.label ?? '',
      section: field?.section ?? '',
      helpText: field?.helpText ?? '',
      required: field?.required ?? false,
    },
  });

  const needsOptions = OPTION_TYPES.has(fieldType);

  function addOption() {
    const v = optionDraft.trim();
    if (!v) return;
    if (options.some((o) => o.toLowerCase() === v.toLowerCase())) {
      setOptionsError('That option already exists.');
      return;
    }
    setOptions([...options, v]);
    setOptionDraft('');
    setOptionsError(null);
  }

  function removeOption(idx: number) {
    setOptions(options.filter((_, i) => i !== idx));
  }

  async function onSubmit(values: { label: string; section?: string; helpText?: string; required: boolean }) {
    const candidate = {
      ...values,
      section: values.section?.trim() ? values.section.trim() : undefined,
      helpText: values.helpText?.trim() ? values.helpText.trim() : undefined,
      fieldType,
      options: needsOptions ? options : undefined,
    };
    const parsed = formFieldSchema.safeParse(candidate);
    if (!parsed.success) {
      setOptionsError(parsed.error.issues[0]?.message ?? 'Please check this question.');
      return;
    }
    setOptionsError(null);
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ formTemplateId, fieldId: field!.id, payload: parsed.data });
      } else {
        await addMutation.mutateAsync({ formTemplateId, payload: parsed.data });
      }
      onClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to save question.' });
    }
  }

  return (
    <Modal open title={isEdit ? 'Edit question' : 'Add question'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="svc-form">
        <div className="svc-form__field">
          <label htmlFor="f-label" className="svc-form__label">Question *</label>
          <input id="f-label" {...register('label', { required: true })}
            className={`svc-form__input ${errors.label ? 'svc-form__input--error' : ''}`}
            placeholder="e.g. How does your scalp usually respond to tight hairstyles?" />
          {errors.label && <p className="svc-form__error">This question needs a label.</p>}
        </div>

        <div className="svc-form__row">
          <div className="svc-form__field">
            <label htmlFor="f-section" className="svc-form__label">Section heading</label>
            <input id="f-section" {...register('section')}
              className="svc-form__input" placeholder="e.g. Scalp Tolerance" />
          </div>
          <div className="svc-form__field">
            <label htmlFor="f-type" className="svc-form__label">Answer type *</label>
            <select
              id="f-type"
              value={fieldType}
              onChange={(e) => { setFieldType(e.target.value as FormFieldType); setOptionsError(null); }}
              className="svc-form__input"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>{FIELD_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="svc-form__field">
          <label htmlFor="f-help" className="svc-form__label">Help text</label>
          <input id="f-help" {...register('helpText')}
            className="svc-form__input" placeholder="Optional guidance shown under the question" />
        </div>

        {needsOptions && (
          <div className="svc-form__field">
            <label className="svc-form__label">Options *</label>
            <div className="builder-options">
              {options.map((opt, idx) => (
                <span key={opt} className="builder-option-chip">
                  {opt}
                  <button type="button" onClick={() => removeOption(idx)} aria-label={`Remove option ${opt}`}>×</button>
                </span>
              ))}
              {options.length === 0 && <p className="svc-form__hint">No options yet — add at least 2 below.</p>}
            </div>
            <div className="builder-option-add">
              <input
                value={optionDraft}
                onChange={(e) => setOptionDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                className="svc-form__input"
                placeholder="Type an option and press Enter"
              />
              <button type="button" onClick={addOption} className="btn btn--ghost btn--sm">Add</button>
            </div>
            {optionsError && <p className="svc-form__error">{optionsError}</p>}
          </div>
        )}

        <div className="svc-form__field svc-form__field--inline">
          <label className="svc-form__label">
            <input type="checkbox" {...register('required')} style={{ marginRight: 8 }} />
            Required — client can't submit the form without answering this
          </label>
        </div>

        <div className="svc-form__actions">
          <button type="button" onClick={onClose} className="btn btn--ghost">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn btn--primary">
            {isSubmitting ? <><Spinner size="sm" />Saving…</> : isEdit ? 'Update question' : 'Add question'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function FormBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const templateId = Number(id);
  const { data: template, isLoading } = useFormTemplate(templateId);
  const deleteFieldMutation = useDeleteFormField();
  const reorderMutation = useReorderFormFields();

  const [showDetails, setShowDetails] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [editField, setEditField] = useState<FormField | null>(null);
  const [deleteFieldTarget, setDeleteFieldTarget] = useState<FormField | null>(null);

  const fields = template?.fields ?? [];

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    const reordered = [...fields];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reorderMutation.mutate({ formTemplateId: templateId, fieldIds: reordered.map((f) => f.id) });
  }

  async function handleDeleteField() {
    if (!deleteFieldTarget) return;
    await deleteFieldMutation.mutateAsync({ formTemplateId: templateId, fieldId: deleteFieldTarget.id });
    setDeleteFieldTarget(null);
  }

  if (isLoading) {
    return <div className="svc-page__state"><Spinner size="lg" /></div>;
  }

  if (!template) {
    return (
      <div className="svc-page__state">
        Form not found. <Link to="/dashboard/forms">Back to consultation forms</Link>
      </div>
    );
  }

  return (
    <div className="svc-page">
      <div className="svc-page__header">
        <div>
          <Link to="/dashboard/forms" className="svc-form__hint" style={{ display: 'inline-block', marginBottom: 4 }}>
            ← Consultation forms
          </Link>
          <h1 className="svc-page__title">{template.name}</h1>
          <p className="svc-page__sub">
            {fields.length} question{fields.length !== 1 ? 's' : ''}
            {!template.isActive && ' · Inactive — not currently required by any category'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button type="button" onClick={() => setShowDetails(true)} className="btn btn--ghost">Edit details</button>
          <button type="button" onClick={() => setShowAddField(true)} className="btn btn--primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add question
          </button>
        </div>
      </div>

      {fields.length === 0 ? (
        <div className="svc-page__state">No questions yet. Add the first one above.</div>
      ) : (
        <div className="builder-field-list">
          {fields.map((f, idx) => (
            <div key={f.id} className="builder-field-row">
              <div className="builder-field-row__reorder">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move up">↑</button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === fields.length - 1} aria-label="Move down">↓</button>
              </div>
              <div className="builder-field-row__body">
                {f.section && <div className="builder-field-row__section">{f.section}</div>}
                <div className="builder-field-row__label">
                  {f.label}
                  {f.required && <span className="cat-badge" style={{ marginLeft: 8 }}>Required</span>}
                </div>
                {f.helpText && <div className="svc-table__desc">{f.helpText}</div>}
                <div className="svc-form__hint">
                  {FIELD_TYPE_LABELS[f.fieldType]}
                  {f.options && f.options.length > 0 ? ` — ${f.options.join(', ')}` : ''}
                </div>
              </div>
              <div className="svc-table__actions">
                <button type="button" onClick={() => setEditField(f)} className="btn btn--ghost btn--sm">Edit</button>
                <button type="button" onClick={() => setDeleteFieldTarget(f)} className="svc-table__del-btn" aria-label={`Delete question ${f.label}`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetails && (
        <TemplateDetailsModal
          templateId={template.id}
          name={template.name}
          description={template.description}
          isActive={template.isActive}
          onClose={() => setShowDetails(false)}
        />
      )}

      {(showAddField || editField) && (
        <FieldFormModal
          formTemplateId={templateId}
          field={editField ?? undefined}
          onClose={() => { setShowAddField(false); setEditField(null); }}
        />
      )}

      {deleteFieldTarget && (
        <ConfirmModal
          open
          title="Delete question"
          message={`Delete "${deleteFieldTarget.label}"? Past client submissions keep their answer; this only removes it from future forms.`}
          confirmLabel="Delete question"
          danger
          loading={deleteFieldMutation.isPending}
          onConfirm={handleDeleteField}
          onClose={() => setDeleteFieldTarget(null)}
        />
      )}
    </div>
  );
}
