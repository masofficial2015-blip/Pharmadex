import React from 'react';

export default function AuthenticatedLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Header & Action Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 rounded-md"></div>
          <div className="h-4 w-72 bg-slate-100 rounded-md"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
          <div className="h-9 w-32 bg-slate-200 rounded-lg"></div>
        </div>
      </div>

      {/* KPI / Metric Cards Grid Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200 rounded"></div>
              <div className="w-7 h-7 bg-slate-100 rounded-lg"></div>
            </div>
            <div className="h-7 w-32 bg-slate-200 rounded-md"></div>
            <div className="h-3 w-20 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Content / Table Workspace Skeleton */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="h-9 w-full sm:w-80 bg-slate-200 rounded-lg"></div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
            <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-slate-100 shrink-0"></div>
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                  <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="hidden sm:block h-4 w-24 bg-slate-100 rounded"></div>
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
              <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
