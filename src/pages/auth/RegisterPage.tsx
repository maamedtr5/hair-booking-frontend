import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormValues } from '../../validators/authValidator';
import { register as registerUser } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/apiClient';

export function RegisterPage() {
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError('');
    try {
      const res = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
        role: 'CLIENT',
      });
      if (!res.token) throw new Error('Registration failed. Please try again.');
      authLogin(res.token);
      navigate('/my/bookings', { replace: true });
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

      <div className="register-page">
        <div className="register-card">
          {/* Logo */}
          <Link to="/" className="register-logo">
            <div className="register-logo-mark">L</div>
            <span className="register-logo-name">Locs Allure</span>
          </Link>

          {/* Heading */}
          <h1 className="register-title">Create account</h1>
          <p className="register-sub">
            Join Locs Allure and book your first appointment
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="register-fields">
              {serverError && (
                <div className="server-error" role="alert">
                  {serverError}
                </div>
              )}

              <div className="register-row">
                <Input
                  label="Full name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ama Mensah"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Phone (optional)"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+233 XX XXX XXXX"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

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
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                error={errors.password?.message}
                hint="Must contain an uppercase letter and a number"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: 14,
                    }}
                    aria-label={showPassword ? 'Hide' : 'Show'}
                  >
                    {showPassword ? '👁' : '👁‍🗨'}
                  </button>
                }
                {...register('password')}
              />

              <Input
                label="Confirm password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
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

          {/* Footer */}
          <div className="register-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
          <p className="register-terms">
            By creating an account you agree to Locs Allure's terms of service and privacy policy.
          </p>
        </div>
      </div>
    </>
  );
}
