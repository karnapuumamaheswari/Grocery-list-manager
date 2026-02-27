import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (
  !supabaseUrl ||
  !supabaseAnonKey ||
  !supabaseServiceRoleKey ||
  supabaseAnonKey.includes("YOUR_ANON_KEY") ||
  supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY") ||
  supabaseServiceRoleKey.includes("YOUR_SERVICE_ROLE_KEY") ||
  supabaseServiceRoleKey.includes("YOUR_SUPABASE_SERVICE_ROLE_KEY") ||
  supabaseServiceRoleKey.includes("PASTE_SERVICE_ROLE_KEY_HERE")
) {
  throw new Error(
    "Missing/invalid Supabase environment variables. Set real SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.",
  );
}

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
