# Quiz and Matching Architecture

## Goal

The future quiz will guide a runner through relevant questions and return suitable shoes from structured application data. The recommendation outcome must be deterministic and explainable. Do not use an LLM for shoe recommendations.

No quiz or matching code is implemented during the documentation phase.

## Required separation

React quiz components must not contain the matching or ranking algorithm.

```text
Quiz answers
    ↓
Runner profile
    ↓
Matching engine
    ↓
Shoe and ranking data
    ↓
Recommended shoes
```

Each stage has a distinct responsibility:

- Quiz UI: render questions, collect answers, show progress, and display results.
- Profile builder: validate and normalize raw answers into a typed runner profile.
- Matching engine: score or filter candidate shoes with deterministic rules.
- Data access: load eligible shoes and required ranking/specification data.
- Results presenter: convert engine output into accessible explanations and links.

## Matching-engine contract

The engine should eventually be a pure TypeScript module with no React, browser, or Supabase dependency. It should accept typed inputs and return typed results.

Conceptually:

```ts
type MatchInput = {
  profile: RunnerProfile;
  candidates: ShoeCandidate[];
  ruleset: MatchingRuleset;
};

type MatchResult = {
  shoeId: string;
  score: number;
  reasons: MatchReason[];
};
```

These are examples, not approved production types. Define the real contract when quiz requirements and shoe fields are known.

## Determinism and explainability

Given the same profile, candidate data, and ruleset version, the engine should return the same ordered results. Results should retain reason codes or score contributions so the UI can explain why a shoe matched without reconstructing logic in a component.

Do not let affiliate payout, retailer availability, or editorial copy silently change fit scores. Commercial presentation rules must remain distinguishable from recommendation logic.

## Versioning

Matching rules will change over time. The eventual design should identify the ruleset/version used for a result so analytics and debugging remain meaningful. Versioning does not require preserving every quiz result indefinitely; retention is a later product and privacy decision.

## UI architecture

Use Server Components for the quiz route shell and non-interactive content. Use Client Components only for stateful question navigation and browser interactions.

The client state should contain only what the current quiz session needs. It should not contain database credentials, privileged data, or duplicated algorithm implementations.

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
3. The profile builder creates a normalized runner profile.
4. Data access loads eligible shoe candidates.
5. The matching engine evaluates candidates.
6. The server returns a limited result model for presentation.

The exact choice between a Server Action and Route Handler should be made when the quiz is implemented, based on navigation and analytics requirements.

## Testing expectations

The matching module should have focused unit tests for:

- Identical inputs producing identical results
- Boundary values and conflicting preferences
- Missing optional specifications
- Stable tie-breaking
- Rule-weight changes
- Exclusion and safety rules
- Human-readable reason codes matching score contributions

UI tests should verify the question flow and accessibility independently of engine tests.

## Analytics boundary

Future quiz analytics may record normalized, privacy-conscious events such as completion, abandonment step, or selected recommendation. Analytics must not become an input to matching unless an explicit, documented product decision changes that rule.

Avoid collecting sensitive or unnecessary personal information. Define consent and retention before storing raw answer sets.

## Open questions for implementation

- Final questions and answer options
- Runner-profile fields and validation rules
- Candidate eligibility rules versus weighted preferences
- Scoring scale and tie-breaking
- Results count and explanation format
- Ruleset-version storage
- Privacy and analytics retention

Resolve these questions before building the algorithm rather than guessing in UI code.