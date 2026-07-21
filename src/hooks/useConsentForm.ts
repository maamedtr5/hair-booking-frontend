import { useMutation } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';

export interface ConsentFormPayload {
  clientId: number;
  consentGiven: boolean;
  signature?: string;
}

export interface ConsentFormResponse {
  id: number;
  clientId: number;
  consentGiven: boolean;
  signature?: string;
  date: string;
}

export function useConsentForm() {
  return useMutation({
    mutationFn: async (payload: ConsentFormPayload) => {
      const res = await apiClient.post<ConsentFormResponse>('/consent', payload);
      return res.data;
    },
  });
}