'use client';

import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Smartphone,
  Banknote,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { closeShiftAction, type ShiftActionResponse } from '@/app/actions/shifts';
import type { ShiftSummary } from '@/types';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftSummary: ShiftSummary;
  onSuccess?: () => void;
}

export function CloseShiftModal({
  isOpen,
  onClose,
  shiftSummary,
  onSuccess,
}: CloseShiftModalProps) {
  const [actualCash, setActualCash] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const openingCash = shiftSummary.opening_cash;
  const cashSales = shiftSummary.cash_sales_total;
  const bankSales = shiftSummary.bank_sales_total;
  const cashRefunds = shiftSummary.cash_refunds_total;
  const cashIn = shiftSummary.cash_in_total;
  const cashOut = shiftSummary.cash_out_total;
  const expectedCash = shiftSummary.expected_closing_cash;

  const countedNumber = parseFloat(actualCash);
  const isValidCount = !isNaN(countedNumber) && countedNumber >= 0;
  const discrepancy = isValidCount ? Number((countedNumber - expectedCash).toFixed(2)) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidCount) {
      setGeneralError('Please enter a valid counted physical cash amount.');
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    const formData = new FormData();
    formData.append('actual_closing_cash', actualCash);
    formData.append('closing_notes', closingNotes);

    const res: ShiftActionResponse = await closeShiftAction(null, formData);
    setIsSubmitting(false);

    if (res.error) {
      setGeneralError(res.error);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Close Shift & Till Reconciliation</h2>
            <p className="text-xs text-slate-500">Calculate physical expected cash and verify discrepancy</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {generalError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>{generalError}</div>
            </div>
          )}

          {/* Immutable notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Permanent Audit Record:</span> Once closed, a shift cannot be edited or reopened. Subsequent corrections require an authorized administrative audit adjustment.
            </div>
          </div>

          {/* Expected Cash Reconciliation Breakdown */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-800 border-b border-slate-200 pb-2">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-teal-700" />
                Physical Cash Breakdown
              </span>
              <span>Amount (ETB)</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Opening Cash Float (+)</span>
              <span className="font-mono">{openingCash.toLocaleString()} ETB</span>
            </div>

            <div className="flex justify-between text-emerald-800 font-medium">
              <span>Physical Cash Sales (+)</span>
              <span className="font-mono">+{cashSales.toLocaleString()} ETB</span>
            </div>

            {cashRefunds > 0 && (
              <div className="flex justify-between text-rose-700 font-medium">
                <span>Cash Refunds Given (-)</span>
                <span className="font-mono">-{cashRefunds.toLocaleString()} ETB</span>
              </div>
            )}

            {cashIn > 0 && (
              <div className="flex justify-between text-teal-800">
                <span>Cash Till Pay In (+)</span>
                <span className="font-mono">+{cashIn.toLocaleString()} ETB</span>
              </div>
            )}

            {cashOut > 0 && (
              <div className="flex justify-between text-amber-800">
                <span>Cash Till Pay Out (-)</span>
                <span className="font-mono">-{cashOut.toLocaleString()} ETB</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Expected Cash in Till (=)</span>
              <span className="font-mono text-base text-teal-900">
                {expectedCash.toLocaleString()} ETB
              </span>
            </div>
          </div>

          {/* Electronic Bank Transfer Notice (Telebirr / CBE Birr) */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <span className="font-semibold">Electronic Bank Collections:</span>
                <span className="text-blue-700 block text-[11px]">
                  Telebirr / CBE Birr (Excluded from physical cash drawer)
                </span>
              </div>
            </div>
            <div className="font-mono font-bold text-sm text-blue-900">
              {bankSales.toLocaleString()} ETB
            </div>
          </div>

          {/* Actual Cash Counted Input */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              Counted Physical Cash in Drawer (ETB) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Banknote className="w-5 h-5" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter exact counted cash..."
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                className="w-full pl-10 pr-14 py-3 bg-white border-2 border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-hidden focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all"
                required
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                ETB
              </span>
            </div>
          </div>

          {/* Live Discrepancy Indicator */}
          {discrepancy !== null && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                discrepancy === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : discrepancy > 0
                  ? 'bg-blue-50 border-blue-200 text-blue-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {discrepancy === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>
                  {discrepancy === 0
                    ? 'Till Balanced (Exact Match)'
                    : discrepancy > 0
                    ? 'Cash Surplus (Over Expected)'
                    : 'Cash Shortage (Below Expected)'}
                </span>
              </div>
              <div className="font-mono text-sm font-extrabold">
                {discrepancy > 0 ? `+${discrepancy.toLocaleString()}` : discrepancy.toLocaleString()} ETB
              </div>
            </div>
          )}

          {/* Closing Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Closing Handover Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Handed 2,000 ETB notes to safe, left 500 ETB change float for next shift."
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="font-semibold bg-slate-900 hover:bg-black text-white"
            >
              Confirm & Finalize Shift
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
