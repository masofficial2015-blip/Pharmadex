import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { AuditLogList, type AuditRecord } from '@/components/admin/audit-log-list';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Security & Audit Trail | Pharmadex',
  description: 'Human-readable immutable ledger of staff actions, completed sales, and pharmacy security events',
};

export default async function AdminAuditLogsPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch recent audit logs with performer details (up to 100 recent events)
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      performed_by,
      ip_address,
      created_at,
      performer:profiles!audit_logs_performed_by_fkey(full_name, role)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  const auditLogs = (logs as unknown as AuditRecord[]) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Security & System Audit Trail
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Concise, human-readable records of staff sign-ins, sales completions, customer notes, and sensitive operations.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          Failed to load audit logs: {error.message}
        </div>
      )}

      {/* Interactive Audit Logs List */}
      <AuditLogList initialLogs={auditLogs} />
    </div>
  );
}
