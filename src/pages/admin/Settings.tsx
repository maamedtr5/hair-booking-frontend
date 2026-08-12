 import React, { useState } from 'react';
import { Save, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageSpinner } from '../../components/ui/Spinner';

import { toast } from '../../store/uiStore';
import {
  useBusinessHours, useUpdateBusinessHours,
  usePaymentPolicy, useUpdatePaymentPolicy,
  useSalonLocation, useUpdateSalonLocation,
  useBusinessInfo, useUpdateBusinessInfo,
} from '../../hooks/useSettings';
import type { BusinessHoursConfig, DayHours, PaymentPolicy, SalonLocation, BusinessInfo } from '../../types/models';

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

function SalonLocationSection() {
  const { data, isLoading } = useSalonLocation();
  const updateMutation = useUpdateSalonLocation();
  const [draft, setDraft] = useState<SalonLocation | null>(null);

  const working = draft ?? data ?? null;

  async function handleSave() {
    if (!working) return;
    if (!working.address.trim()) {
      toast.error('Address is required — it powers the map and directions on the public site');
      return;
    }
    try {
      await updateMutation.mutateAsync(working);
      toast.success('Location updated');
    } catch {
      toast.error('Could not save location');
    }
  }

  if (isLoading || !working) return <PageSpinner message="Loading…" />;

  const hasCoords = working.latitude !== null && working.longitude !== null;

  return (
    <div className="form-fields">
      <p className="settings-help-text">
        Powers the "Getting Here" section on the public site — the map, the directions button, and your own notes
        on how clients should get here (which trotro routes to take, which to avoid, landmarks to watch for).
      </p>

      <Input
        label="Address"
        placeholder="e.g. Madina Estates, near the Magistrate Court, Accra"
        value={working.address}
        onChange={(e) => setDraft({ ...working, address: e.target.value })}
      />

      <div className="form-row">
        <Input
          label="Latitude (optional)"
          type="number"
          step="any"
          placeholder="e.g. 5.6837"
          value={working.latitude ?? ''}
          onChange={(e) => {
            const v = e.target.value === '' ? null : Number(e.target.value);
            setDraft({ ...working, latitude: v, longitude: v === null ? null : working.longitude });
          }}
        />
        <Input
          label="Longitude (optional)"
          type="number"
          step="any"
          placeholder="e.g. -0.1657"
          value={working.longitude ?? ''}
          onChange={(e) => {
            const v = e.target.value === '' ? null : Number(e.target.value);
            setDraft({ ...working, longitude: v, latitude: v === null ? null : working.latitude });
          }}
        />
      </div>
      <p className="settings-help-text">
        {hasCoords
          ? 'Coordinates set — the map and directions will pin this exact spot.'
          : "Optional, but recommended: without coordinates, the map falls back to searching the address text above, which is less precise. Find yours by right-clicking your location in Google Maps and copying the two numbers it shows."}
      </p>

      <div>
        <label className="form-label" style={{ display: 'block', marginBottom: 6 }}>
          Getting-here notes (optional)
        </label>
        <textarea
          className="form-textarea"
          rows={5}
          placeholder={"e.g.\nFrom Circle: board a Madina trotro, get off at Madina Zongo Junction, we're a 5 min walk from there.\nFrom the Airport area: a taxi or Bolt is more reliable than trotro for this route."}
          value={working.gettingHereNotes}
          onChange={(e) => setDraft({ ...working, gettingHereNotes: e.target.value })}
        />
        <p className="settings-help-text">
          One tip per line. This is the one place trotro-specific guidance should come from — write what you'd
          actually tell a client, including routes you'd steer them away from.
        </p>
      </div>

      <Button icon={<Save size={14} />} onClick={handleSave} loading={updateMutation.isPending}>
        Save Location
      </Button>
    </div>
  );
}

function BusinessInfoSection() {
  const { data, isLoading } = useBusinessInfo();
  const updateMutation = useUpdateBusinessInfo();
  const [draft, setDraft] = useState<BusinessInfo | null>(null);

  const working = draft ?? data ?? null;

  async function handleSave() {
    if (!working) return;
    if (!working.name.trim()) {
      toast.error('Business name is required');
      return;
    }
    if (working.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(working.email)) {
      toast.error('Enter a valid email address');
      return;
    }
    try {
      await updateMutation.mutateAsync(working);
      toast.success('Business info updated');
    } catch {
      toast.error('Could not save business info');
    }
  }

  if (isLoading || !working) return <PageSpinner message="Loading…" />;

  return (
    <div className="form-fields">
      <p className="settings-help-text">
        Business name is used as the sender name on emails clients receive from Locs Allure.
      </p>
      <div className="form-row">
        <Input
          label="Business name"
          value={working.name}
          onChange={(e) => setDraft({ ...working, name: e.target.value })}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="e.g. +233 20 869 0943"
          value={working.phone}
          onChange={(e) => setDraft({ ...working, phone: e.target.value })}
        />
      </div>
      <Input
        label="Email"
        type="email"
        placeholder="e.g. hello@locsallure.com"
        value={working.email}
        onChange={(e) => setDraft({ ...working, email: e.target.value })}
      />
      <Button icon={<Save size={14} />} onClick={handleSave} loading={updateMutation.isPending}>
        Save Changes
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

      {/* Location & Directions — powers the public "Getting Here" section */}
      <SettingsSection title="Location & Directions">
        <SalonLocationSection />
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

      {/* Business Information — name is used as the outgoing-email sender
          name (see emailService.js). Phone/email aren't consumed
          anywhere else yet, but are now real, saved settings rather than
          a static mock. */}
      <SettingsSection title="Business Information">
        <BusinessInfoSection />
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
