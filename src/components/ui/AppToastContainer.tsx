import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUiStore, type ToastType } from '../../store/uiStore';

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
  warning: AlertTriangle,
};

/**
 * Renders toasts pushed via useUiStore (the addToast / toast.success() /
 * toast.error() calls used throughout the app's mutation hooks).
 *
 * This replaces react-toastify's <ToastContainer /> in main.tsx — the app
 * uses its own Zustand-based toast store, not react-toastify, so mounting
 * react-toastify's container alone renders nothing. Mount THIS instead.
 * react-toastify can be removed as a dependency once this is confirmed
 * working, unless something else in the codebase still calls its toast().
 */
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