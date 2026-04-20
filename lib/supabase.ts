import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

// When env vars are missing we export null instead of passing `undefined!`
// into createClient — this prevents a broken client from throwing
// obscure errors deep inside request handlers. Callers must null-check.
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

if (!supabase) {
  console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — Supabase disabled");
}
