// hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SettingsApi } from '../api/settings';

const KEY = 'settings';

export function useSettings() {
  return useQuery({ queryKey: [KEY], queryFn: SettingsApi.getAll });
}

export function useSettingByKey(key: string) {
  return useQuery({ queryKey: [KEY, key], queryFn: () => SettingsApi.getByKey(key), enabled: !!key });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { value: string } }) => SettingsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCreateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: SettingsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}