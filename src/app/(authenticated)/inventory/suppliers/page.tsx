import React from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getSuppliersWithBalances } from '@/app/actions/suppliers';
import { SupplierList } from '@/components/inventory/supplier-list';
import { Building2, PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Suppliers Management | Pharmadex',
  description: 'Manage pharmaceutical suppliers, distributors, and outstanding Dube credit balances',
};

export default async function SuppliersPage() {
  const { profile } = await requireAdmin();
  const isAdmin = profile.role === 'ADMIN';
  const suppliers = await getSuppliersWithBalances();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Building2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Suppliers & Distributors</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain essential supplier contacts and track outstanding credit (Dube) balances.
          </p>
        </div>

        <Link href="/inventory/receive">
          <Button variant="primary" className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs gap-1.5 shadow-2xs">
            <PackagePlus className="w-4 h-4" />
            Receive Stock
          </Button>
        </Link>
      </div>

      <SupplierList initialSuppliers={suppliers} isAdmin={isAdmin} />
    </div>
  );
}
