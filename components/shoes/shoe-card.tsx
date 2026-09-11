import { ArrowUpRight, Footprints } from "lucide-react";
import Link from "next/link";

import { ShoeScore } from "@/components/shoes/shoe-score";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

type ShoeSpec = {
  label: string;
  value: string;
};

type ShoeCardProps = {
  brand: string;
  name: string;
  category: string;
  score?: number;
  tags?: string[];
  specs?: ShoeSpec[];
  href?: string;
};

function ShoeCard({
  brand,
  name,
  category,
  score,
  tags = [],
  specs = [],
  href,
}: ShoeCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lifted">
      <div className="flex aspect-[16/9] items-center justify-center border-b border-border bg-surface text-muted-foreground">
        <div className="flex flex-col items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
          <Footprints className="h-7 w-7 text-primary" aria-hidden="true" />
          Shoe image
        </div>
      </div>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{category}</Badge>
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="neutral">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="pt-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{brand}</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight">{name}</h3>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-5">
        {typeof score === "number" ? (
          <ShoeScore score={score} compact />
        ) : (
          <div className="rounded-md border border-dashed border-border bg-surface px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Score pending</p>
            <p className="mt-1 text-sm text-muted-foreground">Structured shoe data will populate this profile.</p>
          </div>
        )}
        {specs.length ? (
          <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
            {specs.slice(0, 3).map((spec) => (
              <div key={spec.label}>
                <dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">{spec.label}</dt>
                <dd className="mt-1 text-sm font-semibold tabular-nums">{spec.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </CardContent>
      <CardFooter>
        {href ? (
          <Button asChild variant="outline" className="w-full justify-between">
            <Link href={href}>
              View shoe
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Shoe profile coming soon
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export { ShoeCard, type ShoeCardProps, type ShoeSpec };