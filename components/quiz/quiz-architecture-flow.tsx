import { ArrowDown, ClipboardList, Database, SlidersHorizontal, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const stages = [
  {
    icon: ClipboardList,
    label: "Quiz UI",
    detail: "Collects only approved answers.",
  },
  {
    icon: UserRound,
    label: "normalizeRunnerProfile()",
    detail: "Validates answers and derives a typed profile.",
  },
  {
    icon: Database,
    label: "Candidate loader",
    detail: "Supplies structured shoe and ranking data.",
  },
  {
    icon: SlidersHorizontal,
    label: "matchShoes()",
    detail: "Will apply a deterministic, versioned ruleset.",
  },
] as const;

export function QuizArchitectureFlow() {
  return (
    <section aria-labelledby="quiz-flow-title" className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="quiz-flow-title" className="text-lg font-bold tracking-tight">
          Intended recommendation flow
        </h3>
        <Badge variant="outline">Engine status: not implemented</Badge>
      </div>

      <ol className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {stages.map(({ icon: Icon, label, detail }, index) => (
          <li key={label} className="contents">
            <div className="rounded-lg border border-border bg-surface p-5">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <p className="mt-4 font-bold">{label}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
            </div>
            {index < stages.length - 1 ? (
              <ArrowDown className="mx-auto h-5 w-5 text-muted-foreground lg:my-auto lg:-rotate-90" aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-3 rounded-lg border border-dashed border-primary/35 bg-primary/5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Presentation boundary</Badge>
          <p className="font-bold">ShoeRecommendationModal</p>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          After real results exist, a presentation adapter will combine each typed match result with current shoe and retailer data before passing serializable props to the existing modal. Nothing is populated or recommended here today.
        </p>
      </div>
    </section>
  );
}
