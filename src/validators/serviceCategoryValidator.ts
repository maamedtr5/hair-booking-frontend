import { z } from 'zod';

export const serviceCategorySchema = z.object({
  name: z.string().min(2, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  displayOrder: z.number().int().min(0).max(10_000).default(0),
  isActive: z.boolean().default(true),
  // Explicit null clears the required-form assignment; undefined leaves it
  // unchanged on an update.
  formTemplateId: z.number().int().min(1).nullable().optional(),
});

export type ServiceCategoryFormValues = z.infer<typeof serviceCategorySchema>;
