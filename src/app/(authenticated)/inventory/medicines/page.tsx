import React from 'react';
import { requireUser } from '@/lib/auth';
import { getMedicinesWithInventory } from '@/app/actions/medicines';
import { MedicineList } from '@/components/inventory/medicine-list';
import { Pill } from 'lucide-react';

export const metadata = {
  title: 'Medicines Management | Pharmadex',
  description: 'Manage pharmacy medicine catalog, packaging conversions, and stock alerts',
};

export default async function MedicinesPage() {
  const { profile } = await requireUser();
  const canManage = profile.role === 'ADMIN' || profile.permissions?.includes('manage_medicines');
  const medicines = await getMedicinesWithInventory();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Pill className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Medicine Catalog & Inventory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse generic and brand medicines, view live stock units, and manage locked packaging conversions.
          </p>
        </div>
      </div>

      <MedicineList initialMedicines={medicines} isAdmin={Boolean(canManage)} />
    </div>
  );
}
