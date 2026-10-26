'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Clock, ShoppingCart, Pill, Building2, Download, Layers } from 'lucide-react';
import type { Profile } from '@/types';

interface MobileNavProps {
  profile: Profile;
}

export function MobileNav({ profile }: MobileNavProps) {
  const pathname = usePathname();
  const isAdmin = profile.role === 'ADMIN';
  const perms = profile.permissions || [];

  function isActive(href: string) {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (href === '/pos') {
      return pathname === '/pos';
    }
    return pathname === href || pathname.startsWith(href + '/');
  }

  // Determine fifth tab based on permissions
  const fifthTab = isAdmin || perms.includes('manage_suppliers')
    ? { href: '/inventory/suppliers', label: 'Suppliers', icon: Building2 }
    : perms.includes('receive_stock')
    ? { href: '/inventory/receive', label: 'Receive', icon: Download }
    : { href: '/inventory/batches', label: 'Batches', icon: Layers };

  const isPosActive = isActive('/pos');

  return (
    <nav className="md:hidden sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
      {/* Home */}
      <Link
        href="/dashboard"
        className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
          isActive('/dashboard') ? 'font-bold text-teal-800' : 'font-medium text-slate-500 hover:text-slate-700'
        }`}
      >
        <LayoutDashboard className={`w-4 h-4 ${isActive('/dashboard') ? 'text-teal-700' : 'text-slate-400'}`} />
        <span>Home</span>
        {isActive('/dashboard') && <span className="w-1.5 h-1.5 rounded-full bg-teal-700 mt-0.5" />}
      </Link>

      {/* Shifts */}
      <Link
        href="/shifts"
        className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
          isActive('/shifts') ? 'font-bold text-teal-800' : 'font-medium text-slate-500 hover:text-slate-700'
        }`}
      >
        <Clock className={`w-4 h-4 ${isActive('/shifts') ? 'text-teal-700' : 'text-slate-400'}`} />
        <span>Shifts</span>
        {isActive('/shifts') && <span className="w-1.5 h-1.5 rounded-full bg-teal-700 mt-0.5" />}
      </Link>

      {/* Center POS Sell Button */}
      <Link href="/pos" className="flex flex-col items-center -mt-4">
        <div
          className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg border-2 border-white transition-all ${
            isPosActive
              ? 'bg-teal-900 ring-2 ring-teal-500 ring-offset-2 scale-105'
              : 'bg-teal-700 hover:bg-teal-800 active:scale-95'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
        </div>
        <span className={`text-[10px] mt-0.5 ${isPosActive ? 'font-extrabold text-teal-950' : 'font-bold text-teal-900'}`}>
          Sell
        </span>
      </Link>

      {/* Medicines */}
      <Link
        href="/inventory/medicines"
        className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
          isActive('/inventory/medicines')
            ? 'font-bold text-teal-800'
            : 'font-medium text-slate-500 hover:text-slate-700'
        }`}
      >
        <Pill className={`w-4 h-4 ${isActive('/inventory/medicines') ? 'text-teal-700' : 'text-slate-400'}`} />
        <span>Medicines</span>
        {isActive('/inventory/medicines') && <span className="w-1.5 h-1.5 rounded-full bg-teal-700 mt-0.5" />}
      </Link>

      {/* Contextual Fifth Tab */}
      <Link
        href={fifthTab.href}
        className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
          isActive(fifthTab.href) ? 'font-bold text-teal-800' : 'font-medium text-slate-500 hover:text-slate-700'
        }`}
      >
        <fifthTab.icon className={`w-4 h-4 ${isActive(fifthTab.href) ? 'text-teal-700' : 'text-slate-400'}`} />
        <span>{fifthTab.label}</span>
        {isActive(fifthTab.href) && <span className="w-1.5 h-1.5 rounded-full bg-teal-700 mt-0.5" />}
      </Link>
    </nav>
  );
}
