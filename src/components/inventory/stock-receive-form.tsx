'use client';

import React, { useState, useTransition, useRef, useEffect, useMemo } from 'react';
import {
  PackagePlus,
  Building2,
  Pill,
  Calculator,
  Calendar,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Search,
  Check,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { receiveStockAction, type InventoryActionResponse } from '@/app/actions/inventory';
import { formatStockBreakdown, formatPackagingFormula } from '@/lib/utils/packaging';
import { AiInvoiceScannerModal } from './ai-invoice-scanner-modal';
import type { ExtractedInvoiceItem } from '@/app/actions/ai-invoice';
import type { MedicineInventorySummary, SupplierWithBalance } from '@/types';

interface StockReceiveFormProps {
  medicines: MedicineInventorySummary[];
  suppliers: SupplierWithBalance[];
}

export function StockReceiveForm({ medicines, suppliers }: StockReceiveFormProps) {
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>(
    medicines.length > 0 ? medicines[0].id : ''
  );
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    suppliers.length > 0 ? suppliers[0].id : ''
  );

  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');
  const [isMedicineDropdownOpen, setIsMedicineDropdownOpen] = useState(false);
  const medicineDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (medicineDropdownRef.current && !medicineDropdownRef.current.contains(event.target as Node)) {
        setIsMedicineDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter medicines in real-time by search query
  const filteredMedicines = useMemo(() => {
    const q = medicineSearchQuery.toLowerCase().trim();
    if (!q) return medicines;
    return medicines.filter((m) => {
      const name = m.name?.toLowerCase() || '';
      const brand = m.brand_name?.toLowerCase() || '';
      const strength = m.strength?.toLowerCase() || '';
      const form = m.dosage_form?.toLowerCase() || '';
      return name.includes(q) || brand.includes(q) || strength.includes(q) || form.includes(q);
    });
  }, [medicines, medicineSearchQuery]);

  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [packs, setPacks] = useState<number>(1);
  const [looseUnits, setLooseUnits] = useState<number>(0);
  const [costPerPack, setCostPerPack] = useState<number>(0);
  const [sellingPricePerPack, setSellingPricePerPack] = useState<number>(0);
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState<number>(0);

  const [paymentStatus, setPaymentStatus] = useState<'FULL' | 'PARTIAL' | 'DUBE'>('FULL');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER'>('CASH');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active medicine details
  const currentMedicine = medicines.find((m) => m.id === selectedMedicineId);
  const unitsPerPack = currentMedicine?.units_per_pack || 1;
  const packLabel = currentMedicine?.pack_label || 'Pack';
  const baseUnit = currentMedicine?.base_unit || 'unit';

  // Math Conversion
  const totalBaseUnits = (packs || 0) * unitsPerPack + (looseUnits || 0);
  const unitCost = unitsPerPack > 0 ? Number((costPerPack / unitsPerPack).toFixed(4)) : 0;
  const totalCost = Number(
    ((packs * costPerPack) + (looseUnits * unitCost)).toFixed(2)
  );

  // When cost or selling pack price changes, auto suggest unit selling price
  function handlePackSellingPriceChange(newPackPrice: number) {
    setSellingPricePerPack(newPackPrice);
    if (unitsPerPack > 0 && newPackPrice > 0) {
      const suggested = Number((newPackPrice / unitsPerPack).toFixed(2));
      setSellingPricePerUnit(suggested);
    }
  }

  // Update payment amounts when totalCost changes
  const effectiveAmountPaid =
    paymentStatus === 'FULL'
      ? totalCost
      : paymentStatus === 'DUBE'
      ? 0
      : amountPaid;

  const remainingBalance = Math.max(0, Number((totalCost - effectiveAmountPaid).toFixed(2)));

  // Apply a single item extracted from Gemini AI
  function handleApplySingleItem(item: ExtractedInvoiceItem, supplierId: string, invNum: string) {
    if (item.matched_medicine_id) {
      setSelectedMedicineId(item.matched_medicine_id);
    }
    if (supplierId) {
      setSelectedSupplierId(supplierId);
    }
    if (item.batch_number) {
      setBatchNumber(item.batch_number);
    }
    if (item.expiry_date) {
      setExpiryDate(item.expiry_date);
    }
    setPacks(item.quantity || 1);
    setLooseUnits(0);
    setCostPerPack(item.cost_per_pack || 0);
    setSellingPricePerPack(item.selling_price_per_pack || 0);
    setSellingPricePerUnit(item.selling_price_per_unit || 0);
    if (invNum) {
      setInvoiceNumber(invNum);
    }
    setSuccessMessage(`Loaded "${item.raw_description}" from invoice into form. Verify and submit.`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('medicine_id', selectedMedicineId);
    formData.append('supplier_id', selectedSupplierId);
    formData.append('batch_number', batchNumber);
    formData.append('expiry_date', expiryDate);
    formData.append('packs', packs.toString());
    formData.append('loose_units', looseUnits.toString());
    formData.append('cost_per_pack', costPerPack.toString());
    formData.append('selling_price_per_pack', sellingPricePerPack.toString());
    formData.append('selling_price_per_unit', sellingPricePerUnit.toString());
    formData.append('payment_status', paymentStatus);
    formData.append('amount_paid', effectiveAmountPaid.toString());
    formData.append('payment_method', paymentStatus === 'DUBE' ? '' : paymentMethod);
    formData.append('invoice_number', invoiceNumber);
    formData.append('notes', notes);

    const res: InventoryActionResponse = await receiveStockAction(null, formData);
    setIsSubmitting(false);

    if (res.error) {
      setGeneralError(res.error);
      if (res.fieldErrors) setFieldErrors(res.fieldErrors);
    } else {
      setSuccessMessage(res.message || 'Stock received successfully!');
      // Reset form fields
      setBatchNumber('');
      setExpiryDate('');
      setPacks(1);
      setLooseUnits(0);
      setCostPerPack(0);
      setSellingPricePerPack(0);
      setSellingPricePerUnit(0);
      setAmountPaid(0);
      setInvoiceNumber('');
      setNotes('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fast Receive with Gemini AI Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-teal-50 via-teal-100/30 to-slate-50 border border-teal-200/80 rounded-2xl shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900">
                Fast Stock Receiving with Gemini AI
              </h3>
              <span className="text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-200 px-1.5 py-0.2 rounded-full">
                AI Vision
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Upload or snap a wholesale paper invoice to auto-extract items, batches, and costs.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsAiScannerOpen(true)}
          className="font-bold text-xs bg-white text-teal-800 border-teal-300 hover:bg-teal-50 gap-1.5 shadow-2xs shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          Scan Invoice with AI
        </Button>
      </div>

      {/* Alert Messages */}
      {generalError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Stock Receiving Failed</p>
            <p className="mt-0.5">{generalError}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="font-semibold">Stock Receipt Completed</p>
            <p className="mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Section 1: Medicine & Supplier Selection */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3">
          <Building2 className="w-4 h-4 text-teal-600" />
          <span>1. Medicine & Supplier Selection</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Supplier <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              required
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.has_unpaid_dube ? `(Unpaid Dube: ${s.total_payable_balance.toLocaleString()} ETB)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Medicine Picker with Live Search */}
          <div className="relative" ref={medicineDropdownRef}>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Medicine <span className="text-rose-500">*</span>
            </label>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={
                  isMedicineDropdownOpen
                    ? medicineSearchQuery
                    : currentMedicine
                    ? `${currentMedicine.name} ${currentMedicine.strength} (${currentMedicine.dosage_form})${
                        currentMedicine.brand_name ? ` - [${currentMedicine.brand_name}]` : ''
                      }`
                    : ''
                }
                onChange={(e) => {
                  setMedicineSearchQuery(e.target.value);
                  if (!isMedicineDropdownOpen) setIsMedicineDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsMedicineDropdownOpen(true);
                  if (!medicineSearchQuery) setMedicineSearchQuery('');
                }}
                placeholder="Search medicine by name, brand, strength..."
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors shadow-2xs font-medium text-slate-900"
                autoComplete="off"
              />

              {isMedicineDropdownOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    if (medicineSearchQuery) {
                      setMedicineSearchQuery('');
                    } else {
                      setIsMedicineDropdownOpen(false);
                    }
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                  title="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMedicineSearchQuery('');
                    setIsMedicineDropdownOpen(true);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                  title="Search medicine"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Hidden Input for Form Submission Fallback */}
            <input type="hidden" name="medicine_id" value={selectedMedicineId} />

            {/* Dropdown Results List */}
            {isMedicineDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                {filteredMedicines.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No medicines matching &ldquo;{medicineSearchQuery}&rdquo;.
                  </div>
                ) : (
                  filteredMedicines.map((m) => {
                    const isSelected = m.id === selectedMedicineId;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMedicineId(m.id);
                          setIsMedicineDropdownOpen(false);
                          setMedicineSearchQuery('');
                        }}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 text-xs transition-colors hover:bg-teal-50/70 ${
                          isSelected ? 'bg-teal-50/90 text-teal-950 font-medium' : 'text-slate-800'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>{m.name}</span>
                            <span className="text-teal-700 font-bold">{m.strength}</span>
                            {m.brand_name && (
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] border border-slate-200">
                                {m.brand_name}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{m.dosage_form}</span>
                            <span>•</span>
                            <span>1 {m.pack_label || 'Pack'} = {m.units_per_pack} {m.base_unit}s</span>
                            <span>•</span>
                            <span>Stock: {m.total_units_in_stock} {m.base_unit}s</span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-teal-700 shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Medicine Info Banner */}
        {currentMedicine && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold text-slate-900">
                {currentMedicine.name} {currentMedicine.strength}
              </span>
              {currentMedicine.brand_name && (
                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-sm font-medium">
                  {currentMedicine.brand_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-slate-600">
              <span>
                Packaging Ratio:{' '}
                <strong className="text-teal-800">
                  {formatPackagingFormula(currentMedicine)}
                </strong>
              </span>
              <span>
                Current Stock:{' '}
                <strong className="text-slate-800">
                  {formatStockBreakdown(currentMedicine.total_units_in_stock, currentMedicine)}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Batch & Quantity Conversion */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3">
          <Calculator className="w-4 h-4 text-teal-600" />
          <span>2. Batch Details & Unit Conversion</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Batch Number */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Batch Number <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. B260814, LOT-901"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              error={fieldErrors.batch_number}
              required
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Expiry Date <span className="text-rose-500">*</span>
            </label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              error={fieldErrors.expiry_date}
              required
            />
          </div>

          {/* Full Packs Quantity */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Full {packLabel}s Received
            </label>
            <Input
              type="number"
              min="0"
              value={packs}
              onChange={(e) => setPacks(parseInt(e.target.value) || 0)}
              error={fieldErrors.packs}
            />
          </div>

          {/* Loose Units Quantity */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Loose {baseUnit}s Received
            </label>
            <Input
              type="number"
              min="0"
              value={looseUnits}
              onChange={(e) => setLooseUnits(parseInt(e.target.value) || 0)}
              error={fieldErrors.loose_units}
            />
          </div>
        </div>

        {/* Live Mathematical Conversion Callout */}
        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-teal-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                Packaging Conversion Breakdown
              </p>
              <p className="text-sm font-bold mt-0.5 text-teal-950">
                {packs} {packLabel}(s) &times; {unitsPerPack} + {looseUnits} Loose ={' '}
                <span className="text-teal-700 text-base">{totalBaseUnits} Total {baseUnit}s</span>
              </p>
              {currentMedicine && totalBaseUnits > 0 && (
                <p className="text-xs text-teal-800 mt-1">
                  Breakdown: <strong>{formatStockBreakdown(totalBaseUnits, currentMedicine)}</strong>
                </p>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs text-teal-700">Stock Added:</span>
            <div className="text-lg font-extrabold text-teal-900">
              +{totalBaseUnits} <span className="text-xs font-normal">{baseUnit}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Cost, Pricing & Payment Terms */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 border-b border-slate-100 pb-3">
          <DollarSign className="w-4 h-4 text-teal-600" />
          <span>3. Pricing & Supplier Payment Terms</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Purchase Cost Per Pack */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Purchase Cost / {packLabel} (ETB) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={costPerPack || ''}
              onChange={(e) => setCostPerPack(parseFloat(e.target.value) || 0)}
              error={fieldErrors.cost_per_pack}
              required
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Cost/{baseUnit}: ~{unitCost.toFixed(2)} ETB
            </span>
          </div>

          {/* Selling Price Per Pack */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Selling Price / {packLabel} (ETB) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={sellingPricePerPack || ''}
              onChange={(e) => handlePackSellingPriceChange(parseFloat(e.target.value) || 0)}
              error={fieldErrors.selling_price_per_pack}
              required
            />
          </div>

          {/* Selling Price Per Loose Unit */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Selling Price / {baseUnit} (ETB) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={sellingPricePerUnit || ''}
              onChange={(e) => setSellingPricePerUnit(parseFloat(e.target.value) || 0)}
              error={fieldErrors.selling_price_per_unit}
              helperText="Dispensed loose unit price"
              required
            />
          </div>

          {/* Total Purchase Cost */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Total Receipt Cost (ETB)
            </label>
            <div className="h-10 px-3 py-2 bg-slate-100 rounded-xl font-bold text-slate-900 flex items-center border border-slate-200 text-sm">
              {totalCost.toLocaleString()} ETB
            </div>
          </div>
        </div>

        {/* Payment Terms Selector: Full, Partial, Dube */}
        <div className="pt-2">
          <label className="block text-xs font-medium text-slate-700 mb-2">
            Payment Term with Supplier <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* FULL */}
            <button
              type="button"
              onClick={() => setPaymentStatus('FULL')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                paymentStatus === 'FULL'
                  ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="font-semibold text-sm flex items-center justify-between">
                <span>Full Payment</span>
                {paymentStatus === 'FULL' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500 mt-1">Paid in full (100% upfront). No debt recorded.</p>
            </button>

            {/* PARTIAL */}
            <button
              type="button"
              onClick={() => setPaymentStatus('PARTIAL')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                paymentStatus === 'PARTIAL'
                  ? 'border-teal-600 bg-teal-50/70 text-teal-950 ring-2 ring-teal-600/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="font-semibold text-sm flex items-center justify-between">
                <span>Partial Payment</span>
                {paymentStatus === 'PARTIAL' && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
              </div>
              <p className="text-xs text-slate-500 mt-1">Pay an advance; balance saved as payable debt.</p>
            </button>

            {/* DUBE */}
            <button
              type="button"
              onClick={() => setPaymentStatus('DUBE')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                paymentStatus === 'DUBE'
                  ? 'border-amber-600 bg-amber-50/70 text-amber-950 ring-2 ring-amber-600/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="font-semibold text-sm flex items-center justify-between">
                <span>Dube (100% Credit)</span>
                {paymentStatus === 'DUBE' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
              </div>
              <p className="text-xs text-slate-500 mt-1">0 ETB upfront. 100% recorded as supplier credit.</p>
            </button>
          </div>
        </div>

        {/* Dynamic Payment Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {paymentStatus === 'PARTIAL' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Amount Paid Advance (ETB) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={totalCost}
                placeholder="e.g. 500"
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                error={fieldErrors.amount_paid}
                required
              />
            </div>
          )}

          {paymentStatus !== 'DUBE' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-colors"
              >
                <option value="CASH">Cash Till</option>
                <option value="TELEBIRR">Telebirr</option>
                <option value="CBE_BIRR">CBE Birr</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Invoice / Delivery Note # <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. INV-90412"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
        </div>

        {/* Payment Summary Bar */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            Paid Now:{' '}
            <strong className="text-slate-900 text-sm">
              {effectiveAmountPaid.toLocaleString()} ETB
            </strong>
          </div>
          <div>
            Remaining Payable to Supplier:{' '}
            <strong
              className={`text-sm ${
                remainingBalance > 0 ? 'text-amber-800 font-bold' : 'text-emerald-700'
              }`}
            >
              {remainingBalance.toLocaleString()} ETB {remainingBalance > 0 ? '(Dube Debt)' : ''}
            </strong>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full sm:w-auto px-8 gap-2 font-semibold"
          isLoading={isSubmitting}
        >
          <PackagePlus className="w-5 h-5" />
          Receive Stock & Update Inventory
        </Button>
      </div>

      {/* AI Invoice Scanner Modal */}
      <AiInvoiceScannerModal
        isOpen={isAiScannerOpen}
        onClose={() => setIsAiScannerOpen(false)}
        medicines={medicines}
        suppliers={suppliers}
        onApplySingleItem={handleApplySingleItem}
        onSuccess={() => {
          setSuccessMessage('AI batch stock receiving completed successfully.');
        }}
      />
    </form>
  );
}
