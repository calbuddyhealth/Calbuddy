import test from "node:test";
import assert from "node:assert/strict";

import { durableMemoryCandidate } from "../api/_lib/ari-vnext/continuity-service.js";
import { rankMemories } from "../api/_lib/ari-vnext/memory-service.js";

test("explicit remember request becomes durable memory", () => {
  const candidate = durableMemoryCandidate("Remember that I hate burpees");
  assert.ok(candidate);
  assert.equal(candidate.memoryType, "explicit_memory");
  assert.equal(candidate.content, "I hate burpees");
  assert.ok(candidate.importance >= 8);
});

test("clear preference becomes durable memory without another model", () => {
  const candidate = durableMemoryCandidate("I prefer morning workouts");
  assert.ok(candidate);
  assert.equal(candidate.memoryType, "preference");
  assert.match(candidate.content, /morning workouts/i);
});

test("a question about preferences is recall, not a memory write", () => {
  assert.equal(durableMemoryCandidate("What do I prefer for workouts?"), null);
});

test("secret-like material is never selected for durable memory", () => {
  assert.equal(durableMemoryCandidate("Remember that my API key is sk-example"), null);
  assert.equal(durableMemoryCandidate("My password is horse-battery-staple"), null);
});

test("sensitive medical statement requires explicit remember intent", () => {
  assert.equal(durableMemoryCandidate("I like this medication better"), null);
  const explicit = durableMemoryCandidate("Remember that I like this medication better");
  assert.ok(explicit);
  assert.equal(explicit.memoryType, "explicit_memory");
});

test("goal and correction statements can become durable continuity", () => {
  assert.equal(durableMemoryCandidate("My goal is to gain 10 pounds")?.memoryType, "goal");
  assert.equal(durableMemoryCandidate("Actually I prefer three training days per week")?.memoryType, "correction");
});

test("memory ranker accepts both legacy 0-1 and vNext 1-10 importance scales", () => {
  const now = new Date().toISOString();
  const ranked = rankMemories([
    { id: "legacy", content: "I prefer morning workouts", importance: 0.8, confidence: 0.9, updated_at: now, tags: ["preference"] },
    { id: "vnext", content: "I prefer morning workouts", importance: 8, confidence: 0.9, updated_at: now, tags: ["preference"] }
  ], "What do I prefer for workouts?");

  const legacy = ranked.find((item) => item.id === "legacy");
  const vnext = ranked.find((item) => item.id === "vnext");
  assert.ok(legacy);
  assert.ok(vnext);
  assert.ok(Math.abs(legacy.relevanceScore - vnext.relevanceScore) < 0.02);
});
