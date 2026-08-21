import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useAuthContext } from '../../hooks/useAuth';
import { useUpdateUser } from '../../hooks/useUsers';
import { useClientByUserId, useUpdateClient } from '../../hooks/useClients';
import { useUIStore } from '../../store/uiStore';
import { IntakeForm } from '../../components/forms/IntakeForm';
import { Spinner } from '../../components/ui/Spinner';
import { getErrorMessage } from '../../utils/apiClient';

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

  const { data: clientProfile, isLoading: clientLoading } = useClientByUserId(user?.id);

  const [activeTab, setActiveTab] = useState<'profile' | 'intake' | 'password'>('profile');

  // ── User profile form ──
  const {
    register: registerProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
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
    register: registerClient,
    handleSubmit: handleClient,
    formState: { errors: clientErrors, isSubmitting: clientSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    values: { phone: clientProfile?.phone ?? '' }, // reactive — updates once clientProfile loads
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
      addToast({ type: 'error', message: getErrorMessage(err) });
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
          <form onSubmit={handleProfile(onProfileSubmit)} noValidate className="profile-form">
            <div className="profile-form__field">
              <label htmlFor="name" className="profile-form__label">Full name</label>
              <input
                id="name"
                type="text"
                {...registerProfile('name')}
                className={`profile-form__input ${profileErrors.name ? 'profile-form__input--error' : ''}`}
              />
              {profileErrors.name && <p className="profile-form__error">{profileErrors.name.message}</p>}
            </div>

            <div className="profile-form__field">
              <label className="profile-form__label">Email address</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="profile-form__input profile-form__input--disabled"
              />
              <p className="profile-form__hint">Contact support to change your email.</p>
            </div>

            <div className="profile-form__actions">
              <button type="submit" disabled={profileSubmitting} className="btn btn--primary">
                {profileSubmitting ? (
                  <>
                    <Spinner size="sm" /> Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </form>

          <form onSubmit={handleClient(onClientSubmit)} noValidate className="profile-form">
            <div className="profile-form__field">
              <label htmlFor="phone" className="profile-form__label">Phone number</label>
              <input
                id="phone"
                type="tel"
                {...registerClient('phone')}
                placeholder="+233 123 456 789"
                className={`profile-form__input ${clientErrors.phone ? 'profile-form__input--error' : ''}`}
              />
              {clientErrors.phone && <p className="profile-form__error">{clientErrors.phone.message}</p>}
            </div>

            <div className="profile-form__actions">
              <button type="submit" disabled={clientSubmitting || clientLoading} className="btn btn--primary">
                {clientSubmitting ? (
                  <>
                    <Spinner size="sm" /> Saving…
                  </>
                ) : (
                  'Update phone'
                )}
              </button>
            </div>
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
              defaultValues={undefined}
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
    </div>
  );
}