import React, { useState } from 'react';
import { Save, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';

import { toast } from '../../store/uiStore';
import { useBusinessHours, useUpdateBusinessHours, usePaymentPolicy, useUpdatePaymentPolicy } from '../../hooks/useSettings';
import type { BusinessHoursConfig, DayHours, PaymentPolicy } from '../../types/models';

type SettingsSectionProps = { title: string; children: React.ReactNode };

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--espresso)' }}>
        {title}
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

const DAY_LABELS: Array<{ key: keyof BusinessHoursConfig; label: string }> = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

function BusinessHoursSection() {
  const { data, isLoading } = useBusinessHours();
  const updateMutation = useUpdateBusinessHours();
  const [draft, setDraft] = useState<BusinessHoursConfig | null>(null);

  const working = draft ?? data ?? null;

  function setDay(key: keyof BusinessHoursConfig, patch: Partial<DayHours>) {
    if (!working) return;
    setDraft({ ...working, [key]: { ...working[key], ...patch } });
  }

  async function handleSave() {
    if (!working) return;
    try {
      await updateMutation.mutateAsync(working);
      toast.success('Business hours updated');
    } catch {
      toast.error('Could not save business hours');
    }
  }

  if (isLoading || !working) return <PageSpinner message="Loading…" />;

  return (
    <div className="hours-editor">
      {DAY_LABELS.map(({ key, label }) => {
        const day = working[key];
        return (
          <div key={key} className="hours-row">
            <label className="hours-row__day">
              <input
                type="checkbox"
                checked={day.open}
                onChange={(e) => setDay(key, { open: e.target.checked })}
              />
              {label}
            </label>
            {day.open ? (
              <div className="hours-row__times">
                <input
                  type="time"
                  className="hours-row__time-input"
                  value={day.start}
                  onChange={(e) => setDay(key, { start: e.target.value })}
                />
                <span className="hours-row__to">to</span>
                <input
                  type="time"
                  className="hours-row__time-input"
                  value={day.end}
                  onChange={(e) => setDay(key, { end: e.target.value })}
                />
              </div>
            ) : (
              <span className="hours-row__closed">Closed</span>
            )}
          </div>
        );
      })}
      <Button icon={<Save size={14} />} onClick={handleSave} loading={updateMutation.isPending} style={{ marginTop: 16 }}>
        Save Business Hours
      </Button>
    </div>
  );
}

function PaymentPolicySection() {
  const { data, isLoading } = usePaymentPolicy();
  const updateMutation = useUpdatePaymentPolicy();
  const [draft, setDraft] = useState<PaymentPolicy | null>(null);

  const working = draft ?? data ?? null;

  async function handleSave() {
    if (!working) return;
    if (working.requireDeposit && (!working.depositAmount || working.depositAmount <= 0)) {
      toast.error('Deposit amount must be greater than 0');
      return;
    }
    try {
      await updateMutation.mutateAsync(working);
      toast.success('Payment policy updated');
    } catch {
      toast.error('Could not save payment policy');
    }
  }

  if (isLoading || !working) return <PageSpinner message="Loading…" />;

  return (
    <div className="form-fields">
      <p className="settings-help-text">
        By default, clients confirm their booking with no payment through the platform — the full amount is
        collected in person (cash or MoMo, directly between client and staff/admin). Turn this on to require a
        deposit at booking time to secure the slot.
      </p>

      <label className="form-field--inline">
        <input
          type="checkbox"
          checked={working.requireDeposit}
          onChange={(e) => setDraft({ ...working, requireDeposit: e.target.checked })}
        />
        Require a deposit at booking time
      </label>

      {working.requireDeposit && (
        <div className="form-row">
          <div>
            <label className="select-label">Deposit type</label>
            <select
              className="form-select"
              value={working.depositType}
              onChange={(e) => setDraft({ ...working, depositType: e.target.value as PaymentPolicy['depositType'] })}
            >
              <option value="PERCENTAGE">Percentage of service price</option>
              <option value="FIXED">Fixed amount (GHS)</option>
            </select>
          </div>
          <Input
            label={working.depositType === 'PERCENTAGE' ? 'Deposit (%)' : 'Deposit (GHS)'}
            type="number"
            min={1}
            max={working.depositType === 'PERCENTAGE' ? 100 : undefined}
            value={working.depositAmount}
            onChange={(e) => setDraft({ ...working, depositAmount: Number(e.target.value) })}
          />
        </div>
      )}

      <Button icon={<Save size={14} />} onClick={handleSave} loading={updateMutation.isPending}>
        Save Payment Policy
      </Button>
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();

  return (
    <div className="settings-page animate-fade-up">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Configure business settings for Locs Allure</p>
      </div>

      {/* Business Hours */}
      <SettingsSection title="Business Hours">
        <BusinessHoursSection />
      </SettingsSection>

      {/* Payment Policy */}
      <SettingsSection title="Payment Policy">
        <PaymentPolicySection />
      </SettingsSection>

      {/* Promo Codes — managed on its own dedicated page now, rather than
          duplicating the same create/edit/delete logic in two places. */}
      <SettingsSection title="Promo Codes">
        <p className="settings-help-text" style={{ marginBottom: 12 }}>
          Promo codes are managed on their own page.
        </p>
        <Button variant="ghost" icon={<ExternalLink size={14} />} onClick={() => navigate('/dashboard/promocodes')}>
          Go to Promo Codes
        </Button>
      </SettingsSection>

      {/* Notification Preferences */}
      <SettingsSection title="Notification Preferences">
        {[
          { label: 'Appointment reminders',   sub: 'Send SMS/email reminders before appointments',   key: 'reminders' },
          { label: 'Booking confirmations',   sub: 'Notify clients when their booking is confirmed', key: 'confirmations' },
          { label: 'Cancellation alerts',     sub: 'Alert admin when an appointment is cancelled',   key: 'cancellations' },
        ].map(({ label, sub, key }) => (
          <NotificationToggle key={key} label={label} sub={sub} />
        ))}
      </SettingsSection>

      {/* Business Information */}
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
}
