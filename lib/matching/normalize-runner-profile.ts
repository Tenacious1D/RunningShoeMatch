import { MatchingEngineNotImplementedError } from "./errors";
import type { NormalizeRunnerProfileOptions, QuizAnswer, RunnerProfile } from "./types";

/**
 * Future boundary for validating raw answers and deriving normalized traits.
 * Intentionally unusable until the question and profile schemas are approved.
 */
export function normalizeRunnerProfile(
  answers: readonly QuizAnswer[],
  options: NormalizeRunnerProfileOptions,
): RunnerProfile {
  void answers;
  void options;
  throw new MatchingEngineNotImplementedError("normalizeRunnerProfile");
}
