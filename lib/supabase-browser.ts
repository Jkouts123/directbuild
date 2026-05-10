import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase browser client is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}

export function getSupabasePhotoBucket(): string {
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_PHOTO_BUCKET;

  if (!bucket) {
    throw new Error(
      "Supabase photo bucket is not configured. Add NEXT_PUBLIC_SUPABASE_PHOTO_BUCKET.",
    );
  }

  return bucket;
}
