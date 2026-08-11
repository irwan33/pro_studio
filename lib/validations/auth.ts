import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(120)
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({ email: z.string().email().toLowerCase() });
export const resetPasswordSchema = z.object({ token: z.string().min(16), password: z.string().min(8).max(120) });
