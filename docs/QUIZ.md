# Quiz and Matching Architecture

## Goal

The future quiz will guide a runner through relevant questions and return suitable shoes from structured application data. The recommendation outcome must be deterministic and explainable. Do not use an LLM for shoe recommendations.

Phase 13 establishes typed interfaces and a framework-independent module
boundary under `lib/matching/`. It does not define questions, profile traits,
eligibility rules, weights, or a production matching algorithm.

## Required separation

React quiz components must not contain the matching or ranking algorithm.

```text
Quiz answers
    ↓
normalizeRunnerProfile()
    ↓
RunnerProfile
    ↓
matchShoes() + shoe/ranking candidates
    ↓
ShoeMatchResult[]
    ↓
presentation adapter + ShoeRecommendationModal
```

Each stage has a distinct responsibility:

- Quiz UI: render questions, collect answers, show progress, and display results.
- Profile builder: validate and normalize raw answers into a typed runner profile.
- Matching engine: score or filter candidate shoes with deterministic rules.
- Data access: load eligible shoes and required ranking/specification data.
- Results presenter: convert engine output into accessible explanations and links.

## Implemented matching-engine contract

`lib/matching/` is a pure TypeScript boundary with no React, browser, Next.js,
Supabase, or affiliate dependency. Its public exports include:

- `QuizAnswer`: one raw answer identified by a stable question key.
- `RunnerProfile`: a versioned collection of normalized traits. It deliberately
  does not have premature fields such as mileage, pace, or pronation.
- `ShoeMatchCandidate`: a shoe ID/slug plus an extensible set of matchable
  attributes and separately typed ranking-score references.
- `ShoeMatchResult`: a shoe identity, personalized match score, explanation
  records, and matching-ruleset version.
- `MatchExplanation`: a stable reason code, display summary, and evidence keys.
- `MatchingRuleset`: the version identity for the eventual deterministic rules.

Conceptually:

```ts
type MatchShoesInput = {
  profile: RunnerProfile;
  candidates: ShoeMatchCandidate[];
  ruleset: MatchingRuleset;
};

type ShoeMatchResult = {
  shoeId: string;
  matchScore: PersonalizedMatchScore;
  explanations: MatchExplanation[];
  rulesetVersion: string;
};
```

The structural boundary is implemented, but its concrete question keys,
profile trait keys, candidate attributes, and ruleset are not approved yet.

### Fail-closed stubs

`normalizeRunnerProfile()` and `matchShoes()` currently throw
`MatchingEngineNotImplementedError` with code
`MATCHING_ENGINE_NOT_IMPLEMENTED`. `MATCHING_ENGINE_STATUS` is explicitly
`not-implemented`. This is intentional: an unfinished engine must fail loudly
rather than returning empty, random, or demo recommendations that could be
mistaken for product behavior.

The `/quiz` page only visualizes the intended boundaries. It does not call the
stubs, create questions, load candidate shoes, calculate a score, or populate
`ShoeRecommendationModal`.

## Ranking score versus match score

These scores answer different questions and must never share one field or type:

- **Ranking Score** is Running Shoe Match's general evaluation of a shoe within
  a published category and methodology version. It belongs to ranking history
  and does not depend on one runner.
- **Match Score** is the future ruleset's estimate of how appropriate a shoe is
  for one normalized runner profile. It belongs to a match result and must be
  reproducible from that profile, candidate data, and ruleset version.

`RankingScoreReference` uses `kind: "ranking-score"`, while
`PersonalizedMatchScore` uses `kind: "personalized-match-score"`. Ranking data
may enter `ShoeMatchCandidate.rankingScores` as explicit context if the approved
ruleset needs it, but the engine must decide transparently how or whether it
contributes. A ranking score must never be relabeled as a match score.

## Determinism and explainability

Given the same profile, candidate data, and ruleset version, the engine should return the same ordered results. Results should retain reason codes or score contributions so the UI can explain why a shoe matched without reconstructing logic in a component.

Do not let affiliate payout, retailer availability, or editorial copy silently change fit scores. Commercial presentation rules must remain distinguishable from recommendation logic.

## Versioning

Matching rules will change over time. The eventual design should identify the ruleset/version used for a result so analytics and debugging remain meaningful. Versioning does not require preserving every quiz result indefinitely; retention is a later product and privacy decision.

## UI architecture

Use Server Components for the quiz route shell and non-interactive content. Use Client Components only for stateful question navigation and browser interactions.

The client state should contain only what the current quiz session needs. It should not contain database credentials, privileged data, candidate loading, ranking queries, or duplicated algorithm implementations.

Support from the start:

- Semantic fieldsets, legends, labels, and error messages
- Keyboard navigation and visible focus states
- Mobile-first question layouts
- URL/session recovery only if explicitly required
- Clear handling of missing, inconsistent, or unsupported answer combinations

## Data flow

One intended server-mediated flow is:

1. The UI collects and submits answers.
2. A server boundary validates the payload.
3. `normalizeRunnerProfile()` creates a versioned `RunnerProfile`.
4. Server-side data access loads eligible shoes, matchable attributes, and only
   the ranking context required by the approved ruleset.
5. A data adapter maps database models to `ShoeMatchCandidate[]`.
6. `matchShoes()` evaluates and orders candidates with a versioned deterministic ruleset.
7. A presentation adapter joins result IDs to current shoe/retailer display data
   and passes serializable props to `ShoeRecommendationModal`.

The exact choice between a Server Action and Route Handler should be made when the quiz is implemented, based on navigation and analytics requirements.

## Testing expectations

The current boundary tests verify that both stubs fail with the dedicated error
instead of returning placeholder recommendations. Once the algorithm is
approved, pure matching-module unit tests should cover:

- Identical inputs producing identical results
- Boundary values and conflicting preferences
- Missing optional specifications
- Stable tie-breaking
- Rule-weight changes
- Exclusion and safety rules
- Human-readable reason codes matching score contributions

UI tests should verify the question flow and accessibility independently of engine tests.

Use fixture profiles and fictional candidates for algorithm tests. Add
golden/expected-result cases approved by the product owner, property tests for
score boundaries and invariants where useful, and regression cases for every
matching bug. Database integration tests should verify only candidate loading
and result adaptation; they should not become the primary tests for scoring
logic.

## Analytics boundary

Future quiz analytics may record normalized, privacy-conscious events such as completion, abandonment step, or selected recommendation. Analytics must not become an input to matching unless an explicit, documented product decision changes that rule.

Avoid collecting sensitive or unnecessary personal information. Define consent and retention before storing raw answer sets.

## Decisions and data required before implementation

The following product inputs are required before building real questions or
replacing the fail-closed stubs:

1. **Quiz audience and scope:** intended runner types, supported shoe use cases,
   geographic/retailer scope, and conditions the quiz should explicitly decline
   to answer.
2. **Approved questions:** exact wording, answer options, required versus
   optional status, allowed combinations, and any branching/skipping rules.
3. **Profile mapping:** which answers become which normalized runner traits,
   their units/controlled values, defaults, and conflict-resolution rules.
4. **Hard eligibility rules:** conditions that exclude a shoe versus preferences
   that only affect its score, including how missing shoe data behaves.
5. **Candidate data dictionary:** the shoe specifications, current metric keys,
   units, normalization scales, confidence requirements, and ranking categories
   the engine is allowed to use.
6. **Scoring methodology:** match-score scale, factor weights or decision rules,
   caps/floors, interaction rules, missing-data penalties, and whether/how a
   published Ranking Score contributes.
7. **Ordering policy:** tie-breaking, minimum acceptable score, number of primary
   and alternative results, and diversity rules if alternatives should not be
   near-duplicates.
8. **Explanation policy:** approved reason codes, customer-facing language,
   tradeoff disclosures, and the evidence required for each explanation.
9. **Versioning and release process:** initial profile-schema and matching-ruleset
   versions, approval fixtures, and who signs off before a ruleset is active.
10. **Session and analytics policy:** whether answers survive refresh, whether
    results are saved, events to record, consent requirements, retention period,
    and fields that must never be collected.

Resolve these items before building the algorithm rather than guessing in UI
code. Retailer availability and affiliate economics are presentation concerns,
not matching inputs, unless a future product decision explicitly creates a
separate availability filter that remains outside fit scoring.
