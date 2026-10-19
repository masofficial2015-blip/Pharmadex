export type DosageFormCategory =
  | 'tab_cap'
  | 'syrup_suspension_drops'
  | 'injection'
  | 'cream_ointment'
  | 'inhaler'
  | 'sachet_powder'
  | 'suppository'
  | 'medical_supplies';

export interface MedicinePackagingInfo {
  dosage_form?: string | null;
  base_unit: string;
  pack_label?: string | null;
  units_per_pack: number;
  packaging_type?: string | null;
  strips_per_box?: number | null;
  tablets_per_strip?: number | null;
}

/**
 * Maps a dosage form string to its corresponding packaging category.
 */
export function getDosageCategory(dosageForm: string | null | undefined): DosageFormCategory {
  if (!dosageForm) return 'tab_cap';
  const df = dosageForm.toLowerCase().trim();

  if (df.includes('tablet') || df.includes('capsule')) {
    return 'tab_cap';
  }
  if (df.includes('syrup') || df.includes('suspension') || df.includes('drop')) {
    return 'syrup_suspension_drops';
  }
  if (df.includes('injection')) {
    return 'injection';
  }
  if (df.includes('cream') || df.includes('ointment')) {
    return 'cream_ointment';
  }
  if (df.includes('inhaler')) {
    return 'inhaler';
  }
  if (df.includes('sachet') || df.includes('powder')) {
    return 'sachet_powder';
  }
  if (df.includes('suppository')) {
    return 'suppository';
  }
  if (df.includes('supplies') || df.includes('device') || df.includes('glove') || df.includes('syringe')) {
    return 'medical_supplies';
  }

  return 'tab_cap';
}

/**
 * Formats a stock integer (stored in Base Units) into a human-readable breakdown.
 * Examples:
 * - "2 Boxes, 3 Strips, 4 Tablets"
 * - "2 Boxes, 5 Strips"
 * - "15 Bottles"
 * - "4 Boxes, 2 Ampoules"
 */
export function formatStockBreakdown(
  totalUnits: number,
  medicine: MedicinePackagingInfo
): string {
  const baseUnit = (medicine.base_unit || 'unit').toLowerCase();
  const packLabel = medicine.pack_label || 'Box';
  const unitsPerPack = Math.max(1, medicine.units_per_pack || 1);

  if (totalUnits <= 0) {
    return `0 ${baseUnit}s`;
  }

  // 1. Blister Box with both strips_per_box and tablets_per_strip
  if (
    medicine.packaging_type === 'BLISTER_BOX' &&
    medicine.strips_per_box &&
    medicine.strips_per_box > 0 &&
    medicine.tablets_per_strip &&
    medicine.tablets_per_strip > 0
  ) {
    const stripsPerBox = medicine.strips_per_box;
    const tabletsPerStrip = medicine.tablets_per_strip;
    const unitsPerBox = stripsPerBox * tabletsPerStrip;

    const boxes = Math.floor(totalUnits / unitsPerBox);
    const remUnits = totalUnits % unitsPerBox;
    const strips = Math.floor(remUnits / tabletsPerStrip);
    const looseTablets = remUnits % tabletsPerStrip;

    const parts: string[] = [];
    if (boxes > 0) parts.push(`${boxes} ${boxes === 1 ? 'Box' : 'Boxes'}`);
    if (strips > 0) parts.push(`${strips} ${strips === 1 ? 'Strip' : 'Strips'}`);
    if (looseTablets > 0) {
      parts.push(`${looseTablets} ${looseTablets === 1 ? baseUnit : `${baseUnit}s`}`);
    }

    return parts.length > 0 ? parts.join(', ') : `0 ${baseUnit}s`;
  }

  // 2. Blister Box with strips_per_box where base_unit is 'strip' (tablets_per_strip omitted)
  if (
    medicine.packaging_type === 'BLISTER_BOX' &&
    medicine.strips_per_box &&
    medicine.strips_per_box > 0 &&
    (!medicine.tablets_per_strip || medicine.tablets_per_strip <= 0)
  ) {
    const stripsPerBox = medicine.strips_per_box;
    const boxes = Math.floor(totalUnits / stripsPerBox);
    const looseStrips = totalUnits % stripsPerBox;

    const parts: string[] = [];
    if (boxes > 0) parts.push(`${boxes} ${boxes === 1 ? 'Box' : 'Boxes'}`);
    if (looseStrips > 0) parts.push(`${looseStrips} ${looseStrips === 1 ? 'Strip' : 'Strips'}`);

    return parts.length > 0 ? parts.join(', ') : `0 Strips`;
  }

  // 3. Single-unit container (Syrups, Inhalers, 1-per-box items)
  if (unitsPerPack === 1) {
    return `${totalUnits} ${totalUnits === 1 ? baseUnit : `${baseUnit}s`}`;
  }

  // 4. Multi-pack container (Tins, Tubes, Ampoules, Sachets, Pieces)
  const boxes = Math.floor(totalUnits / unitsPerPack);
  const loose = totalUnits % unitsPerPack;

  const parts: string[] = [];
  if (boxes > 0) {
    const pluralPack = packLabel.endsWith('s') ? packLabel : `${packLabel}es`;
    const boxWord = packLabel.toLowerCase() === 'box' ? (boxes === 1 ? 'Box' : 'Boxes') : (boxes === 1 ? packLabel : `${packLabel}s`);
    parts.push(`${boxes} ${boxWord}`);
  }
  if (loose > 0) {
    parts.push(`${loose} ${loose === 1 ? baseUnit : `${baseUnit}s`}`);
  }

  return parts.length > 0 ? parts.join(', ') : `0 ${baseUnit}s`;
}

/**
 * Returns a short packaging conversion formula for tables and cards.
 * Example: "1 Box = 10 Strips × 10 Tabs (100 Tabs)"
 */
export function formatPackagingFormula(medicine: MedicinePackagingInfo): string {
  const packLabel = medicine.pack_label || 'Box';
  const baseUnit = (medicine.base_unit || 'unit').toLowerCase();

  if (
    medicine.packaging_type === 'BLISTER_BOX' &&
    medicine.strips_per_box &&
    medicine.tablets_per_strip
  ) {
    return `1 ${packLabel} = ${medicine.strips_per_box} Strips × ${medicine.tablets_per_strip} ${baseUnit}s (${medicine.units_per_pack} ${baseUnit}s)`;
  }

  if (
    medicine.packaging_type === 'BLISTER_BOX' &&
    medicine.strips_per_box
  ) {
    return `1 ${packLabel} = ${medicine.strips_per_box} Strips`;
  }

  if (medicine.units_per_pack === 1) {
    return `1 ${baseUnit} per ${packLabel}`;
  }

  return `1 ${packLabel} = ${medicine.units_per_pack} ${baseUnit}s`;
}
