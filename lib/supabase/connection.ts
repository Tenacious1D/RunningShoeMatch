import "server-only";

import { getSupabasePublicCredentials } from "@/lib/supabase/config";

export type SupabaseConnectionStatus = {
  configurationPresent: boolean;
  databaseConnectionSuccessful: boolean;
};

function isSupabaseHealthResponse(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    value.name === "GoTrue"
  );
}

export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const credentials = getSupabasePublicCredentials();

  if (!credentials) {
    return {
      configurationPresent: false,
      databaseConnectionSuccessful: false,
    };
  }

  try {
    const healthUrl = new URL("/auth/v1/health", credentials.url);
    const response = await fetch(healthUrl, {
      cache: "no-store",
      headers: {
        apikey: credentials.publishableKey,
      },
      signal: AbortSignal.timeout(5_000),
    });
    const healthResponse: unknown = response.ok ? await response.json() : null;

    return {
      configurationPresent: true,
      databaseConnectionSuccessful:
        response.ok && isSupabaseHealthResponse(healthResponse),
    };
  } catch {
    return {
      configurationPresent: true,
      databaseConnectionSuccessful: false,
    };
  }
}