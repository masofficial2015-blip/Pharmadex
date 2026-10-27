'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  FileText,
  DollarSign,
  ChevronDown,
  Layers,
  Search,
  Check,
  Plus,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  scanInvoiceWithGeminiAction,
  batchReceiveInvoiceAction,
  type ExtractedInvoiceItem,
  type InvoiceScanResult,
} from '@/app/actions/ai-invoice';
import { SupplierModal } from './supplier-modal';
import type { MedicineInventorySummary, SupplierWithBalance } from '@/types';

interface AiInvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: MedicineInventorySummary[];
  suppliers: SupplierWithBalance[];
  onApplySingleItem?: (item: ExtractedInvoiceItem, supplierId: string, invoiceNumber: string) => void;
  onSuccess?: () => void;
}

export function AiInvoiceScannerModal({
  isOpen,
  onClose,
  medicines,
  suppliers,
  onApplySingleItem,
  onSuccess,
}: AiInvoiceScannerModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<InvoiceScanResult | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Editable review states
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'FULL' | 'PARTIAL' | 'DUBE'>('FULL');
  const [items, setItems] = useState<ExtractedInvoiceItem[]>([]);
  const [isReceivingAll, setIsReceivingAll] = useState(false);
  const [receiveSuccessMessage, setReceiveSuccessMessage] = useState<string | null>(null);

  // New supplier modal integration
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);

  // Update preview when file changes
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setGeneralError(null);
      setScanResult(null);
    }
  }

  // Client-side image handling: preserve 100% original quality unless exceeding Vercel 4.5MB limit
  async function compressImageIfNeeded(file: File): Promise<File> {
    // Only compress files larger than 3.5MB to stay well under Vercel's 4.5MB serverless limit
    if (file.size <= 3.5 * 1024 * 1024) return file;

    return new Promise(async (resolve) => {
      try {
        let width = 0;
        let height = 0;
        let source: CanvasImageSource;

        if (typeof createImageBitmap === 'function') {
          const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
          width = bitmap.width;
          height = bitmap.height;
          source = bitmap;
        } else {
          const img = new Image();
          const url = URL.createObjectURL(file);
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = url;
          });
          URL.revokeObjectURL(url);
          width = img.width;
          height = img.height;
          source = img;
        }

        const MAX_DIM = 2560;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(source, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressed);
          },
          'image/jpeg',
          0.92
        );
      } catch {
        resolve(file);
      }
    });
  }

  async function handleStartScan() {
    if (!selectedFile) {
      setGeneralError('Please select or photograph an invoice first.');
      return;
    }

    setIsScanning(true);
    setGeneralError(null);
    setReceiveSuccessMessage(null);

    try {
      const fileToSend = await compressImageIfNeeded(selectedFile);
      const formData = new FormData();
      formData.append('image', fileToSend);

      const result = await scanInvoiceWithGeminiAction(formData);
      setIsScanning(false);

      if (!result.success) {
        setGeneralError(result.error || 'Failed to scan invoice.');
        return;
      }

      setScanResult(result);
      setItems(result.items);
      setInvoiceNumber(result.invoice_number || '');
      if (result.matched_supplier_id) {
        setSelectedSupplierId(result.matched_supplier_id);
      } else if (suppliers.length > 0) {
        setSelectedSupplierId(suppliers[0].id);
      }
    } catch (err: any) {
      setIsScanning(false);
      setGeneralError(err.message || 'Error preparing invoice image for scanning.');
    }
  }

  function handleUpdateItem(id: string, updates: Partial<ExtractedInvoiceItem>) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // If medicine was changed, adjust units per pack and suggested unit price
          if (updates.matched_medicine_id) {
            const med = medicines.find((m) => m.id === updates.matched_medicine_id);
            if (med && updated.selling_price_per_pack > 0) {
              updated.selling_price_per_unit = Number(
                (updated.selling_price_per_pack / (med.units_per_pack || 1)).toFixed(2)
              );
            }
          }
          return updated;
        }
        return item;
      })
    );
  }

  async function handleBatchReceiveAll() {
    if (!selectedSupplierId) {
      setGeneralError('Please select a supplier for these received items.');
      return;
    }

    const activeItems = items.filter((i) => i.selected);
    if (activeItems.length === 0) {
      setGeneralError('Please select at least one item to receive.');
      return;
    }

    // Validate that all selected items have a mapped medicine
    const unmapped = activeItems.find((i) => !i.matched_medicine_id);
    if (unmapped) {
      setGeneralError(`Please select a matching medicine for "${unmapped.raw_description}".`);
      return;
    }

    setIsReceivingAll(true);
    setGeneralError(null);

    const totalCost = activeItems.reduce(
      (sum, item) => sum + Number(item.cost_per_pack * item.quantity),
      0
    );

    const payload = {
      supplier_id: selectedSupplierId,
      invoice_number: invoiceNumber,
      payment_status: paymentStatus,
      amount_paid: paymentStatus === 'FULL' ? totalCost : 0,
      payment_method: 'CASH',
      notes: `Extracted via Gemini AI from invoice #${invoiceNumber || 'N/A'}`,
      items: activeItems.map((item) => ({
        medicine_id: item.matched_medicine_id!,
        batch_number: item.batch_number || `BATCH-${Date.now().toString().slice(-6)}`,
        expiry_date: item.expiry_date || '2028-12-31',
        packs: item.quantity,
        loose_units: 0,
        cost_per_pack: item.cost_per_pack,
        selling_price_per_pack: item.selling_price_per_pack,
        selling_price_per_unit: item.selling_price_per_unit,
      })),
    };

    const res = await batchReceiveInvoiceAction(payload);
    setIsReceivingAll(false);

    if (!res.success) {
      setGeneralError(res.error || 'Failed to complete batch receive.');
    } else {
      setReceiveSuccessMessage(res.message || 'Batch stock receiving completed successfully.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
        <div className="flex min-h-full items-start sm:items-center justify-center pt-4 pb-12 sm:py-6">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Receive Stock with Gemini AI
                    </h2>
                    <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                      Gemini Vision AI
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Snap or upload a paper wholesale invoice to auto-extract items, batches, and costs.
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

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {generalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>{generalError}</div>
                </div>
              )}

              {receiveSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>{receiveSuccessMessage}</div>
                </div>
              )}

              {/* Step 1: Upload / Capture Phase */}
              {!scanResult && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-3xl p-8 text-center transition-all bg-slate-50/50">
                    {previewUrl ? (
                      <div className="space-y-4">
                        <div className="relative max-h-64 overflow-hidden rounded-2xl mx-auto inline-block border border-slate-200 shadow-sm">
                          <img
                            src={previewUrl}
                            alt="Invoice Preview"
                            className="max-h-64 object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <label className="cursor-pointer text-xs font-semibold text-teal-700 hover:underline">
                            Change Photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Upload or drag wholesale invoice image
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Supports JPG, PNG, WEBP receipts & invoices
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-2xs transition-all">
                            <Upload className="w-4 h-4" /> Choose Image File
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-all">
                            <Camera className="w-4 h-4" /> Camera
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Scan Button */}
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleStartScan}
                      isLoading={isScanning}
                      className="w-full py-3 text-sm font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {isScanning ? 'Analyzing & Extracting Invoice...' : 'Scan & Extract Invoice'}
                    </Button>
                  )}
                </div>
              )}

              {/* Step 2: Interactive Review & Manual Override Phase */}
              {scanResult && (
                <div className="space-y-5">
                  {/* Extraction Status Report Banner */}
                  {scanResult.status_message && (
                    <div
                      className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
                        (scanResult.unmatched_count || 0) > 0
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      {(scanResult.unmatched_count || 0) > 0 ? (
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm">
                          {(scanResult.unmatched_count || 0) > 0
                            ? 'Invoice Extracted — Review & Complete Matching'
                            : 'Invoice Successfully Extracted & Catalog Matched'}
                        </p>
                        <p className="leading-relaxed">{scanResult.status_message}</p>
                        {scanResult.model_used && (
                          <p className="text-[10px] text-slate-500 font-mono mt-1">
                            Processed using: <span className="font-semibold text-slate-700">{scanResult.model_used}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Extracted Header Metadata */}
                  <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Supplier Selection */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-teal-700" />
                            Supplier / Wholesaler
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsNewSupplierModalOpen(true)}
                            className="text-[11px] font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add New Supplier
                          </button>
                        </div>
                        <select
                          value={selectedSupplierId}
                          onChange={(e) => setSelectedSupplierId(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-teal-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                        >
                          <option value="">Select or map supplier...</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.phone ? `(${s.phone})` : ''}
                            </option>
                          ))}
                        </select>
                        {scanResult.supplier_name && (
                          <span className="text-[11px] text-teal-700 mt-1 block">
                            Receipt header:{' '}
                            <strong className="text-teal-900">{scanResult.supplier_name}</strong>
                          </span>
                        )}
                      </div>

                      {/* Invoice Number */}
                      <div className="w-full sm:w-44">
                        <label className="block text-xs font-bold text-teal-950 mb-1">
                          Invoice / FS #
                        </label>
                        <Input
                          type="text"
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          placeholder="e.g. 00002015"
                          className="h-10 text-xs font-mono font-bold bg-white border-teal-300"
                        />
                      </div>

                      {/* Payment Terms */}
                      <div className="w-full sm:w-36">
                        <label className="block text-xs font-bold text-teal-950 mb-1">
                          Payment Terms
                        </label>
                        <select
                          value={paymentStatus}
                          onChange={(e) =>
                            setPaymentStatus(e.target.value as 'FULL' | 'PARTIAL' | 'DUBE')
                          }
                          className="w-full h-10 px-3 bg-white border border-teal-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden"
                        >
                          <option value="FULL">Full Paid</option>
                          <option value="DUBE">Dube (Credit)</option>
                          <option value="PARTIAL">Partial</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Items List Section Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Extracted Line Items ({items.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Verify and override any medicine match, batch number, expiry date, or price.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setScanResult(null)}
                      className="text-xs h-8 text-slate-600"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-scan
                    </Button>
                  </div>

                  {/* Extracted Items Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3 px-3 w-10 text-center">Inc</th>
                            <th className="py-3 px-3">Invoice Item & Matched Medicine</th>
                            <th className="py-3 px-3 w-32">Batch #</th>
                            <th className="py-3 px-3 w-32">Expiry Date</th>
                            <th className="py-3 px-3 w-20 text-right">Packs</th>
                            <th className="py-3 px-3 w-24 text-right">Cost (ETB)</th>
                            <th className="py-3 px-3 w-28 text-right">Sell Price</th>
                            {onApplySingleItem && <th className="py-3 px-3 w-24 text-center">Action</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {items.map((item) => {
                            const isMatched = Boolean(item.matched_medicine_id);

                            return (
                              <tr
                                key={item.id}
                                className={`transition-colors ${
                                  item.selected ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/50 opacity-50'
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="py-3 px-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={item.selected}
                                    onChange={(e) =>
                                      handleUpdateItem(item.id, { selected: e.target.checked })
                                    }
                                    className="w-4 h-4 rounded text-teal-700 focus:ring-teal-500"
                                  />
                                </td>

                                {/* Description & Medicine Match Dropdown */}
                                <td className="py-3 px-3 space-y-1">
                                  <div className="font-semibold text-slate-900 text-xs">
                                    {item.raw_description}
                                    {item.code && (
                                      <span className="text-[10px] text-slate-400 font-mono ml-1.5">
                                        [{item.code}]
                                      </span>
                                    )}
                                  </div>
                                  <select
                                    value={item.matched_medicine_id || ''}
                                    onChange={(e) =>
                                      handleUpdateItem(item.id, {
                                        matched_medicine_id: e.target.value || null,
                                      })
                                    }
                                    className={`w-full h-8 px-2 rounded-lg text-xs font-medium border ${
                                      isMatched
                                        ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950'
                                        : 'bg-amber-50/70 border-amber-300 text-amber-950 font-bold'
                                    }`}
                                  >
                                    <option value="">
                                      {isMatched ? 'Change medicine...' : '⚠️ Unmatched - Select medicine...'}
                                    </option>
                                    {medicines.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name} {m.brand_name ? `(${m.brand_name})` : ''} {m.strength}{' '}
                                        - {m.dosage_form}
                                      </option>
                                    ))}
                                  </select>
                                </td>

                                {/* Batch Number Input */}
                                <td className="py-3 px-3">
                                  <Input
                                    type="text"
                                    value={item.batch_number}
                                    onChange={(e) =>
                                      handleUpdateItem(item.id, { batch_number: e.target.value })
                                    }
                                    className="h-8 text-xs font-mono font-bold"
                                    placeholder="Batch #"
                                  />
                                </td>

                                {/* Expiry Date Input */}
                                <td className="py-3 px-3">
                                  <Input
                                    type="date"
                                    value={item.expiry_date}
                                    onChange={(e) =>
                                      handleUpdateItem(item.id, { expiry_date: e.target.value })
                                    }
                                    className="h-8 text-xs font-mono"
                                  />
                                </td>

                                {/* Quantity / Packs */}
                                <td className="py-3 px-3 text-right">
                                  <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleUpdateItem(item.id, {
                                        quantity: Math.max(1, parseInt(e.target.value) || 1),
                                      })
                                    }
                                    className="h-8 text-xs font-bold text-center w-16 ml-auto"
                                  />
                                </td>

                                {/* Unit Cost (ETB) */}
                                <td className="py-3 px-3 text-right">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.cost_per_pack}
                                    onChange={(e) => {
                                      const cost = Math.max(0, parseFloat(e.target.value) || 0);
                                      handleUpdateItem(item.id, {
                                        cost_per_pack: cost,
                                        unit_price: cost,
                                      });
                                    }}
                                    className="h-8 text-xs font-mono text-right w-20 ml-auto"
                                  />
                                </td>

                                {/* Selling Price / Pack */}
                                <td className="py-3 px-3 text-right">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.selling_price_per_pack}
                                    onChange={(e) => {
                                      const sp = Math.max(0, parseFloat(e.target.value) || 0);
                                      const med = medicines.find(
                                        (m) => m.id === item.matched_medicine_id
                                      );
                                      const units = med?.units_per_pack || 1;
                                      handleUpdateItem(item.id, {
                                        selling_price_per_pack: sp,
                                        selling_price_per_unit: Number((sp / units).toFixed(2)),
                                      });
                                    }}
                                    className="h-8 text-xs font-mono font-bold text-teal-900 text-right w-24 ml-auto"
                                  />
                                </td>

                                {/* Action: Apply single */}
                                {onApplySingleItem && (
                                  <td className="py-3 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onApplySingleItem(item, selectedSupplierId, invoiceNumber);
                                        onClose();
                                      }}
                                      disabled={!item.matched_medicine_id}
                                      className="px-2 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-[11px] font-semibold rounded-lg border border-slate-200 disabled:opacity-40"
                                    >
                                      Apply to Form
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isReceivingAll}>
                Close
              </Button>
              {scanResult && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleBatchReceiveAll}
                    isLoading={isReceivingAll}
                    className="font-bold bg-teal-800 hover:bg-teal-900 text-white gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Receive All ({items.filter((i) => i.selected).length} items)
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Embedded New Supplier Modal */}
      <SupplierModal
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        initialName={scanResult?.supplier_name || ''}
        initialPhone={scanResult?.supplier_phone || ''}
        onSuccess={() => {
          setIsNewSupplierModalOpen(false);
        }}
      />
    </>
  );
}
