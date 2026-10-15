import { z } from 'zod';

export const openShiftSchema = z.object({
  opening_cash: z.coerce
    .number({ invalid_type_error: 'Opening cash must be a valid number' })
    .min(0, 'Opening cash cannot be negative'),
});

export type OpenShiftFormValues = z.infer<typeof openShiftSchema>;

export const cashMovementSchema = z.object({
  movement_type: z.enum(['PAY_IN', 'PAY_OUT'], {
    errorMap: () => ({ message: 'Please select Pay In or Pay Out' }),
  }),
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters (e.g. Till float addition, Expense)'),
});

export type CashMovementFormValues = z.infer<typeof cashMovementSchema>;

export const closeShiftSchema = z.object({
  actual_closing_cash: z.coerce
    .number({ invalid_type_error: 'Actual closing cash must be a valid number' })
    .min(0, 'Counted cash cannot be negative'),
  closing_notes: z.string().trim().optional().or(z.literal('')),
});

export type CloseShiftFormValues = z.infer<typeof closeShiftSchema>;
