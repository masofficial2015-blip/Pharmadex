import { z } from 'zod';

export const cartItemInputSchema = z.object({
  medicine_id: z.string().uuid('Invalid medicine selected'),
  pack_quantity: z.coerce.number().int().min(0, 'Pack quantity cannot be negative').default(0),
  loose_quantity: z.coerce.number().int().min(0, 'Loose quantity cannot be negative').default(0),
  custom_unit_price: z.coerce.number().min(0.01, 'Unit price must be greater than 0').optional(),
}).refine((data) => data.pack_quantity > 0 || data.loose_quantity > 0, {
  message: 'Must enter at least 1 pack or 1 loose unit',
  path: ['loose_quantity'],
});

export const saleCheckoutSchema = z.object({
  shift_id: z.string().uuid('Active shift ID is required'),
  payment_method: z.enum(['CASH', 'TELEBIRR', 'CBE_BIRR', 'BANK_TRANSFER'], {
    errorMap: () => ({ message: 'Please select a valid payment method' }),
  }),
  customer_name: z.string().trim().optional().or(z.literal('')),
  cash_tendered: z.coerce.number().min(0).optional(),
  notes: z.string().trim().optional().or(z.literal('')),
  items: z.array(cartItemInputSchema).min(1, 'Cart cannot be empty'),
});

export type SaleCheckoutFormValues = z.infer<typeof saleCheckoutSchema>;
