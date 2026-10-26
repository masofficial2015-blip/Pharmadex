'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, User, Calendar, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ShiftSummary } from '@/types';

interface ShiftHistoryTableProps {
  shifts: ShiftSummary[];
}

export function ShiftHistoryTable({ shifts }: ShiftHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShifts = shifts.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const staff = s.user?.full_name?.toLowerCase() || '';
    const notes = s.shift.closing_notes?.toLowerCase() || '';
    return !q || staff.includes(q) || notes.includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Closed Shifts & Reconciliation Ledger
        </h3>
        <input
          type="text"
          placeholder="Filter by pharmacist or notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg max-w-xs focus:outline-hidden focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {filteredShifts.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          No closed shifts in record yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pharmacist</th>
                  <th className="py-3 px-4">Shift Duration</th>
                  <th className="py-3 px-4 text-right">Opening Float</th>
                  <th className="py-3 px-4 text-right">Expected Till</th>
                  <th className="py-3 px-4 text-right">Counted Cash</th>
                  <th className="py-3 px-4 text-right">Discrepancy</th>
                  <th className="py-3 px-4">Handover Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredShifts.map(({ shift, user }) => {
                  const openedDate = new Date(shift.opened_at);
                  const closedDate = shift.closed_at ? new Date(shift.closed_at) : null;

                  const opened = openedDate.toLocaleString('en-US', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  });

                  const closed = closedDate
                    ? closedDate.toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : null;

                  let durationStr = '';
                  if (closedDate) {
                    const diffMs = Math.max(0, closedDate.getTime() - openedDate.getTime());
                    const hours = Math.floor(diffMs / (1000 * 60 * 60));
                    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                  }

                  const expected = Number(shift.expected_closing_cash || 0);
                  const actual = Number(shift.actual_closing_cash || 0);
                  const discrepancy = Number(shift.cash_discrepancy || 0);

                  return (
                    <tr key={shift.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user?.full_name || 'Staff'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-sans">
                        <div className="font-medium text-slate-900">{opened}</div>
                        {closed ? (
                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span>Closed: {closed}</span>
                            {durationStr && (
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-mono">
                                ({durationStr})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">Active</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right text-slate-700">
                        {Number(shift.opening_cash).toLocaleString()} ETB
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {expected.toLocaleString()} ETB
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {actual.toLocaleString()} ETB
                      </td>

                      <td className="py-3.5 px-4 text-right font-sans">
                        {discrepancy === 0 ? (
                          <Badge variant="success">Exact (0.00)</Badge>
                        ) : discrepancy > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            +{discrepancy.toLocaleString()} ETB
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            {discrepancy.toLocaleString()} ETB
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-sans text-slate-600 max-w-xs truncate" title={shift.closing_notes || ''}>
                        {shift.closing_notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
