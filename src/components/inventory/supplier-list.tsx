'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Edit2,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  ToggleLeft,
  ToggleRight,
  Receipt,
  PackagePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SupplierModal } from './supplier-modal';
import { toggleSupplierStatusAction } from '@/app/actions/suppliers';
import type { SupplierWithBalance } from '@/types';

interface SupplierListProps {
  initialSuppliers: SupplierWithBalance[];
  isAdmin: boolean;
}

export function SupplierList({ initialSuppliers, isAdmin }: SupplierListProps) {
  const [suppliers, setSuppliers] = useState<SupplierWithBalance[]>(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'DUBE' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithBalance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
      (s.phone && s.phone.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterTab === 'DUBE') return s.has_unpaid_dube;
    if (filterTab === 'ACTIVE') return s.is_active;
    if (filterTab === 'INACTIVE') return !s.is_active;

    return true;
  });

  const totalDubeSuppliers = suppliers.filter((s) => s.has_unpaid_dube).length;
  const totalOutstandingBalance = suppliers.reduce((acc, s) => acc + s.total_payable_balance, 0);

  function handleOpenCreate() {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(supplier: SupplierWithBalance) {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  }

  function handleToggleStatus(supplier: SupplierWithBalance) {
    startTransition(async () => {
      const res = await toggleSupplierStatusAction(supplier.id);
      if (res.success && res.data) {
        setSuppliers((prev) =>
          prev.map((item) =>
            item.id === supplier.id ? { ...item, is_active: !item.is_active } : item
          )
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner if there is outstanding Dube */}
      {totalOutstandingBalance > 0 && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold">Total Outstanding Supplier Credit (Dube)</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Outstanding post-paid balance across {totalDubeSuppliers} suppliers
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xl font-bold text-amber-900">
              {totalOutstandingBalance.toLocaleString()}{' '}
              <span className="text-xs font-normal text-amber-700">ETB</span>
            </span>
          </div>
        </div>
      )}

      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, phone, or contact person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all shadow-2xs"
          />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/inventory/receive">
              <Button variant="outline" className="gap-1.5 text-xs font-semibold text-teal-800 border-teal-200 hover:bg-teal-50">
                <PackagePlus className="w-4 h-4" />
                Receive Stock
              </Button>
            </Link>
            <Button onClick={handleOpenCreate} variant="primary" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Supplier
            </Button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterTab === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Suppliers ({suppliers.length})
        </button>
        <button
          onClick={() => setFilterTab('DUBE')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            filterTab === 'DUBE'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100/60'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Unpaid Credit / Dube ({totalDubeSuppliers})
        </button>
        <button
          onClick={() => setFilterTab('ACTIVE')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterTab === 'ACTIVE'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Active ({suppliers.filter((s) => s.is_active).length})
        </button>
        <button
          onClick={() => setFilterTab('INACTIVE')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterTab === 'INACTIVE'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Inactive ({suppliers.filter((s) => !s.is_active).length})
        </button>
      </div>

      {/* Suppliers Grid / Table */}
      {filteredSuppliers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No suppliers found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No suppliers matching "${searchQuery}". Try a different keyword.`
              : 'No suppliers registered in this list.'}
          </p>
          {isAdmin && !searchQuery && (
            <Button onClick={handleOpenCreate} variant="outline" className="mt-4 gap-1.5">
              <Plus className="w-4 h-4" /> Add your first supplier
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Supplier</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4 text-center">Receipts</th>
                  <th className="py-3.5 px-4">Credit / Dube Balance</th>
                  <th className="py-3.5 px-4">Status</th>
                  {isAdmin && <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((supplier) => {
                  return (
                    <tr
                      key={supplier.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        !supplier.is_active ? 'opacity-60 bg-slate-50/30' : ''
                      }`}
                    >
                      {/* Name & Contact Person */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900">{supplier.name}</div>
                        {supplier.contact_person && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            Contact: <span className="text-slate-700">{supplier.contact_person}</span>
                          </div>
                        )}
                      </td>

                      {/* Phone & Email */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-xs">
                          {supplier.phone ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{supplier.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">No phone</span>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{supplier.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-4 px-4">
                        {supplier.address ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 max-w-xs truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{supplier.address}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-700 font-medium">
                          <Receipt className="w-3.5 h-3.5 text-slate-400" />
                          {supplier.total_received_orders} receipts
                        </span>
                      </td>

                      {/* Outstanding Dube Balance */}
                      <td className="py-4 px-4">
                        {supplier.has_unpaid_dube ? (
                          <div>
                            <span className="font-bold text-sm text-amber-900">
                              {supplier.total_payable_balance.toLocaleString()} ETB
                            </span>
                            <div className="mt-0.5">
                              <Badge variant="warning">Unpaid Dube</Badge>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-emerald-700">0 ETB (Clear)</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {supplier.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Inactive</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              onClick={() => handleOpenEdit(supplier)}
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-slate-600 hover:text-slate-900"
                              title="Edit Supplier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline ml-1 text-xs">Edit</span>
                            </Button>
                            <Button
                              onClick={() => handleToggleStatus(supplier)}
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-slate-500 hover:text-slate-800"
                              title={supplier.is_active ? 'Deactivate' : 'Activate'}
                              disabled={isPending}
                            >
                              {supplier.is_active ? (
                                <ToggleRight className="w-5 h-5 text-teal-600" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-slate-400" />
                              )}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplierToEdit={selectedSupplier}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
