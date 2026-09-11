import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/data/formatters";
import type { RetailerOffer } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type AffiliateRetailerButtonProps = {
  offer: RetailerOffer;
  className?: string;
};

function AffiliateRetailerButton({
  offer,
  className,
}: AffiliateRetailerButtonProps) {
  return (
    <Button
      asChild
      variant={offer.isPrimary ? "default" : "outline"}
      className={cn("h-auto min-h-10 whitespace-normal py-2 text-left", className)}
    >
      <a
        href={offer.affiliateUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
      >
        <span>View at {offer.retailerName}</span>
        {offer.displayedPrice === null ? null : (
          <span className="tabular-nums">
            {formatCurrency(offer.displayedPrice, offer.currency)}
          </span>
        )}
        <ExternalLink aria-hidden="true" />
      </a>
    </Button>
  );
}

export { AffiliateRetailerButton, type AffiliateRetailerButtonProps };
