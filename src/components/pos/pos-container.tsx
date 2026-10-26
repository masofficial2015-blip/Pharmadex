'use client';

import React, { useState, useDeferredValue, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Clock,
  Plus,
  AlertCircle,
  Filter,
  Check,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PosMedicineCard } from './pos-medicine-card';
import { QuantityConfigModal } from './quantity-config-modal';
import { PosCartSheet } from './pos-cart-sheet';
import { PosCheckoutModal } from './pos-checkout-modal';
import { PosReceiptModal } from './pos-receipt-modal';
import { OpenShiftModal } from '@/components/shifts/open-shift-modal';
import type { PosMedicineItem, CartItem, ShiftSummary, SaleReceipt } from '@/types';

interface PosContainerProps {
  initialMedicines: PosMedicineItem[];
  activeShift: ShiftSummary | null;
}

export function PosContainer({ initialMedicines, activeShift }: PosContainerProps) {
  const [medicines, setMedicines] = useState<PosMedicineItem[]>(initialMedicines);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterForm, setFilterForm] = useState<string>('ALL');

  // React 19 deferred value keeps mobile keyboard typing buttery smooth and non-blocking
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Modals state
  const [selectedMedicine, setSelectedMedicine] = useState<PosMedicineItem | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastReceipt, setLastReceipt] = useState<SaleReceipt | null>(null);

  // Dynamically derive available dosage forms/categories from available medicines
  const availableCategories = useMemo(() => {
    const counts = new Map<string, number>();
    medicines.forEach((m) => {
      const form = m.dosage_form?.trim();
      if (form) {
        counts.set(form, (counts.get(form) || 0) + 1);
      }
    });

    const sortedForms = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([form, count]) => ({ form, label: form, count }));

    return [
      { form: 'ALL', label: 'All Medicines', count: medicines.length },
      ...sortedForms,
    ];
  }, [medicines]);

  // Memoized O(1) Cart Quantity Map to avoid O(N*M) lookup in the rendering loop
  const cartQuantities = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((i) => map.set(i.medicine.id, i.total_units));
    return map;
  }, [cart]);

  // Filter medicines with deferred query
  const filteredMedicines = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase().trim();
    return medicines.filter((m) => {
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        (m.brand_name && m.brand_name.toLowerCase().includes(q)) ||
        m.strength.toLowerCase().includes(q) ||
        m.dosage_form.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (filterForm !== 'ALL' && m.dosage_form !== filterForm) return false;

      return true;
    });
  }, [medicines, deferredSearchQuery, filterForm]);

  const cartTotalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartTotalUnits = cart.reduce((sum, item) => sum + item.total_units, 0);

  function handleSelectMedicine(med: PosMedicineItem) {
    if (!activeShift) {
      setIsOpenShiftModalOpen(true);
      return;
    }
    setSelectedMedicine(med);
    setIsConfigModalOpen(true);
  }

  function handleCartConfirm(item: CartItem) {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.medicine.id === item.medicine.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = item;
        return updated;
      }
      return [...prev, item];
    });
  }

  function handleRemoveItem(medicineId: string) {
    setCart((prev) => prev.filter((i) => i.medicine.id !== medicineId));
  }

  function handleSaleCompleted(receipt: SaleReceipt) {
    setLastReceipt(receipt);
    setCart([]);
    setIsCheckoutModalOpen(false);
    setIsCartSheetOpen(false);
    setIsReceiptModalOpen(true);

    // Refresh page inventory state after a brief moment
    setTimeout(() => {
      // Re-fetch logic or soft refresh
    }, 500);
  }

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {/* Shift Warning Notice if No Shift is Open */}
      {!activeShift && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">No Active Shift Open</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                A pharmacist must open a shift with an initial cash float before sales can be recorded.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsOpenShiftModalOpen(true)}
            variant="primary"
            size="sm"
            className="font-bold bg-amber-700 hover:bg-amber-800 text-white shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Open Shift Now
          </Button>
        </div>
      )}

      {/* Top Search Bar & Category Filter Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Live search medicines by generic, brand name, strength, or form..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all shadow-2xs"
            autoFocus
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {availableCategories.map(({ form, label, count }) => {
            const isActive = filterForm === form;
            return (
              <button
                key={form}
                type="button"
                onClick={() => setFilterForm(form)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold leading-none ${
                    isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Medicine Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <h4 className="text-sm font-semibold text-slate-700">No medicines found</h4>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? `No matches for "${searchQuery}".` : 'No medicines in catalog.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMedicines.map((med) => {
            const inCartUnits = cartQuantities.get(med.id) || 0;

            return (
              <PosMedicineCard
                key={med.id}
                medicine={med}
                quantityInCart={inCartUnits}
                onSelect={handleSelectMedicine}
              />
            );
          })}
        </div>
      )}

      {/* Sticky Mobile Floating Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-14 md:bottom-6 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-200">
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-2xl flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {cart.length}
              </div>
              <div>
                <span className="text-xs text-slate-300 block">Total Bill:</span>
                <span className="font-mono font-extrabold text-base text-white">
                  {cartTotalAmount.toLocaleString()} ETB
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartSheetOpen(true)}
                className="text-white border-slate-700 hover:bg-slate-800 h-9 px-3 text-xs"
              >
                View Cart
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCheckoutModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-500 font-bold h-9 px-4 text-xs"
              >
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Configuration Modal */}
      <QuantityConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        medicine={selectedMedicine}
        existingCartItem={cart.find((i) => i.medicine.id === selectedMedicine?.id)}
        onConfirm={handleCartConfirm}
      />

      {/* Cart Drawer */}
      <PosCartSheet
        isOpen={isCartSheetOpen}
        onClose={() => setIsCartSheetOpen(false)}
        cart={cart}
        onEditItem={(item) => {
          setSelectedMedicine(item.medicine);
          setIsCartSheetOpen(false);
          setIsConfigModalOpen(true);
        }}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCart([])}
        onProceedCheckout={() => {
          setIsCartSheetOpen(false);
          setIsCheckoutModalOpen(true);
        }}
      />

      {/* Checkout Modal */}
      {activeShift && (
        <PosCheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          shiftId={activeShift.shift.id}
          cart={cart}
          onSaleCompleted={handleSaleCompleted}
        />
      )}

      {/* Receipt Modal */}
      <PosReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receipt={lastReceipt}
        onNewSale={() => {
          setLastReceipt(null);
          setCart([]);
        }}
      />

      {/* Open Shift Modal */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
