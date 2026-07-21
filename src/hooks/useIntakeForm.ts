import { useMutation } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';

export interface IntakeFormPayload {
  clientId: number;
  hairType?: string;
  scalpCondition?: string;
  productPreference?: string;
  visitReason?: string;
  lastChemicalTreatment?: Date;
  currentProducts?: string;
  goals?: string;
  allergies?: string;
  notes?: string;
}

export interface IntakeFormResponse {
  id: number;
  clientId: number;
  createdAt: string;
}

export function useIntakeForm() {
  return useMutation<IntakeFormResponse, Error, IntakeFormPayload>({
    mutationFn: async (payload: IntakeFormPayload) => {
      const res = await apiClient.post<IntakeFormResponse>('/intake', payload);
      return res.data;
    },
  });
}