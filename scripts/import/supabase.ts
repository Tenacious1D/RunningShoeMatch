import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnvironment } from "dotenv";

export function createImportClient(): SupabaseClient {
  loadEnvironment({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });

  const url = process.env.SUPABASE_URL?.trim();
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();

  if (!url || !secretKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local for database imports.");
  }

  if (url.includes("YOUR_PROJECT_REF") || secretKey.includes("REPLACE_ME")) {
    throw new Error("Replace the Supabase import placeholders in .env.local before running an import.");
  }

  if (secretKey.startsWith("sb_publishable_") || secretKey === process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()) {
    throw new Error("SUPABASE_SECRET_KEY contains a publishable key. Use the server-only Supabase secret key for imports.");
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function chunks<T>(items: T[], size = 200): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
