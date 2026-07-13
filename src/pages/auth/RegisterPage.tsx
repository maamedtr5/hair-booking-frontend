import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormValues } from '../../validators/authValidator';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/apiClient';

export function RegisterPage() {
  const { register } = useAuth(); // ✅ use context register directly
  const navigate = useNavigate();
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
    
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
        role: 'CLIENT',
      });

      navigate('/my/bookings', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
         <>
       

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
