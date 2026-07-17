import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.NEXT_PUBLIC_PROJECT_URL || process.env.PROJECT_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY;
const serviceKey = process.env.SERVICE_KEY;

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Anon client - safe for client-side use (respects RLS)
export const getSupabase = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not set - using mock client");
    return createClient("https://placeholder.supabase.co", "placeholder");
  }
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
};

// Admin client - server-side only (bypasses RLS). Never export to client components.
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseUrl || !serviceKey) {
    console.warn("Supabase service key not set - using mock client");
    return createClient("https://placeholder.supabase.co", "placeholder");
  }
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, serviceKey);
  }
  return _supabaseAdmin;
};

// Default export for client components (anon key)
export default getSupabase();

// Lazy admin client - only instantiated when first accessed on the server.
// Do NOT import this in client components — it will leak the service key.
let _supabaseAdminExport: SupabaseClient | null = null;
export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!_supabaseAdminExport) {
    _supabaseAdminExport = getSupabaseAdmin();
  }
  return _supabaseAdminExport;
};

// Backward-compat proxy: accessing supabaseAdminClient.xxx lazily creates the client.
// This keeps all existing module imports working without changes.
export const supabaseAdminClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdminClient() as any)[prop];
  },
});
