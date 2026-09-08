import apiClient from '../utils/apiClient';
import type { Payment, InitPaymentPayload, ApiResponse } from '../types/models';

interface InitPaymentResponse {
  payment: Payment;
  authorizationUrl: string | null; // Paystack redirect URL, or null if no payment was needed
  isDeposit: boolean;
}


export async function initializePayment(
  payload: InitPaymentPayload,
): Promise<InitPaymentResponse> {
  const { data } = await apiClient.post<ApiResponse<{ payment: Payment; checkoutUrl: string | null; isDeposit: boolean }>>(
    '/payments/init',
    payload,
  );
  const result = data.data!;
  return { payment: result.payment, authorizationUrl: result.checkoutUrl, isDeposit: result.isDeposit };
}

/** GET /payments/quote/:bookingId — what will this booking actually cost right now? */
export async function getPaymentQuote(bookingId: number): Promise<{
  fullPrice: number;
  amountDue: number;
  isDeposit: boolean;
}> {
  const { data } = await apiClient.get<ApiResponse<{ fullPrice: number; amountDue: number; isDeposit: boolean }>>(
    `/payments/quote/${bookingId}`,
  );
  return data.data!;
}

/** POST /payments/manual — staff/admin logs a payment collected in person (cash or MoMo) */
export async function recordManualPayment(payload: {
  bookingId: number;
  amount: number;
  method: 'CASH' | 'MOBILE_MONEY';
}): Promise<Payment> {
  const { data } = await apiClient.post<ApiResponse<Payment>>('/payments/manual', payload);
  return data.data!;
}

/** PUT /payments/:id/success — mark payment as SUCCESS */
export async function markPaymentSuccess(id: number): Promise<Payment> {
  const { data } = await apiClient.put<ApiResponse<Payment>>(
    `/payments/${id}/success`,
  );
  return data.data!;
}

/** PUT /payments/:id/failed — mark payment as FAILED */
export async function markPaymentFailed(id: number): Promise<Payment> {
  const { data } = await apiClient.put<ApiResponse<Payment>>(
    `/payments/${id}/failed`,
  );
  return data.data!;
}
