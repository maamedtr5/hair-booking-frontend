import { z } from "zod";

export const staffSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  bio: z.string().max(1000).optional(),
  phone: z
    .string()
    .regex(/^\+?[0-9]{9,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")), // allow empty string
});

export type StaffFormValues = z.infer<typeof staffSchema>;
