import apiClient from '../utils/apiClient';
import type { Payment, InitPaymentPayload, ApiResponse } from '../types/models';

interface InitPaymentResponse {
  success: boolean;
  payment: Payment;
  authorizationUrl: string; // Paystack redirect URL
  reference: string;
}

/** POST /payments/init — initialises Paystack transaction, returns redirect URL */
export async function initializePayment(
  payload: InitPaymentPayload,
): Promise<InitPaymentResponse> {
  const { data } = await apiClient.post<InitPaymentResponse>('/payments/init', payload);
  return data;
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