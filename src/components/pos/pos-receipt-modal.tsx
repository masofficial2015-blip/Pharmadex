'use client';

import React from 'react';
import { CheckCircle2, Printer, Plus, X, Receipt, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SaleReceipt } from '@/types';

interface PosReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: SaleReceipt | null;
  onNewSale: () => void;
}

export function PosReceiptModal({
  isOpen,
  onClose,
  receipt,
  onNewSale,
}: PosReceiptModalProps) {
  if (!isOpen || !receipt) return null;

  const dateStr = new Date(receipt.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="flex min-h-full items-start sm:items-center justify-center pt-4 pb-12 sm:py-8">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Success Badge */}
        <div className="p-6 bg-emerald-50/80 border-b border-emerald-100 text-center space-y-1.5">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-lg text-emerald-950">Sale Completed!</h3>
          <p className="text-xs text-emerald-800 font-mono font-bold">
            Receipt #{receipt.receipt_number}
          </p>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 space-y-4 text-xs font-mono" id="printable-receipt">
          <div className="text-center border-b border-dashed border-slate-200 pb-3">
            <h4 className="font-bold text-sm text-slate-900 uppercase font-sans">Pharmadex Pharmacy</h4>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">Community Pharmacy • Addis Ababa</p>
            <div className="text-[10px] text-slate-400 mt-1">
              <span>{dateStr}</span> • <span>Cashier: {receipt.cashier.full_name}</span>
            </div>
            {(receipt.customer_name || receipt.notes) && (
              <div className="text-[11px] text-slate-700 mt-1 bg-slate-50 py-1 px-2 rounded border border-slate-100">
                {receipt.customer_name && <div>Customer: <strong>{receipt.customer_name}</strong></div>}
                {receipt.notes && receipt.notes !== receipt.customer_name && (
                  <div className="text-[10px] text-slate-500">Note: {receipt.notes}</div>
                )}
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="space-y-2 border-b border-dashed border-slate-200 pb-3">
            <div className="flex justify-between font-bold text-slate-700 border-b border-slate-100 pb-1 text-[11px]">
              <span>Item & Batch</span>
              <span className="text-right">Qty & Price</span>
            </div>

            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="flex-1 pr-2">
                  <div className="font-bold text-slate-900 font-sans">{item.medicine_name} {item.strength}</div>
                  <div className="text-[10px] text-slate-400">
                    Lot #{item.batch_number} (Exp: {item.expiry_date})
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div>
                    {item.quantity_units} &times; {item.unit_price} ETB
                  </div>
                  <div className="font-bold text-slate-900">{item.subtotal.toLocaleString()} ETB</div>
                </div>
              </div>
            ))}
          </div>

          {/* Total & Payment Method */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-sm font-extrabold text-slate-900">
              <span>TOTAL PAID:</span>
              <span className="text-base text-teal-900">{receipt.total_amount.toLocaleString()} ETB</span>
            </div>

            <div className="flex justify-between text-slate-600 text-[11px]">
              <span>Payment Channel:</span>
              <span className="font-bold text-slate-800">{receipt.payment_method}</span>
            </div>

            {receipt.cash_tendered !== null && receipt.cash_tendered !== undefined && (
              <>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Cash Tendered:</span>
                  <span>{receipt.cash_tendered.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold text-[11px]">
                  <span>Change Given:</span>
                  <span>{receipt.change_returned?.toLocaleString()} ETB</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-400 font-sans">
            Thank you for your visit! Keep this receipt for returns.
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="flex-1 gap-1.5 text-xs font-semibold"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => {
              onNewSale();
              onClose();
            }}
            className="flex-1 gap-1.5 text-xs font-bold bg-teal-700 hover:bg-teal-800"
          >
            <Plus className="w-4 h-4" />
            New Sale
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}