'use client';

import React, { useState } from 'react';
import {
  X,
  AlertCircle,
  Clock,
  User,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { closeShiftAction, type ShiftActionResponse } from '@/app/actions/shifts';
import type { ShiftSummary } from '@/types';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftSummary: ShiftSummary;
  onSuccess?: () => void;
}

export function CloseShiftModal({
  isOpen,
  onClose,
  shiftSummary,
  onSuccess,
}: CloseShiftModalProps) {
  const [closingNotes, setClosingNotes] = useState<string>('');
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const openedDate = new Date(shiftSummary.shift.opened_at);
  const openedTimeStr = openedDate.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneralError(null);

    const formData = new FormData();
    formData.append('closing_notes', closingNotes);

    const res: ShiftActionResponse = await closeShiftAction(null, formData);
    setIsSubmitting(false);

    if (res.error) {
      setGeneralError(res.error);
    } else {
      if (onSuccess) onSuccess();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="flex min-h-full items-start sm:items-center justify-center pt-4 pb-12 sm:py-8">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Close Pharmacy Shift</h2>
              <p className="text-xs text-slate-500">Conclude active dispensing shift</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {generalError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>{generalError}</div>
              </div>
            )}

            {/* Shift Context Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <User className="w-3.5 h-3.5" />
                  Pharmacist on Duty
                </span>
                <span className="font-semibold text-slate-900">
                  {shiftSummary.user?.full_name || 'Staff'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  Shift Started
                </span>
                <span className="font-mono text-slate-700">
                  {openedTimeStr}
                </span>
              </div>
            </div>

            {/* Closing Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Handover Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Completed routine sales, all prescriptions dispensed, left till float in order."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="font-semibold bg-slate-900 hover:bg-black text-white"
              >
                Confirm & Close Shift
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
