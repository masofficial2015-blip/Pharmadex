import { cache } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Profile, AuditAction } from '@/types';

export interface AuthContext {
  userId: string;
  email: string;
  profile: Profile;
}

/**
 * Retrieve the current authenticated user and their active profile.
 * Memoized per server render request via React cache() to prevent redundant DB calls.
 * Returns null if not authenticated or profile is missing.
 */
export const getCurrentUser = cache(async (): Promise<AuthContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: rawProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = rawProfile as unknown as Profile | null;

  if (profileError || !profile) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email || '',
    profile,
  };
});

/**
 * Asserts that a user is authenticated and their account is active.
 * Redirects to /login if unauthenticated or deactivated.
 */
export async function requireUser(): Promise<AuthContext> {
  const auth = await getCurrentUser();

  if (!auth) {
    redirect('/login');
  }

  if (!auth.profile.is_active) {
    redirect('/login?error=account_disabled');
  }

  return auth;
}

/**
 * Asserts that the authenticated user is an active Owner/Admin.
 * Redirects to /unauthorized if the user is a Pharmacist, or /login if unauthenticated.
 */
export async function requireAdmin(): Promise<AuthContext> {
  const auth = await requireUser();

  if (auth.profile.role !== 'ADMIN') {
    redirect('/unauthorized');
  }

  return auth;
}

/**
 * Record an entry into the system-wide audit_logs table.
 */
export async function recordAuditLog(params: {
  tableName: string;
  recordId?: string | null;
  action: AuditAction;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  performedBy?: string | null;
}) {
  try {
    const adminSupabase = createAdminClient();
    const headerList = await headers();
    const ipAddress =
      headerList.get('x-forwarded-for')?.split(',')[0].trim() ||
      headerList.get('x-real-ip') ||
      'unknown';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminSupabase.from('audit_logs') as any).insert({
      table_name: params.tableName,
      record_id: params.recordId || null,
      action: params.action,
      old_data: (params.oldData as import('@/types').Json) || null,
      new_data: (params.newData as import('@/types').Json) || null,
      performed_by: params.performedBy || null,
      ip_address: ipAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
