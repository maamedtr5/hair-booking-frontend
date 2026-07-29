import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormValues } from '../../validators/authValidator';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/apiClient';
import type { Role } from '../../types/models';

// Same maps as LoginPage
const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/dashboard',
  STAFF: '/staff/dashboard',
  CLIENT: '/my/bookings',
};

const ROLE_ALLOWED_PREFIXES: Record<Role, string[]> = {
  ADMIN: ['/dashboard'],
  STAFF: ['/staff'],
  CLIENT: ['/book', '/my', '/booking'],
};

function resolveRedirect(role: Role, from?: string): string {
  const home = ROLE_HOME[role];
  if (!from) return home;
  const allowed = ROLE_ALLOWED_PREFIXES[role] ?? [];
  const isAllowed = allowed.some((p) => from === p || from.startsWith(`${p}/`));
  return isAllowed ? from : home;
}

function PasswordToggleButton({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="password-toggle"
      onClick={onToggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
    >
      {shown ? '👁' : '👁‍🗨'}
    </button>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError('');
    try {
      const user = await register({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
        role: 'CLIENT', // always forced
      });

      const dest = resolveRedirect(user.role as Role, from);
      navigate(dest, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    // Reuses the exact same .auth-page / .auth-hero / .auth-form-panel
    // layout as LoginPage so the two pages are visually consistent
    // instead of drifting into two different, half-styled designs.
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-content">
          <div className="auth-hero-mark">L</div>
          <h1 className="auth-hero-title">Locs Allure</h1>
          <p className="auth-hero-sub">
            Premium hair salon in the heart of Madina Estates, Accra.
            Book, manage, and experience luxury hair care.
          </p>
          <p className="auth-hero-quote">
            "Where every strand tells a story of beauty and culture."
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-card">
          <h2 className="auth-form-heading">Create your account</h2>
          <p className="auth-form-sub">Join Locs Allure and book your first appointment</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-fields">
              {serverError && (
                <div className="auth-server-error" role="alert">
                  {serverError}
                </div>
              )}

              <div className="auth-fields-row">
                <Input
                  label="Full name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  error={errors.name?.message}
                  {...formRegister('name')}
                />
                <Input
                  label="Phone (optional)"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+233 XX XXX XXXX"
                  error={errors.phone?.message}
                  {...formRegister('phone')}
                />
              </div>

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...formRegister('email')}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                error={errors.password?.message}
                hint="Must include an uppercase letter, a lowercase letter, a number, and a symbol"
                rightIcon={<PasswordToggleButton shown={showPassword} onToggle={() => setShowPassword((p) => !p)} />}
                {...formRegister('password')}
              />

              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                error={errors.confirmPassword?.message}
                {...formRegister('confirmPassword')}
              />

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={isSubmitting}
                style={{ marginTop: 4 }}
              >
                Create Account
              </Button>
            </div>
          </form>

          <div className="auth-divider">or</div>

          <div className="auth-form-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
          <p className="auth-form-terms">
            By creating an account you agree to Locs Allure's terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
