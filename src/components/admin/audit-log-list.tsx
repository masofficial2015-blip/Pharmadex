'use client';

import React, { useState, useDeferredValue, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  User,
  Clock,
  Globe,
  ShoppingBag,
  Package,
  Layers,
  KeyRound,
  FileText,
  ChevronDown,
  ChevronUp,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

export interface AuditRecord {
  id: string;
  table_name: string;
  record_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'CANCEL' | 'AUTHORIZE';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  performed_by: string | null;
  ip_address: string | null;
  created_at: string;
  performer?: {
    full_name: string;
    role: string;
  } | null;
}

interface AuditLogListProps {
  initialLogs: AuditRecord[];
}

export function AuditLogList({ initialLogs }: AuditLogListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [expandedJsonId, setExpandedJsonId] = useState<string | null>(null);

  // React 19 deferred value keeps mobile search typing fluid
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Humanize event into plain, non-technical English
  function humanizeEvent(log: AuditRecord) {
    const data = log.new_data || log.old_data || {};
    const event = (data.event as string) || '';

    // Auth events
    if (event === 'USER_LOGIN') {
      return {
        category: 'AUTH',
        icon: KeyRound,
        iconBg: 'bg-teal-50 text-teal-700 border-teal-200',
        title: 'Staff Sign In',
        summary: `${data.full_name || 'User'} (${data.role || 'Staff'}) successfully logged in.`,
        note: null,
      };
    }
    if (event === 'USER_LOGOUT') {
      return {
        category: 'AUTH',
        icon: KeyRound,
        iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
        title: 'Staff Sign Out',
        summary: `${data.full_name || 'User'} logged out of the session.`,
        note: null,
      };
    }
    if (event === 'USER_REGISTERED') {
      return {
        category: 'STAFF',
        icon: User,
        iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
        title: 'New Staff Registered',
        summary: `Created account for ${data.full_name} with role ${data.role}.`,
        note: null,
      };
    }

    // Sales events
    if (log.table_name === 'sales') {
      const receipt = (data.receipt_number as string) || '';
      const amount = data.total_amount ? Number(data.total_amount).toLocaleString() : '0';
      const method = (data.payment_method as string) || 'CASH';
      const itemsCount = data.items_count ? `${data.items_count} items` : '';
      const customerNote = (data.customer_name as string) || (data.notes as string) || '';

      return {
        category: 'SALES',
        icon: ShoppingBag,
        iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        title: `Sale Completed #${receipt}`,
        summary: `Sold ${itemsCount} for ${amount} ETB via ${method}. Cashier: ${data.cashier || log.performer?.full_name || 'Staff'}.`,
        note: customerNote ? `Customer / Notes: "${customerNote}"` : null,
      };
    }

    // Staff Profile changes
    if (log.table_name === 'profiles') {
      const name = (data.full_name as string) || 'Staff account';
      const role = (data.role as string) || '';
      const reason = (data.reason as string) || '';

      return {
        category: 'STAFF',
        icon: User,
        iconBg: 'bg-purple-50 text-purple-700 border-purple-200',
        title: log.action === 'INSERT' ? 'Staff Account Created' : 'Staff Profile Updated',
        summary: `${name} ${role ? `(${role})` : ''} - ${reason || 'profile settings updated.'}`,
        note: null,
      };
    }

    // Stock receipts
    if (log.table_name === 'stock_receipts') {
      return {
        category: 'STOCK',
        icon: Package,
        iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
        title: 'Supplier Delivery Received',
        summary: `Received stock shipment. Invoice: ${data.invoice_number || 'N/A'}. Total: ${data.total_cost || 0} ETB.`,
        note: (data.notes as string) || null,
      };
    }

    // Stock movements / Inventory
    if (log.table_name === 'batches' || log.table_name === 'stock_movements') {
      return {
        category: 'STOCK',
        icon: Layers,
        iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        title: 'Inventory Adjustment',
        summary: `Stock updated for batch #${data.batch_number || log.record_id || ''}.`,
        note: (data.notes as string) || null,
      };
    }

    // Fallback
    return {
      category: 'OTHER',
      icon: Activity,
      iconBg: 'bg-slate-50 text-slate-700 border-slate-200',
      title: `${log.action} on ${log.table_name}`,
      summary: `Action ${log.action} recorded on ${log.table_name}.`,
      note: null,
    };
  }

  // Filter logs memoized with deferred search query
  const filteredLogs = useMemo(() => {
    const q = deferredSearchQuery.toLowerCase().trim();
    return initialLogs.filter((log) => {
      const info = humanizeEvent(log);

      // Category filter
      if (categoryFilter !== 'ALL' && info.category !== categoryFilter) {
        return false;
      }

      // Text search
      if (!q) return true;

      const performer = log.performer?.full_name?.toLowerCase() || '';
      const title = info.title.toLowerCase();
      const summary = info.summary.toLowerCase();
      const note = (info.note || '').toLowerCase();
      const ip = (log.ip_address || '').toLowerCase();

      return (
        performer.includes(q) ||
        title.includes(q) ||
        summary.includes(q) ||
        note.includes(q) ||
        ip.includes(q)
      );
    });
  }, [initialLogs, deferredSearchQuery, categoryFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Action Filter Chips */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff, sale, customer, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all shadow-2xs"
          />
        </div>

        {/* Filter Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'AUTH', label: 'Logins & Auth' },
            { id: 'SALES', label: 'Sales Receipts' },
            { id: 'STAFF', label: 'Staff Accounts' },
            { id: 'STOCK', label: 'Inventory & Stock' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat.id
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {filteredLogs.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No Events Match Your Filter</p>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? `No audit events found for "${searchQuery}".`
              : 'Try selecting a different filter category above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const info = humanizeEvent(log);
            const Icon = info.icon;
            const isJsonExpanded = expandedJsonId === log.id;

            return (
              <div
                key={log.id}
                className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs space-y-2.5"
              >
                {/* Header: Icon, Title, Action, Performer & Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${info.iconBg}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {info.title}
                        </h4>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.table_name}
                        </span>
                      </div>
                      {log.performer && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>
                            {log.performer.full_name} ({log.performer.role})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamp & IP */}
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono self-start sm:self-center">
                    {log.ip_address && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Globe className="w-3 h-3 text-slate-300" />
                        {log.ip_address}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                </div>

                {/* Plain-English Summary Description */}
                <div className="text-xs text-slate-700 break-words whitespace-normal leading-relaxed pl-12 sm:pl-12">
                  {info.summary}
                </div>

                {/* Prominent Notes / Customer Details (Fully Visible on Mobile) */}
                {info.note && (
                  <div className="ml-12 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-950 break-words whitespace-normal leading-relaxed font-medium">
                    {info.note}
                  </div>
                )}

                {/* Collapsible Technical Details (Optional) */}
                <div className="ml-12 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setExpandedJsonId(isJsonExpanded ? null : log.id)}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span>{isJsonExpanded ? 'Hide technical data' : 'View raw details'}</span>
                    {isJsonExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isJsonExpanded && (
                    <div className="mt-2 text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-slate-600 overflow-x-auto">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(log.new_data || log.old_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
