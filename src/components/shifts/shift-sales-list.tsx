'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  User,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ShiftSaleItem } from '@/app/actions/shifts';

interface ShiftSalesListProps {
  sales: ShiftSaleItem[];
  shiftName?: string;
}

export function ShiftSalesList({ sales, shiftName }: ShiftSalesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  const filteredSales = sales.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const receipt = s.receipt_number.toLowerCase();
    const customer = (s.customer_name || '').toLowerCase();
    const notes = (s.notes || '').toLowerCase();
    const cashier = (s.cashier?.full_name || '').toLowerCase();
    const method = s.payment_method.toLowerCase();

    return (
      !q ||
      receipt.includes(q) ||
      customer.includes(q) ||
      notes.includes(q) ||
      cashier.includes(q) ||
      method.includes(q)
    );
  });

  function getPaymentBadge(method: string) {
    switch (method) {
      case 'CASH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Banknote className="w-3 h-3" /> Cash Till
          </span>
        );
      case 'TELEBIRR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Smartphone className="w-3 h-3" /> Telebirr
          </span>
        );
      case 'CBE_BIRR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Building className="w-3 h-3" /> CBE Birr
          </span>
        );
      case 'BANK_TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <CreditCard className="w-3 h-3" /> Transfer
          </span>
        );
      default:
        return <Badge variant="neutral">{method}</Badge>;
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              Completed Sales & Customer Notes
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {shiftName ? `Sales recorded for shift: ${shiftName}` : 'Recent sales receipts and cashier notes'}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt, customer, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-teal-600 transition-all"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredSales.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-slate-100 space-y-1.5">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No Sales Found</p>
          <p className="text-xs text-slate-400">
            {searchQuery
              ? `No receipts matching "${searchQuery}".`
              : 'Completed transactions will display here along with all customer notes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSales.map((sale) => {
            const isExpanded = expandedSaleId === sale.id;
            const timeStr = new Date(sale.created_at).toLocaleTimeString('en-US', {
              timeStyle: 'short',
            });
            const hasNotes = Boolean(sale.customer_name || sale.notes);

            return (
              <div
                key={sale.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white transition-all space-y-2.5 shadow-2xs"
              >
                {/* Top Row: Receipt, Time, Cashier, Amount, Payment */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      #{sale.receipt_number}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {timeStr}
                    </span>
                    {sale.cashier && (
                      <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                        <User className="w-3 h-3 text-slate-400" />
                        {sale.cashier.full_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    {getPaymentBadge(sale.payment_method)}
                    <span className="font-mono font-extrabold text-sm text-teal-900">
                      {sale.total_amount.toLocaleString()} ETB
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                      title={isExpanded ? 'Hide items' : 'View items'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Customer Name & Notes - Highlighted for Owner */}
                {hasNotes ? (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                    {sale.customer_name && (
                      <div className="flex items-start gap-1.5">
                        <span className="font-semibold text-amber-900 shrink-0">Customer / Note:</span>
                        <span className="text-amber-950 font-medium break-words">
                          {sale.customer_name}
                        </span>
                      </div>
                    )}
                    {sale.notes && sale.notes !== sale.customer_name && (
                      <div className="flex items-start gap-1.5 text-amber-800">
                        <span className="font-medium shrink-0">Additional Note:</span>
                        <span className="break-words">{sale.notes}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">No customer notes recorded</div>
                )}

                {/* Expandable Line Items */}
                {isExpanded && sale.items && sale.items.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1 font-mono text-xs">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 font-sans">
                      Items Dispensed ({sale.items.length})
                    </div>
                    {sale.items.map((it) => (
                      <div key={it.id} className="flex justify-between items-center text-slate-700 py-0.5">
                        <span className="font-sans">
                          {it.medicine?.name} {it.medicine?.strength} &times; {it.quantity_units}
                        </span>
                        <span className="font-semibold">{it.subtotal.toLocaleString()} ETB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
