import React from 'react';
import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { getMedicinesWithInventory } from '@/app/actions/medicines';
import { getSuppliersWithBalances } from '@/app/actions/suppliers';
import { StockReceiveForm } from '@/components/inventory/stock-receive-form';
import { PackagePlus, Pill, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Stock Receiving | Pharmadex',
  description: 'Receive supplier stock with pack-to-unit conversions and Full, Partial, or Dube payment terms',
};

export default async function StockReceivePage() {
  await requirePermission('receive_stock');
  const [medicines, suppliers] = await Promise.all([
    getMedicinesWithInventory(),
    getSuppliersWithBalances(),
  ]);

  const activeMedicines = medicines.filter((m) => m.is_active);
  const activeSuppliers = suppliers.filter((s) => s.is_active);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <PackagePlus className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Stock Receiving from Suppliers</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Log supplier deliveries with dual pack + loose unit conversion and Full, Partial, or Dube payment terms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/inventory/batches">
            <Button variant="outline" size="sm" className="text-xs">
              View FEFO Batches
            </Button>
          </Link>
          <Link href="/inventory/movements">
            <Button variant="outline" size="sm" className="text-xs">
              Stock Ledger
            </Button>
          </Link>
        </div>
      </div>

      {activeMedicines.length === 0 || activeSuppliers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <PackagePlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            {activeMedicines.length === 0
              ? 'No active medicines found'
              : 'No active suppliers found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Before receiving stock, you must register at least one active medicine and one active supplier.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {activeMedicines.length === 0 && (
              <Link href="/inventory/medicines">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Pill className="w-4 h-4" /> Add Medicine
                </Button>
              </Link>
            )}
            {activeSuppliers.length === 0 && (
              <Link href="/inventory/suppliers">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Building2 className="w-4 h-4" /> Add Supplier
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <StockReceiveForm medicines={activeMedicines} suppliers={activeSuppliers} />
      )}
    </div>
  );
}
