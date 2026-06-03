import { z } from 'zod';

export const intakeFormSchema = z.object({
  hairType: z.string().min(1, 'Hair type is required'),
  allergies: z.string().max(300).optional(),
  preferredStyle: z.string().max(200).optional(),
  consultationNotes: z.string().max(500).optional(),
});

export type IntakeFormValues = z.infer<typeof intakeFormSchema>;
