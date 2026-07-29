// pages/admin/Promocodes.tsx
import { useState } from 'react';
import {
  usePromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
} from '../../hooks/usePromocdes';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/ui/Pagination';
import { Spinner } from '../../components/ui/Spinner';
import { useUiStore } from '../../store/uiStore';
import type { Promocode, DiscountType } from '../../types/models';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDiscount(promo: Promocode) {
  return promo.type === 'PERCENTAGE' ? `${promo.discount}%` : `GH₵${promo.discount}`;
}

function isCurrentlyValid(promo: Promocode) {
  const now = new Date();
  return promo.isActive && now >= new Date(promo.validFrom) && now <= new Date(promo.validUntil);
}

interface PromoFormState {
  code: string;
  description: string;
  discount: string;
  type: DiscountType;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

function toFormState(promo?: Promocode): PromoFormState {
  return {
    code: promo?.code ?? '',
    description: promo?.description ?? '',
    discount: promo?.discount != null ? String(promo.discount) : '',
    type: promo?.type ?? 'PERCENTAGE',
    validFrom: promo?.validFrom ? promo.validFrom.slice(0, 10) : new Date().toISOString().slice(0, 10),
    validUntil: promo?.validUntil ? promo.validUntil.slice(0, 10) : '',
    isActive: promo?.isActive ?? true,
  };
}

function PromoFormModal({ promo, onClose }: { promo?: Promocode; onClose: () => void }) {
  const { addToast } = useUiStore();
  const createMutation = useCreatePromoCode();
  const updateMutation = useUpdatePromoCode();
  const isEdit = !!promo;

  const [form, setForm] = useState<PromoFormState>(toFormState(promo));
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  function set<K extends keyof PromoFormState>(key: K, value: PromoFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const discountNum = Number(form.discount);
    if (!form.code.trim()) return setError('Code is required.');
    if (!discountNum || discountNum <= 0) return setError('Discount must be a positive number.');
    if (form.type === 'PERCENTAGE' && discountNum > 100) return setError('Percentage discount cannot exceed 100.');
    if (!form.validFrom || !form.validUntil) return setError('Both start and end dates are required.');
    if (new Date(form.validUntil) < new Date(form.validFrom)) return setError('End date must be after start date.');

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      discount: discountNum,
      type: form.type,
      validFrom: new Date(form.validFrom).toISOString(),
      validUntil: new Date(form.validUntil).toISOString(),
      isActive: form.isActive,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: promo.id, payload });
        addToast({ type: 'success', message: 'Promo code updated.' });
      } else {
        await createMutation.mutateAsync(payload);
        addToast({ type: 'success', message: 'Promo code created.' });
      }
      onClose();
    } catch {
      setError('Could not save this promo code. The code may already be in use.');
    }
  }

  return (
    <Modal open title={isEdit ? 'Edit promo code' : 'New promo code'} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} noValidate className="promo-form">
        <div className="promo-form__field">
          <label htmlFor="code" className="promo-form__label">Code *</label>
          <input
            id="code"
            value={form.code}
            onChange={(e) => set('code', e.target.value)}
            className="promo-form__input"
            placeholder="e.g. LOCS20"
          />
        </div>

        <div className="promo-form__row">
          <div className="promo-form__field">
            <label htmlFor="type" className="promo-form__label">Discount type *</label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => set('type', e.target.value as DiscountType)}
              className="promo-form__select"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed amount (GH₵)</option>
            </select>
          </div>
          <div className="promo-form__field">
            <label htmlFor="discount" className="promo-form__label">
              Discount {form.type === 'PERCENTAGE' ? '(%)' : '(GH₵)'} *
            </label>
            <input
              id="discount"
              type="number"
              min="1"
              step={form.type === 'PERCENTAGE' ? '1' : '0.01'}
              value={form.discount}
              onChange={(e) => set('discount', e.target.value)}
              className="promo-form__input"
              placeholder={form.type === 'PERCENTAGE' ? '20' : '50'}
            />
          </div>
        </div>

        <div className="promo-form__row">
          <div className="promo-form__field">
            <label htmlFor="validFrom" className="promo-form__label">Valid from *</label>
            <input
              id="validFrom"
              type="date"
              value={form.validFrom}
              onChange={(e) => set('validFrom', e.target.value)}
              className="promo-form__input"
            />
          </div>
          <div className="promo-form__field">
            <label htmlFor="validUntil" className="promo-form__label">Valid until *</label>
            <input
              id="validUntil"
              type="date"
              value={form.validUntil}
              onChange={(e) => set('validUntil', e.target.value)}
              className="promo-form__input"
            />
          </div>
        </div>

        <div className="promo-form__field">
          <label htmlFor="description" className="promo-form__label">Description</label>
          <input
            id="description"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="promo-form__input"
            placeholder="Shown internally only"
          />
        </div>

        <div className="promo-form__field promo-form__field--inline">
          <label className="promo-form__label">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Active
          </label>
        </div>

        {error && <p className="promo-form__error">{error}</p>}

        <div className="promo-form__actions">
          <button type="button" onClick={onClose} className="btn btn--ghost">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn btn--primary">
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create promo code'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function PromocodesPage() {
  const { addToast } = useUiStore();
  const { data: promocodes, isLoading } = usePromoCodes();
  const deleteMutation = useDeletePromoCode();
  const pagination = usePagination(promocodes ?? [], 12);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Promocode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      addToast({ type: 'success', message: 'Promo code deleted.' });
    } catch {
      addToast({ type: 'error', message: 'Delete failed.' });
    }
    setDeleteTarget(null);
  }

  return (
    <div className="promo-page">
      <div className="promo-page__header">
        <div>
          <h1 className="promo-page__title">Promo codes</h1>
          <p className="promo-page__sub">{promocodes?.length ?? 0} code{promocodes?.length === 1 ? '' : 's'}</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)} className="btn btn--primary">
          New promo code
        </button>
      </div>

      {isLoading ? (
        <div className="promo-page__state"><Spinner size="lg" /></div>
      ) : (
        <div className="promo-page__grid">
          {(promocodes ?? []).length === 0 ? (
            <p className="promo-page__empty">No promo codes yet.</p>
          ) : pagination.pageItems.map((promo) => {
            const valid = isCurrentlyValid(promo);
            return (
              <div key={promo.id} className={`promo-card ${!promo.isActive ? 'promo-card--inactive' : ''}`}>
                <div className="promo-card__top">
                  <span className="promo-card__code">{promo.code}</span>
                  <span className={`promo-card__badge ${valid ? 'promo-card__badge--active' : ''}`}>
                    {valid ? 'Active' : promo.isActive ? 'Not in date range' : 'Inactive'}
                  </span>
                </div>
                <span className="promo-card__discount">{formatDiscount(promo)} off</span>
                {promo.description && <p className="promo-card__desc">{promo.description}</p>}
                <p className="promo-card__dates">
                  {formatDate(promo.validFrom)} – {formatDate(promo.validUntil)}
                </p>
                <div className="promo-card__actions">
                  <button type="button" onClick={() => setEditTarget(promo)} className="btn btn--ghost btn--sm">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(promo.id)}
                    className="btn btn--ghost btn--sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (promocodes ?? []).length > 0 && (
        <Pagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          onPageChange={pagination.setPage}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageSizeChange={pagination.setPageSize}
          pageSizeOptions={[12, 24, 48]}
        />
      )}

      {showForm && <PromoFormModal onClose={() => setShowForm(false)} />}
      {editTarget && <PromoFormModal promo={editTarget} onClose={() => setEditTarget(null)} />}

      {deleteTarget && (
        <ConfirmModal
          open
          title="Delete promo code"
          message="This will permanently remove this promo code. Any bookings that already used it are unaffected."
          confirmLabel="Delete"
          danger
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
