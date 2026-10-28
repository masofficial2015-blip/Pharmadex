'use client';

import React, { useState, useDeferredValue, useMemo, useEffect } from 'react';
import {
  Search,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Layers,
  Calendar,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatStockBreakdown } from '@/lib/utils/packaging';
import { updateBatchDetailsAction } from '@/app/actions/inventory';
import type { BatchWithDetails } from '@/types';

interface BatchTableProps {
  batches: BatchWithDetails[];
}

const PAGE_SIZE = 25;

export function BatchTable({ batches }: BatchTableProps) {
  const [batchesState, setBatchesState] = useState<BatchWithDetails[]>(batches);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'NEAR_EXPIRY' | 'EXPIRED' | 'AVAILABLE' | 'ZERO_STOCK'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Batch Edit State (Stock count, prices, batch number, expiry)
  const [editingBatch, setEditingBatch] = useState<BatchWithDetails | null>(null);
  const [editPacks, setEditPacks] = useState('');
  const [editLooseUnits, setEditLooseUnits] = useState('');
  const [editTotalUnits, setEditTotalUnits] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editPackPrice, setEditPackPrice] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  const [editBatchNumber, setEditBatchNumber] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setBatchesState(batches);
  }, [batches]);

  // React 19 deferred search query keeps mobile input typing fluid
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Reset to page 1 whenever search query or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, filterTab]);

  function handleStartEdit(batch: BatchWithDetails) {
    setEditingBatch(batch);
    setEditError(null);
    const unitsPerPack = batch.medicine?.units_per_pack || 1;
    const currentUnits = batch.current_quantity_units || 0;
    const currentPacks = Math.floor(currentUnits / unitsPerPack);
    const currentLoose = currentUnits % unitsPerPack;

    setEditPacks(currentPacks.toString());
    setEditLooseUnits(currentLoose.toString());
    setEditTotalUnits(currentUnits.toString());

    setEditCostPrice(batch.cost_per_pack ? batch.cost_per_pack.toString() : '0');
    setEditPackPrice(batch.selling_price_per_pack ? batch.selling_price_per_pack.toString() : '');
    setEditUnitPrice(batch.selling_price_per_unit ? batch.selling_price_per_unit.toString() : '');
    setEditBatchNumber(batch.batch_number || '');
    setEditExpiryDate(batch.expiry_date ? batch.expiry_date.split('T')[0] : '');
    setEditReason('');
  }

  function handlePacksOrLooseChange(newPacksStr: string, newLooseStr: string) {
    if (!editingBatch) return;
    const unitsPerPack = editingBatch.medicine?.units_per_pack || 1;
    setEditPacks(newPacksStr);
    setEditLooseUnits(newLooseStr);

    const p = parseInt(newPacksStr) || 0;
    const l = parseInt(newLooseStr) || 0;
    const total = p * unitsPerPack + l;
    setEditTotalUnits(total.toString());
  }

  function handleTotalUnitsChange(newTotalStr: string) {
    if (!editingBatch) return;
    const unitsPerPack = editingBatch.medicine?.units_per_pack || 1;
    setEditTotalUnits(newTotalStr);

    const total = parseInt(newTotalStr) || 0;
    setEditPacks(Math.floor(total / unitsPerPack).toString());
    setEditLooseUnits((total % unitsPerPack).toString());
  }

  async function handleSaveBatch() {
    if (!editingBatch) return;
    const totalUnits = parseInt(editTotalUnits);
    if (isNaN(totalUnits) || totalUnits < 0) {
      setEditError('Please enter a valid stock quantity (0 or greater).');
      return;
    }

    const costPack = parseFloat(editCostPrice) || 0;
    const packPrice = parseFloat(editPackPrice) || 0;
    const unitPrice = parseFloat(editUnitPrice) || 0;

    setIsUpdating(true);
    setEditError(null);

    try {
      const res = await updateBatchDetailsAction({
        batchId: editingBatch.id,
        currentQuantityUnits: totalUnits,
        costPerPack: costPack,
        sellingPricePerPack: packPrice,
        sellingPricePerUnit: unitPrice,
        batchNumber: editBatchNumber.trim(),
        expiryDate: editExpiryDate.trim(),
        reason: editReason.trim(),
      });

      if (res.success) {
        setBatchesState((prev) =>
          prev.map((b) =>
            b.id === editingBatch.id
              ? {
                  ...b,
                  current_quantity_units: totalUnits,
                  cost_per_pack: costPack,
                  selling_price_per_pack: packPrice,
                  selling_price_per_unit: unitPrice,
                  batch_number: editBatchNumber.trim() || b.batch_number,
                  expiry_date: editExpiryDate.trim() || b.expiry_date,
                }
              : b
          )
        );
        setEditingBatch(null);
      } else {
        setEditError(res.error || 'Failed to update batch details');
      }
    } catch (err: any) {
      setEditError(err.message || 'Error updating batch');
    } finally {
      setIsUpdating(false);
    }
  }

  const filteredBatches = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase().trim();
    return batchesState.filter((b) => {
      const medName = b.medicine?.name?.toLowerCase() || '';
      const brandName = b.medicine?.brand_name?.toLowerCase() || '';
      const batchNum = b.batch_number.toLowerCase();

      const matchesSearch = !q || medName.includes(q) || brandName.includes(q) || batchNum.includes(q);
      if (!matchesSearch) return false;

      if (filterTab === 'NEAR_EXPIRY') return b.is_near_expiry;
      if (filterTab === 'EXPIRED') return b.is_expired;
      if (filterTab === 'AVAILABLE') return b.current_quantity_units > 0 && !b.is_expired;
      if (filterTab === 'ZERO_STOCK') return b.current_quantity_units === 0 || b.is_unstocked;

      return true;
    });
  }, [batchesState, deferredSearchQuery, filterTab]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE));
  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBatches.slice(start, start + PAGE_SIZE);
  }, [filteredBatches, currentPage]);

  const nearExpiryCount = batchesState.filter((b) => b.is_near_expiry).length;
  const expiredCount = batchesState.filter((b) => b.is_expired).length;
  const zeroStockCount = batchesState.filter((b) => b.current_quantity_units === 0 || b.is_unstocked).length;

  return (
    <div className="space-y-6">
      {/* Expiry Alerts Summary Bar */}
      {(nearExpiryCount > 0 || expiredCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {nearExpiryCount > 0 && (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Near Expiry Alert (&lt; 4 Months)</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {nearExpiryCount} batch(es) expiring within 120 days. Prioritize in FEFO dispensing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFilterTab('NEAR_EXPIRY')}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                View ({nearExpiryCount})
              </button>
            </div>
          )}

          {expiredCount > 0 && (
            <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-900 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Expired Batches (Blocked from Sale)</h4>
                  <p className="text-xs text-rose-700 mt-0.5">
                    {expiredCount} batch(es) past expiry date. POS allocation is strictly blocked.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFilterTab('EXPIRED')}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                View ({expiredCount})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search and Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by medicine, brand name, or batch #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all shadow-2xs"
          />
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
            All Batches ({batches.length})
          </button>
          <button
            onClick={() => setFilterTab('NEAR_EXPIRY')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filterTab === 'NEAR_EXPIRY'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Near Expiry ({nearExpiryCount})
          </button>
          <button
            onClick={() => setFilterTab('EXPIRED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filterTab === 'EXPIRED'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Expired ({expiredCount})
          </button>
          <button
            onClick={() => setFilterTab('AVAILABLE')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterTab === 'AVAILABLE'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Available Stock
          </button>
          <button
            onClick={() => setFilterTab('ZERO_STOCK')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filterTab === 'ZERO_STOCK'
                ? 'bg-purple-700 text-white'
                : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Zero Stock ({zeroStockCount})
          </button>
        </div>
      </div>

      {/* FEFO Table */}
      {filteredBatches.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <PackageCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No batches match filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No batches matching "${searchQuery}".`
              : 'There are no batches registered under this filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">FEFO Priority & Expiry</th>
                  <th className="py-3.5 px-4">Medicine Item</th>
                  <th className="py-3.5 px-4">Batch #</th>
                  <th className="py-3.5 px-4">Available Units</th>
                  <th className="py-3.5 px-4">Selling Prices</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBatches.map((b, idx) => {
                  const globalIdx = (currentPage - 1) * PAGE_SIZE + idx;
                  const unitsPerPack = b.medicine?.units_per_pack || 1;
                  const packLabel = b.medicine?.pack_label || 'Pack';
                  const baseUnit = b.medicine?.base_unit || 'unit';

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        b.is_expired
                          ? 'bg-rose-50/30'
                          : b.is_near_expiry
                          ? 'bg-amber-50/30'
                          : ''
                      }`}
                    >
                      {/* FEFO Expiry Countdown */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                            #{globalIdx + 1}
                          </span>
                          <div>
                            {b.is_unstocked ? (
                              <div className="font-semibold text-slate-500 flex items-center gap-1.5 text-xs">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>No batch set</span>
                              </div>
                            ) : (
                              <>
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{b.expiry_date}</span>
                                </div>
                                <div className="mt-0.5">
                                  {b.is_expired ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                                      <ShieldAlert className="w-3 h-3" />
                                      Expired {Math.abs(b.days_to_expiry)}d ago
                                    </span>
                                  ) : b.is_near_expiry ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                                      <Clock className="w-3 h-3" />
                                      Expiring in {b.days_to_expiry} days
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-emerald-700 font-medium">
                                      {b.days_to_expiry} days remaining
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Medicine details */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900">
                          {b.medicine?.name} {b.medicine?.strength}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{b.medicine?.dosage_form}</span>
                          {b.medicine?.brand_name && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-slate-700">
                                {b.medicine?.brand_name}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Batch Number */}
                      <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-800">
                        {b.is_unstocked ? (
                          <span className="text-slate-400 italic">None</span>
                        ) : (
                          b.batch_number
                        )}
                      </td>

                      {/* Current Stock */}
                      <td className="py-4 px-4">
                        <div className={`font-bold text-sm ${b.is_unstocked || b.current_quantity_units === 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {b.is_unstocked ? '0 Packs (Out of stock)' : formatStockBreakdown(b.current_quantity_units, b.medicine)}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ({b.current_quantity_units.toLocaleString()} {baseUnit}{b.current_quantity_units !== 1 ? 's' : ''})
                        </div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-4 px-4">
                        <div>
                          <div className="text-xs text-slate-900 font-semibold">
                            {b.selling_price_per_pack} ETB / {packLabel}
                          </div>
                          <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                            {b.selling_price_per_unit} ETB / {baseUnit}
                          </div>
                          {Number(b.selling_price_per_pack) === 0 && (
                            <span className="inline-block px-1.5 py-0.2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-medium mt-0.5">
                              Price not set
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {b.supplier?.name || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {b.is_unstocked ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Zero Stock
                          </span>
                        ) : b.is_expired ? (
                          <Badge variant="danger">Blocked (Expired)</Badge>
                        ) : b.is_near_expiry ? (
                          <Badge variant="warning">Near Expiry</Badge>
                        ) : (
                          <Badge variant="success">Healthy FEFO</Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant={b.is_unstocked ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleStartEdit(b)}
                          className={`h-8 px-2.5 text-xs font-semibold gap-1.5 shadow-2xs ${
                            b.is_unstocked
                              ? 'bg-teal-700 hover:bg-teal-800 text-white'
                              : 'text-teal-800 hover:text-teal-900 border-teal-200 hover:bg-teal-50'
                          }`}
                          title={b.is_unstocked ? "Initialize Stock & Pricing" : "Edit Batch Stock & Pricing"}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{b.is_unstocked ? '+ Set Initial Stock' : 'Edit'}</span>
                        </Button>
                      </td>
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
                  {Math.min(currentPage * PAGE_SIZE, filteredBatches.length)}
                </strong>{' '}
                of <strong className="text-slate-900 font-semibold">{filteredBatches.length}</strong> batches
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

      {/* Edit Batch Stock & Pricing Modal */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-teal-700" />
                  {editingBatch.is_unstocked ? 'Set Initial Stock & Pricing' : 'Edit Batch Stock & Pricing'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-slate-800">{editingBatch.medicine?.name}</span>{' '}
                  {editingBatch.medicine?.strength && <span>{editingBatch.medicine.strength}</span>}{' '}
                  {editingBatch.medicine?.dosage_form && <span>({editingBatch.medicine.dosage_form})</span>}
                  {editingBatch.medicine?.brand_name && (
                    <span className="text-slate-600"> • Brand: {editingBatch.medicine.brand_name}</span>
                  )}
                </p>
                <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                  Packaging: 1 {editingBatch.medicine?.pack_label || 'Pack'} = {editingBatch.medicine?.units_per_pack || 1} {editingBatch.medicine?.base_unit || 'unit'}(s)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBatch(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{editError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Section 1: Stock Quantity */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-700" />
                    Stock Quantity on Hand
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Current: {editingBatch.current_quantity_units} {editingBatch.medicine?.base_unit || 'unit'}(s)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Packs ({editingBatch.medicine?.pack_label || 'Box'}es)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editPacks}
                      onChange={(e) => handlePacksOrLooseChange(e.target.value, editLooseUnits)}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-semibold bg-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Loose ({editingBatch.medicine?.base_unit || 'Unit'}s)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editLooseUnits}
                      onChange={(e) => handlePacksOrLooseChange(editPacks, e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-semibold bg-white"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">
                    Total Base Units:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={editTotalUnits}
                      onChange={(e) => handleTotalUnitsChange(e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-24 px-2 py-1 text-sm font-bold text-teal-800 text-right border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
                    />
                    <span className="text-xs text-slate-500 font-medium">
                      {editingBatch.medicine?.base_unit || 'unit'}(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Pricing */}
              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-teal-700" />
                  Pricing (ETB)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Cost / {editingBatch.medicine?.pack_label || 'Pack'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editCostPrice}
                      onChange={(e) => setEditCostPrice(e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Selling / {editingBatch.medicine?.pack_label || 'Pack'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editPackPrice}
                      onChange={(e) => {
                        const p = e.target.value;
                        setEditPackPrice(p);
                        const units = editingBatch.medicine?.units_per_pack || 1;
                        if (parseFloat(p) > 0 && units > 0) {
                          setEditUnitPrice((parseFloat(p) / units).toFixed(2));
                        }
                      }}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-semibold text-slate-900 bg-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Selling / {editingBatch.medicine?.base_unit || 'Unit'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editUnitPrice}
                      onChange={(e) => setEditUnitPrice(e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Batch Number & Expiry Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch #
                  </label>
                  <input
                    type="text"
                    value={editBatchNumber}
                    onChange={(e) => setEditBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-mono text-xs"
                    placeholder="BATCH-123"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={editExpiryDate}
                    onChange={(e) => setEditExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Section 4: Adjustment Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment <span className="text-slate-400 font-normal">(Optional audit note)</span>
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 placeholder:text-slate-400"
                  placeholder="e.g. Initial stock counting mistake correction"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingBatch(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveBatch}
                disabled={isUpdating}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-4"
              >
                {isUpdating ? 'Saving Changes...' : 'Save Batch & Stock'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
