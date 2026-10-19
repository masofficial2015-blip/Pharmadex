-- ==============================================================================
-- PHARMADEX-2: MIGRATION 007 - PACKAGING REFACTOR & HUMAN-READABLE BREAKDOWNS
-- ==============================================================================

-- 1. ADD PACKAGING CONFIGURATION COLUMNS TO MEDICINES
ALTER TABLE medicines
  ADD COLUMN IF NOT EXISTS packaging_type TEXT DEFAULT 'STANDARD',
  ADD COLUMN IF NOT EXISTS strips_per_box INTEGER,
  ADD COLUMN IF NOT EXISTS tablets_per_strip INTEGER;

-- 2. CLEAN SLATE TEST DATA WIPE (PREPARING FOR LIVE STOCK MIGRATION)
TRUNCATE TABLE 
  returns,
  sale_items,
  sales,
  cash_movements,
  stock_movements,
  batches,
  stock_receipts,
  shifts,
  medicines,
  suppliers,
  audit_logs
RESTART IDENTITY CASCADE;

-- 3. RECREATE INVENTORY AGGREGATION VIEW WITH PACKAGING FIELDS
DROP VIEW IF EXISTS view_medicine_inventory_summaries;

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
  m.packaging_type,
  m.strips_per_box,
  m.tablets_per_strip,
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
