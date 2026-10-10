export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'ADMIN' | 'PHARMACIST';
export type ShiftStatus = 'OPEN' | 'CLOSED';
export type MovementType = 'RECEIVE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DISPOSAL';
export type ReferenceType = 'RECEIPT' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DISPOSAL';
export type PaymentMethod = 'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER';
export type SaleStatus = 'COMPLETED' | 'CANCELLED' | 'RETURNED';
export type CashMovementType = 'PAY_IN' | 'PAY_OUT';
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'CANCEL' | 'AUTHORIZE';

export type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          phone_number: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: UserRole;
          phone_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          phone_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      medicines: {
        Row: {
          id: string;
          name: string;
          strength: string;
          dosage_form: string;
          base_unit: string;
          units_per_pack: number;
          low_stock_threshold: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          strength: string;
          dosage_form: string;
          base_unit: string;
          units_per_pack: number;
          low_stock_threshold?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          strength?: string;
          dosage_form?: string;
          base_unit?: string;
          units_per_pack?: number;
          low_stock_threshold?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      batches: {
        Row: {
          id: string;
          medicine_id: string;
          supplier_id: string | null;
          batch_number: string;
          expiry_date: string;
          cost_per_pack: number;
          selling_price_per_pack: number;
          selling_price_per_unit: number;
          initial_quantity_units: number;
          current_quantity_units: number;
          received_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          medicine_id: string;
          supplier_id?: string | null;
          batch_number: string;
          expiry_date: string;
          cost_per_pack: number;
          selling_price_per_pack: number;
          selling_price_per_unit: number;
          initial_quantity_units: number;
          current_quantity_units: number;
          received_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          medicine_id?: string;
          supplier_id?: string | null;
          batch_number?: string;
          expiry_date?: string;
          cost_per_pack?: number;
          selling_price_per_pack?: number;
          selling_price_per_unit?: number;
          initial_quantity_units?: number;
          current_quantity_units?: number;
          received_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      shifts: {
        Row: {
          id: string;
          user_id: string;
          opened_at: string;
          closed_at: string | null;
          status: ShiftStatus;
          opening_cash: number;
          expected_closing_cash: number | null;
          actual_closing_cash: number | null;
          cash_discrepancy: number | null;
          closing_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          opened_at?: string;
          closed_at?: string | null;
          status?: ShiftStatus;
          opening_cash: number;
          expected_closing_cash?: number | null;
          actual_closing_cash?: number | null;
          cash_discrepancy?: number | null;
          closing_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          opened_at?: string;
          closed_at?: string | null;
          status?: ShiftStatus;
          opening_cash?: number;
          expected_closing_cash?: number | null;
          actual_closing_cash?: number | null;
          cash_discrepancy?: number | null;
          closing_notes?: string | null;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
      stock_movements: {
        Row: {
          id: string;
          batch_id: string;
          medicine_id: string;
          movement_type: MovementType;
          quantity_units: number;
          previous_quantity_units: number;
          new_quantity_units: number;
          reference_type: ReferenceType;
          reference_id: string | null;
          performed_by: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          medicine_id: string;
          movement_type: MovementType;
          quantity_units: number;
          previous_quantity_units: number;
          new_quantity_units: number;
          reference_type: ReferenceType;
          reference_id?: string | null;
          performed_by: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          medicine_id?: string;
          movement_type?: MovementType;
          quantity_units?: number;
          previous_quantity_units?: number;
          new_quantity_units?: number;
          reference_type?: ReferenceType;
          reference_id?: string | null;
          performed_by?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
      sales: {
        Row: {
          id: string;
          receipt_number: string;
          shift_id: string;
          cashier_id: string;
          customer_name: string | null;
          payment_method: PaymentMethod;
          total_amount: number;
          status: SaleStatus;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_number: string;
          shift_id: string;
          cashier_id: string;
          customer_name?: string | null;
          payment_method: PaymentMethod;
          total_amount: number;
          status?: SaleStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          receipt_number?: string;
          shift_id?: string;
          cashier_id?: string;
          customer_name?: string | null;
          payment_method?: PaymentMethod;
          total_amount?: number;
          status?: SaleStatus;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          medicine_id: string;
          batch_id: string;
          is_pack: boolean;
          quantity: number;
          quantity_units: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          medicine_id: string;
          batch_id: string;
          is_pack?: boolean;
          quantity: number;
          quantity_units: number;
          unit_price: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_id?: string;
          medicine_id?: string;
          batch_id?: string;
          is_pack?: boolean;
          quantity?: number;
          quantity_units?: number;
          unit_price?: number;
          subtotal?: number;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
      returns: {
        Row: {
          id: string;
          sale_id: string;
          sale_item_id: string | null;
          batch_id: string;
          quantity_units: number;
          refunded_amount: number;
          return_reason: string;
          authorized_by: string;
          stock_restored: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          sale_item_id?: string | null;
          batch_id: string;
          quantity_units: number;
          refunded_amount: number;
          return_reason: string;
          authorized_by: string;
          stock_restored?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_id?: string;
          sale_item_id?: string | null;
          batch_id?: string;
          quantity_units?: number;
          refunded_amount?: number;
          return_reason?: string;
          authorized_by?: string;
          stock_restored?: boolean;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
      cash_movements: {
        Row: {
          id: string;
          shift_id: string;
          movement_type: CashMovementType;
          amount: number;
          reason: string;
          performed_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shift_id: string;
          movement_type: CashMovementType;
          amount: number;
          reason: string;
          performed_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shift_id?: string;
          movement_type?: CashMovementType;
          amount?: number;
          reason?: string;
          performed_by?: string;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
      audit_logs: {
        Row: {
          id: string;
          table_name: string;
          record_id: string | null;
          action: AuditAction;
          old_data: Json | null;
          new_data: Json | null;
          performed_by: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_name: string;
          record_id?: string | null;
          action: AuditAction;
          old_data?: Json | null;
          new_data?: Json | null;
          performed_by?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          table_name?: string;
          record_id?: string | null;
          action?: AuditAction;
          old_data?: Json | null;
          new_data?: Json | null;
          performed_by?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
