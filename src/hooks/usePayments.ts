import { useMutation, useQuery } from '@tanstack/react-query';
import * as paymentsApi from '../api/payments';
import type { InitPaymentPayload } from '../types/models';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';

/**
 * Initialise a Paystack payment for the current client's own booking.
 * On success, redirect the browser to authorizationUrl (see BookingPage).
 *
 * This is the ONLY payment mutation available to the client portal.
 * Payment confirmation is never decided here — the backend Paystack
 * webhook is the sole source of truth for payment status. After
 * redirecting to Paystack, poll the booking via useBooking(id) (see
 * ConfirmationPage) to read the real, backend-confirmed payment status.
 *
 * useMarkPaymentSuccess / useMarkPaymentFailed have been moved to
 * hooks/admin/usePaymentAdmin.ts — those endpoints require ADMIN or
 * STAFF on the backend and must never be reachable from client-facing
 * code. Do not re-add them here.
 */
export function useInitializePayment() {
  return useMutation({
    mutationFn: (payload: InitPaymentPayload) =>
      paymentsApi.initializePayment(payload),
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

/** What will this booking actually cost right now? (full price / deposit / nothing) */
export function usePaymentQuote(bookingId: number | null) {
  return useQuery({
    queryKey: ['paymentQuote', bookingId],
    queryFn: () => paymentsApi.getPaymentQuote(bookingId!),
    enabled: !!bookingId,
  });
}

/** Imperative version for use inside an async handler (e.g. right after booking creation) */
export function useFetchPaymentQuote() {
  return useMutation({
    mutationFn: (bookingId: number) => paymentsApi.getPaymentQuote(bookingId),
  });
}