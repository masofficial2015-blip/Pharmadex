import React from 'react';
import { requireUser } from '@/lib/auth';
import { getActiveShift, getShiftHistoryAction, getShiftSalesAction } from '@/app/actions/shifts';
import { ShiftStatusBadge } from '@/components/shifts/shift-status-badge';
import { ShiftHistoryTable } from '@/components/shifts/shift-history-table';
import { ShiftSalesList } from '@/components/shifts/shift-sales-list';
import { Clock, Smartphone } from 'lucide-react';

export const metadata = {
  title: 'Pharmacy Shifts | Pharmadex',
  description: 'Manage active pharmacy dispensing shifts and staff handover history',
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
            <h1 className="text-xl font-bold text-slate-900">Pharmacy Shifts</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage pharmacy shifts, active dispensing duty, and shift handover records.
          </p>
        </div>

        <ShiftStatusBadge activeShift={activeShift} currentUserId={profile.id} />
      </div>

      {/* Active Shift Banner (If Shift is Open) */}
      {activeShift && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {activeShift.user?.full_name || 'Staff Member'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active On Duty
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                Shift started:{' '}
                {new Date(activeShift.shift.opened_at).toLocaleTimeString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-600 font-medium">
            Shift ID: <span className="font-mono text-slate-800">{activeShift.shift.id.slice(0, 8)}</span>
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
