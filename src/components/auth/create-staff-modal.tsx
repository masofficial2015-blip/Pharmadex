'use client';

import React, { useActionState, useState, useEffect } from 'react';
import { createPharmacistAction, type StaffActionResponse } from '@/app/actions/staff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, X, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialState: StaffActionResponse = {};

export function CreateStaffModal({ isOpen, onClose }: CreateStaffModalProps) {
  const [state, formAction, isPending] = useActionState(createPharmacistAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.success, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="flex min-h-full items-start sm:items-center justify-center pt-4 pb-12 sm:py-8">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-teal-800">
            <UserPlus className="w-5 h-5" />
            <h3 className="font-semibold text-slate-900 text-base">Add New Pharmacist</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form action={formAction} className="p-6 space-y-4">
          {state.error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p>{state.error}</p>
            </div>
          )}

          {state.success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p>{state.message}</p>
            </div>
          )}

          <Input
            label="Full Name"
            name="fullName"
            placeholder="e.g. Dr. Hanna Bekele"
            required
            error={state.fieldErrors?.fullName}
            disabled={isPending}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="hanna@pharmadex.et"
            required
            error={state.fieldErrors?.email}
            disabled={isPending}
          />

          <Input
            label="Phone Number (Optional)"
            name="phoneNumber"
            placeholder="+251 91 123 4567"
            error={state.fieldErrors?.phoneNumber}
            disabled={isPending}
          />

          <div className="relative">
            <Input
              label="Initial Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 characters"
              required
              error={state.fieldErrors?.password}
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-8 text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Privileged Permissions */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 block mb-1.5">
              Privileged Access Rights (Optional)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  name="permissions"
                  value="receive_stock"
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <span className="text-[11px] font-medium text-slate-700">Receive Stock</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  name="permissions"
                  value="manage_suppliers"
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <span className="text-[11px] font-medium text-slate-700">Manage Suppliers</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  name="permissions"
                  value="manage_medicines"
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <span className="text-[11px] font-medium text-slate-700">Manage Medicines</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  name="permissions"
                  value="view_ledger"
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <span className="text-[11px] font-medium text-slate-700">Stock Ledger</span>
              </label>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            This creates an active pharmacist account immediately with the selected permissions.
          </p>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="md" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={isPending} disabled={isPending}>
              Create Account
            </Button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
