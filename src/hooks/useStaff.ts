
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as staffApi from '../api/staff';
import type { CreateStaffPayload } from '../api/staff';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';

export const staffKeys = {
  all: ['staff'] as const,
  byId: (id: number) => ['staff', id] as const,
};

export function useStaff() {
  return useQuery({
    queryKey: staffKeys.all,
    queryFn: staffApi.getStaff,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStaffMember(id: number) {
  return useQuery({
    queryKey: staffKeys.byId(id),
    queryFn: () => staffApi.getStaffMember(id),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStaffPayload) => staffApi.createStaff(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      toast.success('Staff member added');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<CreateStaffPayload>;
    }) => staffApi.updateStaff(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      qc.invalidateQueries({ queryKey: staffKeys.byId(id) });
      toast.success('Staff profile updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => staffApi.deleteStaff(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.all });
      toast.success('Staff member removed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}