import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = rawUrl
  ? rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : undefined;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl && 
  (supabaseServiceKey || supabaseAnonKey) && 
  supabaseUrl.startsWith('http') && 
  !supabaseUrl.includes('your-project')
);

/**
 * Returns a Supabase client with elevated server privileges if service key is set,
 * or standard anon key otherwise.
 */
export function createServerClient() {
  if (!isServerSupabaseConfigured) {
    return null;
  }

  const key = supabaseServiceKey || supabaseAnonKey!;
  return createClient(supabaseUrl!, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
