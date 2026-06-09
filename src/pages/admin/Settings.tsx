import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SubmitHandler } from 'react-hook-form';

import apiClient from '../../utils/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { PageSpinner } from '../../components/ui/Spinner';

import { createPromoCodeSchema, type CreatePromoCodeFormValues } from '../../validators/promocodeValidator';
import { toast } from '../../store/uiStore';
import { getErrorMessage } from '../../utils/apiClient';

import { formatGHS } from '../../utils/formatCurrency';

type SettingsSectionProps = {
  title: string;
  children: React.ReactNode;
};

type CreatePromoCodeFormInput = Omit<CreatePromoCodeFormValues, 'isActive'> & { isActive?: boolean };

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-display)',
          fontSize: '1.05rem',
          fontWeight: 600,
          color: 'var(--espresso)',
        }}
      >
        {title}
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

export function Settings() {
  const qc = useQueryClient();
  const [promoOpen, setPromoOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  // ── Promo codes ──
  const { data: promos = [], isLoading: promosLoading } = useQuery({
    queryKey: ['promocodes'],
    queryFn: async () => {
      const { data } = await apiClient.get('/promocodes');
      return data.data ?? data;
    },
  });

  const createPromoMutation = useMutation({
    mutationFn: async (payload: CreatePromoCodeFormValues) => {
      const { data } = await apiClient.post('/promocodes', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promocodes'] });
      toast.success('Promo code created');
      setPromoOpen(false);
      resetPromo();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deletePromoMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/promocodes/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promocodes'] });
      toast.success('Promo code deleted');
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const {
    register: registerPromo,
    handleSubmit: handlePromoSubmit,
    reset: resetPromo,
    formState: { errors: promoErrors, isSubmitting: promoSubmitting },
  } = useForm<CreatePromoCodeFormValues>({ resolver: zodResolver(createPromoCodeSchema) });

  const onCreatePromo: SubmitHandler<CreatePromoCodeFormValues> = (values) => {
    createPromoMutation.mutate(values);
  };

  return (
    <>
      {/* Main layout */}
      <div className="settings-page animate-fade-up">
        {/* Header */}
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Configure business settings for Locs Allure</p>
        </div>

        {/* Promo Codes Section */}
        <SettingsSection title="Promo Codes">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setPromoOpen(true)}>
              New Promo Code
            </Button>
          </div>
          {promosLoading ? (
            <PageSpinner message="Loading…" />
          ) : (
            <table className="promo-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {promos.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '28px 0', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      No promo codes yet
                    </td>
                  </tr>
                ) : (
                  promos.map((p: CreatePromoCodeFormValues & { id: number }) => (
  <tr key={p.id}>
    <td>
      <span className="promo-code">{p.code}</span>
      {p.description && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.description}</div>
      )}
    </td>
    <td>
      {p.type === 'PERCENTAGE'
        ? `${p.discount}% off`
        : `${formatGHS(p.discount)} off`}
    </td>
    <td>{p.validUntil.split('T')[0]}</td>
    <td>
      <Badge variant={p.isActive ? 'green' : 'muted'} size="sm">
        {p.isActive ? 'Active' : 'Inactive'}
      </Badge>
    </td>
    <td>
      <Button
        variant="ghost"
        size="sm"
        icon={<Trash2 size={13} />}
        onClick={() => setDeleteTarget(p.id)}
      />
    </td>
  </tr>
))
                )}  
              </tbody>
            </table>
          )}
        </SettingsSection>

        {/* Notification Preferences Section */}
        <SettingsSection title="Notification Preferences">
          {[
            {
              label: 'Appointment reminders',
              sub: 'Send SMS/email reminders before appointments',
              key: 'reminders',
            },
            {
              label: 'Booking confirmations',
              sub: 'Notify clients when their booking is confirmed',
              key: 'confirmations',
            },
            {
              label: 'Cancellation alerts',
              sub: 'Alert admin when an appointment is cancelled',
              key: 'cancellations',
            },
          ].map(({ label, sub, key }) => (
            <NotificationToggle key={key} label={label} sub={sub} />
          ))}
        </SettingsSection>

        {/* Business Information Section */}
        <SettingsSection title="Business Information">
          <div className="form-fields">
            <div className="form-row">
              <Input label="Business name" defaultValue="Locs Allure" />
              <Input label="Phone" type="tel" defaultValue="+233 20 869 0943" />
            </div>
            <Input label="Address" defaultValue="Madina Estates, Accra, Ghana" />
            <Input label="Email" type="email" defaultValue="hello@locsallure.com" />
            <Button icon={<Save size={14} />}>Save Changes</Button>
          </div>
        </SettingsSection>
      </div>

      {/* Create Promo Code Modal */}
      <Modal
        open={promoOpen}
        onClose={() => {
          setPromoOpen(false);
          resetPromo();
        }}
        title="Create Promo Code"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setPromoOpen(false); resetPromo(); }}>
              Cancel
            </Button>
            <Button form="promo-form" type="submit" loading={promoSubmitting}>
              Create Code
            </Button>
          </>
        }
      >
<form
  id="promo-form"
  onSubmit={handlePromoSubmit((values) => {
    createPromoMutation.mutate(values);
  })}
  noValidate
>


          <div className="form-fields">
            <Input
              label="Code"
              placeholder="WELCOME20"
              error={promoErrors.code?.message}
              {...registerPromo('code')}
            />
            <Input
              label="Description (optional)"
              placeholder="New client welcome discount"
              {...registerPromo('description')}
            />
            <div className="form-row">
              <Input
                label="Discount value"
                type="number"
                step="0.01"
                placeholder="20"
                error={promoErrors.discount?.message}
                {...registerPromo('discount', { valueAsNumber: true })}
              />
              <div>
                <label className="select-label">Type</label>
                <select className="form-select" {...registerPromo('type')}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (GHS)</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <Input
                label="Valid from"
                type="date"
                error={promoErrors.validFrom?.message}
                {...registerPromo('validFrom')}
              />
              <Input
                label="Valid until"
                type="date"
                error={promoErrors.validUntil?.message}
                {...registerPromo('validUntil')}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Promo Code Confirmation Modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deletePromoMutation.mutate(deleteTarget)}
        title="Delete Promo Code"
        message="This promo code will be permanently deleted and can no longer be used."
        confirmLabel="Delete"
        danger
        loading={deletePromoMutation.isPending}
      />
    </>
  );
}

function NotificationToggle({ label, sub }: { label: string; sub?: string }) {
  const [enabled, setEnabled] = useState(true);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={enabled} onChange={() => setEnabled((s) => !s)} />
      </label>
    </div>
  );
}m