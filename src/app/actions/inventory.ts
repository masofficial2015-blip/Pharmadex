'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser, requirePermission, recordAuditLog } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { stockReceiveSchema } from '@/lib/validations/inventory';
import type {
  BatchWithDetails,
  StockMovementWithDetails,
  Medicine,
  Supplier,
  Profile,
  StockReceipt,
} from '@/types';

export interface InventoryActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: any;
}

/**
 * Retrieve all stock batches sorted by FEFO (First-Expiring, First-Out).
 * Attaches alerts for near-expiry (< 4 months / 120 days) and expired items.
 */
export async function getBatchesWithStatus(): Promise<BatchWithDetails[]> {
  await requireUser();
  const adminSupabase = createAdminClient();

  // Query batches ordered by expiry_date ascending (FEFO)
  const { data: rawBatches, error: batchError } = await adminSupabase
    .from('batches')
    .select(`
      *,
      medicine:medicines(*),
      supplier:suppliers(*)
    `)
    .order('expiry_date', { ascending: true });

  if (batchError || !rawBatches) {
    console.error('Error fetching batches:', batchError);
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (rawBatches as any[]).map((b) => {
    const expiry = new Date(b.expiry_date);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isExpired = daysToExpiry <= 0;
    const isNearExpiry = !isExpired && daysToExpiry <= 120; // 4 months threshold

    return {
      ...b,
      medicine: b.medicine as Medicine,
      supplier: (b.supplier as Supplier) || null,
      is_expired: isExpired,
      is_near_expiry: isNearExpiry,
      days_to_expiry: daysToExpiry,
    };
  });
}

/**
 * Retrieve the immutable stock movements ledger with audit relations.
 */
export async function getStockMovementsLedger(): Promise<StockMovementWithDetails[]> {
  await requirePermission('view_ledger');
  const adminSupabase = createAdminClient();

  const { data: rawMovements, error } = await adminSupabase
    .from('stock_movements')
    .select(`
      *,
      medicine:medicines(*),
      batch:batches(*),
      performer:profiles(*)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error || !rawMovements) {
    console.error('Error fetching stock movements:', error);
    return [];
  }

  return rawMovements as any[] as StockMovementWithDetails[];
}

/**
 * Record stock receiving from a supplier.
 * Converts packs and loose units to base units accurately.
 * Supports FULL, PARTIAL, and DUBE payment terms.
 * Maintains individual batch quantity and FEFO records.
 * Records immutable movement in the stock ledger.
 */
export async function receiveStockAction(
  _prevState: InventoryActionResponse | null,
  formData: FormData
): Promise<InventoryActionResponse> {
  const auth = await requirePermission('receive_stock');
  const adminSupabase = createAdminClient();

  const raw = {
    medicine_id: formData.get('medicine_id'),
    supplier_id: formData.get('supplier_id'),
    batch_number: formData.get('batch_number'),
    expiry_date: formData.get('expiry_date'),
    packs: formData.get('packs') || '0',
    loose_units: formData.get('loose_units') || '0',
    cost_per_pack: formData.get('cost_per_pack'),
    selling_price_per_pack: formData.get('selling_price_per_pack'),
    selling_price_per_unit: formData.get('selling_price_per_unit'),
    payment_status: formData.get('payment_status'),
    amount_paid: formData.get('amount_paid') || '0',
    payment_method: formData.get('payment_method') || '',
    invoice_number: formData.get('invoice_number') || '',
    notes: formData.get('notes') || '',
  };

  const parsed = stockReceiveSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return { error: 'Please check form fields and correct errors.', fieldErrors };
  }

  const data = parsed.data;

  // 1. Fetch medicine to get accurate pack packaging
  const { data: rawMed, error: medErr } = await adminSupabase
    .from('medicines')
    .select('*')
    .eq('id', data.medicine_id)
    .single();

  if (medErr || !rawMed) {
    return { error: 'Selected medicine was not found.' };
  }

  const medicine = rawMed as unknown as Medicine;
  const unitsPerPack = medicine.units_per_pack || 1;

  // 2. Packaging conversion calculation
  // Total base units = (packs * units_per_pack) + loose_units
  const totalBaseUnits = data.packs * unitsPerPack + data.loose_units;
  if (totalBaseUnits <= 0) {
    return { error: 'Received quantity must be greater than 0.' };
  }

  // Cost calculation
  const costPerUnit = data.cost_per_pack / unitsPerPack;
  const totalCost = Number(
    ((data.packs * data.cost_per_pack) + (data.loose_units * costPerUnit)).toFixed(2)
  );

  // Validate and normalize payment
  let finalAmountPaid = data.amount_paid;
  if (data.payment_status === 'FULL') {
    finalAmountPaid = totalCost;
  } else if (data.payment_status === 'DUBE') {
    finalAmountPaid = 0;
  } else if (data.payment_status === 'PARTIAL') {
    if (finalAmountPaid <= 0 || finalAmountPaid >= totalCost) {
      return {
        error: `For partial payment, amount paid must be between 1 ETB and ${totalCost - 0.01} ETB.`,
      };
    }
  }

  // 3. Create stock_receipts record if table exists
  const receiptNumber = `REC-${new Date().toISOString().slice(2, 7).replace('-', '')}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

  let receiptId: string | null = null;
  try {
    const { data: createdReceipt, error: receiptError } = await adminSupabase
      .from('stock_receipts')
      .insert({
        receipt_number: receiptNumber,
        supplier_id: data.supplier_id,
        invoice_number: data.invoice_number || null,
        total_cost: totalCost,
        amount_paid: finalAmountPaid,
        payment_status: data.payment_status,
        payment_method: (data.payment_method as any) || null,
        received_by: auth.userId,
        notes: data.notes || null,
      } as any)
      .select('id')
      .single();

    if (!receiptError && createdReceipt) {
      receiptId = (createdReceipt as any).id;
    } else {
      console.warn('Note: stock_receipts insert skipped or table pending:', receiptError?.message);
    }
  } catch (err) {
    console.warn('stock_receipts table not accessible:', err);
  }

  // 4. Batch lookup or creation
  const { data: existingBatchRaw } = await adminSupabase
    .from('batches')
    .select('*')
    .eq('medicine_id', data.medicine_id)
    .eq('batch_number', data.batch_number.trim())
    .single();

  const existingBatch = existingBatchRaw as any;
  let batchId: string;
  let previousQty = 0;
  let newQty = totalBaseUnits;

  if (existingBatch) {
    // If batch exists, verify expiry date matches
    if (existingBatch.expiry_date !== data.expiry_date) {
      return {
        error: `Batch "${data.batch_number}" already exists for this medicine with a different expiry date (${existingBatch.expiry_date}). Please verify the batch number or use the correct expiry date.`,
      };
    }

    previousQty = existingBatch.current_quantity_units || 0;
    newQty = previousQty + totalBaseUnits;
    batchId = existingBatch.id;

    // Update batch quantity and prices
    const { error: updateBatchErr } = await (adminSupabase.from('batches') as any)
      .update({
        current_quantity_units: newQty,
        initial_quantity_units: (existingBatch.initial_quantity_units || 0) + totalBaseUnits,
        cost_per_pack: data.cost_per_pack,
        selling_price_per_pack: data.selling_price_per_pack,
        selling_price_per_unit: data.selling_price_per_unit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    if (updateBatchErr) {
      return { error: `Failed to update existing batch: ${updateBatchErr.message}` };
    }
  } else {
    // Insert new batch
    const batchPayload: Record<string, unknown> = {
      medicine_id: data.medicine_id,
      supplier_id: data.supplier_id,
      batch_number: data.batch_number.trim(),
      expiry_date: data.expiry_date,
      cost_per_pack: data.cost_per_pack,
      selling_price_per_pack: data.selling_price_per_pack,
      selling_price_per_unit: data.selling_price_per_unit,
      initial_quantity_units: totalBaseUnits,
      current_quantity_units: totalBaseUnits,
      received_by: auth.userId,
    };

    if (receiptId) batchPayload.receipt_id = receiptId;
    batchPayload.packs_received = data.packs;
    batchPayload.loose_units_received = data.loose_units;
    batchPayload.cost_per_unit = costPerUnit;

    const { data: createdBatchRaw, error: batchErr } = await (adminSupabase.from('batches') as any)
      .insert(batchPayload)
      .select('id')
      .single();

    if (batchErr || !createdBatchRaw) {
      console.error('Failed to create batch:', batchErr);
      return { error: `Failed to create batch: ${batchErr?.message}` };
    }

    batchId = (createdBatchRaw as any).id;
  }

  // 5. Insert auditable stock movement into ledger
  const movementNotes = `Received ${data.packs} ${medicine.pack_label || 'pack'}(s) + ${data.loose_units} loose (${totalBaseUnits} total ${medicine.base_unit}s). Payment: ${data.payment_status} (Paid: ${finalAmountPaid} ETB / Total: ${totalCost} ETB). Batch #${data.batch_number}`;

  const { error: movementErr } = await adminSupabase
    .from('stock_movements')
    .insert({
      batch_id: batchId,
      medicine_id: data.medicine_id,
      movement_type: 'RECEIVE',
      quantity_units: totalBaseUnits,
      previous_quantity_units: previousQty,
      new_quantity_units: newQty,
      reference_type: 'RECEIPT',
      reference_id: receiptId || undefined,
      performed_by: auth.userId,
      notes: movementNotes,
    } as any);

  if (movementErr) {
    console.error('Failed to insert stock movement:', movementErr);
  }

  // 6. Record system audit log
  await recordAuditLog({
    tableName: 'batches',
    recordId: batchId,
    action: 'INSERT',
    newData: {
      medicine_id: data.medicine_id,
      batch_number: data.batch_number,
      packs: data.packs,
      loose_units: data.loose_units,
      total_units: totalBaseUnits,
      total_cost: totalCost,
      amount_paid: finalAmountPaid,
      payment_status: data.payment_status,
    },
    performedBy: auth.userId,
  });

  revalidatePath('/inventory/medicines');
  revalidatePath('/inventory/batches');
  revalidatePath('/inventory/movements');
  revalidatePath('/inventory/suppliers');
  revalidatePath('/inventory/receive');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: `Successfully received ${data.packs} ${medicine.pack_label || 'pack'}(s) + ${data.loose_units} loose (${totalBaseUnits} ${medicine.base_unit}s) into Batch #${data.batch_number}. Total Cost: ${totalCost.toLocaleString()} ETB (${data.payment_status}).`,
    data: {
      totalBaseUnits,
      totalCost,
      amountPaid: finalAmountPaid,
      batchId,
    },
  };
}

/**
 * Quick update for batch selling and cost prices.
 * Used especially when migrating legacy initial stock with 0.00 prices.
 */
export async function updateBatchPricingAction(
  batchId: string,
  sellingPricePerPack: number,
  sellingPricePerUnit: number,
  costPerPack?: number
): Promise<{ success: boolean; error?: string }> {
  await requireUser();
  const adminSupabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    selling_price_per_pack: sellingPricePerPack,
    selling_price_per_unit: sellingPricePerUnit,
    updated_at: new Date().toISOString(),
  };

  if (costPerPack !== undefined && costPerPack >= 0) {
    updateData.cost_per_pack = costPerPack;
  }

  const { error } = await (adminSupabase.from('batches') as any)
    .update(updateData)
    .eq('id', batchId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/inventory/batches');
  revalidatePath('/pos');
  revalidatePath('/inventory/medicines');
  return { success: true };
}

export interface UpdateBatchDetailsParams {
  batchId: string;
  currentQuantityUnits: number;
  costPerPack: number;
  sellingPricePerPack: number;
  sellingPricePerUnit: number;
  batchNumber?: string;
  expiryDate?: string;
  reason?: string;
}

/**
 * Edit batch values: stock count, cost price, selling prices, batch number, and expiry date.
 * Creates an ADJUSTMENT stock movement if quantity changes, maintaining full audit trail.
 */
export async function updateBatchDetailsAction(
  params: UpdateBatchDetailsParams
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireUser();
  const adminSupabase = createAdminClient();

  // 1. Fetch current batch data
  const { data: currentBatch, error: fetchError } = await (adminSupabase.from('batches') as any)
    .select('*, medicine:medicines(*)')
    .eq('id', params.batchId)
    .single();

  if (fetchError || !currentBatch) {
    return { success: false, error: 'Batch not found' };
  }

  const prevQty = Number(currentBatch.current_quantity_units) || 0;
  const newQty = Math.max(0, Math.floor(params.currentQuantityUnits));
  const qtyDelta = newQty - prevQty;

  const updateData: Record<string, unknown> = {
    current_quantity_units: newQty,
    cost_per_pack: Math.max(0, params.costPerPack),
    selling_price_per_pack: Math.max(0, params.sellingPricePerPack),
    selling_price_per_unit: Math.max(0, params.sellingPricePerUnit),
    updated_at: new Date().toISOString(),
  };

  if (newQty > (Number(currentBatch.initial_quantity_units) || 0)) {
    updateData.initial_quantity_units = newQty;
  }

  if (params.batchNumber && params.batchNumber.trim()) {
    updateData.batch_number = params.batchNumber.trim();
  }

  if (params.expiryDate && params.expiryDate.trim()) {
    updateData.expiry_date = params.expiryDate.trim();
  }

  const { error: updateError } = await (adminSupabase.from('batches') as any)
    .update(updateData)
    .eq('id', params.batchId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // 2. If quantity changed, log an audit record in stock_movements
  if (qtyDelta !== 0) {
    const { error: movementError } = await (adminSupabase.from('stock_movements') as any).insert({
      batch_id: params.batchId,
      medicine_id: currentBatch.medicine_id,
      movement_type: 'ADJUSTMENT',
      quantity_units: qtyDelta,
      previous_quantity_units: prevQty,
      new_quantity_units: newQty,
      reference_type: 'ADJUSTMENT',
      performed_by: auth.userId,
      notes: params.reason?.trim() || `Inventory count correction (${prevQty} -> ${newQty} units)`,
    });

    if (movementError) {
      console.error('Error logging stock movement adjustment:', movementError);
    }
  }

  // 3. Record audit log
  await recordAuditLog({
    tableName: 'batches',
    recordId: params.batchId,
    action: 'UPDATE',
    oldData: {
      medicine_name: currentBatch.medicine?.name,
      current_quantity_units: prevQty,
      cost_per_pack: currentBatch.cost_per_pack,
      selling_price_per_pack: currentBatch.selling_price_per_pack,
      selling_price_per_unit: currentBatch.selling_price_per_unit,
      batch_number: currentBatch.batch_number,
    },
    newData: {
      current_quantity_units: newQty,
      quantity_delta: qtyDelta,
      cost_per_pack: params.costPerPack,
      selling_price_per_pack: params.sellingPricePerPack,
      selling_price_per_unit: params.sellingPricePerUnit,
      batch_number: updateData.batch_number || currentBatch.batch_number,
      reason: params.reason,
    },
    performedBy: auth.userId,
  });

  revalidatePath('/inventory/batches');
  revalidatePath('/inventory/medicines');
  revalidatePath('/inventory/movements');
  revalidatePath('/pos');
  revalidatePath('/dashboard');

  return { success: true };
}
