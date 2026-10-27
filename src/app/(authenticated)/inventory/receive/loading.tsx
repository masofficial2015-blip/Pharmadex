import React from 'react';

export default function StockReceiveLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100/60"></div>
            <div className="h-6 w-64 bg-slate-200 rounded-md"></div>
          </div>
          <div className="h-3.5 w-96 bg-slate-100 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-slate-200 rounded-lg"></div>
          <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
        </div>
      </div>

      {/* Main Stock Receive Form Container Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-6">
        {/* Medicine & Supplier Selection Rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-200 rounded"></div>
            <div className="h-11 w-full bg-slate-100 rounded-xl border border-slate-200"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
            <div className="h-11 w-full bg-slate-100 rounded-xl border border-slate-200"></div>
          </div>
        </div>

        {/* Batch Number & Expiry Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded"></div>
            <div className="h-11 w-full bg-slate-100 rounded-xl border border-slate-200"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="h-11 w-full bg-slate-100 rounded-xl border border-slate-200"></div>
          </div>
        </div>

        {/* Quantity Stepper & Cost Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="h-11 w-full bg-slate-100 rounded-xl border border-slate-200"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded"></div>
            <div className="h-11 w-full bg-slate-100 rounded-xl border border-slate-200"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-36 bg-slate-200 rounded"></div>
            <div className="h-11 w-full bg-slate-100 rounded-xl border border-slate-200"></div>
          </div>
        </div>

        {/* Payment Terms Skeleton */}
        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
          <div className="h-4 w-40 bg-slate-200 rounded"></div>
          <div className="flex gap-2">
            <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
            <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
            <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
          </div>
        </div>

        {/* Submit Button Skeleton */}
        <div className="pt-2">
          <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
