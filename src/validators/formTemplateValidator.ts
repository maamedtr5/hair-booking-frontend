import { z } from 'zod';

export const FIELD_TYPES = [
  'TEXT',
  'TEXTAREA',
  'SINGLE_SELECT',
  'MULTI_SELECT',
  'SCALE',
  'DATE',
  'CHECKBOX',
  'SIGNATURE',
] as const;

export const FIELD_TYPE_LABELS: Record<(typeof FIELD_TYPES)[number], string> = {
  TEXT: 'Short text',
  TEXTAREA: 'Long text',
  SINGLE_SELECT: 'Single choice',
  MULTI_SELECT: 'Multiple choice',
  SCALE: 'Scale (1–5)',
  DATE: 'Date',
  CHECKBOX: 'Yes / No',
  SIGNATURE: 'Signature',
};

const OPTION_TYPES = new Set<(typeof FIELD_TYPES)[number]>(['SINGLE_SELECT', 'MULTI_SELECT']);

export const formTemplateSchema = z.object({
  name: z.string().min(2, 'Form name is required').max(150),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
});

export type FormTemplateFormValues = z.infer<typeof formTemplateSchema>;

export const formFieldSchema = z
  .object({
    label: z.string().min(1, 'Question is required').max(300),
    section: z.string().max(150).optional(),
    helpText: z.string().max(500).optional(),
    fieldType: z.enum(FIELD_TYPES),
    options: z.array(z.string().min(1)).optional(),
    required: z.boolean().default(false),
    order: z.number().int().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (OPTION_TYPES.has(data.fieldType)) {
      const options = data.options ?? [];
      if (options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Add at least 2 options for a choice question',
          path: ['options'],
        });
      }
      const seen = new Set(options.map((o) => o.trim().toLowerCase()));
      if (seen.size !== options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Options must be unique',
          path: ['options'],
        });
      }
    }
  });

export type FormFieldFormValues = z.infer<typeof formFieldSchema>;
