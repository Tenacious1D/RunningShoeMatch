import assert from "node:assert/strict";
import test from "node:test";

import {
  MATCHING_ENGINE_STATUS,
  MatchingEngineNotImplementedError,
  matchShoes,
  normalizeRunnerProfile,
  type MatchShoesInput,
  type QuizAnswer,
} from "../../lib/matching";

test("matching engine advertises that it is not implemented", () => {
  assert.equal(MATCHING_ENGINE_STATUS, "not-implemented");
});

test("profile normalization cannot invent a profile before questions are approved", () => {
  const answers: readonly QuizAnswer[] = [];
  assert.throws(
    () => normalizeRunnerProfile(answers, { profileSchemaVersion: "unapproved" }),
    (error: unknown) => error instanceof MatchingEngineNotImplementedError && error.code === "MATCHING_ENGINE_NOT_IMPLEMENTED",
  );
});

test("matching cannot return placeholder recommendations", () => {
  const input: MatchShoesInput = {
    profile: { profileSchemaVersion: "unapproved", traits: [] },
    candidates: [],
    ruleset: { version: "unapproved" },
  };

  assert.throws(
    () => matchShoes(input),
    (error: unknown) => error instanceof MatchingEngineNotImplementedError && /must not produce recommendations yet/.test(error.message),
  );
});
