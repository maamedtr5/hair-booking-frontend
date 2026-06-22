import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

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
      const res = await axios.post<ConsentFormResponse>('/consent', payload);
      return res.data;
    }
  });
}
