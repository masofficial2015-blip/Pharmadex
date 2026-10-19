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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatStockBreakdown } from '@/lib/utils/packaging';
import type { BatchWithDetails } from '@/types';

interface BatchTableProps {
  batches: BatchWithDetails[];
}

const PAGE_SIZE = 25;

export function BatchTable({ batches }: BatchTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'NEAR_EXPIRY' | 'EXPIRED' | 'AVAILABLE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // React 19 deferred search query keeps mobile input typing fluid
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Reset to page 1 whenever search query or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, filterTab]);

  const filteredBatches = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase().trim();
    return batches.filter((b) => {
      const medName = b.medicine?.name?.toLowerCase() || '';
      const brandName = b.medicine?.brand_name?.toLowerCase() || '';
      const batchNum = b.batch_number.toLowerCase();

      const matchesSearch = !q || medName.includes(q) || brandName.includes(q) || batchNum.includes(q);
      if (!matchesSearch) return false;

      if (filterTab === 'NEAR_EXPIRY') return b.is_near_expiry;
      if (filterTab === 'EXPIRED') return b.is_expired;
      if (filterTab === 'AVAILABLE') return b.current_quantity_units > 0 && !b.is_expired;

      return true;
    });
  }, [batches, deferredSearchQuery, filterTab]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / PAGE_SIZE));
  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredBatches.slice(start, start + PAGE_SIZE);
  }, [filteredBatches, currentPage]);

  const nearExpiryCount = batches.filter((b) => b.is_near_expiry).length;
  const expiredCount = batches.filter((b) => b.is_expired).length;

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
                  <th className="py-3.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBatches.map((b, idx) => {
                  const globalIdx = (currentPage - 1) * PAGE_SIZE + idx;
                  const unitsPerPack = b.medicine?.units_per_pack || 1;
                  const packLabel = b.medicine?.pack_label || 'Pack';
                  const baseUnit = b.medicine?.base_unit || 'unit';
                  const availablePacks = Math.floor(b.current_quantity_units / unitsPerPack);
                  const looseUnits = b.current_quantity_units % unitsPerPack;

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
                        {b.batch_number}
                      </td>

                      {/* Current Stock */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {formatStockBreakdown(b.current_quantity_units, b.medicine)}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          ({b.current_quantity_units.toLocaleString()} {baseUnit}{b.current_quantity_units !== 1 ? 's' : ''})
                        </div>
                      </td>

                      {/* Selling Price */}
                      <td className="py-4 px-4">
                        <div className="text-xs text-slate-900 font-semibold">
                          {b.selling_price_per_pack} ETB / {packLabel}
                        </div>
                        <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                          {b.selling_price_per_unit} ETB / {baseUnit}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="py-4 px-4 text-xs text-slate-600">
                        {b.supplier?.name || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-right">
                        {b.is_expired ? (
                          <Badge variant="danger">Blocked (Expired)</Badge>
                        ) : b.is_near_expiry ? (
                          <Badge variant="warning">Near Expiry</Badge>
                        ) : (
                          <Badge variant="success">Healthy FEFO</Badge>
                        )}
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
    </div>
  );
}
