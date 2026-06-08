import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'gold' | 'espresso' | 'white' | 'muted';
}

const sizes: Record<'sm' | 'md' | 'lg', number> = { sm: 16, md: 28, lg: 44 };
const colors: Record<'gold' | 'espresso' | 'white' | 'muted', string> = {
  gold:     'var(--gold)',
  espresso: 'var(--espresso)',
  white:    '#ffffff',
  muted:    'var(--text-muted)',
};

export function Spinner({ size = 'md', color = 'gold' }: SpinnerProps) {
  const px = sizes[size];
  const c  = colors[color];

  return (
    <>
      <style>{`
        /* Animation */
        @keyframes spinner-rotate { to { transform: rotate(360deg); } }

        /* Base */
        .spinner {
          border-radius: 50%;
          animation: spinner-rotate 0.7s linear infinite;
          flex-shrink: 0;
        }
      `}</style>

      <span
        className="spinner"
        role="status"
        aria-label="Loading"
        style={{
          width: px,
          height: px,
          border: `${size === 'sm' ? 2 : size === 'md' ? 2.5 : 3}px solid`,
          borderColor: `${c}22 ${c}22 ${c}22 ${c}`,
        }}
      />
    </>
  );
}

/** Full-page centred loading state */
interface PageSpinnerProps {
  message?: string;
}

export function PageSpinner({ message }: PageSpinnerProps) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <Spinner size="lg" />
      {message && (
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            letterSpacing: '0.02em',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
