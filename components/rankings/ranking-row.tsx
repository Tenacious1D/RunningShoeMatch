import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { RankMovement } from "@/components/rankings/rank-movement";
import { RankingScore } from "@/components/rankings/ranking-score";
import { AffiliateRetailerButton } from "@/components/shoes/affiliate-retailer-button";
import { ShoeImage } from "@/components/shoes/shoe-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDataLabel } from "@/lib/data/formatters";
import type { RankingListItem } from "@/lib/data/types";

type RankingRowProps = {
  result: RankingListItem;
};

function RankingRow({ result }: RankingRowProps) {
  const shoeName = `${result.shoe.brandName} ${result.shoe.modelName}`;

  return (
    <li>
      <Card className="overflow-hidden">
        <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[5rem_minmax(0,1fr)_12rem] lg:items-center">
          <div className="flex items-center justify-between gap-4 lg:block">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-foreground text-xl font-bold tabular-nums text-background">
              #{result.rank}
            </div>
            <div className="text-right lg:mt-3 lg:text-left">
              <RankMovement movement={result.movement} />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-4">
              <ShoeImage
                src={result.shoe.imageUrl}
                alt={result.shoe.imageUrl ? shoeName : ""}
                className="h-20 w-24 shrink-0 rounded-md border border-border p-2"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {result.shoe.brandName}
                </p>
                <h2 className="mt-1 text-lg font-bold tracking-tight sm:text-xl">
                  <Link className="hover:text-primary" href={`/shoes/${result.shoe.slug}`}>
                    {result.shoe.modelName}
                  </Link>
                </h2>
                <Badge variant="neutral" className="mt-2">
                  {formatDataLabel(result.shoe.status)}
                </Badge>
              </div>
            </div>

            {result.componentScores.length ? (
              <dl className="mt-5 flex flex-wrap gap-2" aria-label="Component scores">
                {result.componentScores.slice(0, 4).map((component) => (
                  <div key={component.key} className="rounded-md border border-border bg-surface px-3 py-2">
                    <dt className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      {formatDataLabel(component.key)}
                    </dt>
                    <dd className="mt-0.5 text-sm font-bold tabular-nums">{component.score}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          <div className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <RankingScore score={result.score} />
            <div className="mt-5 grid gap-2">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={`/shoes/${result.shoe.slug}`}>
                  Shoe details
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
              {result.primaryRetailerOffer ? (
                <AffiliateRetailerButton
                  offer={result.primaryRetailerOffer}
                  className="w-full justify-between"
                />
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

export { RankingRow, type RankingRowProps };

