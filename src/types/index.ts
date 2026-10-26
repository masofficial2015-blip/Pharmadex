export * from './database.types';

import type { Database, PaymentMethod } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type PharmacistPermission =
  | 'receive_stock'
  | 'manage_suppliers'
  | 'manage_medicines'
  | 'view_ledger';
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type Medicine = Database['public']['Tables']['medicines']['Row'];
export type Batch = Database['public']['Tables']['batches']['Row'];
export type StockReceipt = Database['public']['Tables']['stock_receipts']['Row'];
export type Shift = Database['public']['Tables']['shifts']['Row'];
export type StockMovement = Database['public']['Tables']['stock_movements']['Row'];
export type Sale = Database['public']['Tables']['sales']['Row'];
export type SaleItem = Database['public']['Tables']['sale_items']['Row'];
export type ReturnRecord = Database['public']['Tables']['returns']['Row'];
export type CashMovement = Database['public']['Tables']['cash_movements']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export interface MedicineInventorySummary extends Medicine {
  total_units_in_stock: number;
  total_packs_in_stock: number;
  active_batches_count: number;
  is_low_stock: boolean;
  earliest_expiry_date: string | null;
  has_stock_transactions: boolean;
}

export interface SupplierWithBalance extends Supplier {
  total_received_orders: number;
  total_payable_balance: number;
  has_unpaid_dube: boolean;
}

export interface BatchWithDetails extends Batch {
  medicine: Medicine;
  supplier: Supplier | null;
  receipt?: StockReceipt | null;
  is_expired: boolean;
  is_near_expiry: boolean; // < 4 months (120 days)
  days_to_expiry: number;
}

export interface StockMovementWithDetails extends StockMovement {
  medicine: Medicine;
  batch: Batch;
  performer: Profile;
}

export interface ShiftSummary {
  shift: Shift;
  user: Profile;
  opening_cash: number;
  cash_sales_total: number;
  bank_sales_total: number;
  cash_refunds_total: number;
  cash_in_total: number;
  cash_out_total: number;
  expected_closing_cash: number;
  actual_closing_cash: number | null;
  cash_discrepancy: number | null;
  sales_count: number;
}

export interface PosMedicineItem {
  id: string;
  name: string;
  brand_name: string | null;
  strength: string;
  dosage_form: string;
  base_unit: string;
  pack_label: string;
  units_per_pack: number;
  packaging_type?: string | null;
  strips_per_box?: number | null;
  tablets_per_strip?: number | null;
  total_available_units: number;
  available_packs: number;
  available_loose: number;
  pack_price: number;
  unit_price: number;
  earliest_expiry_date: string | null;
  batches_count: number;
}

export interface CartItem {
  medicine: PosMedicineItem;
  pack_quantity: number;
  loose_quantity: number;
  total_units: number;
  subtotal: number;
}

export interface SaleReceiptItem {
  id: string;
  medicine_name: string;
  brand_name: string | null;
  strength: string;
  dosage_form: string;
  batch_number: string;
  expiry_date: string;
  quantity_units: number;
  unit_price: number;
  subtotal: number;
}

export interface SaleReceipt {
  id: string;
  receipt_number: string;
  shift_id: string;
  cashier: Profile;
  customer_name: string | null;
  notes?: string | null;
  payment_method: PaymentMethod;
  total_amount: number;
  cash_tendered?: number | null;
  change_returned?: number | null;
  created_at: string;
  items: SaleReceiptItem[];
}
