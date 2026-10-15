import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local manually if dotenv is not installed
const envPath = path.resolve(process.cwd(), '.env.local');
const envVars = {};

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length > 0) {
        envVars[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Please configure .env.local with your Supabase credentials first.');
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';
const email = process.argv[2] || process.env.SEED_ADMIN_EMAIL || (isProduction ? null : 'owner@pharmadex.et');
const password = process.argv[3] || process.env.SEED_ADMIN_PASSWORD || (isProduction ? null : 'Owner@Pharmadex2026!');
const fullName = process.argv[4] || process.env.SEED_ADMIN_NAME || 'Pharmacy Owner (Admin)';

if (!email || !password) {
  console.error('❌ Security Error: In production, explicit admin credentials must be provided via CLI arguments or SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD environment variables.');
  console.error('Usage: node scripts/seed-admin.mjs <email> <password> "<fullName>"');
  process.exit(1);
}

async function seedAdmin() {
  console.log(`🚀 Bootstrapping Owner Account for Pharmadex...`);
  console.log(`Email: ${email}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if user already exists
  const { data: userList } = await supabase.auth.admin.listUsers();
  const existingUser = userList?.users?.find((u) => u.email === email);

  let userId;

  if (existingUser) {
    console.log(`ℹ️ Auth user already exists (${existingUser.id}). Updating password and metadata...`);
    userId = existingUser.id;
    await supabase.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { full_name: fullName, role: 'ADMIN' },
    });
  } else {
    console.log(`Creating new Supabase Auth user...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'ADMIN' },
    });

    if (createError) {
      console.error(`❌ Failed to create auth user:`, createError);
      if (createError.cause) console.error(`Cause:`, createError.cause);
      process.exit(1);
    }
    userId = newUser.user.id;
  }

  // Upsert profile as ADMIN
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: fullName,
    role: 'ADMIN',
    phone_number: '+251 91 100 0000',
    is_active: true,
  });

  if (profileError) {
    console.error(`❌ Failed to upsert admin profile:`, profileError.message);
    process.exit(1);
  }

  // Record audit log
  await supabase.from('audit_logs').insert({
    table_name: 'profiles',
    record_id: userId,
    action: 'INSERT',
    new_data: { event: 'owner_bootstrapped', email, role: 'ADMIN' },
  });

  console.log(`✅ Pharmacy Owner account ready!`);
  console.log(`-----------------------------------------------`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     ADMIN`);
  console.log(`-----------------------------------------------`);
}

seedAdmin().catch(console.error);
