'use client';

import React from 'react';
import { X, Trash2, Edit2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatStockBreakdown } from '@/lib/utils/packaging';
import type { CartItem } from '@/types';

interface PosCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onEditItem: (item: CartItem) => void;
  onRemoveItem: (medicineId: string) => void;
  onClearCart: () => void;
  onProceedCheckout: () => void;
}

export function PosCartSheet({
  isOpen,
  onClose,
  cart,
  onEditItem,
  onRemoveItem,
  onClearCart,
  onProceedCheckout,
}: PosCartSheetProps) {
  if (!isOpen) return null;

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalUnitsCount = cart.reduce((sum, item) => sum + item.total_units, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden h-[85vh] sm:h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Sale Cart</h3>
              <p className="text-xs text-slate-500">
                {cart.length} item(s) • {totalUnitsCount} total units
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-12 h-12 stroke-1 mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">Cart is empty</p>
              <p className="text-xs text-slate-400 mt-1">Tap medicines in the grid to configure and add items.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.medicine.id}
                className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {item.medicine.name}
                  </h4>
                  <div className="text-slate-500 font-medium mt-0.5">
                    {item.medicine.strength} • {item.medicine.dosage_form}
                  </div>

                  {/* Quantity Breakdown */}
                  <div className="mt-2 text-slate-700 flex items-center gap-2">
                    <span className="font-semibold text-teal-800">
                      {formatStockBreakdown(item.total_units, item.medicine)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({item.total_units} {item.medicine.base_unit}s)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {item.subtotal.toLocaleString()} ETB
                    </span>
                    {item.custom_unit_price !== undefined && (
                      <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-semibold">
                        Custom: {item.custom_unit_price} ETB/{item.medicine.base_unit}
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit & Remove Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditItem(item)}
                    className="p-2 text-slate-500 hover:text-teal-700 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                    title="Change quantity"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.medicine.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white border border-transparent hover:border-rose-100 transition-all"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-white space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Items Total:</span>
              <span className="font-mono font-bold text-lg text-slate-900">
                {totalAmount.toLocaleString()} ETB
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClearCart}
                className="text-xs text-slate-500 hover:text-rose-600 border-slate-200"
              >
                Clear
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={onProceedCheckout}
                className="flex-1 h-12 text-sm font-bold bg-teal-700 hover:bg-teal-800 shadow-md"
              >
                <span>Checkout ({totalAmount.toLocaleString()} ETB)</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
