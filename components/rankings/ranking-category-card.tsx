import { ArrowUpRight, BarChart3 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type RankingCategoryCardProps = {
  title: string;
  description: string | null;
  href: string;
  isDemo?: boolean;
};

function RankingCategoryCard({
  title,
  description,
  href,
  isDemo = false,
}: RankingCategoryCardProps) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="h-full transition-[border-color,box-shadow,transform] duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lifted">
        <CardContent className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <Badge variant={isDemo ? "outline" : "success"}>
              {isDemo ? "Demo category" : "Active"}
            </Badge>
          </div>
          <h3 className="mt-6 text-xl font-bold tracking-tight">{title}</h3>
          <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
            {description ?? "Published ranking snapshots for this running shoe category."}
          </p>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm font-semibold">
            <span className="text-muted-foreground">Versioned rankings</span>
            <span className="inline-flex items-center gap-1 text-primary">
              View rankings
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export { RankingCategoryCard, type RankingCategoryCardProps };
