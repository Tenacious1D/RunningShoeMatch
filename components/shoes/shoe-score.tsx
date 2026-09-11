import { cn } from "@/lib/utils";

type ShoeScoreProps = {
  score: number;
  label?: string;
  className?: string;
  compact?: boolean;
};

function ShoeScore({
  score,
  label = "Match score",
  className,
  compact = false,
}: ShoeScoreProps) {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
  const barColor =
    normalizedScore >= 85
      ? "bg-success"
      : normalizedScore >= 70
        ? "bg-primary"
        : "bg-warning";

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-end justify-between gap-4">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <span className={cn("font-bold tabular-nums", compact ? "text-lg" : "text-2xl")}>
          {normalizedScore}
          <span className="ml-0.5 text-xs font-medium text-muted-foreground">/100</span>
        </span>
      </div>
      <div
        className={cn("mt-2 overflow-hidden rounded-full bg-muted", compact ? "h-1.5" : "h-2")}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedScore}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", barColor)}
          style={{ width: `${normalizedScore}%` }}
        />
      </div>
    </div>
  );
}

export { ShoeScore, type ShoeScoreProps };