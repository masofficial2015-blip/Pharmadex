'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser, requirePermission, recordAuditLog } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { medicineFormSchema } from '@/lib/validations/inventory';
import type { Medicine, MedicineInventorySummary } from '@/types';

export interface MedicineActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: Medicine;
}

/**
 * Retrieve all medicines with aggregated inventory metrics.
 * Calculates total units in stock (non-expired), active batches,
 * low-stock status, and whether packaging conversion is locked.
 */
export async function getMedicinesWithInventory(): Promise<MedicineInventorySummary[]> {
  await requireUser();
  const adminSupabase = createAdminClient();

  // 1. Optimized Path: Query PostgreSQL aggregation view (Migration 006)
  try {
    const { data: viewData, error: viewError } = await (adminSupabase.from('view_medicine_inventory_summaries') as any)
      .select('*')
      .order('name', { ascending: true });

    if (!viewError && viewData && viewData.length > 0) {
      return viewData as MedicineInventorySummary[];
    }
  } catch (err) {
    // Fall back to direct query if view is not yet applied
  }

  // 2. Fallback Path: Query medicines and active batches with reduced overhead
  const { data: rawMedicines, error: medError } = await adminSupabase
    .from('medicines')
    .select('*')
    .order('name', { ascending: true });

  if (medError || !rawMedicines) {
    console.error('Error fetching medicines:', medError);
    return [];
  }

  const medicines = rawMedicines as unknown as Medicine[];

  // Fetch batches with stock or near expiry
  const { data: rawBatches } = await adminSupabase
    .from('batches')
    .select('id, medicine_id, current_quantity_units, expiry_date');

  // Fetch distinct medicine IDs from stock_movements (bounded check)
  const { data: rawMovements } = await adminSupabase
    .from('stock_movements')
    .select('medicine_id')
    .limit(5000);

  const movementMedicineIds = new Set((rawMovements || []).map((m: { medicine_id: string }) => m.medicine_id));
  const todayStr = new Date().toISOString().split('T')[0];

  const batchesByMedicine = new Map<string, Array<{ current_quantity_units: number; expiry_date: string }>>();
  (rawBatches || []).forEach((b: { id: string; medicine_id: string; current_quantity_units: number; expiry_date: string }) => {
    const list = batchesByMedicine.get(b.medicine_id) || [];
    list.push(b);
    batchesByMedicine.set(b.medicine_id, list);
  });

  return medicines.map((med) => {
    const batches = batchesByMedicine.get(med.id) || [];
    const hasMovements = movementMedicineIds.has(med.id);
    const hasStockTransactions = batches.length > 0 || hasMovements;

    // Sum non-expired quantity
    let totalUnits = 0;
    let activeBatchesCount = 0;
    let earliestExpiry: string | null = null;

    batches.forEach((b) => {
      const isExpired = b.expiry_date <= todayStr;
      if (!isExpired && b.current_quantity_units > 0) {
        totalUnits += b.current_quantity_units;
        activeBatchesCount++;
        if (!earliestExpiry || b.expiry_date < earliestExpiry) {
          earliestExpiry = b.expiry_date;
        }
      }
    });

    const unitsPerPack = med.units_per_pack || 1;
    const totalPacks = Math.floor(totalUnits / unitsPerPack);
    const isLowStock = totalUnits <= (med.low_stock_threshold || 10);

    return {
      ...med,
      brand_name: med.brand_name || null,
      pack_label: med.pack_label || 'Pack',
      total_units_in_stock: totalUnits,
      total_packs_in_stock: totalPacks,
      active_batches_count: activeBatchesCount,
      is_low_stock: isLowStock,
      earliest_expiry_date: earliestExpiry,
      has_stock_transactions: hasStockTransactions,
    };
  });
}

/**
 * Check if a medicine has any recorded stock transactions
 * (batches or stock_movements) that lock its packaging conversion.
 */
export async function checkMedicinePackagingLocked(medicineId: string): Promise<boolean> {
  await requireUser();
  const adminSupabase = createAdminClient();

  const { count: batchCount } = await adminSupabase
    .from('batches')
    .select('id', { count: 'exact', head: true })
    .eq('medicine_id', medicineId);

  if ((batchCount || 0) > 0) return true;

  const { count: movementCount } = await adminSupabase
    .from('stock_movements')
    .select('id', { count: 'exact', head: true })
    .eq('medicine_id', medicineId);

  return (movementCount || 0) > 0;
}

/**
 * Create a new medicine record.
 * Validates input, prevents duplicate combinations, and registers audit log.
 */
export async function createMedicineAction(
  _prevState: MedicineActionResponse | null,
  formData: FormData
): Promise<MedicineActionResponse> {
  const auth = await requirePermission('manage_medicines');
  const adminSupabase = createAdminClient();

  const raw = {
    name: formData.get('name'),
    brand_name: formData.get('brand_name') || '',
    strength: formData.get('strength'),
    dosage_form: formData.get('dosage_form'),
    base_unit: formData.get('base_unit'),
    pack_label: formData.get('pack_label') || 'Box',
    units_per_pack: formData.get('units_per_pack'),
    packaging_type: formData.get('packaging_type') || 'STANDARD',
    strips_per_box: formData.get('strips_per_box') || null,
    tablets_per_strip: formData.get('tablets_per_strip') || null,
    low_stock_threshold: formData.get('low_stock_threshold') || '10',
  };

  const parsed = medicineFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return { error: 'Please correct the errors in the form.', fieldErrors };
  }

  const data = parsed.data;

  // Duplicate Check: same name, strength, dosage_form
  const { data: existing } = await adminSupabase
    .from('medicines')
    .select('id, name, strength, dosage_form, brand_name')
    .ilike('name', data.name)
    .ilike('strength', data.strength)
    .ilike('dosage_form', data.dosage_form);

  if (existing && existing.length > 0) {
    const matched = existing.find(
      (m: { brand_name: string | null }) =>
        (m.brand_name || '').toLowerCase() === (data.brand_name || '').toLowerCase()
    );
    if (matched) {
      return {
        error: `A medicine with name "${data.name} ${data.strength} (${data.dosage_form})"${
          data.brand_name ? ` brand "${data.brand_name}"` : ''
        } already exists.`,
      };
    }
  }

  // Insert payload
  const insertPayload: Record<string, unknown> = {
    name: data.name,
    strength: data.strength,
    dosage_form: data.dosage_form,
    base_unit: data.base_unit.toLowerCase(),
    units_per_pack: data.units_per_pack,
    packaging_type: data.packaging_type || 'STANDARD',
    strips_per_box: data.strips_per_box || null,
    tablets_per_strip: data.tablets_per_strip || null,
    low_stock_threshold: data.low_stock_threshold,
    is_active: true,
  };

  if (data.brand_name) insertPayload.brand_name = data.brand_name;
  if (data.pack_label) insertPayload.pack_label = data.pack_label;

  const { data: createdRaw, error: insertError } = await adminSupabase
    .from('medicines')
    .insert(insertPayload as any)
    .select('*')
    .single();

  if (insertError || !createdRaw) {
    console.error('Failed to create medicine:', insertError);
    return { error: insertError?.message || 'Failed to create medicine.' };
  }

  const createdMedicine = createdRaw as unknown as Medicine;

  await recordAuditLog({
    tableName: 'medicines',
    recordId: createdMedicine.id,
    action: 'INSERT',
    newData: createdMedicine,
    performedBy: auth.userId,
  });

  revalidatePath('/inventory/medicines');
  revalidatePath('/inventory/receive');
  return {
    success: true,
    message: `Medicine "${createdMedicine.name} ${createdMedicine.strength}" created successfully.`,
    data: createdMedicine,
  };
}

/**
 * Update an existing medicine.
 * Strictly verifies whether packaging conversion is locked before allowing
 * changes to `units_per_pack` or `base_unit`.
 */
export async function updateMedicineAction(
  medicineId: string,
  _prevState: MedicineActionResponse | null,
  formData: FormData
): Promise<MedicineActionResponse> {
  const auth = await requirePermission('manage_medicines');
  const adminSupabase = createAdminClient();

  const { data: existingRaw, error: fetchError } = await adminSupabase
    .from('medicines')
    .select('*')
    .eq('id', medicineId)
    .single();

  if (fetchError || !existingRaw) {
    return { error: 'Medicine record not found.' };
  }

  const existing = existingRaw as unknown as Medicine;

  const raw = {
    name: formData.get('name'),
    brand_name: formData.get('brand_name') || '',
    strength: formData.get('strength'),
    dosage_form: formData.get('dosage_form'),
    base_unit: formData.get('base_unit'),
    pack_label: formData.get('pack_label') || 'Box',
    units_per_pack: formData.get('units_per_pack'),
    packaging_type: formData.get('packaging_type') || 'STANDARD',
    strips_per_box: formData.get('strips_per_box') || null,
    tablets_per_strip: formData.get('tablets_per_strip') || null,
    low_stock_threshold: formData.get('low_stock_threshold') || '10',
  };

  const parsed = medicineFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return { error: 'Please correct the errors in the form.', fieldErrors };
  }

  const data = parsed.data;

  // PACKAGING CONVERSION LOCK CHECK
  const isLocked = await checkMedicinePackagingLocked(medicineId);
  if (isLocked) {
    const unitsChanged = Number(existing.units_per_pack) !== Number(data.units_per_pack);
    const baseUnitChanged = existing.base_unit.toLowerCase() !== data.base_unit.toLowerCase();

    if (unitsChanged || baseUnitChanged) {
      return {
        error:
          'Packaging conversion is locked because this medicine has recorded inventory transactions. Changes to units per pack or base unit are strictly prevented to protect inventory integrity. If packaging has changed, please create a new medicine entry or perform an authorized stock recount.',
      };
    }
  }

  // Duplicate Check against other records
  const { data: duplicateCheck } = await adminSupabase
    .from('medicines')
    .select('id, name, strength, dosage_form, brand_name')
    .neq('id', medicineId)
    .ilike('name', data.name)
    .ilike('strength', data.strength)
    .ilike('dosage_form', data.dosage_form);

  if (duplicateCheck && duplicateCheck.length > 0) {
    const matched = duplicateCheck.find(
      (m: { brand_name: string | null }) =>
        (m.brand_name || '').toLowerCase() === (data.brand_name || '').toLowerCase()
    );
    if (matched) {
      return {
        error: `Another medicine with name "${data.name} ${data.strength} (${data.dosage_form})"${
          data.brand_name ? ` brand "${data.brand_name}"` : ''
        } already exists.`,
      };
    }
  }

  const updatePayload: Record<string, unknown> = {
    name: data.name,
    strength: data.strength,
    dosage_form: data.dosage_form,
    base_unit: isLocked ? existing.base_unit : data.base_unit.toLowerCase(),
    units_per_pack: isLocked ? existing.units_per_pack : data.units_per_pack,
    packaging_type: isLocked ? (existing.packaging_type || 'STANDARD') : (data.packaging_type || 'STANDARD'),
    strips_per_box: isLocked ? existing.strips_per_box : (data.strips_per_box || null),
    tablets_per_strip: isLocked ? existing.tablets_per_strip : (data.tablets_per_strip || null),
    pack_label: data.pack_label,
    low_stock_threshold: data.low_stock_threshold,
    brand_name: data.brand_name || null,
  };

  const { data: updatedRaw, error: updateError } = await (adminSupabase.from('medicines') as any)
    .update(updatePayload)
    .eq('id', medicineId)
    .select('*')
    .single();

  if (updateError || !updatedRaw) {
    console.error('Failed to update medicine:', updateError);
    return { error: updateError?.message || 'Failed to update medicine.' };
  }

  const updatedMedicine = updatedRaw as unknown as Medicine;

  await recordAuditLog({
    tableName: 'medicines',
    recordId: medicineId,
    action: 'UPDATE',
    oldData: existing,
    newData: updatedMedicine,
    performedBy: auth.userId,
  });

  revalidatePath('/inventory/medicines');
  revalidatePath('/inventory/receive');
  return {
    success: true,
    message: `Medicine "${updatedMedicine.name} ${updatedMedicine.strength}" updated successfully.`,
    data: updatedMedicine,
  };
}

/**
 * Toggle active status of a medicine (enable / disable).
 */
export async function toggleMedicineStatusAction(medicineId: string): Promise<MedicineActionResponse> {
  const auth = await requirePermission('manage_medicines');
  const adminSupabase = createAdminClient();

  const { data: existingRaw, error: fetchError } = await adminSupabase
    .from('medicines')
    .select('*')
    .eq('id', medicineId)
    .single();

  if (fetchError || !existingRaw) {
    return { error: 'Medicine not found.' };
  }

  const existing = existingRaw as unknown as Medicine;
  const newStatus = !existing.is_active;

  const { data: updatedRaw, error: updateError } = await (adminSupabase.from('medicines') as any)
    .update({ is_active: newStatus })
    .eq('id', medicineId)
    .select('*')
    .single();

  if (updateError || !updatedRaw) {
    return { error: updateError?.message || 'Failed to toggle status.' };
  }

  const updated = updatedRaw as unknown as Medicine;

  await recordAuditLog({
    tableName: 'medicines',
    recordId: medicineId,
    action: 'UPDATE',
    oldData: existing,
    newData: updated,
    performedBy: auth.userId,
  });

  revalidatePath('/inventory/medicines');
  return {
    success: true,
    message: `Medicine "${updated.name}" is now ${newStatus ? 'active' : 'inactive'}.`,
    data: updated,
  };
}
