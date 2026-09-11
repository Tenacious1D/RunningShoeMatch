/** Values the future quiz transport may collect without committing to questions. */
export type QuizAnswerValue = string | number | boolean | readonly string[] | null;

export interface QuizAnswer {
  questionKey: string;
  value: QuizAnswerValue;
}

/**
 * A normalized fact derived from one or more answers. Concrete trait keys and
 * validation rules are intentionally deferred until the quiz is approved.
 */
export interface RunnerProfileTrait {
  key: string;
  value: QuizAnswerValue;
  sourceQuestionKeys: readonly string[];
}

export interface RunnerProfile {
  profileSchemaVersion: string;
  traits: readonly RunnerProfileTrait[];
}

export type ShoeMatchAttributeValue = string | number | boolean | readonly string[] | null;

/** A general editorial ranking signal, not a personalized match score. */
export interface RankingScoreReference {
  kind: "ranking-score";
  categorySlug: string;
  score: number;
  effectiveDate: string;
  methodologyVersion: string;
}

/** Database data adapted into a framework-independent matching input. */
export interface ShoeMatchCandidate {
  shoeId: string;
  shoeSlug: string;
  attributes: Readonly<Record<string, ShoeMatchAttributeValue>>;
  rankingScores: readonly RankingScoreReference[];
}

export interface MatchExplanation {
  code: string;
  summary: string;
  evidenceKeys: readonly string[];
}

/** A score calculated for one runner by a versioned matching ruleset. */
export interface PersonalizedMatchScore {
  kind: "personalized-match-score";
  value: number;
}

export interface ShoeMatchResult {
  shoeId: string;
  shoeSlug: string;
  matchScore: PersonalizedMatchScore;
  explanations: readonly MatchExplanation[];
  rulesetVersion: string;
}

export interface MatchingRuleset {
  version: string;
}

export interface NormalizeRunnerProfileOptions {
  profileSchemaVersion: string;
}

export interface MatchShoesInput {
  profile: RunnerProfile;
  candidates: readonly ShoeMatchCandidate[];
  ruleset: MatchingRuleset;
}
