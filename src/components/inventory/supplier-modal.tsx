'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
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
}

export function SupplierModal({ isOpen, onClose, supplierToEdit, onSuccess }: SupplierModalProps) {
  const isEditing = Boolean(supplierToEdit);

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        name: supplierToEdit.name,
        contact_person: supplierToEdit.contact_person || '',
        phone: supplierToEdit.phone || '',
        email: supplierToEdit.email || '',
        address: supplierToEdit.address || '',
      });
    } else {
      setFormData({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
      });
    }
    setFieldErrors({});
    setGeneralError(null);
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    const body = new FormData();
    body.append('name', formData.name);
    body.append('contact_person', formData.contact_person);
    body.append('phone', formData.phone);
    body.append('email', formData.email);
    body.append('address', formData.address);

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
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Update essential contact and vendor details'
                : 'Register a pharmaceutical distributor or vendor'}
            </p>
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
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>{generalError}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Supplier / Company Name <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Ethiopian Pharmaceuticals Supply Agency (EPSA), Cadila"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={fieldErrors.name}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Contact Person <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Abebe Tadesse"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                error={fieldErrors.contact_person}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. +251 91 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={fieldErrors.phone}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Email Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="email"
              placeholder="e.g. orders@supplier.et"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={fieldErrors.email}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Address / Location <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Addis Ababa, Merkato, Kirkos Subcity"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              error={fieldErrors.address}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
