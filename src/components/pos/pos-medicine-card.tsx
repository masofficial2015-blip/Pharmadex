'use client';

import React from 'react';
import { Pill, Package, Sparkles, Check, Plus } from 'lucide-react';
import type { PosMedicineItem } from '@/types';

interface PosMedicineCardProps {
  medicine: PosMedicineItem;
  quantityInCart?: number;
  onSelect: (med: PosMedicineItem) => void;
}

export function PosMedicineCard({ medicine, quantityInCart = 0, onSelect }: PosMedicineCardProps) {
  const isOutOfStock = medicine.total_available_units <= 0;

  return (
    <div
      onClick={() => {
        if (!isOutOfStock) onSelect(medicine);
      }}
      className={`relative p-3.5 sm:p-4 rounded-2xl border transition-all text-left flex flex-col justify-between ${
        isOutOfStock
          ? 'bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed'
          : quantityInCart > 0
          ? 'bg-teal-50/50 border-teal-300 ring-2 ring-teal-600/20 shadow-xs cursor-pointer hover:border-teal-400'
          : 'bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs cursor-pointer active:scale-98'
      }`}
    >
      {/* In-Cart Pill Badge */}
      {quantityInCart > 0 && (
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-teal-700 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-2xs">
          <Check className="w-3 h-3" />
          <span>{quantityInCart} in cart</span>
        </div>
      )}

      {/* Top Details */}
      <div>
        <div className="flex items-start justify-between gap-1.5 pr-14">
          <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2">
            {medicine.name}
          </h4>
        </div>

        {/* Brand & Strength */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
          <span className="font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded-md">
            {medicine.strength}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-600">{medicine.dosage_form}</span>
          {medicine.brand_name && (
            <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-md">
              {medicine.brand_name}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Pricing & Available Stock */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-end justify-between text-xs">
        <div>
          <div className="font-mono font-bold text-slate-900 text-sm">
            {medicine.pack_price.toLocaleString()} ETB{' '}
            <span className="text-[10px] font-normal text-slate-500">/ {medicine.pack_label}</span>
          </div>
          <div className="text-[11px] font-mono text-teal-700">
            {medicine.unit_price.toLocaleString()} ETB / {medicine.base_unit}
          </div>
        </div>

        <div className="text-right">
          {isOutOfStock ? (
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              Out of Stock
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-600">
              Stock:{' '}
              <strong className="text-slate-800">
                {medicine.available_packs > 0 ? `${medicine.available_packs}p ` : ''}
                {medicine.available_loose > 0 ? `${medicine.available_loose}u` : ''}
              </strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
