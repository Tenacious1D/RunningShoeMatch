"use client";

import { useRef } from "react";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";

import { AffiliateRetailerButton } from "@/components/shoes/affiliate-retailer-button";
import { ShoeImage } from "@/components/shoes/shoe-image";
import { ShoeScore } from "@/components/shoes/shoe-score";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RetailerOffer, ShoeSummary } from "@/lib/data/types";

type ShoeRecommendationModalProps = {
  shoe: ShoeSummary;
  explanation: string;
  retailerOffers: RetailerOffer[];
  alternatives?: ShoeSummary[];
  matchScore?: number;
  triggerLabel?: string;
};

function ShoeRecommendationModal({
  shoe,
  explanation,
  retailerOffers,
  alternatives = [],
  matchScore,
  triggerLabel = "Preview recommendation",
}: ShoeRecommendationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const shoeName = `${shoe.brandName} ${shoe.modelName}`;

  return (
    <>
      <Button type="button" onClick={() => dialogRef.current?.showModal()}>
        {triggerLabel}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="recommendation-title"
        aria-describedby="recommendation-explanation"
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto rounded-xl border border-border bg-card p-0 text-card-foreground shadow-lifted backdrop:bg-foreground/70 backdrop:backdrop-blur-sm"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur sm:px-6">
          <Badge variant="success">Recommendation preview</Badge>
          <form method="dialog">
            <Button type="submit" variant="ghost" size="icon" aria-label="Close recommendation">
              <X aria-hidden="true" />
            </Button>
          </form>
        </div>

        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[0.85fr_1.15fr] lg:p-8">
          <ShoeImage
            src={shoe.imageUrl}
            alt={shoe.imageUrl ? shoeName : ""}
            className="aspect-square rounded-lg border border-border p-8"
          />

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {shoe.brandName}
            </p>
            <h2 id="recommendation-title" className="mt-2 text-3xl font-bold tracking-tight">
              {shoe.modelName}
            </h2>
            {typeof matchScore === "number" ? (
              <ShoeScore
                score={matchScore}
                label="Future match score"
                className="mt-6"
              />
            ) : null}
            <p id="recommendation-explanation" className="mt-6 leading-7 text-muted-foreground">
              {explanation}
            </p>

            <div className="mt-7 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em]">
                Retailer options
              </h3>
              {retailerOffers.length ? (
                <div className="grid gap-2">
                  {retailerOffers.map((offer) => (
                    <AffiliateRetailerButton
                      key={offer.id}
                      offer={offer}
                      className="w-full justify-between"
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">
                  No retailer links are currently available for this shoe.
                </p>
              )}
              <p className="text-xs leading-5 text-muted-foreground">
                Running Shoe Match may earn a commission when you purchase through links on this site.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-surface p-5 sm:p-7 lg:p-8">
          <h3 className="text-lg font-bold tracking-tight">Alternative shoes</h3>
          {alternatives.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {alternatives.map((alternative) => (
                <Link
                  key={alternative.id}
                  href={`/shoes/${alternative.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-md border border-border bg-card p-4 transition-colors hover:border-primary/35"
                >
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {alternative.brandName}
                    </span>
                    <span className="mt-1 block font-bold">{alternative.modelName}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Alternative matches will appear here when they are available.
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}

export { ShoeRecommendationModal, type ShoeRecommendationModalProps };

