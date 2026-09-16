import assert from "node:assert/strict";
import test from "node:test";

import {
  ARI_BLIND_REASONING_ARENA_VERSION,
  deriveBlindArenaDomains,
  deterministicCandidateOrder,
  normalizeBlindArenaJudgment,
  shouldRunBlindReasoningArena
} from "../api/_lib/ari-vnext/blind-reasoning-arena.js";
import {
  deriveTeacherAuthority,
  deriveTeacherReliabilityFromStrategies
} from "../api/_lib/ari-vnext/teacher-reliability.js";

test("blind arena randomizes labels deterministically without exposing source identity", () => {
  const first = deterministicCandidateOrder("turn-123");
  const second = deterministicCandidateOrder("turn-123");

  assert.deepEqual(first, second);
  assert.deepEqual(new Set([first.A, first.B]), new Set(["ari", "challenger"]));
  assert.equal(ARI_BLIND_REASONING_ARENA_VERSION, "1.0.0");
});

test("blind judge result maps randomized labels back to Ari or challenger", () => {
  const order = { A: "challenger", B: "ari" };
  const normalized = normalizeBlindArenaJudgment({
    winner: "B",
    confidence: 0.9,
    scores: {
      correctness: { A: 7, B: 9 },
      reasoning: { A: 7, B: 9 },
      completeness: { A: 8, B: 9 },
      calibration: { A: 8, B: 9 },
      utility: { A: 8, B: 9 }
    },
    decisiveReasons: ["Candidate B handled the decisive constraint correctly."],
    uncertainty: "Low"
  }, order, {
    challengerModel: "gpt-5.6-sol",
    judgeModel: "independent-judge-model"
  });

  assert.equal(normalized.winner, "ari");
  assert.equal(normalized.judgeIndependent, true);
  assert.ok(normalized.evidenceWeight > 0.9);
});

test("same-model judge is discounted rather than treated as fully independent evidence", () => {
  const raw = {
    winner: "A",
    confidence: 1,
    scores: {
      correctness: { A: 10, B: 7 },
      reasoning: { A: 10, B: 7 },
      completeness: { A: 9, B: 8 },
      calibration: { A: 9, B: 8 },
      utility: { A: 9, B: 8 }
    },
    decisiveReasons: [],
    uncertainty: ""
  };
  const independent = normalizeBlindArenaJudgment(raw, { A: "ari", B: "challenger" }, {
    challengerModel: "teacher-model",
    judgeModel: "judge-model"
  });
  const sameModel = normalizeBlindArenaJudgment(raw, { A: "ari", B: "challenger" }, {
    challengerModel: "teacher-model",
    judgeModel: "teacher-model"
  });

  assert.ok(independent.evidenceWeight > sameModel.evidenceWeight);
  assert.equal(sameModel.judgeIndependent, false);
});

test("arena runs for explicit owner benchmark prompts but excludes sensitive and high-stakes turns", () => {
  const priorEnabled = process.env.ARI_REASONING_ARENA_ENABLED;
  const priorSample = process.env.ARI_REASONING_ARENA_SAMPLE_RATE;
  process.env.ARI_REASONING_ARENA_ENABLED = "true";
  process.env.ARI_REASONING_ARENA_SAMPLE_RATE = "0";

  try {
    const common = {
      result: {
        success: true,
        reply: "A substantial answer.",
        safety: { highStakes: false },
        route: { developer: true, followUp: false, complexity: "deep" },
        action: null
      },
      academy: { active: true }
    };

    assert.equal(shouldRunBlindReasoningArena({
      ...common,
      turn: { turnId: "t1", message: "Run a blind benchmark comparing Ari versus Sol on this software architecture decision." }
    }), true);

    assert.equal(shouldRunBlindReasoningArena({
      ...common,
      turn: { turnId: "t2", message: "Benchmark my medication symptoms and diagnosis against another model." }
    }), false);

    assert.equal(shouldRunBlindReasoningArena({
      ...common,
      turn: { turnId: "t3", message: "Run a blind benchmark on this architecture decision." },
      result: { ...common.result, safety: { highStakes: true } }
    }), false);
  } finally {
    if (priorEnabled === undefined) delete process.env.ARI_REASONING_ARENA_ENABLED;
    else process.env.ARI_REASONING_ARENA_ENABLED = priorEnabled;
    if (priorSample === undefined) delete process.env.ARI_REASONING_ARENA_SAMPLE_RATE;
    else process.env.ARI_REASONING_ARENA_SAMPLE_RATE = priorSample;
  }
});

test("arena domains identify developer and decision reasoning without user identity data", () => {
  const domains = deriveBlindArenaDomains({
    route: { developer: true, currentInfo: false },
    message: "Compare these two architecture strategies and choose the better trade-off."
  });

  assert.deepEqual(domains, ["developer", "decision"]);
});

test("repeated blind Ari wins can move a teacher to critic-only", () => {
  const arenaResults = Array.from({ length: 5 }, (_, index) => ({
    turnId: `arena-ari-${index}`,
    challengerModel: "gpt-5.6-sol",
    judgeModel: "independent-judge",
    domains: ["developer"],
    winner: "ari",
    evidenceWeight: 1,
    confidence: 0.9
  }));
  const reliability = deriveTeacherReliabilityFromStrategies([], arenaResults);
  const authority = deriveTeacherAuthority({
    reliability,
    model: "gpt-5.6-sol",
    domains: ["developer"]
  });

  assert.equal(reliability.arenaBenchmarkCount, 5);
  assert.equal(authority.role, "critic_only");
  assert.ok(authority.ariScore > authority.teacherScore);
  assert.equal(authority.teacherCanOverride, false);
});

test("repeated blind challenger wins can move a teacher to mentor while Ari remains executive", () => {
  const arenaResults = Array.from({ length: 5 }, (_, index) => ({
    turnId: `arena-teacher-${index}`,
    challengerModel: "gpt-5.6-sol",
    judgeModel: "independent-judge",
    domains: ["developer"],
    winner: "challenger",
    evidenceWeight: 1,
    confidence: 0.9
  }));
  const reliability = deriveTeacherReliabilityFromStrategies([], arenaResults);
  const authority = deriveTeacherAuthority({
    reliability,
    model: "gpt-5.6-sol",
    domains: ["developer"]
  });

  assert.equal(authority.role, "mentor");
  assert.ok(authority.teacherScore > authority.ariScore);
  assert.equal(authority.ariOwnsFinalSynthesis, true);
  assert.equal(authority.teacherCanOverride, false);
});
