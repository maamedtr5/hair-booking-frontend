import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { useCreateService, useUpdateService, useDeleteService } from '../../hooks/useServices';
import {
  useAdminServiceCategories,
  useCreateServiceCategory,
  useUpdateServiceCategory,
  useDeleteServiceCategory,
} from '../../hooks/useServiceCategories';
import { useFormTemplates } from '../../hooks/useFormTemplates';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useUiStore } from '../../store/uiStore';
import type { Service, ServiceCategory } from '../../types';
import { serviceSchema } from '../../validators/serviceValidator';
import type { ServiceFormValues } from '../../validators/serviceValidator';
import { serviceCategorySchema } from '../../validators/serviceCategoryValidator';
import type { ServiceCategoryFormValues } from '../../validators/serviceCategoryValidator';
import { getErrorMessage } from '../../utils/apiClient';

function formatGHS(n: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 0 }).format(n);
}
function formatDuration(mins: number) {
  const h = Math.floor(mins / 60); const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

// ============================================================
// Service (sub-option) form — belongs to exactly one category
// ============================================================
function ServiceFormModal({
  service,
  defaultCategoryId,
  categories,
  onClose,
}: {
  service?: Service;
  defaultCategoryId?: number;
  categories: ServiceCategory[];
  onClose: () => void;
}) {
  const { addToast } = useUiStore();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const isEdit = !!service;

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ServiceFormValues>({
      resolver: zodResolver(serviceSchema) as Resolver<ServiceFormValues>,
      defaultValues: service
        ? {
            categoryId:  service.categoryId,
            name:        service.name,
            description: service.description ?? '',
            price:       service.price,
            duration:    service.duration,
            isActive:    service.isActive,
            displayOrder: service.displayOrder,
          }
        : { categoryId: defaultCategoryId, isActive: true, displayOrder: 0 },
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
          <label htmlFor="categoryId" className="svc-form__label">Category *</label>
          <select id="categoryId" {...register('categoryId', { valueAsNumber: true })}
            className={`svc-form__input ${errors.categoryId ? 'svc-form__input--error' : ''}`}>
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="svc-form__error">{errors.categoryId.message}</p>}
        </div>

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

        <div className="svc-form__row">
          <div className="svc-form__field">
            <label htmlFor="displayOrder" className="svc-form__label">Display order</label>
            <input id="displayOrder" type="number" min="0"
              {...register('displayOrder', { valueAsNumber: true })}
              className="svc-form__input" placeholder="0" />
          </div>
          <div className="svc-form__field svc-form__field--inline" style={{ alignSelf: 'end' }}>
            <label className="svc-form__label">
              <input type="checkbox" {...register('isActive')} style={{ marginRight: 8 }} />
              Active (visible to clients for booking)
            </label>
          </div>
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

// ============================================================
// Category form — name/description/order/active + optional
// required consultation form (assigned from existing templates,
// built separately on the Consultation Forms page)
// ============================================================
function CategoryFormModal({ category, onClose }: { category?: ServiceCategory; onClose: () => void }) {
  const { addToast } = useUiStore();
  const { data: templates } = useFormTemplates();
  const createMutation = useCreateServiceCategory();
  const updateMutation = useUpdateServiceCategory();
  const isEdit = !!category;

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ServiceCategoryFormValues>({
      resolver: zodResolver(serviceCategorySchema) as Resolver<ServiceCategoryFormValues>,
      defaultValues: category
        ? {
            name:           category.name,
            description:    category.description ?? '',
            displayOrder:   category.displayOrder,
            isActive:       category.isActive,
            formTemplateId: category.formTemplateId ?? null,
          }
        : { isActive: true, displayOrder: 0, formTemplateId: null },
    });

  async function onSubmit(values: ServiceCategoryFormValues) {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: category!.id, payload: values });
        addToast({ type: 'success', message: 'Category updated.' });
      } else {
        await createMutation.mutateAsync(values);
        addToast({ type: 'success', message: 'Category created.' });
      }
      onClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to save category.' });
    }
  }

  // A category assigned to a since-deactivated template should still show
  // its current choice in the dropdown, so admin can see and deliberately
  // change it rather than have it silently vanish from the list.
  const templateOptions = (templates ?? []).filter(
    (t) => t.isActive || t.id === category?.formTemplateId,
  );

  return (
    <Modal open title={isEdit ? 'Edit category' : 'New category'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="svc-form">
        <div className="svc-form__field">
          <label htmlFor="cat-name" className="svc-form__label">Category name *</label>
          <input id="cat-name" {...register('name')}
            className={`svc-form__input ${errors.name ? 'svc-form__input--error' : ''}`}
            placeholder="e.g. Starter Locs" />
          {errors.name && <p className="svc-form__error">{errors.name.message}</p>}
        </div>

        <div className="svc-form__field">
          <label htmlFor="cat-desc" className="svc-form__label">Description</label>
          <textarea id="cat-desc" {...register('description')} rows={2}
            className="svc-form__textarea" placeholder="Shown to clients above this category's services…" />
          {errors.description && <p className="svc-form__error">{errors.description.message}</p>}
        </div>

        <div className="svc-form__field">
          <label htmlFor="cat-form" className="svc-form__label">Required consultation form</label>
          <select id="cat-form" {...register('formTemplateId', {
            setValueAs: (v) => (v === '' ? null : Number(v)),
          })}
            className="svc-form__input" defaultValue={category?.formTemplateId ?? ''}>
            <option value="">None — book directly</option>
            {templateOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <p className="svc-form__hint">
            Clients must complete this form before booking any service in this category.{' '}
            <Link to="/dashboard/forms">Build or edit a form →</Link>
          </p>
        </div>

        <div className="svc-form__row">
          <div className="svc-form__field">
            <label htmlFor="cat-order" className="svc-form__label">Display order</label>
            <input id="cat-order" type="number" min="0"
              {...register('displayOrder', { valueAsNumber: true })}
              className="svc-form__input" placeholder="0" />
          </div>
          <div className="svc-form__field svc-form__field--inline" style={{ alignSelf: 'end' }}>
            <label className="svc-form__label">
              <input type="checkbox" {...register('isActive')} style={{ marginRight: 8 }} />
              Active (visible to clients)
            </label>
          </div>
        </div>

        <div className="svc-form__actions">
          <button type="button" onClick={onClose} className="btn btn--ghost">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn btn--primary">
            {isSubmitting ? <><Spinner size="sm" />Saving…</> : isEdit ? 'Update category' : 'Create category'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ServicesPage() {
  const { data: categories, isLoading } = useAdminServiceCategories();
  const deleteCategoryMutation = useDeleteServiceCategory();
  const deleteServiceMutation = useDeleteService();
  const { addToast } = useUiStore();

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editCategory, setEditCategory] = useState<ServiceCategory | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<ServiceCategory | null>(null);
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null);

  const [addServiceCategoryId, setAddServiceCategoryId] = useState<number | null>(null);
  const [editService, setEditService] = useState<Service | null>(null);
  const [deleteServiceTarget, setDeleteServiceTarget] = useState<Service | null>(null);

  async function handleDeleteCategory() {
    if (!deleteCategoryTarget) return;
    setCategoryDeleteError(null);
    try {
      await deleteCategoryMutation.mutateAsync(deleteCategoryTarget.id);
      setDeleteCategoryTarget(null);
    } catch (err) {
      // Server refuses (409) with a specific "still has N services" message
      // when the category isn't empty — surface that instead of a generic
      // failure so admin knows exactly what to do next.
      setCategoryDeleteError(getErrorMessage(err));
    }
  }

  async function handleDeleteService() {
    if (!deleteServiceTarget) return;
    try {
      await deleteServiceMutation.mutateAsync(deleteServiceTarget.id);
      addToast({ type: 'success', message: 'Service deleted.' });
    } catch {
      addToast({ type: 'error', message: 'Delete failed.' });
    }
    setDeleteServiceTarget(null);
  }

  const totalServices = (categories ?? []).reduce((sum, c) => sum + (c.services?.length ?? 0), 0);

  // Services still sitting in the catch-all "Other Services" bucket (where
  // every pre-existing service landed when categories were introduced)
  // don't get their own tab on the client booking page — the category
  // selector only shows tabs once there's more than one category with
  // services in it. Surface this here so it's obvious in the admin, not
  // just something you notice missing on the client site.
  const otherServicesCategory = (categories ?? []).find(
    (c) => c.name.trim().toLowerCase() === 'other services'
  );
  const uncategorizedCount = otherServicesCategory?.services?.length ?? 0;
  const bookableCategoryCount = (categories ?? []).filter((c) => (c.services?.length ?? 0) > 0).length;

  return (
    <div className="svc-page">
      <div className="svc-page__header">
        <div>
          <h1 className="svc-page__title">Services</h1>
          <p className="svc-page__sub">
            {totalServices} service{totalServices !== 1 ? 's' : ''} across {(categories ?? []).length} categor{(categories ?? []).length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link to="/dashboard/forms" className="btn btn--ghost">Consultation forms</Link>
          <button type="button" onClick={() => setShowCategoryForm(true)} className="btn btn--primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add category
          </button>
        </div>
      </div>

      {!isLoading && uncategorizedCount > 0 && bookableCategoryCount <= 1 && (
        <div className="svc-page__banner svc-page__banner--warn" role="status">
          <strong>{uncategorizedCount}</strong> service{uncategorizedCount !== 1 ? 's' : ''} still in{' '}
          <strong>Other Services</strong>. Clients won't see category tabs on the booking page until
          services are spread across more than one category — move these into the right category below.
        </div>
      )}

      {isLoading ? (
        <div className="svc-page__state"><Spinner size="lg" /></div>
      ) : (categories ?? []).length === 0 ? (
        <div className="svc-page__state">No categories yet. Add your first category to start adding services.</div>
      ) : (
        <div className="cat-list">
          {categories!.map((cat) => (
            <section key={cat.id} className="cat-section">
              <header className="cat-section__header">
                <div className="cat-section__heading">
                  <h2 className="cat-section__name">{cat.name}</h2>
                  {!cat.isActive && (
                    <span className="svc-table__status svc-table__status--inactive">Inactive</span>
                  )}
                  {cat.formTemplate && (
                    <span className="cat-badge" title="Required before booking any service in this category">
                      Requires: {cat.formTemplate.name}
                    </span>
                  )}
                </div>
                {cat.description && <p className="cat-section__desc">{cat.description}</p>}
                <div className="cat-section__actions">
                  <button type="button" onClick={() => setAddServiceCategoryId(cat.id)} className="btn btn--ghost btn--sm">
                    + Add service
                  </button>
                  <button type="button" onClick={() => setEditCategory(cat)} className="btn btn--ghost btn--sm">
                    Edit category
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteCategoryTarget(cat); setCategoryDeleteError(null); }}
                    className="svc-table__del-btn"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </header>

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
                    {(cat.services ?? []).length === 0 ? (
                      <tr><td colSpan={5} className="svc-table__empty">No services in this category yet.</td></tr>
                    ) : cat.services!.map((s) => (
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
                            <button type="button" onClick={() => setEditService(s)} className="btn btn--ghost btn--sm">Edit</button>
                            <button type="button" onClick={() => setDeleteServiceTarget(s)} className="svc-table__del-btn" aria-label={`Delete ${s.name}`}>
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
            </section>
          ))}
        </div>
      )}

      {(showCategoryForm || editCategory) && (
        <CategoryFormModal
          category={editCategory ?? undefined}
          onClose={() => { setShowCategoryForm(false); setEditCategory(null); }}
        />
      )}

      {deleteCategoryTarget && (
        <ConfirmModal
          open
          title="Delete category"
          message={categoryDeleteError ?? `Delete "${deleteCategoryTarget.name}"? This can't be undone.`}
          confirmLabel="Delete category"
          danger
          loading={deleteCategoryMutation.isPending}
          onConfirm={handleDeleteCategory}
          onClose={() => { setDeleteCategoryTarget(null); setCategoryDeleteError(null); }}
        />
      )}

      {(addServiceCategoryId !== null || editService) && (
        <ServiceFormModal
          service={editService ?? undefined}
          defaultCategoryId={editService ? undefined : addServiceCategoryId!}
          categories={categories ?? []}
          onClose={() => { setAddServiceCategoryId(null); setEditService(null); }}
        />
      )}

      {deleteServiceTarget && (
        <ConfirmModal
          open
          title="Delete service"
          message="Existing appointments using this service will not be affected, but new bookings won't be possible."
          confirmLabel="Delete service"
          danger
          loading={deleteServiceMutation.isPending}
          onConfirm={handleDeleteService}
          onClose={() => setDeleteServiceTarget(null)}
        />
      )}
    </div>
  );
}
