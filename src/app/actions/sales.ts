'use server';

import { revalidatePath } from 'next/cache';
import { requireUser, recordAuditLog } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { saleCheckoutSchema, type SaleCheckoutFormValues } from '@/lib/validations/sales';
import type {
  PosMedicineItem,
  SaleReceipt,
  SaleReceiptItem,
  Medicine,
  Batch,
  Profile,
} from '@/types';

export interface SaleActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: SaleReceipt;
}

/**
 * Retrieve all active medicines with non-expired inventory for the POS screen.
 * Orders batches by FEFO so the pharmacist sees the next batch pricing and earliest expiry.
 */
export async function getPosMedicinesAction(): Promise<PosMedicineItem[]> {
  await requireUser();
  const adminSupabase = createAdminClient();

  const { data: rawMeds, error: medError } = await (adminSupabase.from('medicines') as any)
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (medError || !rawMeds) {
    console.error('Error fetching POS medicines:', medError);
    return [];
  }

  const medicines = rawMeds as Medicine[];
  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch all non-expired batches with stock > 0, ordered by FEFO
  const { data: rawBatches } = await (adminSupabase.from('batches') as any)
    .select('*')
    .gt('expiry_date', todayStr)
    .gt('current_quantity_units', 0)
    .order('expiry_date', { ascending: true });

  const batches = (rawBatches || []) as Batch[];

  // Group batches by medicine_id
  const batchesByMed = new Map<string, Batch[]>();
  batches.forEach((b) => {
    const list = batchesByMed.get(b.medicine_id) || [];
    list.push(b);
    batchesByMed.set(b.medicine_id, list);
  });

  return medicines.map((med) => {
    const medBatches = batchesByMed.get(med.id) || [];
    const unitsPerPack = med.units_per_pack || 1;

    const totalAvailableUnits = medBatches.reduce(
      (acc, b) => acc + Number(b.current_quantity_units || 0),
      0
    );

    const availablePacks = Math.floor(totalAvailableUnits / unitsPerPack);
    const availableLoose = totalAvailableUnits % unitsPerPack;

    // Use earliest expiring batch for current POS pricing
    const primaryBatch = medBatches[0];
    const packPrice = primaryBatch ? Number(primaryBatch.selling_price_per_pack) : 0;
    const unitPrice = primaryBatch
      ? Number(primaryBatch.selling_price_per_unit)
      : unitsPerPack > 0
      ? Number((packPrice / unitsPerPack).toFixed(2))
      : 0;

    return {
      id: med.id,
      name: med.name,
      brand_name: med.brand_name || null,
      strength: med.strength,
      dosage_form: med.dosage_form,
      base_unit: med.base_unit,
      pack_label: med.pack_label || 'Pack',
      units_per_pack: unitsPerPack,
      packaging_type: med.packaging_type || 'STANDARD',
      strips_per_box: med.strips_per_box || null,
      tablets_per_strip: med.tablets_per_strip || null,
      total_available_units: totalAvailableUnits,
      available_packs: availablePacks,
      available_loose: availableLoose,
      pack_price: packPrice,
      unit_price: unitPrice,
      earliest_expiry_date: primaryBatch ? primaryBatch.expiry_date : null,
      batches_count: medBatches.length,
    };
  });
}

/**
 * Record a sale transaction with strict FEFO batch deductions.
 * Deducts stock from earliest-expiring batches, records sale_items,
 * logs stock_movements, and creates an auditable receipt.
 */
export async function recordSaleAction(
  data: SaleCheckoutFormValues
): Promise<SaleActionResponse> {
  const auth = await requireUser();
  const adminSupabase = createAdminClient();

  // 1. Verify that the shift is currently OPEN
  const { data: shift, error: shiftErr } = await (adminSupabase.from('shifts') as any)
    .select('id, status, user_id')
    .eq('id', data.shift_id)
    .single();

  if (shiftErr || !shift || shift.status !== 'OPEN') {
    return {
      error: 'Cannot complete sale: The selected shift is not open. Please ensure an active shift is open.',
    };
  }

  // 2. Validate payload schema
  const parsed = saleCheckoutSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return { error: 'Please check the sale form errors.', fieldErrors };
  }

  const { shift_id, payment_method, customer_name, cash_tendered, notes, items } = parsed.data;
  const todayStr = new Date().toISOString().split('T')[0];

  // 3. Pre-fetch medicines and verify stock availability across FEFO batches
  interface ItemAllocationPlan {
    medicine: Medicine;
    packQuantity: number;
    looseQuantity: number;
    totalUnitsRequested: number;
    customUnitPrice?: number;
    allocatedBatches: Array<{
      batch: Batch;
      unitsToDeduct: number;
      unitPrice: number;
      subtotal: number;
    }>;
  }

  const allocationPlans: ItemAllocationPlan[] = [];
  let grandTotal = 0;

  for (const item of items) {
    const { data: medRaw, error: medErr } = await (adminSupabase.from('medicines') as any)
      .select('*')
      .eq('id', item.medicine_id)
      .single();

    if (medErr || !medRaw) {
      return { error: `Medicine record not found for ID: ${item.medicine_id}` };
    }

    const medicine = medRaw as Medicine;
    const unitsPerPack = medicine.units_per_pack || 1;
    const requestedUnits = item.pack_quantity * unitsPerPack + item.loose_quantity;

    if (requestedUnits <= 0) {
      return { error: `Invalid quantity for medicine ${medicine.name}. Must be at least 1 unit.` };
    }

    // Fetch non-expired batches with stock > 0, ordered by FEFO
    const { data: batchListRaw } = await (adminSupabase.from('batches') as any)
      .select('*')
      .eq('medicine_id', medicine.id)
      .gt('expiry_date', todayStr)
      .gt('current_quantity_units', 0)
      .order('expiry_date', { ascending: true })
      .order('created_at', { ascending: true });

    const availableBatches = (batchListRaw || []) as Batch[];
    const totalAvailable = availableBatches.reduce(
      (sum, b) => sum + Number(b.current_quantity_units || 0),
      0
    );

    if (totalAvailable < requestedUnits) {
      return {
        error: `Insufficient stock for ${medicine.name} ${medicine.strength}. Requested: ${requestedUnits} ${medicine.base_unit}s, Available non-expired: ${totalAvailable} ${medicine.base_unit}s.`,
      };
    }

    // Greedily allocate from FEFO batches
    let remainingToDeduct = requestedUnits;
    const allocatedBatches: ItemAllocationPlan['allocatedBatches'] = [];

    for (const batch of availableBatches) {
      if (remainingToDeduct <= 0) break;

      const batchStock = Number(batch.current_quantity_units || 0);
      const unitsFromThisBatch = Math.min(remainingToDeduct, batchStock);

      const existingUnitPrice = Number(batch.selling_price_per_unit || (Number(batch.selling_price_per_pack) / unitsPerPack));
      const unitPrice = (item.custom_unit_price && (existingUnitPrice <= 0 || item.custom_unit_price > 0))
        ? Number(item.custom_unit_price)
        : existingUnitPrice;

      const subtotal = Number((unitsFromThisBatch * unitPrice).toFixed(2));

      allocatedBatches.push({
        batch,
        unitsToDeduct: unitsFromThisBatch,
        unitPrice,
        subtotal,
      });

      remainingToDeduct -= unitsFromThisBatch;
      grandTotal += subtotal;
    }

    allocationPlans.push({
      medicine,
      packQuantity: item.pack_quantity,
      looseQuantity: item.loose_quantity,
      totalUnitsRequested: requestedUnits,
      customUnitPrice: item.custom_unit_price,
      allocatedBatches,
    });
  }

  grandTotal = Number(grandTotal.toFixed(2));

  // Cash tender validation
  let changeReturned = 0;
  if (payment_method === 'CASH' && cash_tendered !== undefined && cash_tendered !== null) {
    if (cash_tendered < grandTotal) {
      return {
        error: `Cash tendered (${cash_tendered} ETB) is less than the total bill (${grandTotal} ETB).`,
      };
    }
    changeReturned = Number((cash_tendered - grandTotal).toFixed(2));
  }

  // 4. Generate unique sale receipt number
  const timestampPart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const receiptNumber = `SAL-${timestampPart}-${randomPart}`;

  // 5. Create Sale Record
  const salePayload: Record<string, unknown> = {
    receipt_number: receiptNumber,
    shift_id,
    cashier_id: auth.userId,
    customer_name: customer_name || null,
    payment_method,
    total_amount: grandTotal,
    status: 'COMPLETED',
    notes: notes || null,
  };

  const { data: saleRaw, error: saleErr } = await (adminSupabase.from('sales') as any)
    .insert(salePayload)
    .select('*')
    .single();

  if (saleErr || !saleRaw) {
    console.error('Failed to create sale record:', saleErr);
    return { error: saleErr?.message || 'Failed to record sale.' };
  }

  const sale = saleRaw as { id: string; created_at: string };
  const receiptItems: SaleReceiptItem[] = [];

  // 6. Execute FEFO Batch Deductions and Record Line Items & Movements
  for (const plan of allocationPlans) {
    for (const alloc of plan.allocatedBatches) {
      // a. Insert sale_items record
      const { data: saleItemRaw } = await (adminSupabase.from('sale_items') as any)
        .insert({
          sale_id: sale.id,
          medicine_id: plan.medicine.id,
          batch_id: alloc.batch.id,
          is_pack: false,
          quantity: alloc.unitsToDeduct,
          quantity_units: alloc.unitsToDeduct,
          unit_price: alloc.unitPrice,
          subtotal: alloc.subtotal,
        })
        .select('id')
        .single();

      // b. Decrement current_quantity_units on batch, and update missing prices if custom_unit_price is provided
      const previousQty = Number(alloc.batch.current_quantity_units || 0);
      const newQty = previousQty - alloc.unitsToDeduct;

      const batchUpdateData: Record<string, unknown> = {
        current_quantity_units: newQty,
        updated_at: new Date().toISOString(),
      };

      if (
        plan.customUnitPrice &&
        plan.customUnitPrice > 0 &&
        (!alloc.batch.selling_price_per_unit || Number(alloc.batch.selling_price_per_unit) <= 0)
      ) {
        const unitsPerPack = plan.medicine.units_per_pack || 1;
        batchUpdateData.selling_price_per_unit = plan.customUnitPrice;
        batchUpdateData.selling_price_per_pack = Number((plan.customUnitPrice * unitsPerPack).toFixed(2));
      }

      await (adminSupabase.from('batches') as any)
        .update(batchUpdateData)
        .eq('id', alloc.batch.id);

      // If customUnitPrice was provided, also populate all unpriced batches of this medicine across inventory
      if (plan.customUnitPrice && plan.customUnitPrice > 0) {
        const unitsPerPack = plan.medicine.units_per_pack || 1;
        const newPackPrice = Number((plan.customUnitPrice * unitsPerPack).toFixed(2));
        await (adminSupabase.from('batches') as any)
          .update({
            selling_price_per_unit: plan.customUnitPrice,
            selling_price_per_pack: newPackPrice,
            updated_at: new Date().toISOString(),
          })
          .eq('medicine_id', plan.medicine.id)
          .or('selling_price_per_unit.is.null,selling_price_per_unit.lte.0');
      }

      // c. Log immutable audit movement in stock_movements ledger
      await (adminSupabase.from('stock_movements') as any).insert({
        batch_id: alloc.batch.id,
        medicine_id: plan.medicine.id,
        movement_type: 'SALE',
        quantity_units: -alloc.unitsToDeduct,
        previous_quantity_units: previousQty,
        new_quantity_units: newQty,
        reference_type: 'SALE',
        reference_id: sale.id,
        performed_by: auth.userId,
        notes: (customer_name || notes) ? `Dispensed in Sale #${receiptNumber} (${alloc.unitsToDeduct} ${plan.medicine.base_unit}s from Batch ${alloc.batch.batch_number}) [Customer/Note: ${customer_name || notes}]` : `Dispensed in Sale #${receiptNumber} (${alloc.unitsToDeduct} ${plan.medicine.base_unit}s from Batch ${alloc.batch.batch_number})`,
      });

      receiptItems.push({
        id: (saleItemRaw as any)?.id || alloc.batch.id,
        medicine_name: plan.medicine.name,
        brand_name: plan.medicine.brand_name || null,
        strength: plan.medicine.strength,
        dosage_form: plan.medicine.dosage_form,
        batch_number: alloc.batch.batch_number,
        expiry_date: alloc.batch.expiry_date,
        quantity_units: alloc.unitsToDeduct,
        unit_price: alloc.unitPrice,
        subtotal: alloc.subtotal,
      });
    }
  }

  // 7. Record System Audit Log
  await recordAuditLog({
    tableName: 'sales',
    recordId: sale.id,
    action: 'INSERT',
    newData: {
      receipt_number: receiptNumber,
      total_amount: grandTotal,
      payment_method,
      items_count: receiptItems.length,
      cashier: auth.profile.full_name,
      customer_name: customer_name || notes || undefined,
      notes: notes || customer_name || undefined,
    },
    performedBy: auth.userId,
  });

  revalidatePath('/pos');
  revalidatePath('/shifts');
  revalidatePath('/dashboard');
  revalidatePath('/inventory/medicines');
  revalidatePath('/inventory/batches');
  revalidatePath('/inventory/movements');

  const receipt: SaleReceipt = {
    id: sale.id,
    receipt_number: receiptNumber,
    shift_id,
    cashier: auth.profile,
    customer_name: customer_name || null,
    payment_method,
    total_amount: grandTotal,
    cash_tendered: cash_tendered || null,
    change_returned: changeReturned || null,
    created_at: sale.created_at,
    items: receiptItems,
  };

  return {
    success: true,
    message: `Sale #${receiptNumber} completed successfully. Total: ${grandTotal.toLocaleString()} ETB via ${payment_method}.`,
    data: receipt,
  };
}

/**
 * Immediately persist selling prices for a medicine and all its unpriced batches.
 * Called when a pharmacist enters prices at POS so neither this modal nor subsequent sales
 * have to ask for the price again.
 */
export async function saveMedicineSellingPriceAction(
  medicineId: string,
  unitPrice: number,
  packPrice?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requireUser();
    if (!medicineId || unitPrice <= 0) {
      return { success: false, error: 'Valid medicine ID and positive unit price are required.' };
    }

    const adminSupabase = createAdminClient();

    // Fetch medicine to get units_per_pack
    const { data: medRaw, error: medErr } = await (adminSupabase.from('medicines') as any)
      .select('id, name, units_per_pack')
      .eq('id', medicineId)
      .single();

    if (medErr || !medRaw) {
      return { success: false, error: 'Medicine not found.' };
    }

    const unitsPerPack = medRaw.units_per_pack || 1;
    const resolvedPackPrice =
      packPrice && packPrice > 0
        ? packPrice
        : Number((unitPrice * unitsPerPack).toFixed(2));

    // Update all batches of this medicine where price is 0 or null
    await (adminSupabase.from('batches') as any)
      .update({
        selling_price_per_unit: unitPrice,
        selling_price_per_pack: resolvedPackPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('medicine_id', medicineId)
      .or('selling_price_per_unit.is.null,selling_price_per_unit.lte.0');

    await recordAuditLog({
      tableName: 'batches',
      recordId: medicineId,
      action: 'UPDATE',
      newData: {
        medicine_id: medicineId,
        medicine_name: medRaw.name,
        selling_price_per_unit: unitPrice,
        selling_price_per_pack: resolvedPackPrice,
        source: 'POS_INLINE_PRICING',
      },
      performedBy: auth.userId,
    });

    revalidatePath('/pos');
    revalidatePath('/inventory/medicines');
    revalidatePath('/inventory/batches');

    return { success: true };
  } catch (err: any) {
    console.error('Failed to save medicine selling price:', err);
    return { success: false, error: err.message || 'Failed to save price.' };
  }
}