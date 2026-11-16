import { z } from 'zod';

export const signInSchema = z.object({
  identifier: z.string().min(1, { message: 'Enter your email or username' }),
  password: z.string().min(1, { message: 'Enter your password' }),
});
