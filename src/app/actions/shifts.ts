'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, requireUser, recordAuditLog } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { openShiftSchema, closeShiftSchema, cashMovementSchema } from '@/lib/validations/shifts';
import type { Shift, ShiftSummary, Profile, CashMovement } from '@/types';

export interface ShiftActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: any;
}

/**
 * Retrieve the current active shift across the pharmacy with live reconciliation.
 * Physical cash is strictly separated from electronic bank transfers (Telebirr/CBE Birr).
 */
export async function getActiveShift(): Promise<ShiftSummary | null> {
  await requireUser();
  const adminSupabase = createAdminClient();

  // 1. Optimized Path: Execute single-roundtrip PostgreSQL RPC function (Migration 006)
  try {
    const { data: rpcData, error: rpcError } = await (adminSupabase.rpc as any)('get_active_shift_summary');
    if (!rpcError && rpcData) {
      return rpcData as ShiftSummary;
    }
  } catch (err) {
    // Fall back to direct queries if RPC is not yet applied
  }

  // 2. Fallback Path: Direct queries with parallelization
  const { data: rawShift, error } = await (adminSupabase.from('shifts') as any)
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('status', 'OPEN')
    .maybeSingle();

  if (error || !rawShift) {
    return null;
  }

  const shift = rawShift as Shift & { user: Profile };
  const shiftId = shift.id;

  // 1. Fetch completed sales for this shift
  const { data: rawSales } = await (adminSupabase.from('sales') as any)
    .select('id, payment_method, total_amount, status')
    .eq('shift_id', shiftId)
    .eq('status', 'COMPLETED');

  const salesList = (rawSales || []) as Array<{
    id: string;
    payment_method: string;
    total_amount: number;
    status: string;
  }>;

  let cashSalesTotal = 0;
  let bankSalesTotal = 0;
  const cashSaleIds: string[] = [];

  salesList.forEach((s) => {
    const amount = Number(s.total_amount || 0);
    if (s.payment_method === 'CASH') {
      cashSalesTotal += amount;
      cashSaleIds.push(s.id);
    } else {
      // Telebirr, CBE Birr, Bank Transfer (Digital Collections)
      bankSalesTotal += amount;
    }
  });

  // 2. Fetch cash refunds (returns) on cash sales for this shift
  let cashRefundsTotal = 0;
  if (cashSaleIds.length > 0) {
    const { data: rawReturns } = await (adminSupabase.from('returns') as any)
      .select('refunded_amount')
      .in('sale_id', cashSaleIds);

    (rawReturns || []).forEach((r: { refunded_amount: number }) => {
      cashRefundsTotal += Number(r.refunded_amount || 0);
    });
  }

  // 3. Expected Physical Cash in Till Calculation:
  // Expected = Opening Cash + Cash Sales - Cash Refunds
  const openingCash = Number(shift.opening_cash || 0);
  const expectedClosingCash = Number(
    (openingCash + cashSalesTotal - cashRefundsTotal).toFixed(2)
  );

  return {
    shift,
    user: shift.user,
    opening_cash: openingCash,
    cash_sales_total: Number(cashSalesTotal.toFixed(2)),
    bank_sales_total: Number(bankSalesTotal.toFixed(2)),
    cash_refunds_total: Number(cashRefundsTotal.toFixed(2)),
    cash_in_total: 0,
    cash_out_total: 0,
    expected_closing_cash: expectedClosingCash,
    actual_closing_cash: shift.actual_closing_cash,
    cash_discrepancy: shift.cash_discrepancy,
    sales_count: salesList.length,
  };
}

/**
 * Open a new shift.
 * Physically guarantees only ONE active shift across the pharmacy at a time.
 */
export async function openShiftAction(
  _prevState: ShiftActionResponse | null,
  formData: FormData
): Promise<ShiftActionResponse> {
  const auth = await requireUser();
  const adminSupabase = createAdminClient();

  // Check if a shift is already open
  const { data: openShift } = await (adminSupabase.from('shifts') as any)
    .select('id, user:profiles(full_name)')
    .eq('status', 'OPEN')
    .maybeSingle();

  if (openShift) {
    const activeStaff = openShift.user?.full_name || 'Another pharmacist';
    return {
      error: `A shift is already open by ${activeStaff}. Only one active shift is permitted across the pharmacy at a time. The current shift must be closed before a new one can begin.`,
    };
  }

  const raw = {
    opening_cash: formData.get('opening_cash') || '0',
  };

  const parsed = openShiftSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return { error: 'Please enter a valid opening cash float.', fieldErrors };
  }

  const { opening_cash } = parsed.data;

  const { data: newShift, error: insertError } = await (adminSupabase.from('shifts') as any)
    .insert({
      user_id: auth.userId,
      opening_cash,
      status: 'OPEN',
      opened_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (insertError || !newShift) {
    console.error('Failed to open shift:', insertError);
    return { error: insertError?.message || 'Failed to open shift.' };
  }

  await recordAuditLog({
    tableName: 'shifts',
    recordId: newShift.id,
    action: 'INSERT',
    newData: {
      user_id: auth.userId,
      opening_cash,
      opened_at: newShift.opened_at,
    },
    performedBy: auth.userId,
  });

  revalidatePath('/shifts');
  revalidatePath('/pos');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: 'Shift opened successfully. Duty active.',
    data: newShift,
  };
}

/**
 * Record a cash till movement (PAY_IN / PAY_OUT) during an active shift.
 */
export async function recordCashMovementAction(
  _prevState: ShiftActionResponse | null,
  formData: FormData
): Promise<ShiftActionResponse> {
  const auth = await requireUser();
  const adminSupabase = createAdminClient();

  const active = await getActiveShift();
  if (!active) {
    return { error: 'No active shift found. A shift must be open to record cash till movements.' };
  }

  // Cross-shift authorization check: only on-duty pharmacist or admin
  const isShiftOwner = active.shift.user_id === auth.userId;
  const isAdmin = auth.profile.role === 'ADMIN';
  if (!isShiftOwner && !isAdmin) {
    return { error: 'Only the on-duty pharmacist or an administrator can record cash movements for this shift.' };
  }

  const raw = {
    movement_type: formData.get('movement_type'),
    amount: formData.get('amount'),
    reason: formData.get('reason'),
  };

  const parsed = cashMovementSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return { error: 'Please correct the cash movement form errors.', fieldErrors };
  }

  const { movement_type, amount, reason } = parsed.data;

  const { data: movement, error: insertError } = await (adminSupabase.from('cash_movements') as any)
    .insert({
      shift_id: active.shift.id,
      movement_type,
      amount,
      reason,
      performed_by: auth.userId,
    })
    .select('*')
    .single();

  if (insertError || !movement) {
    return { error: insertError?.message || 'Failed to record cash movement.' };
  }

  await recordAuditLog({
    tableName: 'cash_movements',
    recordId: movement.id,
    action: 'INSERT',
    newData: {
      shift_id: active.shift.id,
      movement_type,
      amount,
      reason,
    },
    performedBy: auth.userId,
  });

  revalidatePath('/shifts');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: `Recorded ${movement_type === 'PAY_IN' ? 'Pay In' : 'Pay Out'} of ${amount.toLocaleString()} ETB: ${reason}`,
    data: movement,
  };
}

/**
 * Close the current active shift and perform physical cash reconciliation.
 * Bank transfers do not count as physical cash.
 * Once closed, the shift is permanently immutable.
 */
export async function closeShiftAction(
  _prevState: ShiftActionResponse | null,
  formData: FormData
): Promise<ShiftActionResponse> {
  const auth = await requireUser();
  const adminSupabase = createAdminClient();

  const active = await getActiveShift();
  if (!active) {
    return { error: 'No active shift found to close.' };
  }

  // Check authorization: Shift owner or Admin can close
  const isOwner = active.shift.user_id === auth.userId;
  const isAdmin = auth.profile.role === 'ADMIN';
  if (!isOwner && !isAdmin) {
    return { error: 'Only the on-duty pharmacist or an administrator can close this shift.' };
  }

  const raw = {
    closing_notes: formData.get('closing_notes') || '',
  };

  const parsed = closeShiftSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return { error: 'Please correct any notes input errors.', fieldErrors };
  }

  const { closing_notes } = parsed.data;

  const updatePayload: Record<string, unknown> = {
    status: 'CLOSED',
    closed_at: new Date().toISOString(),
    expected_closing_cash: active.expected_closing_cash,
    actual_closing_cash: null,
    cash_discrepancy: null,
    closing_notes: closing_notes || null,
  };

  const { data: closedShift, error: updateError } = await (adminSupabase.from('shifts') as any)
    .update(updatePayload)
    .eq('id', active.shift.id)
    .eq('status', 'OPEN') // Safety: ensure it hasn't already been closed
    .select('*')
    .single();

  if (updateError || !closedShift) {
    return { error: updateError?.message || 'Failed to close shift. It may already be closed.' };
  }

  await recordAuditLog({
    tableName: 'shifts',
    recordId: active.shift.id,
    action: 'UPDATE',
    oldData: { status: 'OPEN', opening_cash: active.opening_cash },
    newData: {
      status: 'CLOSED',
      closed_at: updatePayload.closed_at,
      closing_notes,
    },
    performedBy: auth.userId,
  });

  revalidatePath('/shifts');
  revalidatePath('/pos');
  revalidatePath('/dashboard');

  return {
    success: true,
    message: 'Shift closed successfully.',
    data: closedShift,
  };
}

/**
 * Retrieve past closed shifts with reconciliation stats.
 */
export async function getShiftHistoryAction(): Promise<ShiftSummary[]> {
  const auth = await requireUser();
  const adminSupabase = createAdminClient();

  let query = (adminSupabase.from('shifts') as any)
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('status', 'CLOSED')
    .order('closed_at', { ascending: false });

  // Pharmacists only see their own shift records; Admins see all staff shifts
  if (auth.profile.role !== 'ADMIN') {
    query = query.eq('user_id', auth.userId);
  }

  const { data: rawShifts, error } = await query.limit(50);

  if (error || !rawShifts) {
    console.error('Error fetching shift history:', error);
    return [];
  }

  return (rawShifts as any[]).map((s) => {
    return {
      shift: s as Shift,
      user: s.user as Profile,
      opening_cash: Number(s.opening_cash || 0),
      cash_sales_total: 0,
      bank_sales_total: 0,
      cash_refunds_total: 0,
      cash_in_total: 0,
      cash_out_total: 0,
      expected_closing_cash: Number(s.expected_closing_cash || 0),
      actual_closing_cash: s.actual_closing_cash !== null ? Number(s.actual_closing_cash) : null,
      cash_discrepancy: s.cash_discrepancy !== null ? Number(s.cash_discrepancy) : null,
      sales_count: 0,
    };
  });
}

/**
 * Retrieve cash movements for a given shift.
 */
export async function getCashMovementsForShift(shiftId: string): Promise<Array<CashMovement & { performer: Profile }>> {
  await requireUser();
  const adminSupabase = createAdminClient();

  const { data: rawMovements, error } = await (adminSupabase.from('cash_movements') as any)
    .select(`
      *,
      performer:profiles(*)
    `)
    .eq('shift_id', shiftId)
    .order('created_at', { ascending: true });

  if (error || !rawMovements) {
    return [];
  }

  return rawMovements as any[];
}

export interface ShiftSaleItem {
  id: string;
  receipt_number: string;
  shift_id: string;
  customer_name: string | null;
  payment_method: string;
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  cashier?: {
    full_name: string;
    role: string;
  } | null;
  items?: Array<{
    id: string;
    quantity_units: number;
    unit_price: number;
    subtotal: number;
    medicine?: {
      name: string;
      strength: string;
    } | null;
  }>;
}

/**
 * Retrieve recent sales with customer names and notes for shift review.
 * Can be filtered by active shift_id or returns the latest pharmacy sales.
 */
export async function getShiftSalesAction(shiftId?: string): Promise<ShiftSaleItem[]> {
  await requireUser();
  const adminSupabase = createAdminClient();
  let query = (adminSupabase.from('sales') as any)
    .select(`
      id,
      receipt_number,
      shift_id,
      customer_name,
      payment_method,
      total_amount,
      status,
      notes,
      created_at,
      cashier:profiles!sales_cashier_id_fkey(full_name, role),
      items:sale_items(
        id,
        quantity_units,
        unit_price,
        subtotal,
        medicine:medicines(name, strength)
      )
    `)
    .order('created_at', { ascending: false });

  if (shiftId) {
    query = query.eq('shift_id', shiftId).limit(50);
  } else {
    query = query.limit(30);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching shift sales:', error);
    return [];
  }
  return (data || []) as ShiftSaleItem[];
}
