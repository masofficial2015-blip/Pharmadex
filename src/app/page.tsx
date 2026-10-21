import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  PackageCheck,
} from 'lucide-react';

export const metadata = {
  title: 'Pharmadex | Ethiopian Pharmacy Management & POS System',
  description: 'Modern pharmacy management system featuring FEFO batch tracking, multi-tier packaging unit conversion, and cash reconciliation.',
};

export default function HomePage() {
  const features = [
    {
      icon: ShoppingBag,
      title: 'Fast Point of Sale & Dispensing',
      description:
        'Instant multi-unit sales for full boxes, blister strips, and loose base units. Supports cash till and bank transfer payments.',
    },
    {
      icon: Clock,
      title: 'Strict FEFO Expiry Tracking',
      description:
        'Automatic First-Expiring, First-Out batch selection protects patient safety and eliminates expired medicine waste.',
    },
    {
      icon: Layers,
      title: 'Multi-Tier Packaging Conversion',
      description:
        'Integer-precise stock tracking across all dosage forms — blister boxes, bulk tins, syrups, vials, ampoules, and tubes.',
    },
    {
      icon: ShieldCheck,
      title: 'Shift & Sales Reconciliation',
      description:
        'Enforced single active shift rule with real-time sales summaries and transparent cash drawer audit trails.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs shrink-0 flex items-center justify-center p-1">
            <Image
              src="/pharmadex.png"
              alt="Pharmadex Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                Pharmadex
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Pharmacy Management &amp; POS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Currency: <strong className="text-slate-800">ETB</strong>
          </span>

          <Link
            href="/login"
            className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-all shadow-xs active:scale-98 gap-1.5"
          >
            <span>Staff Login</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-teal-800/40">
          {/* Subtle background glow */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            {/* Prominent Logo Display (Appears first on mobile screens for immediate brand recognition) */}
            <div className="shrink-0 flex flex-col items-center justify-center order-first md:order-last">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 p-2 shadow-2xl">
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white p-2 flex items-center justify-center">
                  <Image
                    src="/pharmadex.png"
                    alt="Pharmadex Pharmacy Software"
                    width={128}
                    height={128}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="max-w-2xl space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-800/60 border border-teal-700 text-teal-200 text-xs font-medium tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Modern Ethiopian Pharmacy System</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Intelligent Pharmacy Operations, Dispensing &amp; Inventory
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Engineered for Ethiopian pharmacies. Complete FEFO batch tracking, automated multi-unit packaging conversion, and transparent shift sales reconciliation.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-white text-teal-950 font-bold text-xs sm:text-sm hover:bg-teal-50 transition-all shadow-md active:scale-98"
                >
                  <span>Sign In to Pharmacist Portal</span>
                  <ArrowRight className="w-4 h-4 text-teal-700" />
                </Link>

                <div className="text-xs text-teal-200/90 flex items-center gap-1.5 px-3 py-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Role-Based Access &amp; Audit Security</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Built for Daily Pharmacy Practice
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Precision tools designed to keep inventory exact and transactions transparent.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition-all shadow-2xs hover:shadow-xs group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Reassurance Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <PackageCheck className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 block">
                Standardized for Ethiopian Regulatory Guidelines
              </span>
              <span className="text-slate-500">
                Individual pharmacist shifts, full FEFO batch traceability, and double-entry stock movement ledgers.
              </span>
            </div>
          </div>

          <Link
            href="/login"
            className="shrink-0 text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            <span>Access Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-4 sm:px-8 py-5 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5 rounded overflow-hidden shrink-0">
              <Image
                src="/pharmadex.png"
                alt="Pharmadex Logo"
                fill
                sizes="20px"
                className="object-cover"
              />
            </div>
            <span className="font-semibold text-slate-800">Pharmadex</span>
            <span>•</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Currency: ETB</span>
            <span>•</span>
            <Link href="/login" className="hover:text-slate-800 transition-colors">
              Staff Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
