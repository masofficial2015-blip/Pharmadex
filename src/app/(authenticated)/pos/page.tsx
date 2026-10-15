import React from 'react';
import { requireUser } from '@/lib/auth';
import { getPosMedicinesAction } from '@/app/actions/sales';
import { getActiveShift } from '@/app/actions/shifts';
import { PosContainer } from '@/components/pos/pos-container';
import { ShoppingCart } from 'lucide-react';
import { ShiftStatusBadge } from '@/components/shifts/shift-status-badge';

export const metadata = {
  title: 'Fast Sales (POS) | Pharmadex',
  description: 'Fast mobile-first pharmacy dispensing screen with FEFO batch deduction',
};

export default async function PosPage() {
  const { profile } = await requireUser();
  const [medicines, activeShift] = await Promise.all([
    getPosMedicinesAction(),
    getActiveShift(),
  ]);

  return (
    <div className="space-y-4">
      {/* Header with Shift Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Dispensing Sales (POS)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select medicine packs or loose units, choose payment, and deduct batches using FEFO.
          </p>
        </div>

        <ShiftStatusBadge activeShift={activeShift} currentUserId={profile.id} />
      </div>

      {/* Main Interactive Mobile POS Controller */}
      <PosContainer initialMedicines={medicines} activeShift={activeShift} />
    </div>
  );
}
