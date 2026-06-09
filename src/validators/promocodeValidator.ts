import { z } from "zod";

export const createPromoCodeSchema = z.object({
  code: z.string().min(3).max(20).transform((val) => val.toUpperCase()),
  description: z.string().max(200).optional(),
  discount: z.number().positive().max(100),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  validFrom: z.string().min(1, "Start date required"),
  validUntil: z.string().min(1, "End date required"),
  isActive: z.boolean().default(true), 
});

export type CreatePromoCodeFormValues = z.infer<typeof createPromoCodeSchema>;
