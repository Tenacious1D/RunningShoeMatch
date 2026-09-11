import { Footprints } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type RankingResultRowProps = {
  position?: number;
  brand?: string;
  name?: string;
  score?: number;
  summary?: string;
};

function RankingResultRow({
  position,
  brand,
  name,
  score,
  summary,
}: RankingResultRowProps) {
  const hasResult = Boolean(brand && name && typeof position === "number");

  return (
    <Card>
      <CardContent className="grid gap-5 p-5 sm:grid-cols-[4rem_1fr_auto] sm:items-center sm:p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-surface font-bold tabular-nums text-muted-foreground">
          {hasResult ? `#${position}` : "—"}
        </div>
        <div className="flex min-w-0 items-center gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-primary sm:flex">
            <Footprints className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {brand ?? "Awaiting published data"}
            </p>
            <h3 className="mt-1 font-bold tracking-tight">{name ?? "Shoe result placeholder"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary ?? "A ranked shoe and its supporting explanation will appear here after publication."}
            </p>
          </div>
        </div>
        <div className="sm:text-right">
          {typeof score === "number" ? (
            <p className="text-xl font-bold tabular-nums">{Math.round(score)}<span className="text-xs text-muted-foreground">/100</span></p>
          ) : (
            <Badge variant="outline">Score pending</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { RankingResultRow, type RankingResultRowProps };