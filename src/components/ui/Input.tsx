import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <>
      <style>{`
        /* Layout */
        .input-wrap { display: flex; flex-direction: column; gap: 6px; }
        .input-field-wrap { position: relative; display: flex; align-items: center; }

        /* Label */
        .input-label {
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        /* Field */
        .input-field {
          width: 100%;
          padding: 11px 14px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--espresso);
          background: var(--bg-card);
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          transition: all var(--transition);
          outline: none;
          appearance: none;
        }
        .input-field::placeholder { color: var(--text-muted); }
        .input-field:hover:not(:disabled) { border-color: var(--border-strong); }
        .input-field:focus {
          border-color: var(--gold);
          box-shadow: var(--shadow-gold);
        }
        .input-field:disabled {
          background: var(--cream-mid);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        /* Error states */
        .input-field.has-error { border-color: #C62828; }
        .input-field.has-error:focus { box-shadow: 0 0 0 3px rgba(198,40,40,0.15); }

        /* Icon spacing */
        .input-with-left  { padding-left: 40px; }
        .input-with-right { padding-right: 40px; }

        /* Icons */
        .input-icon {
          position: absolute;
          display: flex;
          align-items: center;
          pointer-events: none;
          color: var(--text-muted);
        }
        .input-icon-left  { left: 12px; }
        .input-icon-right { right: 12px; }

        /* Feedback */
        .input-error {
          font-size: 12px;
          color: #C62828;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .input-hint {
          font-size: 12px;
          color: var(--text-muted);
        }
      `}</style>

      <div className={`input-wrap ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
          </label>
        )}

        <div className="input-field-wrap">
          {leftIcon && (
            <span className="input-icon input-icon-left">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'input-field',
              error ? 'has-error' : '',
              leftIcon  ? 'input-with-left'  : '',
              rightIcon ? 'input-with-right' : '',
              className,
            ].join(' ')}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <span className="input-icon input-icon-right">{rightIcon}</span>
          )}
        </div>

        {error && (
          <span id={`${inputId}-error`} className="input-error" role="alert">
            ⚠ {error}
          </span>
        )}
        {hint && !error && (
          <span id={`${inputId}-hint`} className="input-hint">
            {hint}
          </span>
        )}
      </div>
    </>
  );
});

Input.displayName = 'Input';
