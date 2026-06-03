import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(2, 'Service name is required').max(100),
  description: z.string().max(500).optional(),
  duration: z.number().int().min(15, 'Minimum duration is 15 minutes').max(480, 'Maximum duration is 8 hours'),
  price: z.number().positive('Price must be greater than 0').max(100_000, 'Price seems too high'),
  isActive: z.boolean().default(true),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;
