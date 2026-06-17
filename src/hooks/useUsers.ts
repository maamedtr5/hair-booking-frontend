// hooks/useUsers.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; phone: string; currentPassword: string; newPassword: string }> }) =>
      usersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth'] }),
  });
}