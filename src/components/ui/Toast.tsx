import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUiStore, type Toast as ToastType } from '../../store/uiStore';
import { Icons } from "../ui/icon";



const ICONS: Record<ToastType['type'], React.ReactNode> = {
  success: <Icons.success size={16} />,
  error:   <Icons.error size={16} />,
  info:    <Icons.info size={16} />,
  warning: <Icons.warning size={16} />,
};

const COLORS: Record<ToastType['type'], string> = {
  success: '#065F46',
  error:   '#991B1B',
  info:    '#1E40AF',
  warning: '#92400E',
};

const BG_COLORS: Record<ToastType['type'], string> = {
  success: '#D1FAE5',
  error:   '#FEE2E2',
  info:    '#DBEAFE',
  warning: '#FEF3C7',
};

/* ─── Toast Item ───────────────────────────────────────────── */
function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useUiStore((s) => s.removeToast);
  const [closing, setClosing] = useState(false);

  // Auto-dismiss after 5s
  useEffect(() => {
    const timer = setTimeout(() => setClosing(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Remove after fade-out ends
  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => removeToast(toast.id), 300); // match fadeOut duration
    return () => clearTimeout(timer);
  }, [closing, removeToast, toast.id]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={closing ? 'toast-fade-out' : 'toast-fade-in'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 14px',
        background: BG_COLORS[toast.type],
        color: COLORS[toast.type],
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
        border: `1px solid ${COLORS[toast.type]}22`,
        minWidth: 260,
        maxWidth: 380,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 500,
        position: 'relative',
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: COLORS[toast.type],
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {ICONS[toast.type]}
      </span>
      <span style={{ flex: 1, lineHeight: 1.5 }}>{toast.message}</span>
      <button
        onClick={() => setClosing(true)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          opacity: 0.6,
          fontSize: 16,
          lineHeight: 1,
          padding: 2,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

/* ─── Toast Container ──────────────────────────────────────── */
export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);

  return createPortal(
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(40px); }
        }

        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column-reverse;
          gap: 8px;
          z-index: 9999;
          pointer-events: none;
        }
        .toast-container > * { pointer-events: auto; }

        .toast-fade-in {
          animation: slideInRight 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .toast-fade-out {
          animation: fadeOut 0.3s ease forwards;
        }
      `}</style>

      <div className="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </>,
    document.body,
  );
}
