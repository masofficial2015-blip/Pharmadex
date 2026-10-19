import { z } from 'zod';

export const medicineFormSchema = z.object({
  name: z.string().trim().min(2, 'Medicine name must be at least 2 characters'),
  brand_name: z.string().trim().optional().or(z.literal('')),
  strength: z.string().trim().min(1, 'Strength is required (e.g. 500mg, 250mg/5ml)'),
  dosage_form: z.string().trim().min(2, 'Dosage form is required (e.g. Tablet, Capsule, Syrup)'),
  base_unit: z.string().trim().min(1, 'Base unit is required (e.g. tablet, capsule, bottle, ampoule)'),
  pack_label: z.string().trim().min(1, 'Pack label is required').default('Box'),
  units_per_pack: z.coerce.number().int().min(1, 'Units per pack must be at least 1'),
  packaging_type: z.string().trim().optional().nullable(),
  strips_per_box: z.coerce.number().int().min(1).optional().nullable(),
  tablets_per_strip: z.coerce.number().int().min(1).optional().nullable(),
  low_stock_threshold: z.coerce.number().int().min(0, 'Low stock threshold cannot be negative').default(10),
});

export type MedicineFormValues = z.infer<typeof medicineFormSchema>;

export const supplierFormSchema = z.object({
  name: z.string().trim().min(2, 'Supplier name must be at least 2 characters'),
  contact_person: z.string().trim().optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export const stockReceiveSchema = z.object({
  medicine_id: z.string().uuid('Please select a valid medicine'),
  supplier_id: z.string().uuid('Please select a valid supplier'),
  batch_number: z.string().trim().min(1, 'Batch number is required'),
  expiry_date: z.string().refine((dateStr) => {
    const expiry = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !isNaN(expiry.getTime()) && expiry > today;
  }, 'Expiry date must be in the future'),
  packs: z.coerce.number().int().min(0, 'Packs cannot be negative').default(0),
  loose_units: z.coerce.number().int().min(0, 'Loose units cannot be negative').default(0),
  cost_per_pack: z.coerce.number().min(0, 'Cost per pack cannot be negative'),
  selling_price_per_pack: z.coerce.number().min(0, 'Selling price per pack cannot be negative'),
  selling_price_per_unit: z.coerce.number().min(0, 'Selling price per unit cannot be negative'),
  payment_status: z.enum(['FULL', 'PARTIAL', 'DUBE']),
  amount_paid: z.coerce.number().min(0, 'Amount paid cannot be negative').default(0),
  payment_method: z.enum(['CASH', 'TELEBIRR', 'CBE_BIRR', 'BANK_TRANSFER']).optional().or(z.literal('')),
  invoice_number: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().optional().or(z.literal('')),
}).refine((data) => data.packs > 0 || data.loose_units > 0, {
  message: 'You must enter at least 1 pack or 1 loose unit',
  path: ['packs'],
});

export type StockReceiveFormValues = z.infer<typeof stockReceiveSchema>;
