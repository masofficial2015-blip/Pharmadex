-- ==============================================================================
-- PHARMADEX-2: MIGRATION 004 - SHIFTS RECONCILIATION & SALES CASH TENDER
-- ==============================================================================

-- 1. EXTEND SHIFTS TABLE WITH RECONCILIATION SNAPSHOT FIELDS
ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS cash_sales_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bank_sales_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_refunds_amount NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_movements_net NUMERIC(12, 2) DEFAULT 0;

-- 2. EXTEND SALES TABLE WITH CASH TENDER FIELDS
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS cash_tendered NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS change_returned NUMERIC(12, 2);

-- 3. ENSURE INDEXES FOR FAST SHIFT RECONCILIATION QUERIES
CREATE INDEX IF NOT EXISTS idx_sales_shift_payment ON sales(shift_id, payment_method, status);
CREATE INDEX IF NOT EXISTS idx_cash_movements_shift_type ON cash_movements(shift_id, movement_type);
