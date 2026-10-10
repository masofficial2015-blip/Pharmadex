'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin, recordAuditLog } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { createPharmacistSchema, resetPasswordSchema } from '@/lib/validations/auth';

export interface StaffActionResponse {
  success?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Owner-only action to create a new Pharmacist account.
 * Uses the Supabase Admin API with secure password hashing.
 */
export async function createPharmacistAction(
  _prevState: StaffActionResponse | null,
  formData: FormData
): Promise<StaffActionResponse> {
  const admin = await requireAdmin();

  const rawData = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phoneNumber: formData.get('phoneNumber') || undefined,
    password: formData.get('password'),
  };

  const parsed = createPharmacistSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return { error: 'Please check form errors', fieldErrors };
  }

  const { fullName, email, phoneNumber, password } = parsed.data;
  const adminSupabase = createAdminClient();

  // Create user in Supabase Auth via Admin API
  const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'PHARMACIST',
    },
  });

  if (authError || !authUser.user) {
    return {
      error: authError?.message || 'Failed to create pharmacist auth user.',
    };
  }

  // Insert or update profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (adminSupabase.from('profiles') as any).upsert({
    id: authUser.user.id,
    full_name: fullName,
    role: 'PHARMACIST',
    phone_number: phoneNumber || null,
    is_active: true,
  });

  if (profileError) {
    // Roll back auth user if profile insertion failed
    await adminSupabase.auth.admin.deleteUser(authUser.user.id);
    return {
      error: `Failed to create pharmacist profile: ${profileError.message}`,
    };
  }

  // Record audit log
  await recordAuditLog({
    tableName: 'profiles',
    recordId: authUser.user.id,
    action: 'INSERT',
    newData: {
      full_name: fullName,
      email,
      role: 'PHARMACIST',
      phone_number: phoneNumber || null,
      is_active: true,
    },
    performedBy: admin.userId,
  });

  revalidatePath('/admin/staff');
  revalidatePath('/admin/audit-logs');
  return {
    success: true,
    message: `Pharmacist account for ${fullName} (${email}) created successfully.`,
  };
}

/**
 * Owner-only action to toggle a pharmacist's account active status.
 */
export async function toggleStaffStatusAction(
  userId: string,
  newStatus: boolean
): Promise<StaffActionResponse> {
  const admin = await requireAdmin();

  if (userId === admin.userId) {
    return { error: 'You cannot deactivate your own Owner account.' };
  }

  const adminSupabase = createAdminClient();

  // Fetch current profile to record in audit log
  const { data: rawExisting, error: fetchError } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const existingProfile = rawExisting as unknown as import('@/types').Profile | null;

  if (fetchError || !existingProfile) {
    return { error: 'Staff member not found.' };
  }

  // Update profile status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (adminSupabase.from('profiles') as any)
    .update({ is_active: newStatus })
    .eq('id', userId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Update ban status in Supabase Auth
  // If deactivating, ban user for 100 years. If activating, lift ban (duration 'none')
  await adminSupabase.auth.admin.updateUserById(userId, {
    ban_duration: newStatus ? 'none' : '876000h',
  });

  // Record audit log
  await recordAuditLog({
    tableName: 'profiles',
    recordId: userId,
    action: 'UPDATE',
    oldData: { is_active: existingProfile.is_active },
    newData: { is_active: newStatus, reason: newStatus ? 'account_activated' : 'account_deactivated' },
    performedBy: admin.userId,
  });

  revalidatePath('/admin/staff');
  revalidatePath('/admin/audit-logs');
  return {
    success: true,
    message: `Account status updated to ${newStatus ? 'Active' : 'Disabled'}.`,
  };
}

/**
 * Owner-only action to reset a pharmacist's password.
 */
export async function resetStaffPasswordAction(
  userId: string,
  newPassword: string
): Promise<StaffActionResponse> {
  const admin = await requireAdmin();

  const parsed = resetPasswordSchema.safeParse({ userId, newPassword });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid password.' };
  }

  const adminSupabase = createAdminClient();

  // Check target user
  const { data: rawTarget, error: fetchError } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const targetProfile = rawTarget as unknown as import('@/types').Profile | null;

  if (fetchError || !targetProfile) {
    return { error: 'Staff member not found.' };
  }

  // Update password in Supabase Auth
  const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (authError) {
    return { error: authError.message };
  }

  // Record audit log (excluding plaintext password for security)
  await recordAuditLog({
    tableName: 'profiles',
    recordId: userId,
    action: 'UPDATE',
    newData: { event: 'password_reset_by_owner', target_user: targetProfile.full_name },
    performedBy: admin.userId,
  });

  revalidatePath('/admin/staff');
  revalidatePath('/admin/audit-logs');
  return {
    success: true,
    message: `Password for ${targetProfile.full_name} has been updated successfully.`,
  };
}
