import { ArrowRight, BookOpen, Clock3 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/data/formatters";

type ArticleCardProps = {
  category: string;
  title: string;
  description: string;
  href: string;
  publishedDate: string;
  readingTimeMinutes: number;
};

function ArticleCard({
  category,
  title,
  description,
  href,
  publishedDate,
  readingTimeMinutes,
}: ArticleCardProps) {
  return (
    <Card className="group relative h-full transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lifted">
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between gap-4">
          <Badge variant="neutral">{category}</Badge>
          <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h3 className="mt-5 text-xl font-bold tracking-tight">
          <Link
            href={href}
            className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">{formatDate(publishedDate)}</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            {readingTimeMinutes} min read
          </span>
        </div>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
          Read guide
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

export { ArticleCard, type ArticleCardProps };
