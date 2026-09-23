import { z } from 'zod';

export const serviceSchema = z.object({
  categoryId: z.number().int().min(1, 'Category is required'),
  name: z.string().min(2, 'Service name is required').max(100),
  description: z.string().max(500).optional(),
  duration: z.number().int().min(15, 'Minimum duration is 15 minutes').max(480, 'Maximum duration is 8 hours'),
  price: z.number().positive('Price must be greater than 0').max(100_000, 'Price seems too high'),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).max(10_000).default(0),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;
