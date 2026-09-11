import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { ShoeImage } from "@/components/shoes/shoe-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatCurrency, formatDataLabel, getDisplaySpecifications } from "@/lib/data/formatters";
import type { ShoeSummary } from "@/lib/data/types";

type ShoeCardProps = {
  shoe: ShoeSummary;
};

function ShoeCard({ shoe }: ShoeCardProps) {
  const specifications = getDisplaySpecifications(shoe.specs).slice(0, 3);
  const attributeBadges = [shoe.specs.surface, shoe.specs.support]
    .filter((value): value is string => typeof value === "string")
    .map(formatDataLabel);
  const shoeName = `${shoe.brandName} ${shoe.modelName}`;

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lifted">
      <ShoeImage
        src={shoe.imageUrl}
        alt={shoe.imageUrl ? shoeName : ""}
        className="aspect-[16/9] border-b border-border p-6"
      />
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={shoe.status === "active" ? "success" : "neutral"}>
            {formatDataLabel(shoe.status)}
          </Badge>
          {attributeBadges.map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{shoe.brandName}</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight">{shoe.modelName}</h3>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">MSRP</p>
          <p className="mt-1 text-lg font-bold tabular-nums">
            {shoe.msrp === null
              ? "Price unavailable"
              : formatCurrency(shoe.msrp, shoe.currency, { maximumFractionDigits: 0 })}
          </p>
        </div>
        {shoe.shortDescription ? (
          <p className="text-sm leading-6 text-muted-foreground">{shoe.shortDescription}</p>
        ) : null}
        {specifications.length ? (
          <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
            {specifications.map((spec) => (
              <div key={spec.key}>
                <dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">{spec.label}</dt>
                <dd className="mt-1 text-sm font-semibold tabular-nums">{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full justify-between">
          <Link href={`/shoes/${shoe.slug}`}>
            View shoe
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export { ShoeCard, type ShoeCardProps };
