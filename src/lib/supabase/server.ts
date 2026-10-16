import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
