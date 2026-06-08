import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormValues } from '../../validators/authValidator';
import { login } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/apiClient';

export function LoginPage() {
  const { login: authLogin } = useAuth();
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
      const res = await login(values);
      if (!res.token) throw new Error('No token received');
      authLogin(res.token);

      // Decode role from JWT payload
      const decoded = JSON.parse(atob(res.token.split('.')[1]));
      const dest =
        from ??
        (decoded.role === 'ADMIN'
          ? '/dashboard'
          : decoded.role === 'STAFF'
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
        .auth-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--cream);
        }
        @media (max-width: 768px) {
          .auth-page { grid-template-columns: 1fr; }
          .auth-hero  { display: none; }
        }

        /* Hero */
        .auth-hero {
          background: var(--espresso);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 48px;
          position: relative;
          overflow: hidden;
        }
        .auth-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 70%, rgba(201,168,76,0.15) 0%, transparent 65%),
                      radial-gradient(ellipse at 80% 20%, rgba(201,168,76,0.08) 0%, transparent 50%);
        }
        .auth-hero-content { position: relative; z-index: 1; text-align: center; }
        .auth-hero-mark {
          width: 72px; height: 72px;
          background: var(--gold);
          border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display);
          font-size: 36px; font-weight: 700;
          color: var(--espresso);
          margin: 0 auto 28px;
          box-shadow: 0 8px 32px rgba(201,168,76,0.35);
        }
        .auth-hero-title {
          font-family: var(--font-display);
          font-size: 2.4rem; font-weight: 600;
          color: var(--gold-light);
          margin-bottom: 12px; line-height: 1.15;
        }
        .auth-hero-sub {
          font-size: 14px; color: var(--sidebar-text);
          line-height: 1.7; max-width: 280px;
        }
        .auth-hero-quote {
          margin-top: 40px;
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.1rem;
          color: var(--gold-muted);
          line-height: 1.6;
          max-width: 300px;
        }

        /* Form */
        .auth-form-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 48px;
        }
        .auth-form-card {
          width: 100%;
          max-width: 380px;
          animation: fadeUp 0.4s ease both;
        }
        .auth-form-heading {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 600;
          color: var(--espresso);
          margin-bottom: 6px;
        }
        .auth-form-sub {
          font-size: 13.5px;
          color: var(--text-muted);
          margin-bottom: 32px;
        }
        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .auth-server-error {
          padding: 12px 14px;
          background: #FEE2E2;
          border: 1px solid #FECACA;
          border-radius: var(--radius-md);
          font-size: 13px;
          color: #991B1B;
          margin-bottom: 4px;
        }

        /* Footer */
        .auth-form-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
        }
        .auth-form-footer a {
          color: var(--gold-muted);
          font-weight: 500;
        }
        .auth-form-footer a:hover {
          color: var(--gold);
        }

        /* Divider */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
          color: var(--text-muted);
          font-size: 12px;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        /* Password toggle */
        .password-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 14px;
          display: flex;
          align-items: center;
          padding: 2px;
          transition: color var(--transition);
        }
        .password-toggle:hover { color: var(--espresso); }
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
