'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth';
import { getMedicinesWithInventory } from '@/app/actions/medicines';
import { getSuppliersWithBalances } from '@/app/actions/suppliers';
import { receiveStockAction } from '@/app/actions/inventory';
import type { MedicineInventorySummary, SupplierWithBalance } from '@/types';

export interface ExtractedInvoiceItem {
  id: string;
  raw_description: string;
  code?: string;
  matched_medicine_id: string | null;
  matched_medicine_name?: string | null;
  batch_number: string;
  expiry_date: string; // YYYY-MM-DD
  quantity: number;
  uom?: string;
  unit_price: number;
  total_price: number;
  cost_per_pack: number;
  selling_price_per_pack: number;
  selling_price_per_unit: number;
  selected: boolean;
}

export interface InvoiceScanResult {
  success: boolean;
  error?: string;
  status_message?: string;
  matched_count?: number;
  unmatched_count?: number;
  model_used?: string;
  supplier_name?: string;
  supplier_phone?: string;
  matched_supplier_id?: string | null;
  invoice_number?: string;
  invoice_date?: string;
  items: ExtractedInvoiceItem[];
  raw_json?: string;
}

/**
 * Scan an uploaded pharmaceutical invoice image using Gemini Vision models.
 * Automatically tries gemini-3.8-flash with fallbacks if a model is unavailable.
 */
export async function scanInvoiceWithGeminiAction(
  formData: FormData
): Promise<InvoiceScanResult> {
  try {
    await requirePermission('receive_stock');

    const file = formData.get('image') as File | null;
    if (!file || file.size === 0) {
      return { success: false, error: 'No invoice image provided. Please select an image.', items: [] };
    }

    const customApiKey = (formData.get('apiKey') as string) || '';
    const apiKey =
      customApiKey.trim() ||
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';

    if (!apiKey) {
      return {
        success: false,
        error:
          'Gemini API Key is not configured. Please enter your API key in the configuration field or add GEMINI_API_KEY in .env.local.',
        items: [],
      };
    }

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // Retrieve active catalog for smart fuzzy matching
    const [medicines, suppliers] = await Promise.all([
      getMedicinesWithInventory(),
      getSuppliersWithBalances(),
    ]);

    const prompt = `You are an expert pharmaceutical document analyzer for a pharmacy management system.
Analyze this attached pharmacy wholesale invoice/receipt carefully.
Extract the header details and all line items accurately.
For each line item:
- raw_description: The exact item description or drug name with dosage and packaging (e.g. "Disposable syringe 5cc", "Cynvet (Salbutamol) 4mg tab of 10x10", "AZITO(Azitromycin) suspension 30ml", "Back -up(Emergency contraception )pill").
- code: Any item or product code (e.g. S-0010, S-0018, A-0028, U-001, B-009).
- batch_number: The batch / lot number (e.g. 260607, dch2404, fbj9l504, 20250215, BKP2603007).
- expiry_date: Expiry date converted to standard YYYY-MM-DD (e.g., 06/30/2031 -> "2031-06-30", 11/30/2027 -> "2027-11-30", 02/28/2029 -> "2029-02-28"). If only MM/YY or MM/YYYY is present, use the last day of that month.
- quantity: Quantity received (e.g. 5, 2, 5, 30, 30).
- uom: Unit of measure (e.g. Box, pk, Bottle, pcs).
- unit_price: Unit price / cost per pack in ETB (e.g. 680, 175, 255, 50, 58).
- total_price: Line item total price in ETB (e.g. 3400, 350, 1275, 1500, 1740).

Return ONLY valid JSON with this exact structure:
{
  "supplier_name": "string (e.g. Homeland wholesales of medicine& medical equip---)",
  "supplier_phone": "string (e.g. 0910602124)",
  "invoice_number": "string (e.g. 00002015)",
  "invoice_date": "string (e.g. 2026-10-13)",
  "items": [
    {
      "raw_description": "string",
      "code": "string",
      "batch_number": "string",
      "expiry_date": "YYYY-MM-DD",
      "quantity": 0,
      "uom": "string",
      "unit_price": 0,
      "total_price": 0
    }
  ]
}`;

    // Candidate models in preference order (starting with gemini-3.8-flash)
    const CANDIDATE_MODELS = [
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
    ];

    let apiResult: any = null;
    let candidateText = '';
    let successfulModel = '';
    let lastErrorDetails = '';

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
              },
            }),
          }
        );

        if (response.ok) {
          apiResult = await response.json();
          candidateText = apiResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (candidateText && candidateText.trim()) {
            successfulModel = model;
            break;
          }
        } else {
          const errText = await response.text();
          let parsedErrMsg = errText;
          try {
            const errObj = JSON.parse(errText);
            parsedErrMsg = errObj?.error?.message || errText;
          } catch {}
          lastErrorDetails = `Model ${model} (${response.status}): ${parsedErrMsg}`;
          console.warn(`[Gemini Invoice Scan] Model ${model} failed, trying next fallback:`, parsedErrMsg);
        }
      } catch (err: any) {
        lastErrorDetails = err.message || 'Network request failed';
      }
    }

    if (!candidateText) {
      return {
        success: false,
        error: `Could not connect to Gemini models. ${lastErrorDetails || 'Please check your API key and network connection.'}`,
        items: [],
      };
    }

    let parsedData: any;
    try {
      // Clean potential markdown blocks
      const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('Failed to parse Gemini response as JSON:', candidateText);
      return {
        success: false,
        error: 'Failed to extract structured text from the invoice image. Please verify image clarity and contrast.',
        items: [],
      };
    }

    // Match extracted supplier with existing suppliers
    const extractedSupplierName = parsedData.supplier_name || '';
    const extractedSupplierPhone = parsedData.supplier_phone || '';
    let matchedSupplierId: string | null = null;

    if (extractedSupplierName) {
      const supNorm = extractedSupplierName.toLowerCase().trim();
      const foundSupplier = suppliers.find((s) => {
        const sNorm = s.name.toLowerCase().trim();
        return sNorm.includes(supNorm) || supNorm.includes(sNorm);
      });
      if (foundSupplier) {
        matchedSupplierId = foundSupplier.id;
      }
    }

    // Process and match extracted items against active medicines catalog
    const rawItems: any[] = Array.isArray(parsedData.items) ? parsedData.items : [];
    if (rawItems.length === 0) {
      return {
        success: false,
        error: 'No medicine line items could be detected in this invoice. Please ensure the invoice table with medicines, quantities, and prices is clearly visible.',
        items: [],
      };
    }

    const items: ExtractedInvoiceItem[] = rawItems.map((item, index) => {
      const rawDesc = String(item.raw_description || '').trim();
      const normDesc = rawDesc.toLowerCase();

      // Find best matching medicine candidate
      let bestMatch: MedicineInventorySummary | null = null;
      let highestScore = 0;

      for (const med of medicines) {
        const genName = med.name.toLowerCase();
        const brandName = (med.brand_name || '').toLowerCase();
        let score = 0;

        if (brandName && brandName.length > 2 && normDesc.includes(brandName)) {
          score += 10;
        }
        if (genName && genName.length > 2 && normDesc.includes(genName)) {
          score += 8;
        }
        if (med.strength && normDesc.includes(med.strength.toLowerCase())) {
          score += 4;
        }
        if (med.dosage_form && normDesc.includes(med.dosage_form.toLowerCase())) {
          score += 2;
        }

        if (score > highestScore && score >= 8) {
          highestScore = score;
          bestMatch = med;
        }
      }

      const costPerPack = Number(item.unit_price) || 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const unitsPerPack = bestMatch?.units_per_pack || 1;

      // Determine default suggested selling prices
      let sellingPack = 0;
      let sellingUnit = 0;
      if (costPerPack > 0) {
        const markup = 1.25;
        sellingPack = Number((costPerPack * markup).toFixed(2));
        sellingUnit = unitsPerPack > 0 ? Number((sellingPack / unitsPerPack).toFixed(2)) : sellingPack;
      }

      // Standardize expiry date
      let exp = String(item.expiry_date || '').trim();
      if (exp.length === 7 && exp.includes('/')) {
        // MM/YYYY format
        const [m, y] = exp.split('/');
        exp = `${y}-${m.padStart(2, '0')}-28`;
      }

      return {
        id: `extracted-${index}-${Date.now()}`,
        raw_description: rawDesc,
        code: item.code || '',
        matched_medicine_id: bestMatch ? bestMatch.id : null,
        matched_medicine_name: bestMatch
          ? `${bestMatch.name} ${bestMatch.strength} (${bestMatch.dosage_form})`
          : null,
        batch_number: String(item.batch_number || '').trim(),
        expiry_date: exp,
        quantity: quantity,
        uom: item.uom || 'Pack',
        unit_price: costPerPack,
        total_price: Number(item.total_price) || Number((quantity * costPerPack).toFixed(2)),
        cost_per_pack: costPerPack,
        selling_price_per_pack: sellingPack,
        selling_price_per_unit: sellingUnit,
        selected: true,
      };
    });

    const matchedCount = items.filter((i) => i.matched_medicine_id !== null).length;
    const unmatchedCount = items.length - matchedCount;

    let statusMessage = `Extracted ${items.length} line item(s) from invoice #${parsedData.invoice_number || 'N/A'}.`;
    if (unmatchedCount === 0) {
      statusMessage += ` All ${items.length} item(s) auto-matched to active catalog.`;
    } else {
      statusMessage += ` ${matchedCount} auto-matched; ${unmatchedCount} item(s) need manual medicine mapping.`;
    }

    return {
      success: true,
      status_message: statusMessage,
      matched_count: matchedCount,
      unmatched_count: unmatchedCount,
      model_used: successfulModel,
      supplier_name: extractedSupplierName,
      supplier_phone: extractedSupplierPhone,
      matched_supplier_id: matchedSupplierId,
      invoice_number: parsedData.invoice_number || '',
      invoice_date: parsedData.invoice_date || '',
      items,
      raw_json: candidateText,
    };
  } catch (err: any) {
    console.error('scanInvoiceWithGeminiAction unexpected error:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while analyzing the invoice.',
      items: [],
    };
  }
}

/**
 * Batch receive multiple confirmed items from an invoice into inventory.
 */
export async function batchReceiveInvoiceAction(payload: {
  supplier_id: string;
  invoice_number?: string;
  payment_status: 'FULL' | 'PARTIAL' | 'DUBE';
  amount_paid: number;
  payment_method?: string;
  notes?: string;
  items: Array<{
    medicine_id: string;
    batch_number: string;
    expiry_date: string;
    packs: number;
    loose_units: number;
    cost_per_pack: number;
    selling_price_per_pack: number;
    selling_price_per_unit: number;
  }>;
}): Promise<{ success: boolean; message?: string; count?: number; error?: string }> {
  try {
    await requirePermission('receive_stock');

    if (!payload.supplier_id) {
      return { success: false, error: 'Please select a valid supplier.' };
    }

    if (!payload.items || payload.items.length === 0) {
      return { success: false, error: 'No items selected to receive.' };
    }

    let successCount = 0;
    const errors: string[] = [];

    // Distribute payment across items for audit record
    for (const item of payload.items) {
      const formData = new FormData();
      formData.append('medicine_id', item.medicine_id);
      formData.append('supplier_id', payload.supplier_id);
      formData.append('batch_number', item.batch_number);
      formData.append('expiry_date', item.expiry_date);
      formData.append('packs', String(item.packs || 0));
      formData.append('loose_units', String(item.loose_units || 0));
      formData.append('cost_per_pack', String(item.cost_per_pack || 0));
      formData.append('selling_price_per_pack', String(item.selling_price_per_pack || 0));
      formData.append('selling_price_per_unit', String(item.selling_price_per_unit || 0));
      formData.append('payment_status', payload.payment_status);
      formData.append('amount_paid', String(payload.amount_paid));
      formData.append('payment_method', payload.payment_method || 'CASH');
      formData.append('invoice_number', payload.invoice_number || '');
      formData.append('notes', payload.notes || 'Batch received via Gemini AI invoice scan');

      const res = await receiveStockAction(null, formData);
      if (res.error) {
        errors.push(`Item batch ${item.batch_number}: ${res.error}`);
      } else {
        successCount++;
      }
    }

    if (successCount === 0 && errors.length > 0) {
      return { success: false, error: errors.join('; ') };
    }

    return {
      success: true,
      message: `Successfully received ${successCount} item(s) from invoice #${payload.invoice_number || 'N/A'}.`,
      count: successCount,
    };
  } catch (err: any) {
    console.error('batchReceiveInvoiceAction error:', err);
    return { success: false, error: err.message || 'Failed to complete batch stock receiving.' };
  }
}
