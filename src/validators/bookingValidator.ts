import { z } from 'zod';

export const promoCodeSchema = z.object({
  code: z.string().min(1, 'Enter a promo code').max(50).toUpperCase(),
});

export type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;
