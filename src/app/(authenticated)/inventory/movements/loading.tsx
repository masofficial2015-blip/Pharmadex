import React from 'react';

export default function StockLedgerLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100/60"></div>
            <div className="h-6 w-52 bg-slate-200 rounded-md"></div>
          </div>
          <div className="h-3.5 w-80 bg-slate-100 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-32 bg-slate-200 rounded-lg"></div>
        </div>
      </div>

      {/* Ledger Table Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="h-9 w-64 bg-slate-100 rounded-xl"></div>
          <div className="h-9 w-40 bg-slate-100 rounded-xl"></div>
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0"></div>
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <div className="h-4 w-40 bg-slate-200 rounded"></div>
                  <div className="h-3 w-28 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="h-4 w-20 bg-slate-100 rounded"></div>
              <div className="h-4 w-24 bg-slate-100 rounded"></div>
              <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
