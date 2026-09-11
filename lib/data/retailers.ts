import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { RetailerOffer } from "@/lib/data/types";
import { createPublicClient } from "@/lib/supabase/public";

type RetailerOfferRow = {
  id: string;
  affiliate_url: string;
  regular_url: string | null;
  displayed_price: number | null;
  currency: string;
  is_primary: boolean;
  last_verified_at: string | null;
  retailer: {
    name: string;
    slug: string;
  };
};

export async function getActiveRetailerOffersForShoe(
  shoeId: string,
): Promise<RetailerOffer[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("retailers", `shoe-retailers-${shoeId}`);

  const supabase = createPublicClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("shoe_retailer_links")
    .select(`
      id,
      affiliate_url,
      regular_url,
      displayed_price,
      currency,
      is_primary,
      last_verified_at,
      retailer:retailers!inner(name, slug)
    `)
    .eq("shoe_id", shoeId)
    .eq("active", true)
    .order("is_primary", { ascending: false })
    .order("displayed_price", { ascending: true, nullsFirst: false })
    .overrideTypes<RetailerOfferRow[], { merge: false }>();

  if (error) {
    throw new Error("Unable to load retailer availability from Supabase.", {
      cause: error,
    });
  }

  return data.map((row) => ({
    id: row.id,
    retailerName: row.retailer.name,
    retailerSlug: row.retailer.slug,
    affiliateUrl: row.affiliate_url,
    regularUrl: row.regular_url,
    displayedPrice: row.displayed_price,
    currency: row.currency,
    isPrimary: row.is_primary,
    lastVerifiedAt: row.last_verified_at,
  }));
}

