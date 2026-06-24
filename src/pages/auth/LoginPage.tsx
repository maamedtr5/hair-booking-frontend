import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '../../validators/authValidator';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/apiClient';

export function LoginPage() {
  const { login } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError('');
    try {
      
        const user = (await login(values)) as { role?: string } | null;
      const dest =
        from ??
        (user?.role === 'ADMIN'
          ? '/dashboard'
          : user?.role === 'STAFF'
          ? '/staff/schedule'
          : '/my/bookings');

      navigate(dest, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
       <>
      <style>{`
        /* Layout */
        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cream);
          padding: 40px 24px;
        }

        /* Card */
        .register-card {
          width: 100%;
          max-width: 460px;
          animation: fadeUp 0.4s ease both;
        }

        /* Logo */
        .register-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
          text-decoration: none;
        }
        .register-logo-mark {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: var(--espresso);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          color: var(--gold);
        }
        .register-logo-name {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--espresso);
        }

        /* Headings */
        .register-title {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 600;
          color: var(--espresso);
          margin-bottom: 6px;
        }
        .register-sub {
          font-size: 13.5px;
          color: var(--text-muted);
          margin-bottom: 28px;
        }

        /* Form */
        .register-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .register-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .server-error {
          padding: 12px 14px;
          background: #FEE2E2;
          border: 1px solid #FECACA;
          border-radius: var(--radius-md);
          font-size: 13px;
          color: #991B1B;
        }

        /* Footer */
        .register-footer {
          margin-top: 20px;
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
        }
        .register-footer a {
          color: var(--gold-muted);
          font-weight: 500;
        }
        .register-terms {
          margin-top: 12px;
          font-size: 11.5px;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.6;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .register-row { grid-template-columns: 1fr; }
        }
      `}</style>

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
    </>
  );
}

