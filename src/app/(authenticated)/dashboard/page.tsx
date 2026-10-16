import React from 'react';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  ShieldCheck,
  Clock,
  ShoppingCart,
  UserCheck,
  FileText,
  Activity,
  ArrowRight,
  TrendingUp,
  Banknote,
  Coins,
} from 'lucide-react';

export default async function DashboardPage() {
  const { profile } = await requireUser();
  const isAdmin = profile.role === 'ADMIN';

  const supabase = await createClient();

  // Fetch count of active staff for summary
  const { count: staffCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: activePharmacistsCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'PHARMACIST')
    .eq('is_active', true);

  // Check currently active shift if any
  const { data: rawShift } = await supabase
    .from('shifts')
    .select('id, user_id, opened_at, opening_cash')
    .eq('status', 'OPEN')
    .maybeSingle();

  const openShift = rawShift as unknown as {
    id: string;
    user_id: string;
    opened_at: string;
    opening_cash: number;
  } | null;

  // Fetch inventory summary metrics
  const { count: medicineCount } = await supabase
    .from('medicines')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const todayStr = new Date().toISOString().split('T')[0];
  const fourMonthsLater = new Date();
  fourMonthsLater.setDate(fourMonthsLater.getDate() + 120);
  const fourMonthsStr = fourMonthsLater.toISOString().split('T')[0];

  // Fetch near-expiry and expired counts using zero-body count queries
  const [{ count: rawExpiredCount }, { count: rawNearExpiryCount }] = await Promise.all([
    supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .gt('current_quantity_units', 0)
      .lte('expiry_date', todayStr),
    supabase
      .from('batches')
      .select('*', { count: 'exact', head: true })
      .gt('current_quantity_units', 0)
      .gt('expiry_date', todayStr)
      .lte('expiry_date', fourMonthsStr),
  ]);

  const expiredCount = rawExpiredCount || 0;
  const nearExpiryCount = rawNearExpiryCount || 0;

  // Fetch today's sales and calculate estimated profit for Owner/Admin
  let todaySalesRevenue = 0;
  let todayEstimatedCost = 0;
  let todayEstimatedProfit = 0;
  let todayProfitMargin = 0;
  let todaySalesCount = 0;

  if (isAdmin) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: rawTodaySales } = await (supabase.from('sales') as any)
      .select(`
        id,
        total_amount,
        status,
        sale_items (
          quantity_units,
          subtotal,
          batch:batches (
            cost_per_pack,
            cost_per_unit,
            medicine:medicines (
              units_per_pack
            )
          )
        )
      `)
      .eq('status', 'COMPLETED')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (rawTodaySales && rawTodaySales.length > 0) {
      todaySalesCount = rawTodaySales.length;
      rawTodaySales.forEach((sale: any) => {
        const items = sale.sale_items || [];
        items.forEach((item: any) => {
          const itemRevenue = Number(item.subtotal || 0);
          todaySalesRevenue += itemRevenue;

          const batch = item.batch;
          if (batch) {
            let unitCost = Number(batch.cost_per_unit || 0);
            if (!unitCost && batch.cost_per_pack && batch.medicine?.units_per_pack) {
              unitCost = Number(batch.cost_per_pack) / Number(batch.medicine.units_per_pack);
            }
            const itemCost = Number(item.quantity_units || 0) * unitCost;
            todayEstimatedCost += itemCost;
          }
        });
      });

      todayEstimatedProfit = todaySalesRevenue - todayEstimatedCost;
      if (todaySalesRevenue > 0) {
        todayProfitMargin = (todayEstimatedProfit / todaySalesRevenue) * 100;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-teal-300 text-xs font-semibold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5" />
              <span>Pharmadex Operational Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome, {profile.full_name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Signed in with individual credentials as{' '}
              <strong className="text-teal-200">{isAdmin ? 'Pharmacy Owner / Administrator' : 'Dispensing Pharmacist'}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/pos">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs gap-1.5 shadow-sm">
                <ShoppingCart className="w-4 h-4" /> Start Selling (POS)
              </Button>
            </Link>
            <Badge variant={isAdmin ? 'default' : 'success'} className="px-3 py-1 text-xs">
              {profile.is_active ? 'Account Active' : 'Deactivated'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Inventory & Operational Quick Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Shift Card */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Shift Status
              </CardTitle>
              <Clock className="w-4 h-4 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {openShift ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-sm font-semibold text-slate-900">Shift Open</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {openShift.user_id === profile.id ? 'You are on duty' : 'Colleague on duty'}
                </p>
                <Link href="/shifts" className="text-[11px] text-teal-700 hover:underline flex items-center gap-1 font-medium pt-1">
                  Reconcile & Close &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-sm font-semibold text-slate-900">No Open Shift</span>
                </div>
                <p className="text-[11px] text-slate-500">Required before sales</p>
                <Link href="/shifts" className="text-[11px] text-amber-800 hover:underline flex items-center gap-1 font-medium pt-1">
                  Open Shift &rarr;
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medicines Catalog Card */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Medicines
              </CardTitle>
              <ShoppingCart className="w-4 h-4 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-900">
                {medicineCount || 0}
              </div>
              <Link href="/inventory/medicines" className="text-[11px] text-teal-700 hover:underline flex items-center gap-1 font-medium">
                Manage Catalog &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Near Expiry / FEFO Alerts Card */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Near Expiry (&lt; 4mo)
              </CardTitle>
              <Activity className="w-4 h-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <span>{nearExpiryCount}</span>
                {expiredCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-semibold">
                    {expiredCount} expired
                  </span>
                )}
              </div>
              <Link href="/inventory/batches" className="text-[11px] text-amber-800 hover:underline flex items-center gap-1 font-medium">
                View FEFO Batches &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stock Receive Card */}
        <Card className="border-teal-200 bg-teal-50/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-teal-900">
                Stock Receiving
              </CardTitle>
              <Activity className="w-4 h-4 text-teal-700" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-[11px] text-teal-800">Receive supplier deliveries with Full, Partial, or Dube terms.</p>
              <Link href="/inventory/receive">
                <Button variant="primary" size="sm" className="w-full text-xs font-semibold">
                  Receive Stock
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-Specific Quick Actions */}
      {isAdmin ? (
        <div className="space-y-4">
          {/* Owner Daily Profit & Financial Summary Widget */}
          <Card className="border-teal-200 bg-gradient-to-br from-white via-teal-50/20 to-emerald-50/30 shadow-xs">
            <CardHeader className="pb-3 border-b border-teal-100/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-slate-900 font-bold">
                      Today&apos;s Estimated Profit & Sales
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Calculated from today&apos;s sold medicines minus batch purchase cost
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-xs font-bold">
                    {todaySalesCount} {todaySalesCount === 1 ? 'sale' : 'sales'} completed today
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Gross Sales */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5 text-teal-700" />
                    Today&apos;s Gross Sales
                  </span>
                  <div className="text-xl font-extrabold text-slate-900">
                    {todaySalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    <span className="text-xs font-semibold text-slate-500">ETB</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Total selling receipts</p>
                </div>

                {/* Estimated Cost */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-slate-600" />
                    Estimated Purchase Cost
                  </span>
                  <div className="text-xl font-extrabold text-slate-700">
                    {todayEstimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    <span className="text-xs font-semibold text-slate-500">ETB</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Wholesale cost of sold stock</p>
                </div>

                {/* Estimated Profit */}
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                      Estimated Gross Profit
                    </span>
                    {todaySalesRevenue > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                        {todayProfitMargin >= 0 ? '+' : ''}{todayProfitMargin.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-extrabold text-emerald-900">
                    {todayEstimatedProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    <span className="text-xs font-semibold text-emerald-700">ETB</span>
                  </div>
                  <p className="text-[10px] text-emerald-700">Selling Price &minus; Purchase Cost</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner View: Staff Management & Audit Trail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-teal-100 hover:border-teal-300 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-700" />
                <CardTitle className="text-base">Staff Account Management</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Create new pharmacist accounts, disable departed staff, or reset passwords.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/staff">
                <Button variant="primary" size="md" className="w-full sm:w-auto font-semibold text-xs">
                  Open Staff Directory
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200 hover:border-slate-300 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-700" />
                <CardTitle className="text-base">Security & Audit Trail</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Review immutable log of user logins, account alterations, and sensitive operations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/audit-logs">
                <Button variant="outline" size="md" className="w-full sm:w-auto font-semibold text-xs">
                  View Audit Logs
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          </div>
        </div>
      ) : (
        /* Pharmacist View: Daily Quick Actions */
        <Card className="border-teal-100">
          <CardHeader>
            <CardTitle className="text-base">Daily Dispensing Tasks</CardTitle>
            <CardDescription className="text-xs">
              Fast daily actions for your active shift. Each transaction is signed with your pharmacist ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Fast Operations Guide:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-500 pt-1">
                <li>Only one pharmacist shift can be open across the pharmacy at a time.</li>
                <li>Every dispensing sale and cash movement is linked directly to your account.</li>
                <li>Administrative functions and account changes require the Pharmacy Owner.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
