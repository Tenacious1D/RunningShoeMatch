import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AdminIdentity = {
  id: string;
  email: string | null;
};

/**
 * Verifies both Supabase authentication and explicit admin membership.
 * Keep this check close to every protected server data boundary; UI visibility
 * is never treated as authorization.
 */
export const requireAdmin = cache(async function requireAdmin() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  if (claimsError || !userId) redirect("/admin/login");

  const { data: membership, error: membershipError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Unable to verify administrator membership: ${membershipError.message}`);
  }

  if (!membership) redirect("/admin/login");

  return {
    supabase,
    user: {
      id: userId,
      email: typeof claims?.email === "string" ? claims.email : null,
    } satisfies AdminIdentity,
  };
});
