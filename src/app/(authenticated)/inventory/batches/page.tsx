import React from 'react';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getBatchesWithStatus } from '@/app/actions/inventory';
import { BatchTable } from '@/components/inventory/batch-table';
import { Layers, PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'FEFO Batch Inventory | Pharmadex',
  description: 'First-Expiring, First-Out (FEFO) batch inventory tracking with near-expiry and expired alerts',
};

export default async function BatchesPage() {
  const { profile } = await requireUser();
  const isAdmin = profile.role === "ADMIN";
  const batches = await getBatchesWithStatus();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">FEFO Batch Inventory & Expiry</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Strictly ordered by First-Expiring, First-Out (FEFO). 4-month near-expiry flags and automatic sale-blocking for expired stock.
          </p>
        </div>

        {isAdmin && (
          <Link href="/inventory/receive">
            <Button variant="primary" size="sm" className="gap-1.5 shrink-0">
              <PackagePlus className="w-4 h-4" /> Receive New Stock
            </Button>
          </Link>
        )}
      </div>

      <BatchTable batches={batches} />
    </div>
  );
}