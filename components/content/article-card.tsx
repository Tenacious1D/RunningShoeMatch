import { ArrowRight, BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type ArticleCardProps = {
  category: string;
  title: string;
  description: string;
};

function ArticleCard({ category, title, description }: ArticleCardProps) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between gap-4">
          <Badge variant="neutral">{category}</Badge>
          <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h3 className="mt-5 text-xl font-bold tracking-tight">{title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          Guide coming soon
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}

export { ArticleCard, type ArticleCardProps };