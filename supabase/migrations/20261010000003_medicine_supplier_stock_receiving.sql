-- ==============================================================================
-- PHARMADEX-2: MIGRATION 003 - MEDICINES, SUPPLIERS & STOCK RECEIVING
-- ==============================================================================

-- 1. EXTEND MEDICINES WITH BRAND NAME AND PACK LABEL
ALTER TABLE medicines 
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS pack_label TEXT NOT NULL DEFAULT 'Pack';

-- Update uniqueness constraint to consider brand_name if provided
-- (Keep existing uq_medicine_identity intact or update if necessary)
CREATE INDEX IF NOT EXISTS idx_medicines_brand_name ON medicines(brand_name);

-- ------------------------------------------------------------------------------
-- 2. STOCK RECEIPTS TABLE (Supplier Invoices & Payment Terms)
-- Supports FULL, PARTIAL, and DUBE (Credit) payments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  invoice_number TEXT,
  total_cost NUMERIC(12, 2) NOT NULL CHECK (total_cost >= 0),
  amount_paid NUMERIC(12, 2) NOT NULL CHECK (amount_paid >= 0),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('FULL', 'PARTIAL', 'DUBE')),
  payment_method TEXT CHECK (payment_method IN ('CASH', 'TELEBIRR', 'CBE_BIRR', 'BANK_TRANSFER')),
  received_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_receipts_supplier ON stock_receipts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_receipts_status ON stock_receipts(payment_status);
CREATE INDEX IF NOT EXISTS idx_stock_receipts_created ON stock_receipts(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. EXTEND BATCHES TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS receipt_id UUID REFERENCES stock_receipts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS packs_received INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loose_units_received INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(12, 4);

CREATE INDEX IF NOT EXISTS idx_batches_receipt ON batches(receipt_id);

-- ------------------------------------------------------------------------------
-- 4. PACKAGING CONVERSION LOCK TRIGGER
-- Prevent modifying units_per_pack or base_unit if the medicine already has inventory
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_medicine_packaging_lock()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.units_per_pack <> NEW.units_per_pack OR OLD.base_unit <> NEW.base_unit) THEN
    IF EXISTS (SELECT 1 FROM batches WHERE medicine_id = OLD.id) OR
       EXISTS (SELECT 1 FROM stock_movements WHERE medicine_id = OLD.id) THEN
      RAISE EXCEPTION 'Cannot modify units_per_pack or base_unit: Medicine has existing inventory transactions. Packaging is locked to prevent inventory corruption.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_medicine_packaging_lock ON medicines;
CREATE TRIGGER trg_medicine_packaging_lock
  BEFORE UPDATE ON medicines
  FOR EACH ROW
  EXECUTE FUNCTION check_medicine_packaging_lock();

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY FOR STOCK_RECEIPTS
-- ------------------------------------------------------------------------------
ALTER TABLE stock_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock receipts"
  ON stock_receipts FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated users can create stock receipts"
  ON stock_receipts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update stock receipts"
  ON stock_receipts FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
