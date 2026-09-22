import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ARI_INSTITUTIONAL_MEMORY_VERSION,
  institutionalMemoryToInstruction,
  scoreInstitutionalLesson
} from "../api/_lib/ari-vnext/institutional-memory.js";
import {
  ARI_COUNCIL_LESSON_EXTRACTOR_VERSION,
  extractCouncilLessons
} from "../api/_lib/ari-vnext/council-lesson-extractor.js";

const read = async (relative) => await readFile(new URL(`../${relative}`, import.meta.url), "utf8");

test("institutional lesson scoring accepts reusable evidence-backed strategies", () => {
  const scored = scoreInstitutionalLesson({
    domain: "coordination",
    title: "Use independent critics before synthesis",
    summary: "Parallel work improves when one specialist attacks the leading explanation.",
    lesson: "For difficult multi-agent reasoning, include an independent critic and verify disagreements before Ari synthesizes.",
    tags: ["multi_agent", "verification"],
    confidence: 0.86,
    novelty: 0.74,
    reusability: 0.91,
    usefulness: 0.93,
    evidenceBasis: "The verified council resolved a contradiction that the first analysis missed.",
    relationship: "new"
  });

  assert.equal(ARI_INSTITUTIONAL_MEMORY_VERSION, "1.0.0");
  assert.equal(scored.accepted, true);
  assert.ok(scored.candidate.lessonKey.startsWith("coordination_"));
  assert.ok(scored.candidate.retrievalPriority >= 0.7);
});

test("institutional memory rejects sensitive user facts and hidden reasoning content", () => {
  const sensitive = scoreInstitutionalLesson({
    domain: "general",
    title: "Remember the user's diagnosis",
    summary: "The user's diagnosis should be carried into future councils.",
    lesson: "Use the user's medication history as durable council memory.",
    confidence: 0.95,
    novelty: 0.9,
    reusability: 0.9,
    usefulness: 0.9,
    evidenceBasis: "User-specific medical details."
  });
  assert.equal(sensitive.accepted, false);
  assert.equal(sensitive.reason, "invalid_candidate");

  const hidden = scoreInstitutionalLesson({
    domain: "reasoning",
    title: "Preserve hidden reasoning",
    summary: "Keep the chain-of-thought from every specialist.",
    lesson: "Store the hidden reasoning trace for later reuse.",
    confidence: 0.95,
    novelty: 0.9,
    reusability: 0.9,
    usefulness: 0.9,
    evidenceBasis: "Raw internal trace."
  });
  assert.equal(hidden.accepted, false);
});

test("institutional instruction keeps prior lessons advisory and revisable", () => {
  const instruction = institutionalMemoryToInstruction({
    active: true,
    lessons: [{
      title: "Verify current claims live",
      lesson: "For freshness-sensitive claims, use live verification rather than durable factual memory.",
      domain: "research",
      confidence: 0.9,
      retrievalPriority: 0.88
    }]
  });

  assert.match(instruction, /strategic evidence, not permanent truth/i);
  assert.match(instruction, /Current evidence.*outrank an older lesson/i);
  assert.match(instruction, /Never treat institutional memory as user memory/i);
  assert.match(instruction, /Do not expose or reconstruct hidden chain-of-thought/i);
});

test("council lesson extractor returns at most three compact candidates", async () => {
  const priorKey = process.env.OPENAI_API_KEY;
  const priorModel = process.env.OPENAI_ARI_INSTITUTIONAL_MEMORY_MODEL;
  const priorFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_ARI_INSTITUTIONAL_MEMORY_MODEL = "gpt-4o-mini";

  const lessons = Array.from({ length: 4 }, (_, index) => ({
    domain: index === 0 ? "coordination" : "reasoning",
    title: `Lesson ${index + 1}`,
    summary: `Reusable summary ${index + 1}`,
    lesson: `Use bounded verification method ${index + 1} when a similar difficult problem appears.`,
    tags: ["verification"],
    confidence: 0.82,
    novelty: 0.76,
    reusability: 0.88,
    usefulness: 0.9,
    evidenceBasis: "Supported by the verified council synthesis.",
    relationship: "new",
    relatedLessonKey: null
  }));

  globalThis.fetch = async () => new Response(JSON.stringify({
    id: "resp_test",
    model: "gpt-4o-mini",
    output: [{
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify({ lessons }) }]
    }],
    usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
  }), { status: 200, headers: { "Content-Type": "application/json" } });

  try {
    const result = await extractCouncilLessons({
      turn: {
        userId: "11111111-1111-4111-8111-111111111111",
        message: "Use several agents to analyze this architecture."
      },
      result: {
        reply: "The verified architecture uses bounded delegation and independent verification.",
        route: { intelligenceEntitlement: { ownerEligible: true } },
        multiAgent: { active: true, verifiedSynthesisAvailable: true }
      },
      council: {
        synthesis: "The council found that bounded delegation plus an adversarial verifier reduced correlated errors."
      },
      existingLessons: []
    });

    assert.equal(ARI_COUNCIL_LESSON_EXTRACTOR_VERSION, "1.0.0");
    assert.equal(result.attempted, true);
    assert.equal(result.candidateCount, 3);
    assert.equal(result.candidates.length, 3);
    assert.equal(result.hiddenChainOfThoughtStored, false);
    assert.equal(result.rawCouncilTranscriptStored, false);
    assert.equal(result.provider.model, "gpt-4o-mini");
  } finally {
    globalThis.fetch = priorFetch;
    if (priorKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = priorKey;
    if (priorModel === undefined) delete process.env.OPENAI_ARI_INSTITUTIONAL_MEMORY_MODEL;
    else process.env.OPENAI_ARI_INSTITUTIONAL_MEMORY_MODEL = priorModel;
  }
});

test("runtime integration retrieves before reasoning and persists only verified council learning", async () => {
  const api = await read("api/ari-vnext.js");
  const orchestrator = await read("api/_lib/ari-vnext/orchestrator.js");
  const multiAgent = await read("api/_lib/ari-vnext/multi-agent-orchestrator.js");
  const migration = await read("supabase/migrations/20260922060405_ari_institutional_memory.sql");

  assert.match(api, /retrieveInstitutionalMemory/);
  assert.match(api, /institutionalMemoryPromise/);
  assert.match(api, /learnFromCouncilTurn/);
  assert.match(api, /verifiedSynthesisAvailable === true/);
  assert.match(api, /hiddenChainOfThoughtStored: false/);
  assert.match(api, /rawCouncilTranscriptStored: false/);

  assert.match(orchestrator, /institutionalMemoryToInstruction/);
  assert.match(orchestrator, /Object\.defineProperty\(payload, "_multiAgentCouncil"/);
  assert.match(orchestrator, /enumerable: false/);

  assert.match(multiAgent, /institutionalMemorySummary\(turn\)/);
  assert.match(multiAgent, /revisable prior strategies/i);

  assert.match(migration, /alter table public\.ari_vnext_institutional_memory enable row level security/i);
  assert.match(migration, /revoke all on table public\.ari_vnext_institutional_memory from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert, update, delete on table public\.ari_vnext_institutional_memory to service_role/i);
  assert.doesNotMatch(migration, /create policy/i);
});
