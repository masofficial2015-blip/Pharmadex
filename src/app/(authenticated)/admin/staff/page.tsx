import React from 'react';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { StaffTable } from '@/components/auth/staff-table';
import type { Profile } from '@/types';

export default async function AdminStaffPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();

  // Fetch all staff profiles
  const { data: staffList, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
        Failed to load staff profiles: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StaffTable
        currentUserId={admin.userId}
        staffList={(staffList as Profile[]) || []}
      />
    </div>
  );
}
