import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as paymentsApi from '../api/payments';
import { useAuthContext } from './useAuthcontext';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';


function useRequireStaffRole() {
  const { user } = useAuthContext();
  const allowed = user?.role === 'ADMIN' || user?.role === 'STAFF';
  return { allowed, role: user?.role };
}

export function useMarkPaymentSuccess() {
  const qc = useQueryClient();
  const { allowed } = useRequireStaffRole();

  return useMutation({
    mutationFn: (id: number) => {
      if (!allowed) {
        return Promise.reject(
          new Error('useMarkPaymentSuccess is restricted to ADMIN/STAFF users.'),
        );
      }
      return paymentsApi.markPaymentSuccess(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Payment marked as successful');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useMarkPaymentFailed() {
  const qc = useQueryClient();
  const { allowed } = useRequireStaffRole();

  return useMutation({
    mutationFn: (id: number) => {
      if (!allowed) {
        return Promise.reject(
          new Error('useMarkPaymentFailed is restricted to ADMIN/STAFF users.'),
        );
      }
      return paymentsApi.markPaymentFailed(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast.error('Payment marked as failed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}