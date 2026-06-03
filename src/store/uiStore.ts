import { create } from 'zustand';

// ─── Toast ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms — default 4000
}

// ─── Store shape ──────────────────────────────────────────────────────────────

interface UiStore {
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Sidebar (admin layout)
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Global loading overlay
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUiStore = create<UiStore>((set, get) => ({
  // ── Toasts ──────────────────────────────────────────────────────────────────
  toasts: [],

  addToast: ({ type, message, duration = 4000 }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, message, duration }] }));

    // Auto-remove after duration
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  // ── Sidebar ─────────────────────────────────────────────────────────────────
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // ── Global loading ───────────────────────────────────────────────────────────
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));

// ─── Convenience helpers (call these from React Query mutation callbacks) ──────

export const toast = {
  success: (message: string) =>
    useUiStore.getState().addToast({ type: 'success', message }),
  error: (message: string) =>
    useUiStore.getState().addToast({ type: 'error', message }),
  info: (message: string) =>
    useUiStore.getState().addToast({ type: 'info', message }),
  warning: (message: string) =>
    useUiStore.getState().addToast({ type: 'warning', message }),
};