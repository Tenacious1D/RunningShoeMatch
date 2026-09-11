import { cn } from "@/lib/utils";

type RankingScoreProps = {
  score: number;
  className?: string;
};

function RankingScore({ score, className }: RankingScoreProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const displayScore = Number.isInteger(normalizedScore)
    ? normalizedScore.toFixed(0)
    : normalizedScore.toFixed(1);

  return (
    <div className={cn("min-w-24", className)}>
      <div className="flex items-end justify-between gap-3 sm:block sm:text-right">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Score
        </span>
        <span className="block text-2xl font-bold tabular-nums">
          {displayScore}
          <span className="ml-0.5 text-xs font-medium text-muted-foreground">/100</span>
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Ranking score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedScore}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${normalizedScore}%` }}
        />
      </div>
    </div>
  );
}

export { RankingScore, type RankingScoreProps };

