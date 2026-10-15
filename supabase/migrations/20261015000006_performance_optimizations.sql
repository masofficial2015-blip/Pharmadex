-- ==============================================================================
-- PHARMADEX-2: MIGRATION 006 - PERFORMANCE OPTIMIZATIONS & DATABASE AGGREGATIONS
-- Optimizes query performance, eliminates N+1 aggregations, and adds indexes
-- ==============================================================================

-- 1. MATERIALIZED / SQL VIEW FOR MEDICINE INVENTORY SUMMARIES
-- Eliminates loading all batches and all stock_movements into server memory.
-- Aggregates non-expired stock, available packs, low stock status, and FEFO expiry.
CREATE OR REPLACE VIEW view_medicine_inventory_summaries AS
SELECT 
  m.id,
  m.name,
  m.brand_name,
  m.strength,
  m.dosage_form,
  m.base_unit,
  m.pack_label,
  m.units_per_pack,
  m.low_stock_threshold,
  m.is_active,
  m.created_at,
  m.updated_at,
  COALESCE(SUM(b.current_quantity_units) FILTER (WHERE b.expiry_date > CURRENT_DATE), 0)::INT AS total_units_in_stock,
  FLOOR(COALESCE(SUM(b.current_quantity_units) FILTER (WHERE b.expiry_date > CURRENT_DATE), 0) / GREATEST(m.units_per_pack, 1))::INT AS total_packs_in_stock,
  COUNT(b.id) FILTER (WHERE b.expiry_date > CURRENT_DATE AND b.current_quantity_units > 0)::INT AS active_batches_count,
  (COALESCE(SUM(b.current_quantity_units) FILTER (WHERE b.expiry_date > CURRENT_DATE), 0) <= m.low_stock_threshold) AS is_low_stock,
  MIN(b.expiry_date) FILTER (WHERE b.expiry_date > CURRENT_DATE AND b.current_quantity_units > 0)::TEXT AS earliest_expiry_date,
  (EXISTS (SELECT 1 FROM batches WHERE medicine_id = m.id) OR 
   EXISTS (SELECT 1 FROM stock_movements WHERE medicine_id = m.id)) AS has_stock_transactions
FROM medicines m
LEFT JOIN batches b ON m.id = b.medicine_id
GROUP BY m.id;

GRANT SELECT ON view_medicine_inventory_summaries TO authenticated;

-- 2. STORED PROCEDURE FOR ACTIVE SHIFT RECONCILIATION
-- Consolidates 4 separate sequential queries (shifts, sales, returns, cash_movements)
-- into a single fast atomic execution inside PostgreSQL.
CREATE OR REPLACE FUNCTION get_active_shift_summary()
RETURNS JSONB AS $$
DECLARE
  v_shift RECORD;
  v_user RECORD;
  v_cash_sales NUMERIC(12,2) := 0;
  v_bank_sales NUMERIC(12,2) := 0;
  v_cash_refunds NUMERIC(12,2) := 0;
  v_cash_in NUMERIC(12,2) := 0;
  v_cash_out NUMERIC(12,2) := 0;
  v_sales_count INT := 0;
BEGIN
  SELECT * INTO v_shift
  FROM shifts
  WHERE status = 'OPEN'
  LIMIT 1;

  IF v_shift.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_user
  FROM profiles
  WHERE id = v_shift.user_id;

  -- 1. Sales aggregation directly in DB
  SELECT 
    COALESCE(SUM(total_amount) FILTER (WHERE payment_method = 'CASH'), 0),
    COALESCE(SUM(total_amount) FILTER (WHERE payment_method <> 'CASH'), 0),
    COUNT(*)
  INTO v_cash_sales, v_bank_sales, v_sales_count
  FROM sales
  WHERE shift_id = v_shift.id AND status = 'COMPLETED';

  -- 2. Refunds on CASH sales for this shift directly in DB
  SELECT COALESCE(SUM(r.refunded_amount), 0)
  INTO v_cash_refunds
  FROM returns r
  JOIN sales s ON r.sale_id = s.id
  WHERE s.shift_id = v_shift.id AND s.payment_method = 'CASH';

  -- 3. Cash till movements directly in DB
  SELECT 
    COALESCE(SUM(amount) FILTER (WHERE movement_type = 'PAY_IN'), 0),
    COALESCE(SUM(amount) FILTER (WHERE movement_type = 'PAY_OUT'), 0)
  INTO v_cash_in, v_cash_out
  FROM cash_movements
  WHERE shift_id = v_shift.id;

  RETURN jsonb_build_object(
    'shift', row_to_json(v_shift),
    'user', row_to_json(v_user),
    'opening_cash', v_shift.opening_cash,
    'cash_sales_total', v_cash_sales,
    'bank_sales_total', v_bank_sales,
    'cash_refunds_total', v_cash_refunds,
    'cash_in_total', v_cash_in,
    'cash_out_total', v_cash_out,
    'expected_closing_cash', (v_shift.opening_cash + v_cash_sales - v_cash_refunds + v_cash_in - v_cash_out),
    'actual_closing_cash', v_shift.actual_closing_cash,
    'cash_discrepancy', v_shift.cash_discrepancy,
    'sales_count', v_sales_count
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_active_shift_summary() TO authenticated;

-- 3. PARTIAL AND COMPOSITE PERFORMANCE INDEXES
-- Partial index for active sellable inventory ordered by FEFO
CREATE INDEX IF NOT EXISTS idx_batches_active_fefo
  ON batches (medicine_id, expiry_date ASC)
  WHERE current_quantity_units > 0;

-- Partial index for dashboard near-expiry alerts
CREATE INDEX IF NOT EXISTS idx_batches_active_expiry
  ON batches (expiry_date ASC)
  WHERE current_quantity_units > 0;

-- Index for return lookups by sale item
CREATE INDEX IF NOT EXISTS idx_returns_sale_item
  ON returns (sale_item_id);

-- Partial index for unpaid supplier credit (Dube) receipts
CREATE INDEX IF NOT EXISTS idx_stock_receipts_unpaid
  ON stock_receipts (supplier_id, payment_status)
  WHERE payment_status IN ('DUBE', 'PARTIAL');
