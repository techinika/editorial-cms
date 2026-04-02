import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = process.env.NEXT_PUBLIC_PROJECT_URL || process.env.PROJECT_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY;
export const serviceKey = process.env.NEXT_PUBLIC_SERVICE_KEY || process.env.SERVICE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

const getSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not set - using mock client");
    return createClient("https://placeholder.supabase.co", "placeholder");
  }
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
};

const getSupabaseAdmin = () => {
  if (!supabaseUrl || !serviceKey) {
    console.warn("Supabase service key not set - using mock client");
    return createClient("https://placeholder.supabase.co", "placeholder");
  }
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, serviceKey);
  }
  return supabaseAdmin;
};

export default getSupabase();
export const supabaseAdminClient = getSupabaseAdmin();
