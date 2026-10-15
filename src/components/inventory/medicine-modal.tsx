'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, AlertCircle, Info, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createMedicineAction, updateMedicineAction, type MedicineActionResponse } from '@/app/actions/medicines';
import type { MedicineInventorySummary } from '@/types';

interface MedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicineToEdit?: MedicineInventorySummary | null;
  onSuccess?: () => void;
}

export function MedicineModal({ isOpen, onClose, medicineToEdit, onSuccess }: MedicineModalProps) {
  const isEditing = Boolean(medicineToEdit);
  const isConversionLocked = isEditing && Boolean(medicineToEdit?.has_stock_transactions);

  const [formData, setFormData] = useState({
    name: '',
    brand_name: '',
    strength: '',
    dosage_form: 'Tablet',
    base_unit: 'tablet',
    pack_label: 'Box',
    units_per_pack: 100,
    low_stock_threshold: 10,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (medicineToEdit) {
      setFormData({
        name: medicineToEdit.name,
        brand_name: medicineToEdit.brand_name || '',
        strength: medicineToEdit.strength,
        dosage_form: medicineToEdit.dosage_form,
        base_unit: medicineToEdit.base_unit,
        pack_label: medicineToEdit.pack_label || 'Box',
        units_per_pack: medicineToEdit.units_per_pack,
        low_stock_threshold: medicineToEdit.low_stock_threshold,
      });
    } else {
      setFormData({
        name: '',
        brand_name: '',
        strength: '',
        dosage_form: 'Tablet',
        base_unit: 'tablet',
        pack_label: 'Box',
        units_per_pack: 100,
        low_stock_threshold: 10,
      });
    }
    setFieldErrors({});
    setGeneralError(null);
  }, [medicineToEdit, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    const body = new FormData();
    body.append('name', formData.name);
    body.append('brand_name', formData.brand_name);
    body.append('strength', formData.strength);
    body.append('dosage_form', formData.dosage_form);
    body.append('base_unit', formData.base_unit);
    body.append('pack_label', formData.pack_label);
    body.append('units_per_pack', formData.units_per_pack.toString());
    body.append('low_stock_threshold', formData.low_stock_threshold.toString());

    let res: MedicineActionResponse;
    if (isEditing && medicineToEdit) {
      res = await updateMedicineAction(medicineToEdit.id, null, body);
    } else {
      res = await createMedicineAction(null, body);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEditing ? 'Edit Medicine' : 'Add New Medicine'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Update medicine details and inventory parameters'
                : 'Register a medicine item in the pharmacy catalog'}
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

          {isConversionLocked && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
              <Lock className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
              <div>
                <p className="font-semibold">Packaging Conversion Locked</p>
                <p className="mt-0.5 text-amber-800">
                  This medicine has recorded stock transactions. Units per pack and base unit cannot be modified to prevent stock ledger corruption.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Generic / Medicine Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Generic Name <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Amoxicillin, Paracetamol, Ciprofloxacin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={fieldErrors.name}
                required
              />
            </div>

            {/* Brand / Trade Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Brand Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Moxilen, Panadol, Cipro-Denk"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                error={fieldErrors.brand_name}
              />
            </div>

            {/* Strength */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Strength <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. 500mg, 250mg/5ml, 1g"
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                error={fieldErrors.strength}
                required
              />
            </div>

            {/* Dosage Form */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Dosage Form <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.dosage_form}
                onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                required
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Suspension">Suspension</option>
                <option value="Injection">Injection</option>
                <option value="Cream">Cream</option>
                <option value="Ointment">Ointment</option>
                <option value="Drops">Eye/Ear Drops</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Sachet">Sachet / Powder</option>
                <option value="Suppository">Suppository</option>
              </select>
            </div>

            {/* Pack Label */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Packaging Label <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.pack_label}
                onChange={(e) => setFormData({ ...formData, pack_label: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                required
              >
                <option value="Box">Box</option>
                <option value="Pack">Pack</option>
                <option value="Bottle">Bottle</option>
                <option value="Strip">Strip</option>
                <option value="Blister">Blister</option>
                <option value="Vial">Vial</option>
                <option value="Ampoule">Ampoule</option>
                <option value="Tin">Tin</option>
              </select>
            </div>

            {/* Base Unit */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Base Unit <span className="text-rose-500">*</span>
                </label>
                {isConversionLocked && (
                  <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>
              <Input
                type="text"
                placeholder="e.g. tablet, capsule, bottle"
                value={formData.base_unit}
                onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
                error={fieldErrors.base_unit}
                disabled={isConversionLocked}
                required
              />
            </div>

            {/* Units Per Pack */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Units Per {formData.pack_label || 'Pack'} <span className="text-rose-500">*</span>
                </label>
                {isConversionLocked && (
                  <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={formData.units_per_pack}
                onChange={(e) => setFormData({ ...formData, units_per_pack: parseInt(e.target.value) || 1 })}
                error={fieldErrors.units_per_pack}
                disabled={isConversionLocked}
                required
              />
            </div>

            {/* Low-stock threshold */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Low Stock Threshold ({formData.base_unit}s)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 20"
                value={formData.low_stock_threshold}
                onChange={(e) =>
                  setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })
                }
                error={fieldErrors.low_stock_threshold}
                helperText={`Alert triggered when available ${formData.base_unit}s fall below this number.`}
                required
              />
            </div>
          </div>

          {/* Conversion Example Note */}
          <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-xl flex items-center gap-2.5 text-teal-800 text-xs">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <div>
              <strong>Conversion Rule:</strong> 1 {formData.pack_label} ={' '}
              <span className="font-semibold">{formData.units_per_pack} {formData.base_unit}s</span>.
              Purchasing 3 {formData.pack_label}s + 12 loose {formData.base_unit}s ={' '}
              <span className="font-semibold">
                {3 * (formData.units_per_pack || 1) + 12} {formData.base_unit}s
              </span>.
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Medicine'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
