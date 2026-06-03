import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as paymentsApi from '../api/payments';
import type { InitPaymentPayload } from '../types/models';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';

/**
 * Initialise a Paystack payment.
 * On success, the component should redirect to authorizationUrl.
 */
export function useInitializePayment() {
  return useMutation({
    mutationFn: (payload: InitPaymentPayload) =>
      paymentsApi.initializePayment(payload),
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useMarkPaymentSuccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentsApi.markPaymentSuccess(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Payment confirmed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useMarkPaymentFailed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentsApi.markPaymentFailed(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast.error('Payment failed — please try again');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}