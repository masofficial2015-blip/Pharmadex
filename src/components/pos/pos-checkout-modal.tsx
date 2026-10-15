'use client';

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { recordSaleAction, type SaleActionResponse } from '@/app/actions/sales';
import type { CartItem, SaleReceipt, PaymentMethod } from '@/types';

interface PosCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId: string;
  cart: CartItem[];
  onSaleCompleted: (receipt: SaleReceipt) => void;
}

export function PosCheckoutModal({
  isOpen,
  onClose,
  shiftId,
  cart,
  onSaleCompleted,
}: PosCheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const grandTotal = Number(
    cart.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
  );

  async function handleCompleteSale(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneralError(null);

    const trimmedNotes = customerNotes.trim() || undefined;

    const payload = {
      shift_id: shiftId,
      payment_method: paymentMethod,
      customer_name: trimmedNotes,
      notes: trimmedNotes,
      items: cart.map((item) => ({
        medicine_id: item.medicine.id,
        pack_quantity: item.pack_quantity,
        loose_quantity: item.loose_quantity,
      })),
    };

    const res: SaleActionResponse = await recordSaleAction(payload);
    setIsSubmitting(false);

    if (res.error) {
      setGeneralError(res.error);
    } else if (res.data) {
      onSaleCompleted(res.data);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">Payment & Complete Sale</h3>
            <p className="text-xs text-slate-500">
              Total Amount Due:{' '}
              <span className="font-bold text-teal-900 text-sm">{grandTotal.toLocaleString()} ETB</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCompleteSale} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {generalError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>{generalError}</div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-2">
              Choose Payment Method <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* CASH */}
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Cash Till</div>
                  <div className="text-[10px] text-slate-500">Drawer coins/notes</div>
                </div>
              </button>

              {/* TELEBIRR */}
              <button
                type="button"
                onClick={() => setPaymentMethod('TELEBIRR')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'TELEBIRR'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Telebirr</div>
                  <div className="text-[10px] text-slate-500">Mobile Wallet</div>
                </div>
              </button>

              {/* CBE BIRR */}
              <button
                type="button"
                onClick={() => setPaymentMethod('CBE_BIRR')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'CBE_BIRR'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-950 ring-2 ring-purple-600/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">CBE Birr</div>
                  <div className="text-[10px] text-slate-500">Commercial Bank</div>
                </div>
              </button>

              {/* BANK TRANSFER */}
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-teal-600 bg-teal-50/70 text-teal-950 ring-2 ring-teal-600/20'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs">Bank Transfer</div>
                  <div className="text-[10px] text-slate-500">Direct Deposit</div>
                </div>
              </button>
            </div>
          </div>

          {/* Customer Name / Notes (Optional) */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Customer Name / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Walk-in patient, Prescription #892, or credit notes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all shadow-2xs"
            />
            <p className="text-[11px] text-slate-500">
              Sale completes assuming full payment ({grandTotal.toLocaleString()} ETB).
            </p>
          </div>

          {/* Complete Sale Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full h-12 text-sm font-bold bg-teal-700 hover:bg-teal-800 shadow-md"
            >
              <span>Complete Sale ({grandTotal.toLocaleString()} ETB)</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}