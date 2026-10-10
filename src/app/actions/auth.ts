'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validations/auth';
import { recordAuditLog } from '@/lib/auth';

export interface ActionResponse {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function loginAction(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0].toString()] = err.message;
      }
    });
    return { error: 'Please check your input', fieldErrors };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return {
      error: 'Invalid email or password. Please verify your credentials.',
    };
  }

  // Verify account is active in profiles
  const { data: rawProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  const profile = rawProfile as unknown as import('@/types').Profile | null;

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return {
      error: 'User profile not found. Please contact the pharmacy owner.',
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    await recordAuditLog({
      tableName: 'profiles',
      recordId: profile.id,
      action: 'UPDATE',
      newData: { attempt: 'failed_login_deactivated_account', email },
      performedBy: profile.id,
    });
    return {
      error: 'Your account has been deactivated. Please contact the pharmacy owner.',
    };
  }

  // Record successful login in audit trail
  await recordAuditLog({
    tableName: 'profiles',
    recordId: profile.id,
    action: 'UPDATE',
    newData: { event: 'user_login', email, role: profile.role },
    performedBy: profile.id,
  });

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await recordAuditLog({
      tableName: 'profiles',
      recordId: user.id,
      action: 'UPDATE',
      newData: { event: 'user_logout' },
      performedBy: user.id,
    });
  }

  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
