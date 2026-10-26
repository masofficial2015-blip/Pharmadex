import React from 'react';
import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { getStockMovementsLedger } from '@/app/actions/inventory';
import { StockMovementTable } from '@/components/inventory/stock-movement-table';
import { History, PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Stock Ledger & Audit Trail | Pharmadex',
  description: 'Auditable immutable stock ledger recording every receipt, sale, and adjustment',
};

export default async function StockMovementsPage() {
  await requirePermission('view_ledger');
  const movements = await getStockMovementsLedger();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <History className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Auditable Stock Movement Ledger</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable transaction history of every stock receipt, dispensing deduction, return, and inventory adjustment.
          </p>
        </div>

        <Link href="/inventory/receive">
          <Button variant="primary" size="sm" className="gap-1.5 shrink-0">
            <PackagePlus className="w-4 h-4" /> Receive Stock
          </Button>
        </Link>
      </div>

      <StockMovementTable movements={movements} />
    </div>
  );
}
