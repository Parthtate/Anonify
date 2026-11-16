import { z } from 'zod';

export const verifySchema = z.object({
  code: z
    .string()
    .regex(/^\d{6}$/, { message: 'Enter the 6-digit code from your email' }),
});
