-- ==============================================================================
-- PHARMADEX-2: SEED DATA FOR ETHIOPIAN PHARMACY SETUP
-- Essential medicines commonly stocked in Ethiopian community pharmacies
-- ==============================================================================

-- 1. Sample Supplier
INSERT INTO suppliers (id, name, contact_person, phone, email, address, is_active)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Ethiopian Pharmaceuticals Supply Agency (EPSA)', 'Abebe Tadesse', '+251 11 275 1200', 'info@epsa.gov.et', 'Addis Ababa, Ethiopia', TRUE),
  ('a0000000-0000-0000-0000-000000000002', 'Cadila Pharmaceuticals Ethiopia', 'Meron Haile', '+251 11 440 2200', 'contact@cadila.et', 'Bishoftu / Addis Ababa', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 2. Essential Medicines (Clean, standardized attributes)
INSERT INTO medicines (id, name, strength, dosage_form, base_unit, units_per_pack, low_stock_threshold, is_active)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Amoxicillin', '500mg', 'Capsule', 'capsule', 100, 200, TRUE),
  ('b0000000-0000-0000-0000-000000000002', 'Paracetamol', '500mg', 'Tablet', 'tablet', 100, 250, TRUE),
  ('b0000000-0000-0000-0000-000000000003', 'Metformin', '500mg', 'Tablet', 'tablet', 100, 150, TRUE),
  ('b0000000-0000-0000-0000-000000000004', 'Omeprazole', '20mg', 'Capsule', 'capsule', 30, 90, TRUE),
  ('b0000000-0000-0000-0000-000000000005', 'Ciprofloxacin', '500mg', 'Tablet', 'tablet', 10, 50, TRUE),
  ('b0000000-0000-0000-0000-000000000006', 'Oral Rehydration Salts (ORS)', '20.5g', 'Sachet', 'sachet', 50, 100, TRUE),
  ('b0000000-0000-0000-0000-000000000007', 'Ibuprofen', '400mg', 'Tablet', 'tablet', 100, 100, TRUE),
  ('b0000000-0000-0000-0000-000000000008', 'Azithromycin', '500mg', 'Tablet', 'tablet', 3, 30, TRUE)
ON CONFLICT (name, strength, dosage_form) DO NOTHING;
