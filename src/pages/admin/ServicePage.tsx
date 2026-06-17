// pages/admin/ServicesPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useServices, useCreateService, useUpdateService, useDeleteService } from '../../hooks/useServices';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { useUIStore } from '../../store/uiStore';
import type { Service } from '../../types';

const CATEGORIES = ['Braiding', 'Natural Hair', 'Weaving', 'Loc Services', 'Treatments', 'Other'];

const serviceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(80),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(1, 'Price must be at least GH₵1.').max(10000),
  duration: z.coerce.number().min(15, 'Minimum 15 minutes.').max(720, 'Maximum 12 hours.'),
  category: z.string().min(1, 'Please select a category.'),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

function ServiceFormModal({
  service,
  onClose,
}: {
  service?: Service;
  onClose: () => void;
}) {
  const { addToast } = useUIStore();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const isEdit = !!service;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service
      ? { name: service.name, description: service.description ?? '', price: service.price, duration: service.duration, category: service.category ?? '' }
      : { category: '' },
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
          <input id="name" {...register('name')} className={`svc-form__input ${errors.name ? 'svc-form__input--error' : ''}`} placeholder="e.g. Box Braids" />
          {errors.name && <p className="svc-form__error">{errors.name.message}</p>}
        </div>

        <div className="svc-form__field">
          <label htmlFor="category" className="svc-form__label">Category *</label>
          <select id="category" {...register('category')} className={`svc-form__select ${errors.category ? 'svc-form__input--error' : ''}`}>
            <option value="">Select category…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.category && <p className="svc-form__error">{errors.category.message}</p>}
        </div>

        <div className="svc-form__row">
          <div className="svc-form__field">
            <label htmlFor="price" className="svc-form__label">Price (GH₵) *</label>
            <input id="price" type="number" step="0.01" min="1" {...register('price')} className={`svc-form__input ${errors.price ? 'svc-form__input--error' : ''}`} placeholder="150" />
            {errors.price && <p className="svc-form__error">{errors.price.message}</p>}
          </div>
          <div className="svc-form__field">
            <label htmlFor="duration" className="svc-form__label">Duration (mins) *</label>
            <input id="duration" type="number" min="15" step="15" {...register('duration')} className={`svc-form__input ${errors.duration ? 'svc-form__input--error' : ''}`} placeholder="180" />
            {errors.duration && <p className="svc-form__error">{errors.duration.message}</p>}
          </div>
        </div>

        <div className="svc-form__field">
          <label htmlFor="description" className="svc-form__label">Description</label>
          <textarea id="description" {...register('description')} rows={3} className="svc-form__textarea" placeholder="Brief description shown to clients…" />
          {errors.description && <p className="svc-form__error">{errors.description.message}</p>}
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
  const { addToast } = useUIStore();
  const { data: services, isLoading } = useServices();
  const deleteMutation = useDeleteService();

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Duration</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {(services ?? []).length === 0 ? (
                <tr><td colSpan={5} className="svc-table__empty">No services yet. Add your first service.</td></tr>
              ) : (services ?? []).map((s: Service) => (
                <tr key={s.id} className="svc-table__row">
                  <td>
                    <div className="svc-table__name">{s.name}</div>
                    {s.description && <div className="svc-table__desc">{s.description}</div>}
                  </td>
                  <td>{s.category ? <Badge variant="muted" size="sm">{s.category}</Badge> : '—'}</td>
                  <td className="svc-table__price">{formatGHS(s.price)}</td>
                  <td>{formatDuration(s.duration)}</td>
                  <td>
                    <div className="svc-table__actions">
                      <button type="button" onClick={() => setEditTarget(s)} className="btn btn--ghost btn--sm">Edit</button>
                      <button type="button" onClick={() => setDeleteTarget(s.id)} className="svc-table__del-btn" aria-label={`Delete ${s.name}`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

{(showForm || editTarget) && (
  <ServiceFormModal
    service={editTarget ?? undefined}
    onClose={() => {
      setShowForm(false);
      setEditTarget(null);
    }}
  />
)}

{deleteTarget && (
  <ConfirmModal
    open
    title="Delete service"
    message="Existing appointments using this service will not be affected, but new bookings won't be possible."
    confirmLabel="Delete service"
    danger
    loading={deleteMutation.isPending}
    onConfirm={handleDelete}
    onClose={() => setDeleteTarget(null)}
  />
)}

    

      <style>{`
        .svc-page { display:flex;flex-direction:column;gap:1.5rem;padding:1.75rem 2rem;max-width:1100px;margin:0 auto; }
        .svc-page__header { display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem; }
        .svc-page__title { font-family:var(--font-display,'Cormorant Garamond',serif);font-size:1.75rem;font-weight:600;color:var(--color-espresso,#2c1a0e);margin:0; }
        .svc-page__sub { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;color:var(--color-text-muted,#9a8e82);margin:.25rem 0 0; }
        .svc-page__state { display:flex;justify-content:center;padding:4rem; }
        .svc-page__table-wrap { overflow-x:auto;border:1px solid var(--color-border,#e5e0d8);border-radius:14px; }
        .svc-table { width:100%;border-collapse:collapse;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9rem; }
        .svc-table thead { background:color-mix(in srgb,var(--color-border,#e5e0d8) 35%,transparent); }
        .svc-table th { padding:.75rem 1.25rem;text-align:left;font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--color-text-muted,#9a8e82);white-space:nowrap; }
        .svc-table__row { border-top:1px solid var(--color-border,#e5e0d8);transition:background .12s; }
        .svc-table__row:hover { background:color-mix(in srgb,var(--color-gold,#c9a96e) 4%,var(--color-surface,#faf8f5)); }
        .svc-table td { padding:1rem 1.25rem;color:var(--color-text,#1a1108);vertical-align:middle; }
        .svc-table__name { font-weight:600;color:var(--color-espresso,#2c1a0e); }
        .svc-table__desc { font-size:.8rem;color:var(--color-text-muted,#9a8e82);margin-top:.2rem;max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .svc-table__price { font-weight:700;color:var(--color-espresso,#2c1a0e); }
        .svc-table__empty { padding:3rem;text-align:center;color:var(--color-text-muted,#9a8e82); }
        .svc-table__actions { display:flex;align-items:center;gap:.5rem; }
        .svc-table__del-btn { width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;color:var(--color-text-muted,#9a8e82);cursor:pointer;border-radius:6px;transition:background .12s,color .12s; }
        .svc-table__del-btn:hover { background:color-mix(in srgb,#ef4444 15%,transparent);color:#dc2626; }
        /* Form */
        .svc-form { display:flex;flex-direction:column;gap:1rem; }
        .svc-form__row { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }
        .svc-form__field { display:flex;flex-direction:column;gap:.375rem; }
        .svc-form__label { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;font-weight:600;color:var(--color-espresso,#2c1a0e); }
        .svc-form__input,.svc-form__select,.svc-form__textarea { padding:.625rem .875rem;background:var(--color-surface,#faf8f5);border:1px solid var(--color-border,#e5e0d8);border-radius:8px;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9375rem;color:var(--color-text,#1a1108);transition:border-color .15s;width:100%; }
        .svc-form__select { appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='%239a8e82' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .875rem center;padding-right:2.25rem;cursor:pointer; }
        .svc-form__textarea { resize:vertical;min-height:80px;line-height:1.55; }
        .svc-form__input:focus,.svc-form__select:focus,.svc-form__textarea:focus { outline:none;border-color:var(--color-gold,#c9a96e); }
        .svc-form__input--error { border-color:#dc2626; }
        .svc-form__error { font-size:.8rem;color:#dc2626;font-weight:500;margin:0; }
        .svc-form__actions { display:flex;justify-content:flex-end;gap:.75rem;padding-top:.5rem; }
        .btn { display:inline-flex;align-items:center;gap:.5rem;padding:.6875rem 1.25rem;border-radius:10px;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9rem;font-weight:600;cursor:pointer;transition:all .18s;border:none;white-space:nowrap; }
        .btn--primary { background:var(--color-espresso,#2c1a0e);color:var(--color-cream,#faf8f5); }
        .btn--primary:hover:not(:disabled) { background:color-mix(in srgb,var(--color-espresso,#2c1a0e) 85%,var(--color-gold,#c9a96e)); }
        .btn--primary:disabled { opacity:.5;cursor:not-allowed; }
        .btn--ghost { background:transparent;border:1px solid var(--color-border,#e5e0d8);color:var(--color-espresso,#2c1a0e); }
        .btn--ghost:hover { background:var(--color-border,#e5e0d8); }
        .btn--sm { padding:.4375rem .875rem;font-size:.8125rem; }
        .sr-only { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0; }
        @media(max-width:780px){ .svc-page{padding:1.25rem 1rem;} .svc-form__row{grid-template-columns:1fr;} }
      `}</style>
    </div>
  );
}