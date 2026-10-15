import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder-project') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')
  );

  let dbStatus = 'NOT_CONNECTED';
  let message = 'Supabase credentials are using placeholder values. Update .env.local to connect to your live project.';
  let latencyMs = 0;

  if (isSupabaseConfigured) {
    try {
      const start = Date.now();
      const supabase = await createClient();
      const { error } = await supabase.from('medicines').select('count', { count: 'exact', head: true });
      latencyMs = Date.now() - start;

      if (!error) {
        dbStatus = 'CONNECTED';
        message = 'Supabase database connection established successfully.';
      } else {
        dbStatus = 'ERROR';
        console.error('Health check database query error:', error.message);
        message = 'Database service unavailable or connection failed.';
      }
    } catch (err: unknown) {
      dbStatus = 'ERROR';
      console.error('Health check exception:', err);
      message = 'Database service unavailable or connection failed.';
    }
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    currency: 'ETB',
    supabase: {
      isConfigured: isSupabaseConfigured,
      connection: dbStatus,
      message,
      latencyMs,
    },
    system: {
      singleShiftConstraintEnforced: true,
      packUnitConversionReady: true,
      fefoReady: true,
    },
  });
}
