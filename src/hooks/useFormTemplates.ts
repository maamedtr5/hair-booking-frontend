import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as formTemplatesApi from '../api/formTemplates';
import type {
  FormTemplateFormValues,
  FormFieldFormValues,
} from '../validators/formTemplateValidator';
import { toast } from '../store/uiStore';
import { getErrorMessage } from '../utils/apiClient';

export const formTemplateKeys = {
  all: ['formTemplates'] as const,
  byId: (id: number) => ['formTemplates', id] as const,
};

function invalidateTemplateQueries(qc: ReturnType<typeof useQueryClient>, id?: number) {
  qc.invalidateQueries({ queryKey: formTemplateKeys.all });
  if (id) qc.invalidateQueries({ queryKey: formTemplateKeys.byId(id) });
  // A category embeds its assigned template's fields (for the booking
  // flow), so any edit here needs that cache refreshed too.
  qc.invalidateQueries({ queryKey: ['serviceCategories'] });
}

export function useFormTemplates() {
  return useQuery({
    queryKey: formTemplateKeys.all,
    queryFn: formTemplatesApi.getFormTemplates,
    staleTime: 60 * 1000,
  });
}

export function useFormTemplate(id: number) {
  return useQuery({
    queryKey: formTemplateKeys.byId(id),
    queryFn: () => formTemplatesApi.getFormTemplate(id),
    enabled: !!id,
  });
}

export function useCreateFormTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FormTemplateFormValues) => formTemplatesApi.createFormTemplate(payload),
    onSuccess: () => {
      invalidateTemplateQueries(qc);
      toast.success('Form created');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateFormTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<FormTemplateFormValues> }) =>
      formTemplatesApi.updateFormTemplate(id, payload),
    onSuccess: (_, { id }) => {
      invalidateTemplateQueries(qc, id);
      toast.success('Form updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteFormTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => formTemplatesApi.deleteFormTemplate(id),
    onSuccess: () => {
      invalidateTemplateQueries(qc);
      toast.success('Form deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useAddFormField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formTemplateId, payload }: { formTemplateId: number; payload: FormFieldFormValues }) =>
      formTemplatesApi.addFormField(formTemplateId, payload),
    onSuccess: (_, { formTemplateId }) => {
      invalidateTemplateQueries(qc, formTemplateId);
      toast.success('Question added');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateFormField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      formTemplateId,
      fieldId,
      payload,
    }: {
      formTemplateId: number;
      fieldId: number;
      payload: Partial<FormFieldFormValues>;
    }) => formTemplatesApi.updateFormField(formTemplateId, fieldId, payload),
    onSuccess: (_, { formTemplateId }) => {
      invalidateTemplateQueries(qc, formTemplateId);
      toast.success('Question updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteFormField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formTemplateId, fieldId }: { formTemplateId: number; fieldId: number }) =>
      formTemplatesApi.deleteFormField(formTemplateId, fieldId),
    onSuccess: (_, { formTemplateId }) => {
      invalidateTemplateQueries(qc, formTemplateId);
      toast.success('Question removed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useReorderFormFields() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formTemplateId, fieldIds }: { formTemplateId: number; fieldIds: number[] }) =>
      formTemplatesApi.reorderFormFields(formTemplateId, fieldIds),
    onSuccess: (_, { formTemplateId }) => {
      invalidateTemplateQueries(qc, formTemplateId);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
