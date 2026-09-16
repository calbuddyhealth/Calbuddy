import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_TEACHER_RELIABILITY_VERSION,
  deriveTeacherAuthority,
  deriveTeacherReliabilityFromStrategies,
  teacherReliabilityInstruction
} from "../api/_lib/ari-vnext/teacher-reliability.js";

test("teacher reliability starts advisory and never grants executive authority", () => {
  const reliability = deriveTeacherReliabilityFromStrategies([]);
  const authority = deriveTeacherAuthority({
    reliability,
    model: "gpt-5.6-sol",
    domains: ["developer"]
  });

  assert.equal(reliability.version, ARI_TEACHER_RELIABILITY_VERSION);
  assert.equal(reliability.teacherNeverExecutive, true);
  assert.equal(authority.role, "advisor");
  assert.equal(authority.ariPrimary, true);
  assert.equal(authority.ariOwnsFinalSynthesis, true);
  assert.equal(authority.teacherCanOverride, false);
});

test("non-academy adaptive strategies do not affect teacher reliability", () => {
  const reliability = deriveTeacherReliabilityFromStrategies([
    {
      strategyKey: "ordinary_strategy",
      sourceKind: "adaptive_reflection",
      sourceModel: "gpt-5.6-sol",
      domains: ["developer"],
      status: "practical_prior",
      positiveOutcomes: 50,
      negativeOutcomes: 0
    }
  ]);

  assert.equal(reliability.challengeCount, 0);
  assert.equal(reliability.modelCount, 0);
});

test("teacher becomes mentor only after challenger methods earn strong observed outcomes", () => {
  const reliability = deriveTeacherReliabilityFromStrategies([
    {
      strategyKey: "academy_hypothesis_search",
      sourceKind: "reasoning_academy",
      sourceModel: "gpt-5.6-sol",
      domains: ["developer", "evidence"],
      status: "practical_prior",
      trials: 14,
      positiveOutcomes: 10,
      negativeOutcomes: 0,
      confidence: 0.94,
      maturityScore: 0.91
    }
  ]);
  const authority = deriveTeacherAuthority({
    reliability,
    model: "gpt-5.6-sol",
    domains: ["developer"]
  });

  assert.equal(authority.role, "mentor");
  assert.ok(authority.teacherScore > authority.ariScore);
  assert.ok(authority.weightedSamples >= 6);
  assert.equal(authority.teacherCanOverride, false);
});

test("teacher shifts to critic-only when academy challengers repeatedly underperform Ari incumbents", () => {
  const reliability = deriveTeacherReliabilityFromStrategies([
    {
      strategyKey: "academy_overcomplicated_method",
      sourceKind: "reasoning_academy",
      sourceModel: "gpt-5.6-sol",
      domains: ["developer"],
      status: "retired",
      trials: 13,
      positiveOutcomes: 0,
      negativeOutcomes: 10,
      confidence: 0.41,
      maturityScore: 0.2
    }
  ]);
  const authority = deriveTeacherAuthority({
    reliability,
    model: "gpt-5.6-sol",
    domains: ["developer"]
  });

  assert.equal(authority.role, "critic_only");
  assert.ok(authority.ariScore > authority.teacherScore);
  assert.equal(authority.reason, "ari_has_stronger_observed_outcomes");
});

test("mixed challenger evidence keeps teacher as peer rather than forcing a winner", () => {
  const reliability = deriveTeacherReliabilityFromStrategies([
    {
      strategyKey: "academy_method_a",
      sourceKind: "reasoning_academy",
      sourceModel: "gpt-5.6-sol",
      domains: ["decision"],
      status: "adopted",
      trials: 8,
      positiveOutcomes: 4,
      negativeOutcomes: 3
    },
    {
      strategyKey: "academy_method_b",
      sourceKind: "reasoning_academy",
      sourceModel: "gpt-5.6-sol",
      domains: ["decision"],
      status: "retired",
      trials: 8,
      positiveOutcomes: 3,
      negativeOutcomes: 4
    }
  ]);
  const authority = deriveTeacherAuthority({
    reliability,
    model: "gpt-5.6-sol",
    domains: ["decision"]
  });

  assert.equal(authority.role, "peer");
  assert.ok(Math.abs(authority.ariScore - authority.teacherScore) < 0.2);
});

test("teacher reliability instruction keeps disagreement evidence-based and provider limits local", () => {
  const reliability = deriveTeacherReliabilityFromStrategies([
    {
      strategyKey: "academy_test",
      sourceKind: "reasoning_academy",
      sourceModel: "gpt-5.6-sol",
      domains: ["evidence"],
      status: "testing",
      trials: 2,
      positiveOutcomes: 1,
      negativeOutcomes: 0
    }
  ]);
  const instruction = teacherReliabilityInstruction(reliability);

  assert.match(instruction, /never Ari's executive authority/i);
  assert.match(instruction, /confidence alone never counts as a win/i);
  assert.match(instruction, /provider refusal, limitation, or unavailable capability must stay local/i);
});
