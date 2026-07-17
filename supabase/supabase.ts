import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_PROJECT_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_API_KEY;
const serviceKey = process.env.SERVICE_KEY;

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

// Anon client - safe for client-side use (respects RLS)
export const getSupabase = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase] NEXT_PUBLIC_PROJECT_URL or NEXT_PUBLIC_API_KEY is missing!");
    console.error("[Supabase] supabaseUrl =", supabaseUrl);
    console.error("[Supabase] supabaseAnonKey =", supabaseAnonKey ? "set" : "MISSING");
    throw new Error(
      "Supabase env vars not set. Check NEXT_PUBLIC_PROJECT_URL and NEXT_PUBLIC_API_KEY in .env"
    );
  }
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
};

// Admin client - server-side only (bypasses RLS). Never export to client components.
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseUrl || !serviceKey) {
    console.error("[Supabase Admin] NEXT_PUBLIC_PROJECT_URL or SERVICE_KEY is missing!");
    console.error("[Supabase Admin] supabaseUrl =", supabaseUrl);
    console.error("[Supabase Admin] serviceKey =", serviceKey ? "set" : "MISSING");
    throw new Error(
      "Supabase admin env vars not set. Check NEXT_PUBLIC_PROJECT_URL and SERVICE_KEY in .env"
    );
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
