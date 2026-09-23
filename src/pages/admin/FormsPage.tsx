import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import {
  useFormTemplates,
  useCreateFormTemplate,
  useDeleteFormTemplate,
} from '../../hooks/useFormTemplates';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useUiStore } from '../../store/uiStore';
import type { FormTemplate } from '../../types';
import { formTemplateSchema } from '../../validators/formTemplateValidator';
import type { FormTemplateFormValues } from '../../validators/formTemplateValidator';

function NewFormModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const { addToast } = useUiStore();
  const createMutation = useCreateFormTemplate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormTemplateFormValues>({
      resolver: zodResolver(formTemplateSchema) as Resolver<FormTemplateFormValues>,
      defaultValues: { isActive: true },
    });

  async function onSubmit(values: FormTemplateFormValues) {
    try {
      const created = await createMutation.mutateAsync(values);
      onCreated(created.id);
    } catch {
      addToast({ type: 'error', message: 'Failed to create form.' });
    }
  }

  return (
    <Modal open title="New consultation form" onClose={onClose} size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="svc-form">
        <div className="svc-form__field">
          <label htmlFor="tpl-name" className="svc-form__label">Form name *</label>
          <input id="tpl-name" {...register('name')}
            className={`svc-form__input ${errors.name ? 'svc-form__input--error' : ''}`}
            placeholder="e.g. SCALP-FIRST™ New Loc Consultation" />
          {errors.name && <p className="svc-form__error">{errors.name.message}</p>}
        </div>

        <div className="svc-form__field">
          <label htmlFor="tpl-desc" className="svc-form__label">Description</label>
          <textarea id="tpl-desc" {...register('description')} rows={2}
            className="svc-form__textarea" placeholder="Shown to clients above the questions…" />
        </div>

        <div className="svc-form__actions">
          <button type="button" onClick={onClose} className="btn btn--ghost">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn btn--primary">
            {isSubmitting ? <><Spinner size="sm" />Creating…</> : 'Create & add questions'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function FormsPage() {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useFormTemplates();
  const deleteMutation = useDeleteFormTemplate();
  const { addToast } = useUiStore();

  const [showNew, setShowNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormTemplate | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch {
      addToast({ type: 'error', message: 'Delete failed.' });
    }
    setDeleteTarget(null);
  }

  return (
    <div className="svc-page">
      <div className="svc-page__header">
        <div>
          <h1 className="svc-page__title">Consultation forms</h1>
          <p className="svc-page__sub">
            Build the questions a client answers before booking a service category that requires one.
          </p>
        </div>
        <button type="button" onClick={() => setShowNew(true)} className="btn btn--primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New form
        </button>
      </div>

      {isLoading ? (
        <div className="svc-page__state"><Spinner size="lg" /></div>
      ) : (templates ?? []).length === 0 ? (
        <div className="svc-page__state">
          No consultation forms yet. Create one, then assign it to a service category from the Services page.
        </div>
      ) : (
        <div className="svc-page__table-wrap">
          <table className="svc-table">
            <thead>
              <tr>
                <th scope="col">Form</th>
                <th scope="col">Questions</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {templates!.map((t) => (
                <tr key={t.id} className="svc-table__row">
                  <td>
                    <div className="svc-table__name">{t.name}</div>
                    {t.description && <div className="svc-table__desc">{t.description}</div>}
                  </td>
                  <td>{t.fields?.length ?? 0}</td>
                  <td>
                    <span className={`svc-table__status ${t.isActive ? 'svc-table__status--active' : 'svc-table__status--inactive'}`}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="svc-table__actions">
                      <Link to={`/dashboard/forms/${t.id}`} className="btn btn--ghost btn--sm">Edit questions</Link>
                      <button type="button" onClick={() => setDeleteTarget(t)} className="svc-table__del-btn" aria-label={`Delete ${t.name}`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NewFormModal
          onClose={() => setShowNew(false)}
          onCreated={(id) => { setShowNew(false); navigate(`/dashboard/forms/${id}`); }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          open
          title="Delete consultation form"
          message={`Delete "${deleteTarget.name}"? Any category currently requiring it will stop requiring a form. Past client submissions are kept.`}
          confirmLabel="Delete form"
          danger
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
