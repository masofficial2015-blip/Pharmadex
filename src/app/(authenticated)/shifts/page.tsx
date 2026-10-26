import React from 'react';
import { requireUser } from '@/lib/auth';
import { getActiveShift, getShiftHistoryAction, getShiftSalesAction } from '@/app/actions/shifts';
import { ShiftStatusBadge } from '@/components/shifts/shift-status-badge';
import { ShiftHistoryTable } from '@/components/shifts/shift-history-table';
import { ShiftSalesList } from '@/components/shifts/shift-sales-list';
import { Clock, Smartphone } from 'lucide-react';

export const metadata = {
  title: 'Pharmacy Shifts & Cash Reconciliation | Pharmadex',
  description: 'Manage active shifts and physical cash drawer reconciliation',
};

export default async function ShiftsPage() {
  const { profile } = await requireUser();
  const [activeShift, shiftHistory] = await Promise.all([
    getActiveShift(),
    getShiftHistoryAction(),
  ]);

  const shiftSales = await getShiftSalesAction(activeShift?.shift.id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Clock className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Pharmacy Shifts & Reconciliation</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage pharmacy shifts, active dispensing duty, and drawer cash reconciliation.
          </p>
        </div>

        <ShiftStatusBadge activeShift={activeShift} currentUserId={profile.id} />
      </div>

      {/* Active Shift Financial Till Breakdown (If Shift is Open) */}
      {activeShift && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                Active Shift Till
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Shift on duty: {activeShift.user.full_name}
              </h3>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Started:{' '}
              {new Date(activeShift.shift.opened_at).toLocaleTimeString('en-US', {
                timeStyle: 'short',
              })}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Opening Cash Float */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Opening Cash Float</span>
              <span className="font-mono font-bold text-base text-slate-900">
                {activeShift.opening_cash.toLocaleString()} ETB
              </span>
            </div>

            {/* Cash Sales */}
            <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200">
              <span className="text-[11px] text-emerald-800 font-semibold block">
                Physical Cash Sales
              </span>
              <span className="font-mono font-bold text-base text-emerald-950">
                +{activeShift.cash_sales_total.toLocaleString()} ETB
              </span>
            </div>

            {/* Expected Cash in Drawer */}
            <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200">
              <span className="text-[11px] text-teal-900 font-bold block">
                Expected Cash in Till (=)
              </span>
              <span className="font-mono font-extrabold text-base text-teal-950">
                {activeShift.expected_closing_cash.toLocaleString()} ETB
              </span>
            </div>
          </div>

          {/* Electronic Collections Banner (Excluded from Cash Till) */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-950">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <span className="font-bold">Digital Collections (Telebirr & CBE Birr):</span>
                <span className="text-blue-700 block text-[11px]">
                  Direct bank deposits (excluded from physical cash drawer).
                </span>
              </div>
            </div>
            <div className="font-mono font-extrabold text-base text-blue-900">
              {activeShift.bank_sales_total.toLocaleString()} ETB
            </div>
          </div>
        </div>
      )}

      {/* Shift Completed Sales & Customer Notes */}
      <ShiftSalesList
        sales={shiftSales}
        shiftName={activeShift?.user.full_name}
      />

      {/* Shifts Audit History Table */}
      <ShiftHistoryTable shifts={shiftHistory} />
    </div>
  );
}
