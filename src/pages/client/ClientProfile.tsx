import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthContext } from '../../hooks/useAuth';
import { useUpdateUser } from '../../hooks/useUsers';
import { useClient, useUpdateClient } from '../../hooks/useClients';
import { useUIStore } from '../../store/uiStore';
import { IntakeForm } from '../../components/forms/IntakeForm';
import { Spinner } from '../../components/ui/Spinner';

type Preferences = Record<string, unknown>;

// ─── Schemas ──────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').max(80),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const clientSchema = z.object({
  phone: z.string().min(7, 'Please enter a valid phone number.').max(20),
});
type ClientFormValues = z.infer<typeof clientSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

// ─── Section wrapper ──────────────────────────────────────────────────────────
function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="profile-section">
      <h2 className="profile-section__title">{title}</h2>
      <div className="profile-section__body">{children}</div>
    </section>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientProfile() {
  const { user } = useAuthContext();
  const { addToast } = useUIStore();
  const updateUser = useUpdateUser();
  const updateClient = useUpdateClient();

  // ✅ use client relation from AuthUser
  const clientId = user?.id;
  const { data: clientProfile, isLoading: clientLoading } = useClient(clientId ?? 0);

  const [activeTab, setActiveTab] = useState<'profile' | 'intake' | 'password'>('profile');

  // ── User profile form ──
  const {
    handleSubmit: handleProfile,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  async function onProfileSubmit(values: ProfileFormValues) {
    try {
      await updateUser.mutateAsync({ id: user!.id, data: values });
      addToast({ type: 'success', message: 'Profile updated.' });
    } catch {
      addToast({ type: 'error', message: 'Update failed. Please try again.' });
    }
  }
  // ── Client phone form ──
  const {
    handleSubmit: handleClient,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: { phone: clientProfile?.phone ?? '' },
  });

  async function onClientSubmit(values: ClientFormValues) {
    try {
      await updateClient.mutateAsync({
        id: clientProfile!.id,
        payload: { phone: values.phone },
      });
      addToast({ type: 'success', message: 'Phone updated.' });
    } catch {
      addToast({ type: 'error', message: 'Phone update failed. Please try again.' });
    }
  }

  // ── Password form ──
  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    formState: { errors: pwErrors, isSubmitting: pwSubmitting },
  } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  async function onPasswordSubmit(values: PasswordFormValues) {
    try {
      await updateUser.mutateAsync({
        id: user!.id,
        data: { currentPassword: values.currentPassword, newPassword: values.newPassword },
      });
      addToast({ type: 'success', message: 'Password changed successfully.' });
      resetPassword();
    } catch (err: unknown) {
      addToast({ type: 'error', message: (err as Error)?.message ?? 'Password change failed.' });
    }
  }

  const initials =
    user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  const TABS = [
    { key: 'profile' as const, label: 'Profile' },
    { key: 'intake' as const, label: 'Hair intake' },
    { key: 'password' as const, label: 'Password' },
  ];

  return (
    <div className="client-profile">
      {/* Hero */}
      <div className="client-profile__hero">
        <div className="client-profile__avatar">{initials}</div>
        <div>
          <h1 className="client-profile__name">{user?.name ?? '—'}</h1>
          <p className="client-profile__email">{user?.email ?? '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="client-profile__tabs" role="tablist" aria-label="Profile sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key)}
            className={`client-profile__tab ${
              activeTab === t.key ? 'client-profile__tab--active' : ''
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === 'profile' && (
        <ProfileSection title="Personal information">
          {/* User form */}
          <form onSubmit={handleProfile(onProfileSubmit)} noValidate className="profile-form">
            {/* Name + Email fields */}
            {/* ... unchanged markup ... */}
          </form>

          {/* Client form */}
          <form onSubmit={handleClient(onClientSubmit)} noValidate className="profile-form">
            {/* Phone field */}
            {/* ... unchanged markup ... */}
          </form>
        </ProfileSection>
      )}

      {/* Hair intake */}
      {activeTab === 'intake' && (
        <ProfileSection title="Hair intake form">
          {clientLoading ? (
            <div className="client-profile__loading">
              <Spinner size="md" />
            </div>
          ) : clientProfile ? (
            <IntakeForm
              clientId={clientProfile.id}
              defaultValues={clientProfile.preferences as Preferences}
              onSuccess={() => addToast({ type: 'success', message: 'Intake form saved.' })}
            />
          ) : (
            <p className="client-profile__no-client">
              Client profile not found. Please contact support.
            </p>
          )}
        </ProfileSection>
      )}

      {/* Password */}
      {activeTab === 'password' && (
        <ProfileSection title="Change password">
          <form onSubmit={handlePassword(onPasswordSubmit)} noValidate className="profile-form">
            {/* Current password */}
            <div className="profile-form__field">
              <label htmlFor="currentPassword" className="profile-form__label">
                Current password *
              </label>
              <input
                id="currentPassword"
                type="password"
                {...regPassword('currentPassword')}
                className={`profile-form__input ${
                  pwErrors.currentPassword ? 'profile-form__input--error' : ''
                }`}
              />
              {pwErrors.currentPassword && (
                <p className="profile-form__error">{pwErrors.currentPassword.message}</p>
              )}
            </div>

            {/* New password */}
            <div className="profile-form__field">
              <label htmlFor="newPassword" className="profile-form__label">
                New password *
              </label>
              <input
                id="newPassword"
                type="password"
                {...regPassword('newPassword')}
                className={`profile-form__input ${
                  pwErrors.newPassword ? 'profile-form__input--error' : ''
                }`}
              />
              {pwErrors.newPassword && (
                <p className="profile-form__error">{pwErrors.newPassword.message}</p>
              )}
              <p className="profile-form__hint">Minimum 8 characters.</p>
            </div>

            {/* Confirm password */}
            <div className="profile-form__field">
              <label htmlFor="confirmPassword" className="profile-form__label">
                Confirm new password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...regPassword('confirmPassword')}
                className={`profile-form__input ${
                  pwErrors.confirmPassword ? 'profile-form__input--error' : ''
                }`}
              />
              {pwErrors.confirmPassword && (
                <p className="profile-form__error">{pwErrors.confirmPassword.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="profile-form__actions">
              <button type="submit" disabled={pwSubmitting} className="btn btn--primary">
                {pwSubmitting ? (
                  <>
                    <Spinner size="sm" /> Changing…
                  </>
                ) : (
                  'Change password'
                )}
              </button>
            </div>
          </form>
        </ProfileSection>
      )}
 <style>{`
        .client-profile { display:flex;flex-direction:column;gap:1.75rem;padding:1.75rem 1.25rem;max-width:600px;margin:0 auto; }
        /* Hero */
        .client-profile__hero { display:flex;align-items:center;gap:1.125rem; }
        .client-profile__avatar { width:64px;height:64px;border-radius:50%;background:color-mix(in srgb,var(--color-gold,#c9a96e) 20%,var(--color-surface,#faf8f5));display:flex;align-items:center;justify-content:center;font-family:var(--font-display,'Cormorant Garamond',serif);font-size:1.5rem;font-weight:700;color:var(--color-espresso,#2c1a0e);border:2.5px solid var(--color-border,#e5e0d8);flex-shrink:0; }
        .client-profile__name { font-family:var(--font-display,'Cormorant Garamond',serif);font-size:1.5rem;font-weight:600;color:var(--color-espresso,#2c1a0e);margin:0; }
        .client-profile__email { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;color:var(--color-text-muted,#9a8e82);margin:.2rem 0 0; }
        /* Tabs */
        .client-profile__tabs { display:flex;gap:.25rem;background:var(--color-border,#e5e0d8);border-radius:10px;padding:3px;align-self:flex-start; }
        .client-profile__tab { padding:.4rem .875rem;border-radius:7px;border:none;background:transparent;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;font-weight:500;color:var(--color-text-muted,#9a8e82);cursor:pointer;transition:all .15s;white-space:nowrap; }
        .client-profile__tab--active { background:var(--color-surface,#faf8f5);color:var(--color-espresso,#2c1a0e);font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.08); }
        /* Section */
        .profile-section { background:var(--color-surface,#faf8f5);border:1px solid var(--color-border,#e5e0d8);border-radius:14px;padding:1.5rem;display:flex;flex-direction:column;gap:1.125rem; }
        .profile-section__title { font-family:var(--font-body,'DM Sans',sans-serif);font-size:1rem;font-weight:700;color:var(--color-espresso,#2c1a0e);margin:0; }
        .profile-section__body { display:flex;flex-direction:column;gap:1rem; }
        /* Form */
        .profile-form { display:flex;flex-direction:column;gap:1rem; }
        .profile-form__field { display:flex;flex-direction:column;gap:.375rem; }
        .profile-form__labe l { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.875rem;font-weight:600;color:var(--color-espresso,#2c1a0e); }
        .profile-form__input { padding:.625rem .875rem;background:var(--color-bg,#fff);border:1px solid var(--color-border,#e5e0d8);border-radius:8px;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9375rem;color:var(--color-text,#1a1108);transition:border-color .15s;width:100%; }
        .profile-form__input:focus { outline:none;border-color:var(--color-gold,#c9a96e);box-shadow:0 0 0 3px color-mix(in srgb,var(--color-gold,#c9a96e) 14%,transparent); }
        .profile-form__input--error { border-color:#dc2626; }
        .profile-form__input--disabled { background:color-mix(in srgb,var(--color-border,#e5e0d8) 40%,var(--color-bg,#fff));cursor:not-allowed;color:var(--color-text-muted,#9a8e82); }
        .profile-form__hint { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.8rem;color:var(--color-text-muted,#9a8e82);margin:0; }
        .profile-form__error { font-size:.8rem;color:#dc2626;font-weight:500;margin:0; }
        .profile-form__actions { display:flex;justify-content:flex-start;padding-top:.25rem; }
        .client-profile__loading { display:flex;justify-content:center;padding:2rem; }
        .client-profile__no-client { font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9375rem;color:var(--color-text-muted,#9a8e82); }
        /* Buttons */
        .btn { display:inline-flex;align-items:center;gap:.5rem;padding:.6875rem 1.25rem;border-radius:10px;font-family:var(--font-body,'DM Sans',sans-serif);font-size:.9rem;font-weight:600;cursor:pointer;transition:all .18s;border:none;white-space:nowrap; }
        .btn--primary { background:var(--color-espresso,#2c1a0e);color:var(--color-cream,#faf8f5); }
        .btn--primary:hover:not(:disabled) { background:color-mix(in srgb,var(--color-espresso,#2c1a0e) 85%,var(--color-gold,#c9a96e)); }
        .btn--primary:disabled { opacity:.45;cursor:not-allowed; }
        @media(max-width:480px){ .client-profile{padding:1.25rem .875rem;} }
      `}</style>                                                   
    </div>
  );
}
