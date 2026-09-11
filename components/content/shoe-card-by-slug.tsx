import Link from "next/link";

import { AffiliateRetailerButton } from "@/components/shoes/affiliate-retailer-button";
import { ShoeCard } from "@/components/shoes/shoe-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getShoeBySlug } from "@/lib/data/shoes";

type ShoeCardBySlugProps = {
  slug: string;
};

async function ShoeCardBySlug({ slug }: ShoeCardBySlugProps) {
  const shoe = await getShoeBySlug(slug);

  if (!shoe) {
    return (
      <Card className="not-prose my-8 border-dashed">
        <CardContent className="p-6">
          <p className="font-bold">Shoe data is not currently available.</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This article references <code>{slug}</code>. The profile may be unpublished or the database may not be configured.
          </p>
          <Link href="/shoes" className={`${buttonVariants({ variant: "outline" })} mt-5`}>Browse available shoes</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="not-prose my-10" aria-label={`Current data for ${shoe.brandName} ${shoe.modelName}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Live shoe profile</p>
          <p className="mt-1 text-sm text-muted-foreground">Specifications, pricing, and links are loaded from the current database record.</p>
        </div>
        {process.env.NODE_ENV === "development" && shoe.shortDescription?.includes("DEVELOPMENT/DEMO") ? <Badge variant="outline">Demo data</Badge> : null}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <ShoeCard shoe={shoe} />
        <Card>
          <CardContent className="p-5 sm:p-6">
            <h3 className="text-lg font-bold tracking-tight">Current retailer options</h3>
            {shoe.retailerOffers.length ? (
              <div className="mt-4 flex flex-col gap-3">
                {shoe.retailerOffers.map((offer) => <AffiliateRetailerButton key={offer.id} offer={offer} className="w-full justify-between" />)}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">No active retailer links are available for this shoe.</p>
            )}
            <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">Affiliate links update from the shoe database; they are not stored in this article.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export { ShoeCardBySlug, type ShoeCardBySlugProps };
