import apiClient from '../utils/apiClient';
import type { FormTemplate, FormField, ApiResponse } from '../types/models';
import type {
  FormTemplateFormValues,
  FormFieldFormValues,
} from '../validators/formTemplateValidator';

/** GET /form-templates — admin only */
export async function getFormTemplates(): Promise<FormTemplate[]> {
  const { data } = await apiClient.get<ApiResponse<FormTemplate[]>>('/form-templates');
  return data.data ?? [];
}

/** GET /form-templates/:id — admin only */
export async function getFormTemplate(id: number): Promise<FormTemplate> {
  const { data } = await apiClient.get<ApiResponse<FormTemplate>>(`/form-templates/${id}`);
  return data.data!;
}

/** POST /form-templates — admin only */
export async function createFormTemplate(payload: FormTemplateFormValues): Promise<FormTemplate> {
  const { data } = await apiClient.post<ApiResponse<FormTemplate>>('/form-templates', payload);
  return data.data!;
}

/** PUT /form-templates/:id — admin only */
export async function updateFormTemplate(
  id: number,
  payload: Partial<FormTemplateFormValues>,
): Promise<FormTemplate> {
  const { data } = await apiClient.put<ApiResponse<FormTemplate>>(`/form-templates/${id}`, payload);
  return data.data!;
}

/** DELETE /form-templates/:id — admin only */
export async function deleteFormTemplate(id: number): Promise<void> {
  await apiClient.delete(`/form-templates/${id}`);
}

/** POST /form-templates/:id/fields — admin only */
export async function addFormField(
  formTemplateId: number,
  payload: FormFieldFormValues,
): Promise<FormField> {
  const { data } = await apiClient.post<ApiResponse<FormField>>(
    `/form-templates/${formTemplateId}/fields`,
    payload,
  );
  return data.data!;
}

/** PUT /form-templates/:id/fields/:fieldId — admin only */
export async function updateFormField(
  formTemplateId: number,
  fieldId: number,
  payload: Partial<FormFieldFormValues>,
): Promise<FormField> {
  const { data } = await apiClient.put<ApiResponse<FormField>>(
    `/form-templates/${formTemplateId}/fields/${fieldId}`,
    payload,
  );
  return data.data!;
}

/** DELETE /form-templates/:id/fields/:fieldId — admin only */
export async function deleteFormField(formTemplateId: number, fieldId: number): Promise<void> {
  await apiClient.delete(`/form-templates/${formTemplateId}/fields/${fieldId}`);
}

/**
 * PUT /form-templates/:id/fields/reorder — admin only. Must include every
 * field currently on the template exactly once (enforced server-side).
 */
export async function reorderFormFields(
  formTemplateId: number,
  fieldIds: number[],
): Promise<FormField[]> {
  const { data } = await apiClient.put<ApiResponse<FormField[]>>(
    `/form-templates/${formTemplateId}/fields/reorder`,
    { fieldIds },
  );
  return data.data ?? [];
}
