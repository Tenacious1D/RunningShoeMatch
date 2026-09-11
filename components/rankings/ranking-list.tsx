import { RankingRow } from "@/components/rankings/ranking-row";
import type { RankingListItem } from "@/lib/data/types";

type RankingListProps = {
  results: RankingListItem[];
  label: string;
};

function RankingList({ results, label }: RankingListProps) {
  return (
    <ol className="space-y-4" aria-label={label}>
      {results.map((result) => (
        <RankingRow key={result.id} result={result} />
      ))}
    </ol>
  );
}

export { RankingList, type RankingListProps };

