// hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {  settingsApi } from '../api/settings';
import type { BusinessHoursConfig, PaymentPolicy, SalonLocation, BusinessInfo } from '../types/models';

const KEY = 'settings';

export function useSettings() {
  return useQuery({ queryKey: [KEY], queryFn:  settingsApi.getAll });
}

export function useSettingByKey(key: string) {
  return useQuery({ queryKey: [KEY, key], queryFn: () =>  settingsApi.getByKey(key), enabled: !!key });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { value: string } }) =>  settingsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCreateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn:  settingsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
// Business hours — admin-configurable open days/hours.
export function useBusinessHours() {
  return useQuery({ queryKey: [KEY, 'businessHours'], queryFn: settingsApi.getBusinessHours });
}

export function useUpdateBusinessHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: BusinessHoursConfig) => settingsApi.updateBusinessHours(config),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'businessHours'] }),
  });
}

// Payment policy — deposit requirement at booking time.
export function usePaymentPolicy() {
  return useQuery({ queryKey: [KEY, 'paymentPolicy'], queryFn: settingsApi.getPaymentPolicy });
}

export function useUpdatePaymentPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policy: PaymentPolicy) => settingsApi.updatePaymentPolicy(policy),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'paymentPolicy'] }),
  });
}

// Salon location — address, optional map coordinates, getting-here notes.
export function useSalonLocation() {
  return useQuery({ queryKey: [KEY, 'salonLocation'], queryFn: settingsApi.getSalonLocation });
}

export function useUpdateSalonLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (location: SalonLocation) => settingsApi.updateSalonLocation(location),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'salonLocation'] }),
  });
}

// Business info — name, phone, email.
export function useBusinessInfo() {
  return useQuery({ queryKey: [KEY, 'businessInfo'], queryFn: settingsApi.getBusinessInfo });
}

export function useUpdateBusinessInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (info: BusinessInfo) => settingsApi.updateBusinessInfo(info),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, 'businessInfo'] }),
  });
}
