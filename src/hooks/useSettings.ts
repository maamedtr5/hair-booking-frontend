// hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {  settingsApi } from '../api/settings';

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