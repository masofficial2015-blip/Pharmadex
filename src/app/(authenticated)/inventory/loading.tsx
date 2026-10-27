import React from 'react';

export default function InventoryLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100/60"></div>
            <div className="h-6 w-52 bg-slate-200 rounded-md"></div>
          </div>
          <div className="h-3.5 w-80 bg-slate-100 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
          <div className="h-9 w-32 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
        <div className="h-9 w-64 bg-slate-100 rounded-xl"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-slate-50 rounded-xl border border-slate-100"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
