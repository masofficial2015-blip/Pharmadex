-- ==============================================================================
-- PHARMADEX-2: MIGRATION 008 - BRAND UNIQUENESS & INITIAL STOCK IMPORT
-- ==============================================================================

-- 1. UPDATE UNIQUE CONSTRAINT TO INCLUDE BRAND NAME
ALTER TABLE medicines DROP CONSTRAINT IF EXISTS uq_medicine_identity;
ALTER TABLE medicines ADD CONSTRAINT uq_medicine_identity 
  UNIQUE NULLS NOT DISTINCT (name, brand_name, strength, dosage_form);

-- 2. CLEAN SLATE TEST DATA WIPE (RETAINING ADMIN & USER PROFILES)
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

-- 3. INSERT 202 VERIFIED MEDICINES & THEIR INITIAL BATCHES
DO $$
DECLARE
  v_admin_id UUID;
  v_med_id UUID;
  v_batch_id UUID;
BEGIN
  -- Obtain primary admin profile ID for received_by and audit logs
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'ADMIN' LIMIT 1;
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM profiles LIMIT 1;
  END IF;

  -- Item #1: Acyclovir (200mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Acyclovir', 'Dancy', '200mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #2: Adrenaline (1mg/1ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Adrenaline', 'CAREDRENA', '1mg/1ml', 'Injection',
    'ampoule', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 200, 200, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 200,
    0, 200, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #3: albendazole (400mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'albendazole', 'Nubend-400', '400mg', 'Tablet',
    'tablet', 'Box', 20,
    'BLISTER_BOX', 20, 1, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 24, 24, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 24,
    0, 24, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #4: Aluminum Hydroxide + Magnesium Hydroxide + Simethicone (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Aluminum Hydroxide + Magnesium Hydroxide + Simethicone', 'Peptico', 'Standard', 'Suspension',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 3, 3, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 3,
    0, 3, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #5: Amitriptyline (25 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Amitriptyline', 'Amileb-25', '25 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1800, 1800, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1800,
    0, 1800, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #6: Amitriptyline (25 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Amitriptyline', 'Amirol 25 mg', '25 mg', 'Tablet',
    'tablet', 'Box', 20,
    'BLISTER_BOX', 2, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 180, 180, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 180,
    0, 180, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #7: Amlodipine (10 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Amlodipine', 'Adipin', '10 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #8: Amlodipine (5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Amlodipine', 'Adipin', '5 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #9: Amoxicillin (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Amoxicillin', 'MILOXY-500', '500 mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 200, 200, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 200,
    0, 200, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #10: Amoxicillin (250 mg / 5 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Amoxicillin', 'Medomox 250', '250 mg / 5 ml', 'Suspension',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 10, 10, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 10,
    0, 10, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #11: Amoxicillin + Clavulanic Acid (400 mg / 57 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Amoxicillin + Clavulanic Acid', 'AMOKLAVIN-BID', '400 mg / 57 mg', 'Suspension',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 7, 7, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 7,
    0, 7, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #12: Amoxicillin + Clavulanic Acid (1000 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Amoxicillin + Clavulanic Acid', 'Amoklavin-BID', '1000 mg', 'Tablet',
    'tablet', 'Box', 14,
    'BLISTER_BOX', 2, 7, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-04-30', 0.00,
    0.00, 0.00, 1106, 1106, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1106,
    0, 1106, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #13: Amoxicillin + Clavulanic Acid (1000 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Amoxicillin + Clavulanic Acid', 'Klamoks BID', '1000 mg', 'Tablet',
    'tablet', 'Box', 14,
    'BLISTER_BOX', 2, 7, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 224, 224, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 224,
    0, 224, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #14: Amoxicillin + Clavulanic Acid (1000 mg / 125 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Amoxicillin + Clavulanic Acid', 'AmoxiClav-Denk', '1000 mg / 125 mg', 'Tablet',
    'tablet', 'Box', 12,
    'BLISTER_BOX', 2, 6, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 96, 96, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 96,
    0, 96, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #15: Artesunate (120 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Artesunate', 'ArtiGo-120', '120 mg', 'Injection',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 6, 6, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 6,
    0, 6, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #16: Artesunate (120 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Artesunate', 'ArtiGo-120', '120 mg', 'Tablet',
    'tablet', 'Box', 24,
    'BLISTER_BOX', 2, 12, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 24, 24, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 24,
    0, 24, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #17: Aspirin (81 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Aspirin', 'Espirin', '81 mg', 'Tablet',
    'tablet', 'Box', 200,
    'BLISTER_BOX', 10, 20, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #18: Atenolol (50 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Atenolol', 'Ateleb', '50 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1000, 1000, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1000,
    0, 1000, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #19: Atorvastatin (40 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Atorvastatin', 'Vastpin', '40 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #20: Atorvastatin (40 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Atorvastatin', 'Ateroz', '40 mg', 'Tablet',
    'tablet', 'Box', 30,
    'BLISTER_BOX', 3, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 180, 180, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 180,
    0, 180, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #21: Azithromycin (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Azithromycin', 'Azithromycin Tablets USP', '500 mg', 'Tablet',
    'tablet', 'Box', 30,
    'BLISTER_BOX', 10, 3, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 660, 660, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 660,
    0, 660, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #22: Azithromycin (200 mg / 5 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Azithromycin', 'AZITO', '200 mg / 5 ml', 'Suspension',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 6, 6, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 6,
    0, 6, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #23: Azithromycin (200 mg / 5 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Azithromycin', 'Myriazee', '200 mg / 5 ml', 'Suspension',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;

  -- Item #24: Bandage (Sterilsed)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Bandage', NULL, 'Sterilsed', 'Medical Supplies',
    'piece', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 13, 13, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 13,
    0, 13, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #25: Bandage (Gause)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Bandage', NULL, 'Gause', 'Medical Supplies',
    'piece', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 30, 30, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 30,
    0, 30, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #26: Bandage (Elastic)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Bandage', NULL, 'Elastic', 'Medical Supplies',
    'piece', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 8, 8, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 8,
    0, 8, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #27: Betamethasone Valerate (0.1% w/w)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Betamethasone Valerate', 'BETNORAN', '0.1% w/w', 'Cream',
    'tube', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-02-28', 0.00,
    0.00, 0.00, 3, 3, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 3,
    0, 3, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #28: Bisacodyl (5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Bisacodyl', 'Biscoffex', '5 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 500, 500, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 500,
    0, 500, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #29: Calcium + Vitamin D3 (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Calcium + Vitamin D3', 'Calcivita Forte', 'Standard', 'Tablet',
    'tablet/capsule', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1, 1, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1,
    0, 1, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #30: Calcium + Vitamin D3 (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Calcium + Vitamin D3', 'Cal D Lift', 'Standard', 'Tablet',
    'tablet', 'Box', 20,
    'BLISTER_BOX', 1, 20, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1040, 1040, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1040,
    0, 1040, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #31: Calcium Gluconate (Not specified)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Calcium Gluconate', 'CALCIUM GLUCONATE INJECTION I.P.', 'Not specified', 'Injection',
    'ampoule', 'Box', 50,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 950, 950, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 950,
    0, 950, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #32: Carbamazepine (200 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Carbamazepine', 'Medazapine 200', '200 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #33: Carbidopa + Levodopa (25 mg + 250 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Carbidopa + Levodopa', 'CONFUNDUS', '25 mg + 250 mg', 'Tablet',
    'tablet', 'Box', 30,
    'BLISTER_BOX', 3, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #34: Castor Oil (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Castor Oil', 'Castril', 'Standard', 'Liquid',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-04-30', 0.00,
    0.00, 0.00, 3, 3, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 3,
    0, 3, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #35: Foley Catheter (16(2way))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Foley Catheter', NULL, '16(2way)', 'Medical Supplies',
    'piece', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 10, 10, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 10,
    0, 10, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #36: Foley Catheter (24(2way))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Foley Catheter', NULL, '24(2way)', 'Medical Supplies',
    'piece', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;

  -- Item #37: Foley Catheter (18(2way))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Foley Catheter', NULL, '18(2way)', 'Medical Supplies',
    'piece', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 8, 8, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 8,
    0, 8, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #38: Foley Catheter (22(3way))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Foley Catheter', NULL, '22(3way)', 'Medical Supplies',
    'piece', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 2, 2, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 2,
    0, 2, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #39: Foley Catheter (22(2way))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Foley Catheter', NULL, '22(2way)', 'Medical Supplies',
    'piece', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 4, 4, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 4,
    0, 4, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #40: Foley Catheter (24(3way))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Foley Catheter', NULL, '24(3way)', 'Medical Supplies',
    'piece', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 5, 5, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 5,
    0, 5, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #41: Cefalexin (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Cefalexin', 'BRULEXIN-500', '500 mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 70, 70, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 70,
    0, 70, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #42: Ceftazidime (1 g)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ceftazidime', 'KEFDIME', '1 g', 'Injection',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 36, 36, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 36,
    0, 36, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #43: Ceftriaxone (1 g)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ceftriaxone', 'MONOPIL 1000', '1 g', 'Injection',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 192, 192, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 192,
    0, 192, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #44: Ceftriaxone (1 g)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ceftriaxone', 'Xoraxon', '1 g', 'Injection',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 38, 38, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 38,
    0, 38, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #45: Ceftriaxone (1 g)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ceftriaxone', 'DESEFIN', '1 g', 'Injection',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 20, 20, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 20,
    0, 20, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #46: Cefuroxime Axetil (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Cefuroxime Axetil', 'CEFAKS 500 mg', '500 mg', 'Tablet',
    'tablet', 'Box', 10,
    'BLISTER_BOX', 1, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 70, 70, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 70,
    0, 70, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #47: Cefuroxime Axetil (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Cefuroxime Axetil', 'Cefutil', '500 mg', 'Tablet',
    'tablet', 'Box', 10,
    'BLISTER_BOX', 1, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1340, 1340, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1340,
    0, 1340, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #48: Cetirizine Hydrochloride (10 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Cetirizine Hydrochloride', 'ZETOP', '10 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #49: Chlordiazepoxide + Clidinium Bromide (5 mg / 2.5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Chlordiazepoxide + Clidinium Bromide', 'Librax', '5 mg / 2.5 mg', 'Tablet',
    'strip', 'Box', 30,
    'BLISTER_BOX', 30, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 330, 330, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 330,
    0, 330, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #50: Chloroquine Phosphate (250 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Chloroquine Phosphate', 'Malavis', '250 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-07-31', 0.00,
    0.00, 0.00, 200, 200, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 200,
    0, 200, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #51: Chlorpheniramine Maleate (4 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Chlorpheniramine Maleate', 'CORAL''S CPM', '4 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #52: Choice (Oral Contraceptive) (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Choice (Oral Contraceptive)', NULL, 'Standard', 'Tablet',
    'unit', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 87, 87, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 87,
    0, 87, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #53: Cimetidine (200mg/2ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Cimetidine', 'CIMETIDINE INJECTION B.P.', '200mg/2ml', 'Injection',
    'ampoule', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 600, 600, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 600,
    0, 600, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #54: Ciprofloxacin (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ciprofloxacin', 'Zindolin 500 mg', '500 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 200, 200, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 200,
    0, 200, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #55: Ciprofloxacin (200 mg / 100 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ciprofloxacin', 'Ciprogyl', '200 mg / 100 ml', 'Injection',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 67, 67, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 67,
    0, 67, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #56: Clotrimazole (100 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Clotrimazole', 'CLOTRISAN V6 vaginal', '100 mg', 'Tablet',
    'tablet', 'Box', 6,
    'BLISTER_BOX', 1, 6, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-08-31', 0.00,
    0.00, 0.00, 60, 60, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 60,
    0, 60, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #57: Cloxacillin Sodium (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Cloxacillin Sodium', 'CLOXAVID-500', '500 mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 500, 500, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 500,
    0, 500, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #58: Distilled Water for IV (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Distilled Water for IV', NULL, 'Standard', 'Injection',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 11, 11, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 11,
    0, 11, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #59: Dexamethasone (4 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Dexamethasone', 'DEXOVEX', '4 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;

  -- Item #60: Dexamethasone (0.5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Dexamethasone', 'DEXOVEX', '0.5 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1000, 1000, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1000,
    0, 1000, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #61: dexamethasone (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'dexamethasone', NULL, 'Standard', 'Eye Drops',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 5, 5, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 5,
    0, 5, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #62: Dexamethasone Phosphate (4 mg/ml (8 mg/2 ml))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Dexamethasone Phosphate', 'Ino-Dexason', '4 mg/ml (8 mg/2 ml)', 'Injection',
    'ampoule', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 29, 29, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 29,
    0, 29, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #63: Dextromethorphan Hydrobromide (15 mg / 5 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Dextromethorphan Hydrobromide', 'Dephan', '15 mg / 5 ml', 'Syrup',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 6, 6, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 6,
    0, 6, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #64: Dextrose (40% w/v (20 ml))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Dextrose', 'Dextrose Injection USP 40%', '40% w/v (20 ml)', 'Injection',
    'ampoule', 'Box', 50,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 70, 70, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 70,
    0, 70, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #65: Diclofenac Sodium (1% w/w)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Diclofenac Sodium', 'Relaxo', '1% w/w', 'Ointment',
    'tube', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 7, 7, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 7,
    0, 7, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #66: Diclofenac Sodium (75 mg/3 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Diclofenac Sodium', 'Indol', '75 mg/3 ml', 'Injection',
    'ampoule', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 80, 80, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 80,
    0, 80, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #67: Diclofenac Sodium (75 mg/3 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Diclofenac Sodium', 'EPIFENAC', '75 mg/3 ml', 'Injection',
    'ampoule', 'Box', 3,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 213, 213, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 213,
    0, 213, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #68: Diclofenac Sodium (Not specified)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Diclofenac Sodium', 'Regunac', 'Not specified', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 180, 180, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 180,
    0, 180, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #69: Digoxin (0.25 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Digoxin', 'Lidoxin-0.25', '0.25 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;

  -- Item #70: Dimenhydrinate (50 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Dimenhydrinate', 'Dizinil', '50 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 530, 530, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 530,
    0, 530, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #71: Disposable Syringe with Needle (3 ml (21G x 1 1/2"))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Disposable Syringe with Needle', 'JANUS MEDITECH PLC', '3 ml (21G x 1 1/2")', 'Medical Supplies',
    'piece', 'Box', 100,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 20, 20, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 20,
    0, 20, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #72: Disposable Syringe with Needle (1ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Disposable Syringe with Needle', NULL, '1ml', 'Medical Supplies',
    'piece', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 38, 38, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 38,
    0, 38, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #73: Disposable Syringe with Needle (5 ml (21G x 1 1/2"))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Disposable Syringe with Needle', 'Zibo Eastmed', '5 ml (21G x 1 1/2")', 'Medical Supplies',
    'piece', 'Box', 100,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1015, 1015, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1015,
    0, 1015, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #74: Disposable Syringe with Needle (10 ml (21G x 1 1/2"))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Disposable Syringe with Needle', 'Quick Pharmaceuticals', '10 ml (21G x 1 1/2")', 'Medical Supplies',
    'piece', 'Box', 100,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1300, 1300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1300,
    0, 1300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #75: Disposable Syringe with Needle (50 ml (21G x 1 1/2"))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Disposable Syringe with Needle', 'Quick Pharmaceuticals', '50 ml (21G x 1 1/2")', 'Medical Supplies',
    'piece', 'Box', 25,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 27, 27, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 27,
    0, 27, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #76: Disposable Syringe with Needle (20 ml (21G x 1 1/2"))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Disposable Syringe with Needle', 'Quick Pharmaceuticals', '20 ml (21G x 1 1/2")', 'Medical Supplies',
    'piece', 'Box', 50,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 50, 50, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 50,
    0, 50, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #77: Dextrose Normal Saline (DNS) (5% Dextrose + 0.9% NaCl)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Dextrose Normal Saline (DNS)', NULL, '5% Dextrose + 0.9% NaCl', 'Injection',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 5, 5, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 5,
    0, 5, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #78: Doxycycline (100 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Doxycycline', 'DORCY', '100 mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #79: Enalapril Maleate (5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Enalapril Maleate', 'Envas', '5 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-05-31', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #80: Enalapril Maleate (10 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Enalapril Maleate', 'Envas', '10 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;

  -- Item #81: Esomeprazole (40 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Esomeprazole', 'Eselan', '40 mg', 'Ampule',
    'ampoule', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 43, 43, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 43,
    0, 43, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #82: Esomeprazole (20 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Esomeprazole', 'Nexium 20', '20 mg', 'Tablet',
    'tablet', 'Box', 14,
    'BLISTER_BOX', 2, 7, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 14, 14, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 14,
    0, 14, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #83: Esomeprazole (40 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Esomeprazole', 'Nexium 40', '40 mg', 'Tablet',
    'tablet', 'Box', 14,
    'BLISTER_BOX', 2, 7, 10
  ) RETURNING id INTO v_med_id;

  -- Item #84: Fluconazole (150 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Fluconazole', 'Uzon', '150 mg', 'Tablet',
    'tablet', 'Box', 10,
    'BLISTER_BOX', 10, 1, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 6, 6, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 6,
    0, 6, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #85: Fluoxetine (20 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Fluoxetine', 'FLUXISCOT-20', '20 mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #86: Folic Acid (5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Folic Acid', 'Folic-SSP 5', '5 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #87: Folic Acid (5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Folic Acid', 'FOLIVE', '5 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;

  -- Item #88: Formalin Solution (5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Formalin Solution', NULL, '5 mg', 'Liquid',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;

  -- Item #89: Furosemide (40 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Furosemide', 'Furoscot', '40 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 5800, 5800, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 5800,
    0, 5800, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #90: Furosemide (40 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Furosemide', 'Fusix', '40 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1200, 1200, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1200,
    0, 1200, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #91: Furosemide (40 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Furosemide', 'Fermi', '40 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;

  -- Item #92: Furosemide (20 mg/2 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Furosemide', 'Fermi', '20 mg/2 ml', 'Injection',
    'ampoule', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;

  -- Item #93: Gabapentin (300mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Gabapentin', 'Glabazep-300', '300mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #94: Gentamicin (80 mg/2 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Gentamicin', 'Getxin', '80 mg/2 ml', 'Injection',
    'ampoule', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;

  -- Item #95: Glibenclamide (5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Glibenclamide', 'Glibenclamide', '5 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1500, 1500, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1500,
    0, 1500, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #96: Griseofulvin (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Griseofulvin', 'Griseben-500', '500 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 10, 10, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 10,
    0, 10, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #97: Hydrogen Peroxide (H2O2) (20 mg/ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Hydrogen Peroxide (H2O2)', 'HYOPIL', '20 mg/ml', 'Liquid',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 14, 14, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 14,
    0, 14, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #98: Haloperidol (5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Haloperidol', 'SCOPERIDOL-5', '5 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 200, 200, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 200,
    0, 200, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #99: HCG Pregnancy Test Strip (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'HCG Pregnancy Test Strip', NULL, 'Standard', 'Medical Supplies',
    'piece', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 20, 20, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 20,
    0, 20, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #100: Heparin (5ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Heparin', 'Hparin Injection BP', '5ml', 'Injection',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 9, 9, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 9,
    0, 9, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #101: Hydrochlorothiazide (25 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Hydrochlorothiazide', 'Hydrochlorothiazide', '25 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #102: Hydrocortisone Acetate (1%)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Hydrocortisone Acetate', 'E-Cort', '1%', 'Cream',
    'tube', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 10, 10, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 10,
    0, 10, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #103: Hydrocortisone Sodium Succinate (100 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Hydrocortisone Sodium Succinate', 'BIOSONE', '100 mg', 'Injection',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 19, 19, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 19,
    0, 19, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #104: Hydroxyprogesterone Caproate (250 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Hydroxyprogesterone Caproate', 'PREGSAVE-250', '250 mg', 'Injection',
    'ampoule', 'Box', 3,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 24, 24, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 24,
    0, 24, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #105: Hyoscine Butylbromide (10 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Hyoscine Butylbromide', 'Hakali', '10 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-01-31', 0.00,
    0.00, 0.00, 500, 500, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 500,
    0, 500, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #106: Hyoscine Butylbromide (20 mg/ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Hyoscine Butylbromide', 'HYOPIL', '20 mg/ml', 'Injection',
    'ampoule', 'Box', 50,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 24, 24, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 24,
    0, 24, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #107: Ibuprofen (400 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ibuprofen', 'Ibuprofen Denk', '400 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 2900, 2900, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 2900,
    0, 2900, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #108: Ibuprofen (400 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ibuprofen', 'Gofen', '400 mg', 'Capsule',
    'capsule', 'Box', 60,
    'BLISTER_BOX', 6, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 660, 660, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 660,
    0, 660, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #109: Ibuprofen (400 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ibuprofen', 'Gesic ADL', '400 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #110: Indomethacin (100 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Indomethacin', 'Indocor', '100 mg', 'Suppository',
    'suppository', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 40, 40, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 40,
    0, 40, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #111: Indomethacin (25 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Indomethacin', 'Indol', '25 mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #112: Iron + Folic Acid + Vitamin B12 + Minerals (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Iron + Folic Acid + Vitamin B12 + Minerals', 'HAEM UP', 'Standard', 'Liquid',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 26, 26, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 26,
    0, 26, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #113: IV Cannula (24G (0.7 x 19 mm))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'IV Cannula', 'Angeltouch', '24G (0.7 x 19 mm)', 'Medical Supplies',
    'piece', 'Box', 100,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 50, 50, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 50,
    0, 50, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #114: IV Cannula (20G (1.1 x 33 mm))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'IV Cannula', 'Angeltouch', '20G (1.1 x 33 mm)', 'Medical Supplies',
    'piece', 'Box', 100,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 10, 10, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 10,
    0, 10, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #115: IV Cannula (18G (1.3 x 45 mm))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'IV Cannula', 'Angeltouch', '18G (1.3 x 45 mm)', 'Medical Supplies',
    'piece', 'Box', 100,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 150, 150, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 150,
    0, 150, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #116: IV Cannula (22G (0.9 x 25 mm))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'IV Cannula', 'PRIMAFLON', '22G (0.9 x 25 mm)', 'Medical Supplies',
    'piece', 'Box', 100,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 150, 150, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 150,
    0, 150, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #117: Ketoconazole (2% W/V)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ketoconazole', 'Ketoconazole Shampoo BP 2% W/V', '2% W/V', 'Shampoo',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 3, 3, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 3,
    0, 3, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #118: Ketoconazole (2% w/w)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ketoconazole', 'KETCO', '2% w/w', 'Cream',
    'tube', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 8, 8, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 8,
    0, 8, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #119: Labetalol (4 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Labetalol', 'LABETALOL INJECTION I.P.', '4 ml', 'Injection',
    'ampoule', 'Box', 5,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 50, 50, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 50,
    0, 50, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #120: Latex Examination Gloves (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Latex Examination Gloves', NULL, 'Standard', 'Medical Supplies',
    'piece', 'Box', 100,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1000, 1000, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1000,
    0, 1000, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #121: lidocaine (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'lidocaine', NULL, 'Standard', 'Injection',
    'vial', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 6, 6, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 6,
    0, 6, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #122: Loratadine (10 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Loratadine', 'G-Lorat', '10 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #123: Lugol's Iodine Solution (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Lugol''s Iodine Solution', NULL, 'Standard', 'Liquid',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 7, 7, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 7,
    0, 7, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #124: Mebendazole (100 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Mebendazole', 'Imatox', '100 mg', 'Tablet',
    'tablet', 'Box', 6,
    'BLISTER_BOX', 1, 6, 10
  ) RETURNING id INTO v_med_id;

  -- Item #125: Mebendazole (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Mebendazole', 'Vermorex', 'Standard', 'Suspension',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 19, 19, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 19,
    0, 19, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #126: Meloxicam (15 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Meloxicam', 'Meloxicam', '15 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;

  -- Item #127: Meloxicam (Not specified)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Meloxicam', 'Ziarth', 'Not specified', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #128: Metformin HCl (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Metformin HCl', 'Glyformin', '500 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 700, 700, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 700,
    0, 700, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #129: Metformin HCl (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Metformin HCl', 'Formentin', '500 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 100, 100, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 100,
    0, 100, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #130: Metformin HCl (1000 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Metformin HCl', 'Glifor', '1000 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 700, 700, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 700,
    0, 700, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #131: Methotrexate (2.5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Methotrexate', 'Gintrex-2.5', '2.5 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 900, 900, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 900,
    0, 900, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #132: Methylprednisolone Acetate (40 mg / ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Methylprednisolone Acetate', 'EPIZOLONE-DEPOT', '40 mg / ml', 'Injection',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 12, 12, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 12,
    0, 12, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #133: Metoclopramide (10 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Metoclopramide', 'Regulix', '10 mg', 'Injection',
    'ampoule', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 100, 100, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 100,
    0, 100, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #134: Metoclopramide (10 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Metoclopramide', 'Regurg', '10 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1000, 1000, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1000,
    0, 1000, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #135: Metronidazole (250 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Metronidazole', 'Metronidazole Capsules USP', '250 mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #136: Metronidazole (500 mg / 100 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Metronidazole', 'metrogyl', '500 mg / 100 ml', 'Injection',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 127, 127, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 127,
    0, 127, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #137: Mometasone Furoate (0.10%)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Mometasone Furoate', 'Mometasone Furoate Cream USP', '0.10%', 'Cream',
    'tube', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 12, 12, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 12,
    0, 12, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #138: Morphine Sulfate (10mg in 1ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Morphine Sulfate', 'Morphine Sulfate 10mg in 1ml Solution for Injection', '10mg in 1ml', 'Injection',
    'ampoule', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 200, 200, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 200,
    0, 200, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #139: Multivitamin + Cod Liver Oil + Calcium (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Multivitamin + Cod Liver Oil + Calcium', 'SANBE KIDS', 'Standard', 'Suspension',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1, 1, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1,
    0, 1, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #140: Multivitamin and Mineral (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Multivitamin and Mineral', 'G-Vit', 'Standard', 'Syrup',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 4, 4, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 4,
    0, 4, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #141: Multivitamin and Mineral (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Multivitamin and Mineral', 'MEGA We care PRENATAL', 'Standard', 'Capsule',
    'capsule', 'Box', 30,
    'BLISTER_BOX', 3, 10, 10
  ) RETURNING id INTO v_med_id;

  -- Item #142: Nasogastric (NG) Tube (16)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Nasogastric (NG) Tube', NULL, '16', 'Medical Supplies',
    'piece', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 15, 15, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 15,
    0, 15, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #143: Nasogastric (NG) Tube (18)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Nasogastric (NG) Tube', NULL, '18', 'Medical Supplies',
    'piece', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 20, 20, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 20,
    0, 20, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #144: Nasogastric (NG) Tube (6)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Nasogastric (NG) Tube', NULL, '6', 'Medical Supplies',
    'piece', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 3, 3, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 3,
    0, 3, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #145: Nasogastric (NG) Tube (8)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Nasogastric (NG) Tube', NULL, '8', 'Medical Supplies',
    'piece', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 10, 10, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 10,
    0, 10, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #146: Nitrofurazone (0.20%)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Nitrofurazone', 'Nitrofurazone Ointment', '0.20%', 'Ointment',
    'tube', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 10, 10, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 10,
    0, 10, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #147: Artificial Tears (Normo Tear) (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Artificial Tears (Normo Tear)', 'artificial tear', 'Standard', 'Eye Drops',
    'tube', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 4, 4, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 4,
    0, 4, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #148: Normal Saline (NS) (0.9% NaCl)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Normal Saline (NS)', NULL, '0.9% NaCl', 'Injection',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 174, 174, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 174,
    0, 174, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #149: Omeprazole (20 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Omeprazole', 'PRAZIM 20', '20 mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 200, 200, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 200,
    0, 200, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #150: Omeprazole (20 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Omeprazole', 'Medoprazole', '20 mg', 'Capsule',
    'capsule', 'Box', 20,
    'BLISTER_BOX', 2, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 60, 60, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 60,
    0, 60, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #151: Omeprazole Sodium (40 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Omeprazole Sodium', 'OMIGUT', '40 mg', 'Injection',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 19, 19, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 19,
    0, 19, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #152: Ondansetron (4 mg/2 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ondansetron', 'ONDAPIL', '4 mg/2 ml', 'Injection',
    'ampoule', 'Box', 50,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #153: Oral Rehydration Salts (ORS) (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Oral Rehydration Salts (ORS)', NULL, 'Standard', 'Medical Supplies',
    'sachet', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 26, 26, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 26,
    0, 26, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #154: Pantoprazole (40 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Pantoprazole', 'Ulcer-X', '40 mg', 'Tablet',
    'tablet', 'Box', 14,
    'BLISTER_BOX', 1, 14, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 294, 294, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 294,
    0, 294, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #155: Pantoprazole (20 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Pantoprazole', 'Pandev 20 mg', '20 mg', 'Tablet',
    'tablet', 'Box', 28,
    'BLISTER_BOX', 4, 7, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1736, 1736, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1736,
    0, 1736, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #156: Pantoprazole (40 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Pantoprazole', 'Pandev 40 mg', '40 mg', 'Tablet',
    'tablet', 'Box', 14,
    'BLISTER_BOX', 2, 7, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1316, 1316, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1316,
    0, 1316, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #157: Pantoprazole (40 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Pantoprazole', 'PANOCER 40 mg', '40 mg', 'Tablet',
    'tablet', 'Box', 28,
    'BLISTER_BOX', 2, 14, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 532, 532, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 532,
    0, 532, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #158: Paracetamol (120 mg / 5 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Paracetamol', 'PARAKANT', '120 mg / 5 ml', 'Syrup',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1, 1, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1,
    0, 1, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #159: Paracetamol (125 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Paracetamol', 'PORO', '125 mg', 'Suppository',
    'suppositories', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 10, 10, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 10,
    0, 10, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #160: Paracetamol (250 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Paracetamol', 'PORO', '250 mg', 'Suppository',
    'suppositories', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 10, 10, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 10,
    0, 10, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #161: Paracetamol (Not specified)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Paracetamol', 'Ipimol IV', 'Not specified', 'Vial',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 157, 157, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 157,
    0, 157, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #162: Paracetamol (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Paracetamol', 'Panadol Advance', '500 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #163: paracetamol (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'paracetamol', NULL, 'Standard', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 930, 930, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 930,
    0, 930, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #164: Phenobarbitone (100 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Phenobarbitone', 'Barbeph', '100 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 100, 100, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 100,
    0, 100, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #165: Phytomenadione (Vitamin K1) (1mg / 0.5 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Phytomenadione (Vitamin K1)', 'KENAJECT', '1mg / 0.5 ml', 'Injection',
    'ampoule', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #166: Postpill (Emergency Contraceptive) (1.5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Postpill (Emergency Contraceptive)', NULL, '1.5 mg', 'Tablet',
    'unit', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 49, 49, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 49,
    0, 49, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #167: Praziquantel (600 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Praziquantel', 'PZQ', '600 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 80, 80, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 80,
    0, 80, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #168: Praziquantel (100 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Praziquantel', 'SUMAFIX 100', '100 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 80, 80, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 80,
    0, 80, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #169: Prednisolone (5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Prednisolone', 'Predleb-5 DT', '5 mg', 'Tablet',
    'tablet', 'Box', 200,
    'BLISTER_BOX', 20, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1940, 1940, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1940,
    0, 1940, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #170: Prednisolone (5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Prednisolone', 'Ephazol', '5 mg', 'Tablet',
    'tablet', 'Box', 1000,
    'BLISTER_BOX', 100, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 880, 880, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 880,
    0, 880, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #171: Pregabalin (75 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Pregabalin', 'Prebel-75', '75 mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #172: Pristeen Surgical Gloves (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Pristeen Surgical Gloves', NULL, 'Standard', 'Medical Supplies',
    'pair', 'Box', 50,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 200, 200, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 200,
    0, 200, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #173: Propranolol (40mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Propranolol', 'Arteflo', '40mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #174: Propylthiouracil (50 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Propylthiouracil', 'Prothyrod', '50 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1340, 1340, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1340,
    0, 1340, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #175: Rectal Tube (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Rectal Tube', NULL, 'Standard', 'Medical Supplies',
    'piece', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 4, 4, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 4,
    0, 4, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #176: Risperidone (4 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Risperidone', 'RISPER-4', '4 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 30, 30, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 30,
    0, 30, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #177: Risperidone (2 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Risperidone', 'RISPER-4', '2 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 500, 500, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 500,
    0, 500, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #178: Ringer's Lactate (RL) (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ringer''s Lactate (RL)', NULL, 'Standard', 'Injection',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 22, 22, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 22,
    0, 22, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #179: Rosuvastatin (20 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Rosuvastatin', 'Rostat', '20 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #180: Salbutamol (2 mg / 5 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Salbutamol', 'Yoxsen', '2 mg / 5 ml', 'Syrup',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-04-30', 0.00,
    0.00, 0.00, 5, 5, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 5,
    0, 5, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #181: Salbutamol (100 mcg / dose)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Salbutamol', 'SALBUTOL', '100 mcg / dose', 'Inhaler',
    'inhaler', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 11, 11, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 11,
    0, 11, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #182: Salbutamol (4 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Salbutamol', 'SALBUTAMOL Tablets BP', '4 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #183: Sildenafil (50 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Sildenafil', 'Dzire', '50 mg', 'Tablet',
    'tablet', 'Box', 80,
    'BLISTER_BOX', 20, 4, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-08-31', 0.00,
    0.00, 0.00, 104, 104, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 104,
    0, 104, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #184: Spironolactone (25 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Spironolactone', 'Cardione', '25 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #185: Sterile Water for Injection (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Sterile Water for Injection', 'Recowater-10', 'Standard', 'Injection',
    'ampoule', 'Box', 100,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 1000, 1000, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 1000,
    0, 1000, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #186: Sulfamethoxazole + Trimethoprim (240 mg / 5 ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Sulfamethoxazole + Trimethoprim', 'Paediatric Co-Trimoxazole', '240 mg / 5 ml', 'Suspension',
    'bottle', 'Bottle', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 91, 91, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 91,
    0, 91, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #187: Tamsulosin Hydrochloride (0.4 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Tamsulosin Hydrochloride', NULL, '0.4 mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 800, 800, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 800,
    0, 800, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #188: Tenofovir Disoproxil Fumarate (300 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Tenofovir Disoproxil Fumarate', 'Tenofovir Disoproxil Fumarate', '300 mg', 'Tablet',
    'tablet', 'Box', 30,
    'BLISTER_BOX', 1, 30, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 330, 330, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 330,
    0, 330, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #189: Terbinafine (Terbonile) (250 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Terbinafine (Terbonile)', '250mg', '250 mg', 'Tablet',
    'unit', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;

  -- Item #190: Tetracycline Hydrochloride (1% (4 g))
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Tetracycline Hydrochloride', 'TETRACYCLINE EYE OINTMENT', '1% (4 g)', 'Ointment',
    'tube', 'Box', 50,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-04-30', 0.00,
    0.00, 0.00, 350, 350, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 350,
    0, 350, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #191: Tinidazole (Tidazol) (500 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Tinidazole (Tidazol)', '500mg', '500 mg', 'Tablet',
    'tablet', 'Box', 240,
    'BLISTER_BOX', 60, 4, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 200, 200, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 200,
    0, 200, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #192: Tramadol HCl (50 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Tramadol HCl', 'Riseol', '50 mg', 'Capsule',
    'capsule', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 400, 400, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 400,
    0, 400, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #193: Tramadol HCl (50 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Tramadol HCl', 'Riseol', '50 mg', 'Injection',
    'vial', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 350, 350, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 350,
    0, 350, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #194: Urine Drainage Bag (Standard)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Urine Drainage Bag', NULL, 'Standard', 'Medical Supplies',
    'piece', 'Box', 10,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 30, 30, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 30,
    0, 30, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #195: Vancomycin Hydrochloride (1000 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Vancomycin Hydrochloride', 'Vancoscot', '1000 mg', 'Injection',
    'vial', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 45, 45, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 45,
    0, 45, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #196: Vitamin B Complex (B1 20mg, B2 2mg, B6 2mg, Niacinamide 30mg, Cal. pantothenate 1mg / 2ml)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Vitamin B Complex', 'Complex Vitamin B Injection', 'B1 20mg, B2 2mg, B6 2mg, Niacinamide 30mg, Cal. pantothenate 1mg / 2ml', 'Injection',
    'ampoule', 'Box', 100,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 14000, 14000, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 14000,
    0, 14000, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #197: Vitamin B1 + B6 + B12 (100 mg / 200 mg / 200 mcg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Vitamin B1 + B6 + B12', 'Revamp', '100 mg / 200 mg / 200 mcg', 'Capsule',
    'capsule', 'Box', 30,
    'BLISTER_BOX', 3, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 240, 240, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 240,
    0, 240, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #198: Vitamin B1 + B6 + B12 (100 mg / 200 mg / 1000 mcg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Vitamin B1 + B6 + B12', 'NEUROSCOT FORTE', '100 mg / 200 mg / 1000 mcg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 500, 500, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 500,
    0, 500, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #199: Vitamin D3 (50000 IU)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Vitamin D3', 'KEL-D3', '50000 IU', 'Tablet',
    'tablet', 'Box', 40,
    'BLISTER_BOX', 4, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 160, 160, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 160,
    0, 160, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #200: Vitamin D3 (50000 IU)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Vitamin D3', 'Vitamin D3', '50000 IU', 'Capsule',
    'capsule', 'Box', 15,
    'BLISTER_BOX', 1, 15, 10
  ) RETURNING id INTO v_med_id;

  -- Item #201: Warfarin Sodium (5 mg)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Warfarin Sodium', 'Warfarin-SSP', '5 mg', 'Tablet',
    'tablet', 'Box', 100,
    'BLISTER_BOX', 10, 10, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 300, 300, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 300,
    0, 300, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

  -- Item #202: Ciprofloxacin + Dexamethasone (Zoxan-D) (0.3% + 0.1%)
  INSERT INTO medicines (
    name, brand_name, strength, dosage_form, base_unit, pack_label,
    units_per_pack, packaging_type, strips_per_box, tablets_per_strip, low_stock_threshold
  ) VALUES (
    'Ciprofloxacin + Dexamethasone (Zoxan-D)', NULL, '0.3% + 0.1%', 'Eye Drops',
    'tube', 'Box', 1,
    'STANDARD', NULL, NULL, 10
  ) RETURNING id INTO v_med_id;
  INSERT INTO batches (
    medicine_id, batch_number, expiry_date, cost_per_pack,
    selling_price_per_pack, selling_price_per_unit,
    initial_quantity_units, current_quantity_units, received_by
  ) VALUES (
    v_med_id, 'INITIAL-STOCK', '2027-12-25', 0.00,
    0.00, 0.00, 7, 7, v_admin_id
  ) RETURNING id INTO v_batch_id;
  INSERT INTO stock_movements (
    batch_id, medicine_id, movement_type, quantity_units,
    previous_quantity_units, new_quantity_units, reference_type,
    performed_by, notes
  ) VALUES (
    v_batch_id, v_med_id, 'RECEIVE', 7,
    0, 7, 'ADJUSTMENT', v_admin_id, 'Initial pharmacy stock migration'
  );

END $$;

-- 4. REFRESH PERMISSIONS ON VIEW
GRANT SELECT ON view_medicine_inventory_summaries TO authenticated;
