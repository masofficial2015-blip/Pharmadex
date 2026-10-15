'use client';

import React, { useState, useDeferredValue, useMemo, useEffect } from 'react';
import {
  Search,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  SlidersHorizontal,
  History,
  User,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StockMovementWithDetails } from '@/types';

interface StockMovementTableProps {
  movements: StockMovementWithDetails[];
}

const PAGE_SIZE = 25;

export function StockMovementTable({ movements }: StockMovementTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // React 19 deferred value keeps mobile search typing fluid
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Reset to page 1 whenever search query or category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, filterType]);

  const filteredMovements = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase().trim();
    return movements.filter((m) => {
      const medName = m.medicine?.name?.toLowerCase() || '';
      const batchNum = m.batch?.batch_number?.toLowerCase() || '';
      const performer = m.performer?.full_name?.toLowerCase() || '';
      const notes = m.notes?.toLowerCase() || '';

      const matchesSearch =
        !q || medName.includes(q) || batchNum.includes(q) || performer.includes(q) || notes.includes(q);

      if (!matchesSearch) return false;

      if (filterType !== 'ALL' && m.movement_type !== filterType) return false;

      return true;
    });
  }, [movements, deferredSearchQuery, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / PAGE_SIZE));
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMovements.slice(start, start + PAGE_SIZE);
  }, [filteredMovements, currentPage]);

  function renderMovementBadge(type: string) {
    switch (type) {
      case 'RECEIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Stock In (Receive)
          </span>
        );
      case 'SALE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Stock Out (Sale)
          </span>
        );
      case 'RETURN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <RotateCcw className="w-3.5 h-3.5" />
            Customer Return
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Recount Adjustment
          </span>
        );
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by medicine, batch #, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all shadow-2xs"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {['ALL', 'RECEIVE', 'SALE', 'RETURN', 'ADJUSTMENT'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filterType === type
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type === 'ALL' ? 'All Movements' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table & Mobile Cards */}
      {filteredMovements.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No stock movements recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No movements matching "${searchQuery}".`
              : 'Every receipt, sale, and adjustment will automatically appear in this immutable ledger.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View (Screens < md) - Ensures Full Audit Notes Visibility */}
          <div className="md:hidden space-y-3">
            {paginatedMovements.map((m) => {
              const dateStr = new Date(m.created_at).toLocaleString('en-US', {
                dateStyle: 'short',
                timeStyle: 'short',
              });
              const isPositive = m.movement_type === 'RECEIVE' || m.movement_type === 'RETURN';

              return (
                <div
                  key={m.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    {renderMovementBadge(m.movement_type)}
                    <span className="font-mono text-[11px] text-slate-400">{dateStr}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      {m.medicine?.name} {m.medicine?.strength}
                    </h4>
                    <div className="text-xs text-slate-500">
                      {m.medicine?.dosage_form} • Batch #{m.batch?.batch_number || 'N/A'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Delta</span>
                      <span className={`font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isPositive ? '+' : '-'}{Math.abs(m.quantity_units)} {m.medicine?.base_unit || 'units'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-sans">Balance</span>
                      <span className="text-slate-600">{m.previous_quantity_units} &rarr; </span>
                      <span className="font-bold text-slate-900">{m.new_quantity_units}</span>
                    </div>
                  </div>

                  {/* Audit Notes - Fully Visible Without Truncation on Mobile */}
                  {m.notes ? (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 break-words whitespace-normal leading-relaxed">
                      <span className="font-semibold text-amber-900 block text-[11px] uppercase tracking-wider mb-0.5">
                        Audit Note:
                      </span>
                      {m.notes}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">No audit notes recorded</div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Staff: {m.performer?.full_name || 'System Staff'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (Screens >= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Medicine Item</th>
                  <th className="py-3.5 px-4">Batch #</th>
                  <th className="py-3.5 px-4 text-center">Quantity Delta</th>
                  <th className="py-3.5 px-4 text-center">Balance</th>
                  <th className="py-3.5 px-4">Performed By</th>
                  <th className="py-3.5 px-4 sm:px-6">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMovements.map((m) => {
                  const dateStr = new Date(m.created_at).toLocaleString('en-US', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  });
                  const isPositive = m.movement_type === 'RECEIVE' || m.movement_type === 'RETURN';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Timestamp */}
                      <td className="py-4 px-4 sm:px-6 text-xs text-slate-500 font-mono whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {renderMovementBadge(m.movement_type)}
                      </td>

                      {/* Medicine */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900">
                          {m.medicine?.name} {m.medicine?.strength}
                        </div>
                        <div className="text-xs text-slate-500">{m.medicine?.dosage_form}</div>
                      </td>

                      {/* Batch */}
                      <td className="py-4 px-4 font-mono text-xs text-slate-800">
                        {m.batch?.batch_number || '—'}
                      </td>

                      {/* Quantity Delta */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                          {Math.abs(m.quantity_units)}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            {m.medicine?.base_unit || 'units'}
                          </span>
                        </span>
                      </td>

                      {/* Balance (Previous -> New) */}
                      <td className="py-4 px-4 text-center text-xs font-mono text-slate-600">
                        <span>{m.previous_quantity_units}</span>
                        <span className="text-slate-400 mx-1">&rarr;</span>
                        <span className="font-semibold text-slate-900">{m.new_quantity_units}</span>
                      </td>

                      {/* Performer */}
                      <td className="py-4 px-4 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{m.performer?.full_name || 'System Staff'}</span>
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="py-4 px-4 sm:px-6 text-xs text-slate-700 whitespace-normal break-words max-w-xs leading-relaxed">
                        {m.notes || '—'}
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
                  {Math.min(currentPage * PAGE_SIZE, filteredMovements.length)}
                </strong>{' '}
                of <strong className="text-slate-900 font-semibold">{filteredMovements.length}</strong> movements
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
      </>
      )}
    </div>
  );
}