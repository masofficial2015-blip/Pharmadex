'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Sparkles, Layers, Pill, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatStockBreakdown, formatPackagingFormula } from '@/lib/utils/packaging';
import type { PosMedicineItem, CartItem } from '@/types';

interface QuantityConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicine: PosMedicineItem | null;
  existingCartItem?: CartItem | null;
  onConfirm: (cartItem: CartItem) => void;
}

export function QuantityConfigModal({
  isOpen,
  onClose,
  medicine,
  existingCartItem,
  onConfirm,
}: QuantityConfigModalProps) {
  const [packQty, setPackQty] = useState<number>(0);
  const [looseQty, setLooseQty] = useState<number>(0);
  const [enteredUnitPrice, setEnteredUnitPrice] = useState<string>('');
  const [enteredPackPrice, setEnteredPackPrice] = useState<string>('');

  const unitsPerPack = medicine?.units_per_pack || 1;
  const isUnpriced = (medicine?.unit_price ?? 0) <= 0;

  useEffect(() => {
    if (existingCartItem) {
      setPackQty(existingCartItem.pack_quantity);
      setLooseQty(existingCartItem.loose_quantity);
      if (existingCartItem.custom_unit_price) {
        setEnteredUnitPrice(existingCartItem.custom_unit_price.toString());
        setEnteredPackPrice(
          (existingCartItem.custom_unit_price * (medicine?.units_per_pack || 1)).toFixed(2)
        );
      } else {
        setEnteredUnitPrice('');
        setEnteredPackPrice('');
      }
    } else {
      // Default to 1 pack if available, otherwise 1 loose unit
      if (medicine && medicine.available_packs > 0) {
        setPackQty(1);
        setLooseQty(0);
      } else {
        setPackQty(0);
        setLooseQty(1);
      }
      setEnteredUnitPrice('');
      setEnteredPackPrice('');
    }
  }, [existingCartItem, medicine, isOpen]);

  if (!isOpen || !medicine) return null;

  const packLabel = medicine.pack_label || 'Pack';
  const baseUnit = medicine.base_unit || 'unit';

  const totalRequestedUnits = packQty * unitsPerPack + looseQty;
  const isOutOfStock = medicine.total_available_units <= 0;
  const exceedsStock = totalRequestedUnits > medicine.total_available_units;

  // Determine effective pricing
  const customUnitPriceNum = parseFloat(enteredUnitPrice) || 0;
  const effectiveUnitPrice = isUnpriced ? customUnitPriceNum : medicine.unit_price;
  const effectivePackPrice = isUnpriced
    ? Number((effectiveUnitPrice * unitsPerPack).toFixed(2))
    : medicine.pack_price;

  const isPriceMissing = isUnpriced && effectiveUnitPrice <= 0;

  // Subtotal calculation
  const subtotal = Number(
    (packQty * effectivePackPrice + looseQty * effectiveUnitPrice).toFixed(2)
  );

  function handleUnitPriceChange(valStr: string) {
    setEnteredUnitPrice(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num >= 0) {
      setEnteredPackPrice((num * unitsPerPack).toFixed(2));
    } else {
      setEnteredPackPrice('');
    }
  }

  function handlePackPriceChange(valStr: string) {
    setEnteredPackPrice(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num >= 0) {
      setEnteredUnitPrice((num / unitsPerPack).toFixed(2));
    } else {
      setEnteredUnitPrice('');
    }
  }

  function handleAddPacks(delta: number) {
    const nextPacks = Math.max(0, packQty + delta);
    const nextTotalUnits = nextPacks * unitsPerPack + looseQty;
    if (nextTotalUnits <= medicine!.total_available_units) {
      setPackQty(nextPacks);
    } else {
      // Max out to available packs
      const maxPacks = Math.floor((medicine!.total_available_units - looseQty) / unitsPerPack);
      setPackQty(Math.max(0, maxPacks));
    }
  }

  function handleAddLoose(delta: number) {
    const nextLoose = Math.max(0, looseQty + delta);
    const nextTotalUnits = packQty * unitsPerPack + nextLoose;
    if (nextTotalUnits <= medicine!.total_available_units) {
      setLooseQty(nextLoose);
    } else {
      // Max out to remaining units
      const maxLoose = medicine!.total_available_units - packQty * unitsPerPack;
      setLooseQty(Math.max(0, maxLoose));
    }
  }

  function handleSave() {
    if (!medicine || totalRequestedUnits <= 0 || exceedsStock || isPriceMissing) return;

    onConfirm({
      medicine,
      pack_quantity: packQty,
      loose_quantity: looseQty,
      total_units: totalRequestedUnits,
      subtotal,
      custom_unit_price: isUnpriced ? effectiveUnitPrice : undefined,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                {medicine.name}
              </span>
              {medicine.brand_name && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-teal-100 text-teal-800 rounded-md">
                  {medicine.brand_name}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <span className="text-teal-700 font-bold">{medicine.strength}</span>
              <span>•</span>
              <span>{medicine.dosage_form}</span>
              <span>•</span>
              <span className="text-slate-700 font-semibold text-teal-800">
                {formatPackagingFormula(medicine)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Availability and FEFO Batch Alert */}
          <div className="p-3 bg-slate-100/80 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">Available in Stock:</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {formatStockBreakdown(medicine.total_available_units, medicine)}
              </span>
              <span className="text-[11px] text-slate-500 ml-1">
                ({medicine.total_available_units.toLocaleString()} {baseUnit}s)
              </span>
            </div>

            {medicine.earliest_expiry_date && (
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">FEFO Next Expiry:</span>
                <span className="font-mono font-semibold text-teal-800 text-xs">
                  {medicine.earliest_expiry_date}
                </span>
              </div>
            )}
          </div>

          {/* Unpriced Medicine Alert & In-line Price Inputs */}
          {isUnpriced && (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    Selling Price Missing (0.00 ETB)
                  </h4>
                  <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                    Please enter the selling price below to complete this sale. This price will be permanently saved to the inventory for all future sales.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Loose Unit Price ({baseUnit}) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={enteredUnitPrice}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-full h-10 px-3 pr-12 text-sm font-bold bg-white border border-amber-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 shadow-2xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      ETB
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Full Pack Price ({packLabel}) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={enteredPackPrice}
                      onChange={(e) => handlePackPriceChange(e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      onClick={(e) => e.currentTarget.select()}
                      className="w-full h-10 px-3 pr-12 text-sm font-bold bg-white border border-amber-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 shadow-2xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      ETB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper 1: Full Packs (Boxes) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Full {packLabel}s
                </span>
                <span className="text-[11px] text-slate-500 font-mono block">
                  {effectivePackPrice.toLocaleString()} ETB / {packLabel}
                </span>
                {isUnpriced && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium mt-0.5 inline-block">
                    {effectivePackPrice > 0 ? 'Custom price set' : 'Needs price entry'}
                  </span>
                )}
              </div>

              {/* Stepper Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddPacks(-1)}
                  disabled={packQty <= 0}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs hover:bg-slate-100"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min="0"
                  value={packQty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setPackQty(Math.max(0, val));
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  className="w-16 h-10 text-center font-bold text-base bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
                />

                <button
                  type="button"
                  onClick={() => handleAddPacks(1)}
                  disabled={exceedsStock}
                  className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs hover:bg-teal-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Stepper 2: Loose Units (Tablets / Capsules) */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Loose {baseUnit}s
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {effectiveUnitPrice.toLocaleString()} ETB / {baseUnit}
                </span>
              </div>

              {/* Stepper Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddLoose(-1)}
                  disabled={looseQty <= 0}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs hover:bg-slate-100"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min="0"
                  value={looseQty}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setLooseQty(Math.max(0, val));
                  }}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => e.currentTarget.select()}
                  className="w-16 h-10 text-center font-bold text-base bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
                />

                <button
                  type="button"
                  onClick={() => handleAddLoose(1)}
                  disabled={exceedsStock}
                  className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs hover:bg-teal-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Live Calculation Preview Banner */}
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-teal-950 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
              <div>
                <span className="font-bold text-slate-900">
                  {packQty} {packLabel}(s) &times; {unitsPerPack} + {looseQty} Loose ={' '}
                </span>
                <span className="font-extrabold text-teal-900 text-sm">
                  {totalRequestedUnits} {baseUnit}s
                </span>
              </div>
            </div>
            <div className="font-mono font-bold text-right sm:text-left text-sm text-teal-950">
              Subtotal: {subtotal.toLocaleString()} ETB
            </div>
          </div>

          {/* Stock Exceeded Warning */}
          {exceedsStock && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                Quantity exceeds available non-expired stock ({medicine.total_available_units} {baseUnit}s maximum).
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="w-1/3">
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={totalRequestedUnits <= 0 || exceedsStock || isOutOfStock || isPriceMissing}
            className="w-2/3 h-12 text-sm font-bold shadow-md bg-teal-700 hover:bg-teal-800 disabled:opacity-50"
          >
            <Check className="w-4 h-4 mr-1.5" />
            {isPriceMissing
              ? 'Enter Price to Add'
              : `Add to Cart • ${subtotal.toLocaleString()} ETB`}
          </Button>
        </div>
      </div>
    </div>
  );
}
