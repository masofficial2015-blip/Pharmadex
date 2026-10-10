import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { ShieldCheck, User, Globe, Clock, History } from 'lucide-react';

interface AuditRecord {
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

export default async function AdminAuditLogsPage() {
  await requireAdmin();
  const supabase = await createClient();

  // Fetch recent audit logs with performer details
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
    .limit(50);

  const auditLogs = (logs as unknown as AuditRecord[]) || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-700" />
          Security & Audit Trail
        </h2>
        <p className="text-xs text-slate-500">
          Immutable ledger of staff logins, account modifications, and sensitive pharmacy events.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          Failed to load audit logs: {error.message}
        </div>
      )}

      {/* Logs Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">Recent System Events</CardTitle>
            <CardDescription className="text-xs">
              Showing the latest {auditLogs.length} recorded operations.
            </CardDescription>
          </div>
          <Badge variant="neutral">{auditLogs.length} Records</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <History className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No Audit Events Recorded Yet</p>
              <p className="text-xs text-slate-500">
                Staff logins, account creation, and sensitive security updates will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => {
                const actionBadgeVariant =
                  log.action === 'INSERT'
                    ? 'success'
                    : log.action === 'DELETE' || log.action === 'CANCEL'
                    ? 'danger'
                    : 'default';

                return (
                  <div key={log.id} className="p-4 sm:px-6 hover:bg-slate-50/70 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={actionBadgeVariant}>{log.action}</Badge>
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {log.table_name}
                        </span>
                        {log.performer && (
                          <span className="text-xs font-medium text-slate-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {log.performer.full_name} ({log.performer.role})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {log.ip_address && (
                          <span className="flex items-center gap-1 font-mono">
                            <Globe className="w-3 h-3" />
                            {log.ip_address}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Payload Details */}
                    {log.new_data && (
                      <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-slate-600 overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.new_data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
