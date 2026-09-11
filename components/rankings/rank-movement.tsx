import { ArrowDown, ArrowUp, Minus, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { RankingMovement } from "@/lib/data/types";

type RankMovementProps = {
  movement: RankingMovement | null;
};

function RankMovement({ movement }: RankMovementProps) {
  if (!movement) {
    return <span className="text-xs text-muted-foreground">First published snapshot</span>;
  }

  if (movement.direction === "new") {
    return (
      <Badge variant="success">
        <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
        NEW
      </Badge>
    );
  }

  if (movement.direction === "unchanged") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        No change
      </span>
    );
  }

  const movedUp = movement.direction === "up";
  const Icon = movedUp ? ArrowUp : ArrowDown;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${movedUp ? "text-success" : "text-destructive"}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {movedUp ? "Up" : "Down"} {movement.places} from previous ranking
    </span>
  );
}

export { RankMovement, type RankMovementProps };
