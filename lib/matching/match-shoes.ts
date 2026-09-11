import { MatchingEngineNotImplementedError } from "./errors";
import type { MatchShoesInput, ShoeMatchResult } from "./types";

export const MATCHING_ENGINE_STATUS = "not-implemented" as const;

/**
 * Future deterministic matching-engine boundary. This stub must never degrade
 * into placeholder recommendations: callers receive an explicit failure until
 * a reviewed, versioned ruleset is implemented.
 */
export function matchShoes(input: MatchShoesInput): readonly ShoeMatchResult[] {
  void input;
  throw new MatchingEngineNotImplementedError("matchShoes");
}
