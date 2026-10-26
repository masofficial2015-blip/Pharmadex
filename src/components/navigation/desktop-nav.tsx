'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Clock,
  Pill,
  Layers,
  Download,
  Building2,
  FileSpreadsheet,
  Users,
  ShieldCheck,
} from 'lucide-react';
import type { Profile } from '@/types';

interface DesktopNavProps {
  profile: Profile;
}

export function DesktopNav({ profile }: DesktopNavProps) {
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

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: '/shifts',
      label: 'Shifts',
      icon: Clock,
      show: true,
    },
    {
      href: '/inventory/medicines',
      label: 'Medicines',
      icon: Pill,
      show: true,
    },
    {
      href: '/inventory/batches',
      label: 'Batches',
      icon: Layers,
      show: true,
    },
    {
      href: '/inventory/receive',
      label: 'Receive Stock',
      icon: Download,
      show: isAdmin || perms.includes('receive_stock'),
    },
    {
      href: '/inventory/suppliers',
      label: 'Suppliers',
      icon: Building2,
      show: isAdmin || perms.includes('manage_suppliers'),
    },
    {
      href: '/inventory/movements',
      label: 'Stock Ledger',
      icon: FileSpreadsheet,
      show: isAdmin || perms.includes('view_ledger'),
    },
    {
      href: '/admin/staff',
      label: 'Staff',
      icon: Users,
      show: isAdmin,
    },
    {
      href: '/admin/audit-logs',
      label: 'Audit Trail',
      icon: ShieldCheck,
      show: isAdmin,
    },
  ];

  const isPosActive = isActive('/pos');

  return (
    <nav className="hidden md:flex items-center gap-1.5 ml-6 border-l border-slate-200 pl-4">
      {/* Primary POS Button */}
      <Link
        href="/pos"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all mr-1.5 ${
          isPosActive
            ? 'bg-teal-900 text-white ring-2 ring-teal-500 ring-offset-1 shadow-sm'
            : 'bg-teal-700 hover:bg-teal-800 text-white shadow-2xs'
        }`}
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        <span>POS / Sell</span>
      </Link>

      {/* Nav Links with Active State Indicators */}
      {navItems
        .filter((item) => item.show)
        .map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-all ${
                active
                  ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200/90 shadow-2xs'
                  : 'text-slate-600 hover:text-teal-900 hover:bg-slate-100 font-medium'
              }`}
            >
              {active && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0 animate-pulse" />
              )}
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-700' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
