'use client';

import React, { useState, useTransition, useDeferredValue, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Lock,
  AlertTriangle,
  Package,
  Layers,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MedicineModal } from './medicine-modal';
import { toggleMedicineStatusAction } from '@/app/actions/medicines';
import type { MedicineInventorySummary } from '@/types';

interface MedicineListProps {
  initialMedicines: MedicineInventorySummary[];
  isAdmin: boolean;
}

const PAGE_SIZE = 25;

export function MedicineList({ initialMedicines, isAdmin }: MedicineListProps) {
  const [medicines, setMedicines] = useState<MedicineInventorySummary[]>(initialMedicines);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'LOW_STOCK' | 'IN_STOCK' | 'OUT_OF_STOCK' | 'INACTIVE'>('ALL');
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineInventorySummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);

  // React 19 deferred value keeps mobile search typing fluid
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Reset to page 1 whenever search query or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, filterTab]);

  // Live filter memoized with deferred search query
  const filteredMedicines = useMemo(() => {
    const query = deferredSearchQuery.toLowerCase().trim();
    return medicines.filter((m) => {
      const matchesSearch =
        !query ||
        m.name.toLowerCase().includes(query) ||
        (m.brand_name && m.brand_name.toLowerCase().includes(query)) ||
        m.strength.toLowerCase().includes(query) ||
        m.dosage_form.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (filterTab === 'LOW_STOCK') return m.is_low_stock && m.is_active;
      if (filterTab === 'IN_STOCK') return m.total_units_in_stock > 0 && m.is_active;
      if (filterTab === 'OUT_OF_STOCK') return m.total_units_in_stock === 0 && m.is_active;
      if (filterTab === 'INACTIVE') return !m.is_active;

      return true;
    });
  }, [medicines, deferredSearchQuery, filterTab]);

  const totalPages = Math.max(1, Math.ceil(filteredMedicines.length / PAGE_SIZE));
  const paginatedMedicines = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMedicines.slice(start, start + PAGE_SIZE);
  }, [filteredMedicines, currentPage]);

  const lowStockCount = medicines.filter((m) => m.is_low_stock && m.is_active).length;

  function handleOpenCreate() {
    setSelectedMedicine(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(med: MedicineInventorySummary) {
    setSelectedMedicine(med);
    setIsModalOpen(true);
  }

  function handleToggleStatus(med: MedicineInventorySummary) {
    startTransition(async () => {
      const res = await toggleMedicineStatusAction(med.id);
      if (res.success && res.data) {
        setMedicines((prev) =>
          prev.map((item) => (item.id === med.id ? { ...item, is_active: !item.is_active } : item))
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filter Tabs & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by generic, brand name, or strength..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all shadow-2xs"
          />
        </div>

        {/* Action Button */}
        {isAdmin && (
          <Button onClick={handleOpenCreate} variant="primary" className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Add Medicine
          </Button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterTab('ALL')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterTab === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Medicines ({medicines.length})
        </button>
        <button
          onClick={() => setFilterTab('LOW_STOCK')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            filterTab === 'LOW_STOCK'
              ? 'bg-amber-600 text-white'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100/60'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Low Stock ({lowStockCount})
        </button>
        <button
          onClick={() => setFilterTab('IN_STOCK')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterTab === 'IN_STOCK'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          In Stock ({medicines.filter((m) => m.total_units_in_stock > 0 && m.is_active).length})
        </button>
        <button
          onClick={() => setFilterTab('OUT_OF_STOCK')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterTab === 'OUT_OF_STOCK'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Out of Stock ({medicines.filter((m) => m.total_units_in_stock === 0 && m.is_active).length})
        </button>
        <button
          onClick={() => setFilterTab('INACTIVE')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filterTab === 'INACTIVE'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Inactive ({medicines.filter((m) => !m.is_active).length})
        </button>
      </div>

      {/* Medicines Table / Cards */}
      {filteredMedicines.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No medicines found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No medicines matching "${searchQuery}". Try clearing your search.`
              : 'No medicine items registered in this category yet.'}
          </p>
          {isAdmin && !searchQuery && (
            <Button onClick={handleOpenCreate} variant="outline" className="mt-4 gap-1.5">
              <Plus className="w-4 h-4" /> Add your first medicine
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Medicine Details</th>
                  <th className="py-3.5 px-4">Dosage & Packaging</th>
                  <th className="py-3.5 px-4 text-center">Available Stock</th>
                  <th className="py-3.5 px-4">Earliest Expiry</th>
                  <th className="py-3.5 px-4">Status</th>
                  {isAdmin && <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMedicines.map((med) => {
                  return (
                    <tr
                      key={med.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        !med.is_active ? 'opacity-60 bg-slate-50/30' : ''
                      }`}
                    >
                      {/* Name & Brand */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{med.name}</span>
                          {med.brand_name && (
                            <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                              {med.brand_name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-medium text-teal-700">{med.strength}</span>
                          <span>•</span>
                          <span>{med.dosage_form}</span>
                        </div>
                      </td>

                      {/* Packaging Conversion */}
                      <td className="py-4 px-4">
                        <div className="text-xs text-slate-800 font-medium flex items-center gap-1.5">
                          <span>1 {med.pack_label || 'Pack'}</span>
                          <span className="text-slate-400">=</span>
                          <span className="font-semibold text-teal-800">
                            {med.units_per_pack} {med.base_unit}s
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {med.has_stock_transactions ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-normal">
                              <Lock className="w-3 h-3 text-amber-600" />
                              Conversion locked
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Editable conversion</span>
                          )}
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="font-bold text-base text-slate-900">
                            {med.total_units_in_stock.toLocaleString()}{' '}
                            <span className="text-xs font-normal text-slate-500">{med.base_unit}s</span>
                          </span>
                          <span className="text-xs text-slate-500">
                            ({med.total_packs_in_stock} {med.pack_label || 'pack'}s)
                          </span>
                          {med.is_low_stock && med.is_active && (
                            <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Low (&le; {med.low_stock_threshold})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Earliest Expiry */}
                      <td className="py-4 px-4">
                        {med.earliest_expiry_date ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{med.earliest_expiry_date}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No active batch</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {med.is_active ? (
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
                              onClick={() => handleOpenEdit(med)}
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-slate-600 hover:text-slate-900"
                              title="Edit Medicine"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline ml-1 text-xs">Edit</span>
                            </Button>
                            <Button
                              onClick={() => handleToggleStatus(med)}
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-slate-500 hover:text-slate-800"
                              title={med.is_active ? 'Deactivate' : 'Activate'}
                              disabled={isPending}
                            >
                              {med.is_active ? (
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

          {/* Pagination Toolbar */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing{' '}
                <strong className="text-slate-900 font-semibold">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900 font-semibold">
                  {Math.min(currentPage * PAGE_SIZE, filteredMedicines.length)}
                </strong>{' '}
                of <strong className="text-slate-900 font-semibold">{filteredMedicines.length}</strong> medicines
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-2.5 text-xs gap-1 border-slate-300"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>

                <span className="px-2 font-medium text-slate-700">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-2.5 text-xs gap-1 border-slate-300"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <MedicineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        medicineToEdit={selectedMedicine}
        onSuccess={() => {
          // Refresh window to re-fetch state from server
          window.location.reload();
        }}
      />
    </div>
  );
}
