import { z } from 'zod';

export const createPromoCodeSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be 20 characters or fewer')
    .toUpperCase(),
  description: z.string().optional(),
  discount: z
    .number({ error: 'Discount must be a number' })
    .positive('Discount must be greater than 0'),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  // .default(true) ensures OUTPUT type is always `boolean`, never `boolean | undefined`
  isActive: z.boolean().default(true),
});

// z.infer gives the OUTPUT type (post-defaults) — isActive is `boolean`, not `boolean | undefined`
export type CreatePromoCodeFormValues = z.infer<typeof createPromoCodeSchema>;