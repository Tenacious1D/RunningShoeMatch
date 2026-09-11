export class MatchingEngineNotImplementedError extends Error {
  readonly code = "MATCHING_ENGINE_NOT_IMPLEMENTED";

  constructor(operation: "normalizeRunnerProfile" | "matchShoes") {
    super(
      `${operation} is an architecture stub. Running Shoe Match has no approved quiz schema or matching ruleset and must not produce recommendations yet.`,
    );
    this.name = "MatchingEngineNotImplementedError";
  }
}
