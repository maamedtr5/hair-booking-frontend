import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '../../validators/authValidator';
import { useAuth } from '../../hooks/useAuth';
import { OtpRequiredError } from '../../store/errors.ts';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/apiClient';
import { toast } from '../../store/uiStore';
import type { Role } from '../../types/models';

const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/dashboard',
  STAFF: '/staff/dashboard',
  CLIENT: '/my/bookings',
};

// Prefixes each role is actually allowed into — must mirror ProtectedRoute's
// route groups in main.tsx. Used to sanity-check `from` before honoring it,
// so we never bounce a user into a portal ProtectedRoute will just reject.
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

export function LoginPage() {
  const { login, verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  // Set only when the backend requires a second factor (ADMIN accounts).
  // Presence of otpToken is what switches the form into OTP-entry mode.
  const [otpToken, setOtpToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError('');
    try {
      const user = await login(values);
      const dest = resolveRedirect(user.role as Role, from);
      navigate(dest, { replace: true });
    } catch (err) {
      if (err instanceof OtpRequiredError) {
        setOtpToken(err.otpToken);
        return;
      }
      setServerError(getErrorMessage(err));
    }
  };

  const onSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSubmitting(true);
    try {
      const user = await verifyOtp(otpToken, otpCode);
      const dest = resolveRedirect(user.role as Role, from);
      navigate(dest, { replace: true });
    } catch (err) {
      setOtpError(getErrorMessage(err));
    } finally {
      setOtpSubmitting(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    setOtpError('');
    try {
      const freshToken = await resendOtp(otpToken);
      setOtpToken(freshToken);
      setOtpCode('');
      toast.success('A new code is on its way to your email.');
    } catch (err) {
      setOtpError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  if (otpToken) {
    return (
      <div className="auth-page">
        <div className="auth-hero">
          <div className="auth-hero-content">
            <div className="auth-hero-mark">L</div>
            <h1 className="auth-hero-title">Locs Allure</h1>
            <p className="auth-hero-sub">
              Premium hair salon in the heart of Madina Estates, Accra.
              Book, manage, and experience luxury hair care.
            </p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-card">
            <h2 className="auth-form-heading">Check your email</h2>
            <p className="auth-form-sub">
              Enter the 6-digit code we sent you. It expires in 5 minutes.
            </p>

            <form onSubmit={onSubmitOtp} noValidate>
              <div className="auth-fields">
                {otpError && (
                  <div className="auth-server-error" role="alert">
                    {otpError}
                  </div>
                )}

                <Input
                  label="Verification code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={otpSubmitting}
                  disabled={otpCode.length !== 6}
                  style={{ marginTop: 4 }}
                >
                  Verify & sign in
                </Button>
              </div>
            </form>

            <div className="auth-form-footer">
              Didn't get it?{' '}
              <button
                type="button"
                className="password-toggle"
                onClick={onResend}
                disabled={resending}
                style={{ textDecoration: 'underline', cursor: resending ? 'default' : 'pointer' }}
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Hero panel */}
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

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <h2 className="auth-form-heading">Welcome back</h2>
          <p className="auth-form-sub">Sign in to your account</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-fields">
              {serverError && (
                <div className="auth-server-error" role="alert">
                  {serverError}
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                rightIcon={
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁' : '👁‍🗨'}
                  </button>
                }
                {...register('password')}
              />

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={isSubmitting}
                style={{ marginTop: 4 }}
              >
                Sign In
              </Button>
            </div>
          </form>

          <div className="auth-divider">or</div>

          <div className="auth-form-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}