import React from 'react';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { logoutAction } from '@/app/actions/auth';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  LogOut,
  User,
  Shield,
  Activity
} from 'lucide-react';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser();
  const isAdmin = profile.role === 'ADMIN';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:bg-teal-800 transition-colors">
              Px
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">Pharmadex</span>
              <span className="text-[10px] text-teal-800 font-bold ml-1.5 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded hidden sm:inline-block">
                ETB
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-6 border-l border-slate-200 pl-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-teal-900 hover:bg-slate-100 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>

            {isAdmin && (
              <>
                <Link
                  href="/admin/staff"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-teal-900 hover:bg-slate-100 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  Staff
                </Link>
                <Link
                  href="/admin/audit-logs"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md text-slate-600 hover:text-teal-900 hover:bg-slate-100 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Audit Trail
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {/* User Profile Badge */}
          <div className="flex items-center gap-2 pr-1">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              {isAdmin ? <Shield className="w-4 h-4 text-teal-700" /> : <User className="w-4 h-4 text-slate-600" />}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{profile.full_name}</p>
              <p className="text-[11px] text-slate-500 capitalize leading-tight">
                {isAdmin ? 'Pharmacy Owner' : 'Pharmacist'}
              </p>
            </div>
            <Badge variant={isAdmin ? 'default' : 'neutral'} className="text-[10px] hidden xs:inline-flex">
              {profile.role}
            </Badge>
          </div>

          {/* Sign Out Form */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-rose-700 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden sticky bottom-0 z-30 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <Link
          href="/dashboard"
          className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-teal-700 active:text-teal-800"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>

        {isAdmin ? (
          <>
            <Link
              href="/admin/staff"
              className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-teal-700 active:text-teal-800"
            >
              <Users className="w-4 h-4" />
              <span>Staff</span>
            </Link>
            <Link
              href="/admin/audit-logs"
              className="flex flex-col items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-teal-700 active:text-teal-800"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Audit Trail</span>
            </Link>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-[11px] font-medium text-teal-700">
            <Activity className="w-4 h-4" />
            <span>Dispensing</span>
          </div>
        )}
      </nav>
    </div>
  );
}
