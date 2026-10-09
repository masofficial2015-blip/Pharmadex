import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Database as DbIcon,
  Layers,
  Clock,
  Coins,
  CheckCircle2,
  FileCode,
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
  const schemaTables = [
    { name: 'profiles', desc: '1 Admin + 2-3 Pharmacists linked to auth.users', status: 'Migrated' },
    { name: 'suppliers', desc: 'Distributor & supplier directory', status: 'Migrated' },
    { name: 'medicines', desc: 'Essential details: name, strength, form, base unit, pack size, threshold', status: 'Migrated' },
    { name: 'batches', desc: 'FEFO index, expiry, pack/unit prices, initial & current quantity', status: 'Migrated' },
    { name: 'shifts', desc: 'Single open shift guarantee (idx_single_open_shift), cash reconciliation', status: 'Migrated' },
    { name: 'stock_movements', desc: 'Audit ledger for every stock in/out with user & batch link', status: 'Migrated' },
    { name: 'sales', desc: 'Receipts with Cash, Telebirr, CBE Birr, Bank Transfer (ETB)', status: 'Migrated' },
    { name: 'sale_items', desc: 'Full packs & individual unit sales with batch deduction', status: 'Migrated' },
    { name: 'returns', desc: 'Authorized returns/cancellations with stock restoration', status: 'Migrated' },
    { name: 'cash_movements', desc: 'Till pay-ins & pay-outs during active shifts', status: 'Migrated' },
    { name: 'audit_logs', desc: 'System-wide compliance & security change tracking', status: 'Migrated' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            Px
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 tracking-tight text-base sm:text-lg">Pharmadex</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">v0.1</span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Ethiopian Pharmacy Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Schema Ready</span>
          </Badge>
          <div className="text-xs text-slate-500 font-mono hidden md:block">
            Currency: <strong className="text-slate-700">ETB</strong>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Hero Card */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 text-teal-200 text-xs font-semibold tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Project Foundation Initialized
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Pharmacy Core & Database Schema
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Clean, mobile-first architecture configured with Next.js 15, TypeScript, Tailwind CSS, and Supabase. 
              The database schema is fully defined with strict integrity constraints, FEFO tracking, and single-shift enforcement.
            </p>
          </div>
        </div>

        {/* Essential Architecture Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-teal-100">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <CardTitle className="text-base">Single Shift Guarantee</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs leading-relaxed text-slate-600">
                Guaranteed by <code className="text-teal-800 font-mono bg-teal-50 px-1 py-0.5 rounded">idx_single_open_shift</code> partial unique index. Strictly prevents multiple active shifts across the pharmacy.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-teal-100">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 mb-1">
                <Layers className="w-4 h-4" />
              </div>
              <CardTitle className="text-base">Pack & Unit Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs leading-relaxed text-slate-600">
                All inventory is accounted in base units (tablets, capsules) with explicit pack pricing and unit pricing. Zero rounding errors during partial pack sales.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-teal-100">
            <CardHeader className="pb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 mb-1">
                <Coins className="w-4 h-4" />
              </div>
              <CardTitle className="text-base">Ethiopian Payments (ETB)</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs leading-relaxed text-slate-600">
                Native support for Cash, Telebirr, CBE Birr, and Bank Transfer with shift cash reconciliation and discrepancy tracking.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Database Schema Verification Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <DbIcon className="w-5 h-5 text-teal-700" />
                PostgreSQL Schema Entities
              </CardTitle>
              <CardDescription>
                Designed in <code className="text-slate-700 font-mono text-xs">supabase/migrations/</code> with RLS policies and indexes
              </CardDescription>
            </div>
            <Badge variant="default" className="hidden sm:inline-flex">11 Tables Ready</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {schemaTables.map((t) => (
                <div key={t.name} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                        {t.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{t.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium pl-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="hidden sm:inline">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Setup & Next Steps Guide */}
        <Card className="bg-slate-900 text-white border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <FileCode className="w-5 h-5 text-teal-400" />
              Supabase Connection & Migration Instructions
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Follow these simple steps to link your Supabase database instance:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-300 font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <p className="text-slate-400">// 1. Add your project credentials to .env.local</p>
              <p className="text-teal-300">NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co</p>
              <p className="text-teal-300">NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]</p>
              <p className="text-teal-300">SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <p className="text-slate-400">// 2. Execute SQL migrations in Supabase SQL Editor or via CLI:</p>
              <p className="text-slate-200">supabase/migrations/20261009000001_initial_schema.sql</p>
              <p className="text-slate-200">supabase/migrations/20261009000002_rls_and_policies.sql</p>
              <p className="text-slate-200">supabase/seed.sql</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        Pharmadex &copy; {new Date().getFullYear()} &mdash; Tailored for Ethiopian Community Pharmacies. ETB Currency & Gregorian Calendar.
      </footer>
    </div>
  );
}
