// hooks/usePromoCodes.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PromocodesApi } from '../api/promocodes';

const KEY = 'promoCodes';

export function usePromoCodes() {
  return useQuery({ queryKey: [KEY], queryFn: PromocodesApi.getAll });
}

export function useCreatePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: PromocodesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeletePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: PromocodesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useValidatePromoCode() {
  return useMutation({ mutationFn: PromocodesApi.getByCode });
}