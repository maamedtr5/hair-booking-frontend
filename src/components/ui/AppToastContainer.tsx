import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUiStore, type ToastType } from '../../store/uiStore';

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
};

export function AppToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => {
        const Icon = ICONS[t.type];
        return (
          <div key={t.id} className={`toast toast--${t.type}`} role="status">
            <Icon size={18} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
            <span>{t.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => removeToast(t.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}