import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const styles: Record<Variant, { base: string }> = {
  primary:   { base: 'btn-primary' },
  secondary: { base: 'btn-secondary' },
  ghost:     { base: 'btn-ghost' },
  danger:    { base: 'btn-danger' },
  outline:   { base: 'btn-outline' },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  disabled,
  className = '',
  style,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <>
      <style>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-body);
          font-weight: 500;
          letter-spacing: 0.01em;
          cursor: pointer;
          transition: all var(--transition);
          white-space: nowrap;
          position: relative;
          overflow: hidden;
          text-decoration: none;
        }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Sizes */
        .btn-sm  { padding: 6px 14px;  font-size: 13px; }
        .btn-md  { padding: 10px 22px; font-size: 14px; }
        .btn-lg  { padding: 14px 30px; font-size: 16px; letter-spacing: 0.02em; }
        .btn-full { width: 100%; }

        /* Variants */
        .btn-primary {
          background: var(--gold);
          color: var(--espresso);
          box-shadow: 0 2px 8px rgba(201,168,76,0.30);
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--gold-muted);
          box-shadow: 0 4px 16px rgba(201,168,76,0.40);
          transform: translateY(-1px);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }

        .btn-secondary {
          background: var(--espresso);
          color: var(--gold-light);
        }
        .btn-secondary:hover:not(:disabled) {
          background: var(--espresso-soft);
          transform: translateY(-1px);
        }

        .btn-outline {
          background: transparent;
          color: var(--espresso);
          border: 1.5px solid var(--border-strong);
        }
        .btn-outline:hover:not(:disabled) {
          border-color: var(--gold);
          color: var(--gold-muted);
          background: rgba(201,168,76,0.05);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-secondary);
        }
        .btn-ghost:hover:not(:disabled) {
          background: var(--cream-mid);
          color: var(--espresso);
        }

        .btn-danger {
          background: #FEF2F2;
          color: #C62828;
          border: 1.5px solid #FECACA;
        }
        .btn-danger:hover:not(:disabled) {
          background: #C62828;
          color: #fff;
          border-color: #C62828;
        }

        /* Spinner */
        .btn-spinner {
          width: 14px; height: 14px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <button
        ref={ref}
        className={[
          'btn',
          styles[variant].base,
          `btn-${size}`,
          fullWidth ? 'btn-full' : '',
          className,
        ].join(' ')}
        disabled={isDisabled}
        style={style}
        {...props}
      >
        {loading && <span className="btn-spinner" aria-hidden="true" />}
        {!loading && icon && iconPosition === 'left' && icon}
        {children}
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    </>
  );
});

Button.displayName = 'Button';
