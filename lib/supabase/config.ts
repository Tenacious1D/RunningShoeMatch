import "server-only";

type SupabasePublicCredentials = {
  url: string;
  publishableKey: string;
};

type SupabasePrivilegedCredentials = {
  url: string;
  secretKey: string;
};

function readValue(value: string | undefined) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

export function getSupabasePublicCredentials(): SupabasePublicCredentials | null {
  const url = readValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = readValue(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function getSupabasePrivilegedCredentials(): SupabasePrivilegedCredentials | null {
  const url = readValue(process.env.SUPABASE_URL);
  const secretKey = readValue(process.env.SUPABASE_SECRET_KEY);

  if (!url || !secretKey) {
    return null;
  }

  return { url, secretKey };
}