import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promoCodesApi } from '../api/promocodes';

const KEY = 'promoCodes';

export function usePromoCodes() {
  return useQuery({ queryKey: [KEY], queryFn: promoCodesApi.getAll });
}

export function useCreatePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promoCodesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdatePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof promoCodesApi.update>[1] }) =>
      promoCodesApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeletePromoCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promoCodesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useValidatePromoCode() {
  return useMutation({ mutationFn: promoCodesApi.getByCode });
}