'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser, recordAuditLog } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { supplierFormSchema } from '@/lib/validations/inventory';
import type { Supplier, SupplierWithBalance } from '@/types';

export interface SupplierActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: Supplier;
}

/**
 * Fetch all suppliers along with their accumulated credit / Dube balances.
 */
export async function getSuppliersWithBalances(): Promise<SupplierWithBalance[]> {
  await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: rawSuppliers, error: supError } = await adminSupabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  if (supError || !rawSuppliers) {
    console.error('Error fetching suppliers:', supError);
    return [];
  }

  const suppliers = rawSuppliers as unknown as Supplier[];

  // Fetch receipts to compute outstanding payable balances
  let receiptsMap = new Map<string, { count: number; unpaid: number }>();
  try {
    const { data: rawReceipts } = await adminSupabase
      .from('stock_receipts')
      .select('supplier_id, total_cost, amount_paid, payment_status');

    if (rawReceipts) {
      rawReceipts.forEach((r: { supplier_id: string; total_cost: number; amount_paid: number; payment_status: string }) => {
        const current = receiptsMap.get(r.supplier_id) || { count: 0, unpaid: 0 };
        current.count += 1;
        const remaining = Math.max(0, Number(r.total_cost || 0) - Number(r.amount_paid || 0));
        current.unpaid += remaining;
        receiptsMap.set(r.supplier_id, current);
      });
    }
  } catch (err) {
    // If stock_receipts table is not yet created in Supabase schema cache
    console.warn('Note: stock_receipts not yet available for balance calculation:', err);
  }

  return suppliers.map((s) => {
    const stat = receiptsMap.get(s.id) || { count: 0, unpaid: 0 };
    return {
      ...s,
      total_received_orders: stat.count,
      total_payable_balance: stat.unpaid,
      has_unpaid_dube: stat.unpaid > 0,
    };
  });
}

/**
 * Create a new supplier record.
 */
export async function createSupplierAction(
  _prevState: SupplierActionResponse | null,
  formData: FormData
): Promise<SupplierActionResponse> {
  const auth = await requireAdmin();
  const adminSupabase = createAdminClient();

  const raw = {
    name: formData.get('name'),
    contact_person: formData.get('contact_person') || '',
    phone: formData.get('phone') || '',
    email: formData.get('email') || '',
    address: formData.get('address') || '',
  };

  const parsed = supplierFormSchema.safeParse(raw);
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

  // Duplicate Check
  const { data: existing } = await adminSupabase
    .from('suppliers')
    .select('id, name')
    .ilike('name', data.name)
    .single();

  if (existing) {
    return { error: `A supplier named "${data.name}" already exists.` };
  }

  const insertPayload = {
    name: data.name,
    contact_person: data.contact_person || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    is_active: true,
  };

  const { data: createdRaw, error: insertError } = await adminSupabase
    .from('suppliers')
    .insert(insertPayload as any)
    .select('*')
    .single();

  if (insertError || !createdRaw) {
    console.error('Failed to create supplier:', insertError);
    return { error: insertError?.message || 'Failed to create supplier.' };
  }

  const created = createdRaw as unknown as Supplier;

  await recordAuditLog({
    tableName: 'suppliers',
    recordId: created.id,
    action: 'INSERT',
    newData: created,
    performedBy: auth.userId,
  });

  revalidatePath('/inventory/suppliers');
  revalidatePath('/inventory/receive');
  return {
    success: true,
    message: `Supplier "${created.name}" created successfully.`,
    data: created,
  };
}

/**
 * Update an existing supplier.
 */
export async function updateSupplierAction(
  supplierId: string,
  _prevState: SupplierActionResponse | null,
  formData: FormData
): Promise<SupplierActionResponse> {
  const auth = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: existingRaw, error: fetchError } = await adminSupabase
    .from('suppliers')
    .select('*')
    .eq('id', supplierId)
    .single();

  if (fetchError || !existingRaw) {
    return { error: 'Supplier not found.' };
  }

  const existing = existingRaw as unknown as Supplier;

  const raw = {
    name: formData.get('name'),
    contact_person: formData.get('contact_person') || '',
    phone: formData.get('phone') || '',
    email: formData.get('email') || '',
    address: formData.get('address') || '',
  };

  const parsed = supplierFormSchema.safeParse(raw);
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

  // Duplicate Check against other suppliers
  const { data: duplicate } = await adminSupabase
    .from('suppliers')
    .select('id')
    .neq('id', supplierId)
    .ilike('name', data.name)
    .single();

  if (duplicate) {
    return { error: `Another supplier named "${data.name}" already exists.` };
  }

  const updatePayload = {
    name: data.name,
    contact_person: data.contact_person || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
  };

  const { data: updatedRaw, error: updateError } = await (adminSupabase.from('suppliers') as any)
    .update(updatePayload)
    .eq('id', supplierId)
    .select('*')
    .single();

  if (updateError || !updatedRaw) {
    console.error('Failed to update supplier:', updateError);
    return { error: updateError?.message || 'Failed to update supplier.' };
  }

  const updated = updatedRaw as unknown as Supplier;

  await recordAuditLog({
    tableName: 'suppliers',
    recordId: supplierId,
    action: 'UPDATE',
    oldData: existing,
    newData: updated,
    performedBy: auth.userId,
  });

  revalidatePath('/inventory/suppliers');
  revalidatePath('/inventory/receive');
  return {
    success: true,
    message: `Supplier "${updated.name}" updated successfully.`,
    data: updated,
  };
}

/**
 * Toggle supplier active status.
 */
export async function toggleSupplierStatusAction(supplierId: string): Promise<SupplierActionResponse> {
  const auth = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: existingRaw, error: fetchError } = await adminSupabase
    .from('suppliers')
    .select('*')
    .eq('id', supplierId)
    .single();

  if (fetchError || !existingRaw) {
    return { error: 'Supplier not found.' };
  }

  const existing = existingRaw as unknown as Supplier;
  const newStatus = !existing.is_active;

  const { data: updatedRaw, error: updateError } = await (adminSupabase.from('suppliers') as any)
    .update({ is_active: newStatus })
    .eq('id', supplierId)
    .select('*')
    .single();

  if (updateError || !updatedRaw) {
    return { error: updateError?.message || 'Failed to toggle status.' };
  }

  const updated = updatedRaw as unknown as Supplier;

  await recordAuditLog({
    tableName: 'suppliers',
    recordId: supplierId,
    action: 'UPDATE',
    oldData: existing,
    newData: updated,
    performedBy: auth.userId,
  });

  revalidatePath('/inventory/suppliers');
  return {
    success: true,
    message: `Supplier "${updated.name}" is now ${newStatus ? 'active' : 'inactive'}.`,
    data: updated,
  };
}
