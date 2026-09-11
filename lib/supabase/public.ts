import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicCredentials } from "@/lib/supabase/config";

/**
 * Creates an anonymous, server-only client for public catalog reads.
 *
 * This client intentionally has no cookie-backed user session. Public rows are
 * still limited by the anon role's grants and Row Level Security policies.
 */
export function createPublicClient() {
  const credentials = getSupabasePublicCredentials();

  if (!credentials) {
    return null;
  }

  return createSupabaseClient(credentials.url, credentials.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

