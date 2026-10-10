import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createPharmacistSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[+0-9\s-]{9,15}$/.test(val), {
      message: 'Please enter a valid phone number (e.g. +251 91 123 4567)',
    }),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password is too long'),
});

export type CreatePharmacistInput = z.infer<typeof createPharmacistSchema>;

export const resetPasswordSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  newPassword: z
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(50, 'Password is too long'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
