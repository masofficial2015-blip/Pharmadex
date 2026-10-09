export * from './database.types';

import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type Medicine = Database['public']['Tables']['medicines']['Row'];
export type Batch = Database['public']['Tables']['batches']['Row'];
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
}
