'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateStaffPermissionsAction } from '@/app/actions/staff';
import type { Profile, PharmacistPermission } from '@/types';

interface EditPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pharmacist: Profile | null;
  onSuccess?: () => void;
}

const AVAILABLE_PERMISSIONS: {
  key: PharmacistPermission;
  label: string;
  description: string;
}[] = [
  {
    key: 'receive_stock',
    label: 'Receive Stock',
    description: 'Can receive supplier deliveries, enter costs, and create stock batches.',
  },
  {
    key: 'manage_suppliers',
    label: 'Manage Suppliers',
    description: 'Can add and update pharmaceutical supplier contacts and accounts.',
  },
  {
    key: 'manage_medicines',
    label: 'Manage Medicines',
    description: 'Can register new catalog medicines and configure packaging conversions.',
  },
  {
    key: 'view_ledger',
    label: 'View Stock Ledger',
    description: 'Can view the audit trail of all inventory receipts, sales, and adjustments.',
  },
];

export function EditPermissionsModal({
  isOpen,
  onClose,
  pharmacist,
  onSuccess,
}: EditPermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<PharmacistPermission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when modal opens
  React.useEffect(() => {
    if (pharmacist) {
      setSelectedPermissions((pharmacist.permissions as PharmacistPermission[]) || []);
      setError(null);
      setSuccessMsg(null);
    }
  }, [pharmacist, isOpen]);

  if (!isOpen || !pharmacist) return null;

  function togglePermission(key: PharmacistPermission) {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pharmacist) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const res = await updateStaffPermissionsAction(pharmacist.id, selectedPermissions);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMsg(res.message || 'Permissions updated.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="flex min-h-full items-start sm:items-center justify-center pt-4 pb-12 sm:py-8">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Privileged Access Rights</h3>
                <p className="text-xs text-slate-500">For {pharmacist.full_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2 text-xs">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>{successMsg}</p>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Grant additional responsibilities beyond standard POS sales and personal shift operations.
            </p>

            <div className="space-y-2.5">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    onClick={() => togglePermission(perm.key)}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-teal-50/70 border-teal-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50/80'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent label click
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                    />
                    <div className="select-none">
                      <span className={`text-xs font-semibold block ${isChecked ? 'text-teal-950' : 'text-slate-800'}`}>
                        {perm.label}
                      </span>
                      <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                        {perm.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Permissions
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
