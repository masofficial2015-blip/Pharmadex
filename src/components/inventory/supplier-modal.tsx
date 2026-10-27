'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Building2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createSupplierAction,
  updateSupplierAction,
  type SupplierActionResponse,
} from '@/app/actions/suppliers';
import type { SupplierWithBalance } from '@/types';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: SupplierWithBalance | null;
  onSuccess?: () => void;
  initialName?: string;
  initialPhone?: string;
}

export function SupplierModal({
  isOpen,
  onClose,
  supplierToEdit,
  onSuccess,
  initialName = '',
  initialPhone = '',
}: SupplierModalProps) {
  const isEditing = Boolean(supplierToEdit);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        name: supplierToEdit.name,
        phone: supplierToEdit.phone || '',
      });
    } else {
      setFormData({
        name: initialName,
        phone: initialPhone,
      });
    }
    setFieldErrors({});
    setGeneralError(null);
  }, [supplierToEdit, isOpen, initialName, initialPhone]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    const body = new FormData();
    body.append('name', formData.name);
    body.append('phone', formData.phone);
    body.append('contact_person', '');
    body.append('email', '');
    body.append('address', '');

    let res: SupplierActionResponse;
    if (isEditing && supplierToEdit) {
      res = await updateSupplierAction(supplierToEdit.id, null, body);
    } else {
      res = await createSupplierAction(null, body);
    }

    setIsSubmitting(false);

    if (res.error) {
      setGeneralError(res.error);
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
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
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isEditing ? 'Update supplier contact details' : 'Register a medicine supplier or vendor'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {generalError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div>{generalError}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Homeland wholesales of medicine, EPSA, Cadila"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={fieldErrors.name}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. 0911234567 or +251 91 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  error={fieldErrors.phone}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} className="font-semibold">
                {isEditing ? 'Save Changes' : 'Create Supplier'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
