'use client';

import React, { useState } from 'react';
import { X, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openShiftAction, type ShiftActionResponse } from '@/app/actions/shifts';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OpenShiftModal({ isOpen, onClose, onSuccess }: OpenShiftModalProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setGeneralError(null);

    const formData = new FormData();
    // Default opening cash to 0 as cash from prior shift was deposited/transferred
    formData.append('opening_cash', '0');

    const res: ShiftActionResponse = await openShiftAction(null, formData);
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
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Open Pharmacy Shift</h2>
                <p className="text-xs text-slate-500">Begin active dispensing duty</p>
              </div>
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

            <div className="p-3.5 bg-teal-50/60 border border-teal-100 rounded-xl flex items-start gap-3 text-teal-900 text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Single Active Shift Rule:</span> Only one shift can be active across the pharmacy at a time. All subsequent sales and cash receipts will be signed with your pharmacist ID.
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-800">Ready to start duty?</p>
              <p className="text-slate-500 leading-relaxed">
                Opening cash float is set to <strong>0 ETB</strong>. Shift sales, cash collections, and till movements will be tracked automatically for closing reconciliation.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} className="font-semibold">
                Confirm & Open Shift
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
