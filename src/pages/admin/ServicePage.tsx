import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '../../hooks/useServices';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useUiStore } from '../../store/uiStore';
import type { Service } from '../../types';
import { serviceSchema } from '../../validators/serviceValidator';
import type { ServiceFormValues } from '../../validators/serviceValidator';

// NOTE: Service has no 'category' field in the database schema.
// The form and table have been updated to remove category entirely.

function ServiceFormModal({ service, onClose }: { service?: Service; onClose: () => void }) {
  const { addToast } = useUiStore();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const isEdit = !!service;

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ServiceFormValues>({
      // Cast resolves the input/output type mismatch from z.boolean().default(true)
      resolver: zodResolver(serviceSchema) as Resolver<ServiceFormValues>,
      defaultValues: service
        ? {
            name:        service.name,
            description: service.description ?? '',
            price:       service.price,
            duration:    service.duration,
            isActive:    service.isActive,
          }
        : { isActive: true },
    });

  async function onSubmit(values: ServiceFormValues) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: service!.id, payload: values });
        addToast({ type: 'success', message: 'Service updated.' });
      } else {
        await createMutation.mutateAsync(values);
        addToast({ type: 'success', message: 'Service created.' });
      }
      onClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to save service.' });
    }
  }

  return (
    <Modal open title={isEdit ? 'Edit service' : 'New service'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="svc-form">
        <div className="svc-form__field">
          <label htmlFor="name" className="svc-form__label">Service name *</label>
          <input id="name" {...register('name')}
            className={`svc-form__input ${errors.name ? 'svc-form__input--error' : ''}`}
            placeholder="e.g. Box Braids" />
          {errors.name && <p className="svc-form__error">{errors.name.message}</p>}
        </div>

        <div className="svc-form__row">
          <div className="svc-form__field">
            <label htmlFor="price" className="svc-form__label">Price (GH₵) *</label>
            <input id="price" type="number" step="0.01" min="1"
              {...register('price', { valueAsNumber: true })}
              className={`svc-form__input ${errors.price ? 'svc-form__input--error' : ''}`}
              placeholder="150" />
            {errors.price && <p className="svc-form__error">{errors.price.message}</p>}
          </div>
          <div className="svc-form__field">
            <label htmlFor="duration" className="svc-form__label">Duration (mins) *</label>
            <input id="duration" type="number" min="15" step="15"
              {...register('duration', { valueAsNumber: true })}
              className={`svc-form__input ${errors.duration ? 'svc-form__input--error' : ''}`}
              placeholder="180" />
            {errors.duration && <p className="svc-form__error">{errors.duration.message}</p>}
          </div>
        </div>

        <div className="svc-form__field">
          <label htmlFor="description" className="svc-form__label">Description</label>
          <textarea id="description" {...register('description')} rows={3}
            className="svc-form__textarea" placeholder="Brief description shown to clients…" />
          {errors.description && <p className="svc-form__error">{errors.description.message}</p>}
        </div>

        <div className="svc-form__field svc-form__field--inline">
          <label className="svc-form__label">
            <input type="checkbox" {...register('isActive')} style={{ marginRight: 8 }} />
            Active (visible to clients for booking)
          </label>
        </div>

        <div className="svc-form__actions">
          <button type="button" onClick={onClose} className="btn btn--ghost">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn btn--primary">
            {isSubmitting ? <><Spinner size="sm" />Saving…</> : isEdit ? 'Update service' : 'Create service'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ServicesPage() {
  const { addToast } = useUiStore();
  const { data: services, isLoading } = useServices();
  const deleteMutation = useDeleteService();
  const pagination = usePagination(services ?? [], 15);

  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  function formatGHS(n: number) {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(n);
  }
  function formatDuration(mins: number) {
    const h = Math.floor(mins / 60); const m = mins % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      addToast({ type: 'success', message: 'Service deleted.' });
    } catch {
      addToast({ type: 'error', message: 'Delete failed.' });
    }
    setDeleteTarget(null);
  }

  return (
    <div className="svc-page">
      <div className="svc-page__header">
        <div>
          <h1 className="svc-page__title">Services</h1>
          <p className="svc-page__sub">{(services ?? []).length} service{(services ?? []).length !== 1 ? 's' : ''}</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn btn--primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add service
        </button>
      </div>

      {isLoading ? (
        <div className="svc-page__state"><Spinner size="lg" /></div>
      ) : (
        <div className="svc-page__table-wrap">
          <table className="svc-table">
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">Price</th>
                <th scope="col">Duration</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {(services ?? []).length === 0 ? (
                <tr><td colSpan={5} className="svc-table__empty">No services yet. Add your first service.</td></tr>
              ) : pagination.pageItems.map((s: Service) => (
                <tr key={s.id} className="svc-table__row">
                  <td>
                    <div className="svc-table__name">{s.name}</div>
                    {s.description && <div className="svc-table__desc">{s.description}</div>}
                  </td>
                  <td className="svc-table__price">{formatGHS(s.price)}</td>
                  <td>{formatDuration(s.duration)}</td>
                  <td>
                    <span className={`svc-table__status ${s.isActive ? 'svc-table__status--active' : 'svc-table__status--inactive'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="svc-table__actions">
                      <button type="button" onClick={() => setEditTarget(s)} className="btn btn--ghost btn--sm">Edit</button>
                      <button type="button" onClick={() => setDeleteTarget(s.id)} className="svc-table__del-btn" aria-label={`Delete ${s.name}`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
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

      {!isLoading && (services ?? []).length > 0 && (
        <Pagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          onPageChange={pagination.setPage}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageSizeChange={pagination.setPageSize}
          pageSizeOptions={[15, 30, 60]}
        />
      )}

      {(showForm || editTarget) && (
        <ServiceFormModal service={editTarget ?? undefined} onClose={() => { setShowForm(false); setEditTarget(null); }} />
      )}

      {deleteTarget && (
        <ConfirmModal open title="Delete service"
          message="Existing appointments using this service will not be affected, but new bookings won't be possible."
          confirmLabel="Delete service" danger loading={deleteMutation.isPending}
          onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}
 
    </div>
  );
}