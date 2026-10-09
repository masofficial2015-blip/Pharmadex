-- ==============================================================================
-- PHARMADEX-2: INITIAL DATABASE SCHEMA MIGRATION
-- Tailored for Ethiopian Pharmacy Management
-- Currency: ETB | Calendar: Gregorian
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- HELPER: Generic update timestamp function
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked to auth.users)
-- Tracks 1 Owner/Admin and 2-3 Pharmacists
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'PHARMACIST')),
  phone_number TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);

-- ------------------------------------------------------------------------------
-- 2. SUPPLIERS TABLE
-- Tracks medicine vendors and distributors
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_suppliers
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

-- ------------------------------------------------------------------------------
-- 3. MEDICINES TABLE
-- Essential medicine attributes only: name, strength, dosage_form, base_unit,
-- units_per_pack, low_stock_threshold
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  strength TEXT NOT NULL,
  dosage_form TEXT NOT NULL,
  base_unit TEXT NOT NULL,
  units_per_pack INTEGER NOT NULL CHECK (units_per_pack >= 1),
  low_stock_threshold INTEGER NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_medicine_identity UNIQUE (name, strength, dosage_form)
);

CREATE TRIGGER set_timestamp_medicines
  BEFORE UPDATE ON medicines
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_active ON medicines(is_active);

-- ------------------------------------------------------------------------------
-- 4. BATCHES TABLE
-- Strict batch tracking: expiry, pack pricing, base-unit stock
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  cost_per_pack NUMERIC(12, 2) NOT NULL CHECK (cost_per_pack >= 0),
  selling_price_per_pack NUMERIC(12, 2) NOT NULL CHECK (selling_price_per_pack >= 0),
  selling_price_per_unit NUMERIC(12, 2) NOT NULL CHECK (selling_price_per_unit >= 0),
  initial_quantity_units INTEGER NOT NULL CHECK (initial_quantity_units >= 0),
  current_quantity_units INTEGER NOT NULL CHECK (current_quantity_units >= 0),
  received_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_medicine_batch UNIQUE (medicine_id, batch_number)
);

CREATE TRIGGER set_timestamp_batches
  BEFORE UPDATE ON batches
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- Index for First-Expired, First-Out (FEFO) allocation & availability lookups
CREATE INDEX IF NOT EXISTS idx_batches_fefo ON batches(medicine_id, expiry_date ASC, current_quantity_units);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_batches_supplier ON batches(supplier_id);
CREATE INDEX IF NOT EXISTS idx_batches_received_by ON batches(received_by);

-- ------------------------------------------------------------------------------
-- 5. SHIFTS TABLE
-- Strict Single Active Shift enforcement across the entire pharmacy
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  opening_cash NUMERIC(12, 2) NOT NULL CHECK (opening_cash >= 0),
  expected_closing_cash NUMERIC(12, 2) CHECK (expected_closing_cash >= 0),
  actual_closing_cash NUMERIC(12, 2) CHECK (actual_closing_cash >= 0),
  cash_discrepancy NUMERIC(12, 2),
  closing_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PHYSICAL GUARANTEE: Only one shift can be OPEN at a time in the database
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_open_shift ON shifts (status) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_shifts_user ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_opened_at ON shifts(opened_at DESC);

-- ------------------------------------------------------------------------------
-- 6. STOCK MOVEMENTS TABLE
-- Complete audit trail for every inventory addition, deduction, or adjustment
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('RECEIVE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DISPOSAL')),
  quantity_units INTEGER NOT NULL,
  previous_quantity_units INTEGER NOT NULL CHECK (previous_quantity_units >= 0),
  new_quantity_units INTEGER NOT NULL CHECK (new_quantity_units >= 0),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('RECEIPT', 'SALE', 'RETURN', 'ADJUSTMENT', 'DISPOSAL')),
  reference_id UUID,
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_medicine ON stock_movements(medicine_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user ON stock_movements(performed_by);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ref ON stock_movements(reference_type, reference_id);

-- ------------------------------------------------------------------------------
-- 7. SALES TABLE
-- Point of sale transactions: Cash, Telebirr, CBE Birr, Bank Transfer
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
  cashier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  customer_name TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'TELEBIRR', 'CBE_BIRR', 'BANK_TRANSFER')),
  total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'CANCELLED', 'RETURNED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_receipt ON sales(receipt_number);
CREATE INDEX IF NOT EXISTS idx_sales_shift ON sales(shift_id);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_payment ON sales(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

-- ------------------------------------------------------------------------------
-- 8. SALE ITEMS TABLE
-- Line items supporting both full packs and individual units
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  is_pack BOOLEAN NOT NULL DEFAULT FALSE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  quantity_units INTEGER NOT NULL CHECK (quantity_units > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_medicine ON sale_items(medicine_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_batch ON sale_items(batch_id);

-- ------------------------------------------------------------------------------
-- 9. RETURNS AND CANCELLATIONS TABLE
-- Authorized sale cancellations and item returns with stock restoration
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
  sale_item_id UUID REFERENCES sale_items(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  quantity_units INTEGER NOT NULL CHECK (quantity_units > 0),
  refunded_amount NUMERIC(12, 2) NOT NULL CHECK (refunded_amount >= 0),
  return_reason TEXT NOT NULL,
  authorized_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  stock_restored BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_returns_sale ON returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_returns_batch ON returns(batch_id);
CREATE INDEX IF NOT EXISTS idx_returns_authorized_by ON returns(authorized_by);
CREATE INDEX IF NOT EXISTS idx_returns_created ON returns(created_at DESC);

-- ------------------------------------------------------------------------------
-- 10. CASH MOVEMENTS TABLE
-- Cash till in/out during an active shift (petty cash, expenses, cashier deposit)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('PAY_IN', 'PAY_OUT')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_shift ON cash_movements(shift_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_performed_by ON cash_movements(performed_by);
CREATE INDEX IF NOT EXISTS idx_cash_movements_created ON cash_movements(created_at DESC);

-- ------------------------------------------------------------------------------
-- 11. AUDIT LOGS TABLE
-- System-wide audit log for accountability and regulatory compliance
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'CANCEL', 'AUTHORIZE')),
  old_data JSONB,
  new_data JSONB,
  performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
