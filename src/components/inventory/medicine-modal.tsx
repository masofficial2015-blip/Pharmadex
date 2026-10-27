'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Lock, Unlock, AlertCircle, AlertTriangle, Sparkles, Check, Layers, Package, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createMedicineAction, updateMedicineAction, type MedicineActionResponse } from '@/app/actions/medicines';
import { getDosageCategory, type DosageFormCategory } from '@/lib/utils/packaging';
import type { MedicineInventorySummary } from '@/types';

interface MedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicineToEdit?: MedicineInventorySummary | null;
  onSuccess?: () => void;
}

export function MedicineModal({ isOpen, onClose, medicineToEdit, onSuccess }: MedicineModalProps) {
  const isEditing = Boolean(medicineToEdit);
  const hasExistingStock = isEditing && Boolean(medicineToEdit?.has_stock_transactions);
  const [allowConversionEdit, setAllowConversionEdit] = useState(false);
  const [recalculateInitialBatch, setRecalculateInitialBatch] = useState(true);

  const isConversionDisabled = hasExistingStock && !allowConversionEdit;

  // Basic Details
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);

  // Dynamic Packaging States
  const [packagingType, setPackagingType] = useState<'BLISTER_BOX' | 'TIN_BOTTLE' | 'STANDARD'>('BLISTER_BOX');
  const [stripsPerBox, setStripsPerBox] = useState<number>(10);
  const [tabletsPerStrip, setTabletsPerStrip] = useState<string>('10'); // string to allow empty optional
  const [tabletsPerTin, setTabletsPerTin] = useState<number>(1000);
  const [unitsPerBox, setUnitsPerBox] = useState<number>(10);
  const [injectionUnitType, setInjectionUnitType] = useState<'ampoule' | 'vial'>('ampoule');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive dosage category
  const dosageCategory = useMemo<DosageFormCategory>(() => {
    return getDosageCategory(dosageForm);
  }, [dosageForm]);

  // Derive Base Unit, Pack Label, and total units_per_pack
  const { baseUnit, packLabel, unitsPerPack, packagingDescription } = useMemo(() => {
    if (dosageCategory === 'tab_cap') {
      const defaultDrugUnit = dosageForm.toLowerCase() === 'capsule' ? 'capsule' : 'tablet';
      if (packagingType === 'BLISTER_BOX') {
        const hasTabsPerStrip = tabletsPerStrip.trim() !== '' && parseInt(tabletsPerStrip) > 0;
        const currentStrips = Math.max(1, stripsPerBox || 1);
        const currentTabsPerStrip = hasTabsPerStrip ? parseInt(tabletsPerStrip) : null;

        if (hasTabsPerStrip && currentTabsPerStrip) {
          const total = currentStrips * currentTabsPerStrip;
          return {
            baseUnit: defaultDrugUnit,
            packLabel: 'Box',
            unitsPerPack: total,
            packagingDescription: `1 Box = ${currentStrips} Strips × ${currentTabsPerStrip} ${defaultDrugUnit}s (${total} ${defaultDrugUnit}s total)`,
          };
        } else {
          return {
            baseUnit: 'strip',
            packLabel: 'Box',
            unitsPerPack: currentStrips,
            packagingDescription: `1 Box = ${currentStrips} Strips (Tracked by strip)`,
          };
        }
      } else {
        // Tin / Bulk Bottle
        const total = Math.max(1, tabletsPerTin || 1);
        return {
          baseUnit: defaultDrugUnit,
          packLabel: 'Tin',
          unitsPerPack: total,
          packagingDescription: `1 Tin = ${total} ${defaultDrugUnit}s`,
        };
      }
    }

    if (dosageCategory === 'syrup_suspension_drops') {
      return {
        baseUnit: 'bottle',
        packLabel: 'Box',
        unitsPerPack: 1,
        packagingDescription: '1 Bottle per Box',
      };
    }

    if (dosageCategory === 'inhaler') {
      return {
        baseUnit: 'inhaler',
        packLabel: 'Box',
        unitsPerPack: 1,
        packagingDescription: '1 Inhaler per Box',
      };
    }

    if (dosageCategory === 'injection') {
      const qty = Math.max(1, unitsPerBox || 1);
      return {
        baseUnit: injectionUnitType,
        packLabel: 'Box',
        unitsPerPack: qty,
        packagingDescription: `1 Box = ${qty} ${injectionUnitType}s`,
      };
    }

    if (dosageCategory === 'cream_ointment') {
      const qty = Math.max(1, unitsPerBox || 1);
      return {
        baseUnit: 'tube',
        packLabel: 'Box',
        unitsPerPack: qty,
        packagingDescription: `1 Box = ${qty} ${qty === 1 ? 'Tube' : 'Tubes'}`,
      };
    }

    if (dosageCategory === 'sachet_powder') {
      const qty = Math.max(1, unitsPerBox || 1);
      return {
        baseUnit: 'sachet',
        packLabel: 'Box',
        unitsPerPack: qty,
        packagingDescription: `1 Box = ${qty} Sachets`,
      };
    }

    if (dosageCategory === 'suppository') {
      const qty = Math.max(1, unitsPerBox || 1);
      return {
        baseUnit: 'suppository',
        packLabel: 'Box',
        unitsPerPack: qty,
        packagingDescription: `1 Box = ${qty} Suppositories`,
      };
    }

    if (dosageCategory === 'medical_supplies') {
      const qty = Math.max(1, unitsPerBox || 1);
      return {
        baseUnit: 'piece',
        packLabel: 'Box',
        unitsPerPack: qty,
        packagingDescription: `1 Box = ${qty} Pieces`,
      };
    }

    return {
      baseUnit: 'unit',
      packLabel: 'Box',
      unitsPerPack: 1,
      packagingDescription: '1 Unit per Box',
    };
  }, [
    dosageCategory,
    dosageForm,
    packagingType,
    stripsPerBox,
    tabletsPerStrip,
    tabletsPerTin,
    unitsPerBox,
    injectionUnitType,
  ]);

  useEffect(() => {
    if (medicineToEdit) {
      setName(medicineToEdit.name);
      setBrandName(medicineToEdit.brand_name || '');
      setStrength(medicineToEdit.strength);
      setDosageForm(medicineToEdit.dosage_form);
      setLowStockThreshold(medicineToEdit.low_stock_threshold || 10);

      const pType = (medicineToEdit.packaging_type as 'BLISTER_BOX' | 'TIN_BOTTLE' | 'STANDARD') || 'BLISTER_BOX';
      setPackagingType(pType);
      if (medicineToEdit.strips_per_box) {
        setStripsPerBox(medicineToEdit.strips_per_box);
      }
      if (medicineToEdit.tablets_per_strip) {
        setTabletsPerStrip(medicineToEdit.tablets_per_strip.toString());
      } else {
        setTabletsPerStrip('');
      }
      if (pType === 'TIN_BOTTLE') {
        setTabletsPerTin(medicineToEdit.units_per_pack || 1000);
      } else {
        setUnitsPerBox(medicineToEdit.units_per_pack || 10);
      }
      if (medicineToEdit.base_unit === 'vial') {
        setInjectionUnitType('vial');
      } else {
        setInjectionUnitType('ampoule');
      }
    } else {
      // Default reset
      setName('');
      setBrandName('');
      setStrength('');
      setDosageForm('Tablet');
      setLowStockThreshold(10);
      setPackagingType('BLISTER_BOX');
      setStripsPerBox(10);
      setTabletsPerStrip('10');
      setTabletsPerTin(1000);
      setUnitsPerBox(10);
      setInjectionUnitType('ampoule');
    }
    setAllowConversionEdit(false);
    setRecalculateInitialBatch(true);
    setFieldErrors({});
    setGeneralError(null);
  }, [medicineToEdit, isOpen]);

  // Adjust defaults when dosage form switches
  function handleDosageFormChange(newForm: string) {
    setDosageForm(newForm);
    const cat = getDosageCategory(newForm);

    if (cat === 'tab_cap') {
      setPackagingType('BLISTER_BOX');
      setStripsPerBox(10);
      setTabletsPerStrip('10');
    } else if (cat === 'syrup_suspension_drops' || cat === 'inhaler') {
      setPackagingType('STANDARD');
      setUnitsPerBox(1);
    } else if (cat === 'cream_ointment') {
      setPackagingType('STANDARD');
      setUnitsPerBox(1);
    } else if (cat === 'injection') {
      setPackagingType('STANDARD');
      setUnitsPerBox(10);
    } else {
      setPackagingType('STANDARD');
      setUnitsPerBox(10);
    }
  }

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);

    const body = new FormData();
    body.append('name', name);
    body.append('brand_name', brandName);
    body.append('strength', strength);
    body.append('dosage_form', dosageForm);
    body.append('base_unit', baseUnit);
    body.append('pack_label', packLabel);
    body.append('units_per_pack', unitsPerPack.toString());
    body.append('low_stock_threshold', lowStockThreshold.toString());
    body.append('packaging_type', packagingType);

    if (dosageCategory === 'tab_cap' && packagingType === 'BLISTER_BOX') {
      body.append('strips_per_box', stripsPerBox.toString());
      if (tabletsPerStrip.trim() !== '' && parseInt(tabletsPerStrip) > 0) {
        body.append('tablets_per_strip', parseInt(tabletsPerStrip).toString());
      }
    }

    if (allowConversionEdit) {
      body.append('allow_conversion_edit', 'true');
      body.append('recalculate_initial_batch', recalculateInitialBatch ? 'true' : 'false');
    }

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="flex min-h-full items-start sm:items-center justify-center pt-4 pb-12 sm:py-8">
        <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {isEditing ? 'Edit Medicine' : 'Add New Medicine'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register medicine and configure strict integer base-unit packaging rules
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

            {hasExistingStock && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 text-amber-900">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                  <div>
                    <p className="font-bold">Existing Stock Transactions</p>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      This medicine has recorded inventory. If there was a human error in the packaging configuration (e.g. strips per box or tablets per strip), you can unlock and edit it below.
                    </p>
                  </div>
                </div>

                {!allowConversionEdit ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAllowConversionEdit(true)}
                    className="w-full text-xs font-semibold text-amber-900 border-amber-300 hover:bg-amber-100 bg-white"
                  >
                    <Unlock className="w-3.5 h-3.5 mr-1 text-amber-700" />
                    Unlock & Edit Unit Conversion (Fix Human Error)
                  </Button>
                ) : (
                  <div className="space-y-1.5 pt-2 border-t border-amber-200">
                    <label className="flex items-center gap-2 text-[11px] font-semibold text-amber-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recalculateInitialBatch}
                        onChange={(e) => setRecalculateInitialBatch(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                      />
                      <span>Recalculate legacy initial stock base units to match new pack rate</span>
                    </label>
                    <p className="text-[10px] text-amber-800 pl-6">
                      Adjusts initial stock batch units proportionally so the physical pack count on your shelf remains accurate.
                    </p>
                  </div>
                )}
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
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
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  error={fieldErrors.strength}
                  required
                />
              </div>

              {/* Dosage Form Dropdown */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Dosage Form <span className="text-rose-500">*</span>
                </label>
                <select
                  value={dosageForm}
                  onChange={(e) => handleDosageFormChange(e.target.value)}
                  disabled={isConversionDisabled}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
                  required
                >
                  <option value="Tablet">Tablet (Tablets / Blister / Tin)</option>
                  <option value="Capsule">Capsule (Capsules / Blister / Tin)</option>
                  <option value="Syrup">Syrup (Liquid Bottle)</option>
                  <option value="Suspension">Suspension (Liquid Bottle)</option>
                  <option value="Eye / Ear Drops">Eye / Ear Drops</option>
                  <option value="Injection">Injection (Ampoule / Vial)</option>
                  <option value="Cream">Cream (Tube)</option>
                  <option value="Ointment">Ointment (Tube)</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Sachet / Powder">Sachet / Powder</option>
                  <option value="Suppository">Suppository</option>
                  <option value="Medical Supplies">Medical Supplies (Gloves, Syringes, etc.)</option>
                </select>
              </div>
            </div>

            {/* DYNAMIC PACKAGING RULES SECTION */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-teal-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Packaging & Unit Conversion Configuration
                  </span>
                </div>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  Base Unit: <strong className="uppercase">{baseUnit}</strong>
                </span>
              </div>

              {/* 1. TABLET / CAPSULE (tab_cap) */}
              {dosageCategory === 'tab_cap' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-800">
                    Select Packaging Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={isConversionDisabled}
                      onClick={() => setPackagingType('BLISTER_BOX')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        packagingType === 'BLISTER_BOX'
                          ? 'border-teal-600 bg-teal-50/70 text-teal-950 ring-2 ring-teal-600/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">Option A: Blister Box</div>
                        <div className="text-[10px] text-slate-500">Strips inside a box</div>
                      </div>
                      {packagingType === 'BLISTER_BOX' && <Check className="w-4 h-4 text-teal-700" />}
                    </button>

                    <button
                      type="button"
                      disabled={isConversionDisabled}
                      onClick={() => setPackagingType('TIN_BOTTLE')}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        packagingType === 'TIN_BOTTLE'
                          ? 'border-teal-600 bg-teal-50/70 text-teal-950 ring-2 ring-teal-600/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">Option B: Tin / Bulk Bottle</div>
                        <div className="text-[10px] text-slate-500">Loose tablets in container</div>
                      </div>
                      {packagingType === 'TIN_BOTTLE' && <Check className="w-4 h-4 text-teal-700" />}
                    </button>
                  </div>

                  {packagingType === 'BLISTER_BOX' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Strips per Box <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g. 10"
                          value={stripsPerBox}
                          onChange={(e) => setStripsPerBox(parseInt(e.target.value) || 1)}
                          disabled={isConversionDisabled}
                          required
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-medium text-slate-700">
                            {dosageForm === 'Capsule' ? 'Capsules' : 'Tablets'} per Strip <span className="text-slate-400 font-normal">(Optional)</span>
                          </label>
                        </div>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g. 10 (or leave empty)"
                          value={tabletsPerStrip}
                          onChange={(e) => setTabletsPerStrip(e.target.value)}
                          disabled={isConversionDisabled}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Leave empty if your pharmacy sells full strips only (strip becomes the Base Unit).
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {dosageForm === 'Capsule' ? 'Capsules' : 'Tablets'} per Tin / Container <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 1000"
                        value={tabletsPerTin}
                        onChange={(e) => setTabletsPerTin(parseInt(e.target.value) || 1)}
                        disabled={isConversionDisabled}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 2. SYRUP / SUSPENSION & EYE/EAR DROPS */}
              {dosageCategory === 'syrup_suspension_drops' && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Fixed Standard Packaging (1 Bottle per Box)
                  </div>
                  <p className="text-slate-500">
                    Syrups, suspensions, and drops are individual sealed bottles. The system automatically tracks stock in bottles.
                  </p>
                </div>
              )}

              {/* 3. INJECTION (injection) */}
              {dosageCategory === 'injection' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ampoules / Vials per Box <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="e.g. 10"
                      value={unitsPerBox}
                      onChange={(e) => setUnitsPerBox(parseInt(e.target.value) || 1)}
                      disabled={isConversionDisabled}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Container Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInjectionUnitType('ampoule')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                          injectionUnitType === 'ampoule'
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Ampoule
                      </button>
                      <button
                        type="button"
                        onClick={() => setInjectionUnitType('vial')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                          injectionUnitType === 'vial'
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Vial
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. CREAM / OINTMENT (cream_ointment) */}
              {dosageCategory === 'cream_ointment' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tubes per Box <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 1 (or 10 for multi-pack)"
                    value={unitsPerBox}
                    onChange={(e) => setUnitsPerBox(parseInt(e.target.value) || 1)}
                    disabled={isConversionDisabled}
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Defaults to 1 tube per box, but editable if purchased in multi-packs.
                  </p>
                </div>
              )}

              {/* 5. INHALER */}
              {dosageCategory === 'inhaler' && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Fixed Standard Packaging (1 Inhaler per Box)
                  </div>
                  <p className="text-slate-500">
                    Inhalers are single unit devices. Stock is tracked directly as individual inhalers.
                  </p>
                </div>
              )}

              {/* 6. SACHET / POWDER */}
              {dosageCategory === 'sachet_powder' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sachets per Box <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 20, 50"
                    value={unitsPerBox}
                    onChange={(e) => setUnitsPerBox(parseInt(e.target.value) || 1)}
                    disabled={isConversionDisabled}
                    required
                  />
                </div>
              )}

              {/* 7. SUPPOSITORY */}
              {dosageCategory === 'suppository' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Suppositories per Box <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 5, 10"
                    value={unitsPerBox}
                    onChange={(e) => setUnitsPerBox(parseInt(e.target.value) || 1)}
                    disabled={isConversionDisabled}
                    required
                  />
                </div>
              )}

              {/* 8. MEDICAL SUPPLIES */}
              {dosageCategory === 'medical_supplies' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pieces per Box <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 100 for gloves, 50 for syringes"
                    value={unitsPerBox}
                    onChange={(e) => setUnitsPerBox(parseInt(e.target.value) || 1)}
                    disabled={isConversionDisabled}
                    required
                  />
                </div>
              )}

              {/* Dynamic Mathematical Conversion Note */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2.5 text-teal-900 text-xs">
                <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
                <div className="flex-1">
                  <strong>Conversion Rule:</strong> {packagingDescription}.
                  <span className="block text-[11px] text-teal-800 mt-0.5">
                    Database will strictly store stock as an integer in <strong>{baseUnit}s</strong>.
                  </span>
                </div>
              </div>
            </div>

            {/* Low-stock threshold */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Low Stock Threshold ({baseUnit}s)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 10"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                error={fieldErrors.low_stock_threshold}
                helperText={`Trigger alert when available ${baseUnit}s fall below this number.`}
                required
              />
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
    </div>
  );
}
