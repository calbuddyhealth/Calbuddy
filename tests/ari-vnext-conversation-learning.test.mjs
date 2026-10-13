import test from "node:test";
import assert from "node:assert/strict";
import { trainConversationPolicy } from "../scripts/lib/ari-conversation-learning.mjs";
import { CONVERSATION_CANDIDATES, conversationFeatures, selectConversationPolicy } from "../api/_lib/ari-vnext/conversation-policy.js";
import artifact from "../api/_lib/ari-vnext/conversation-policy-artifact.js";
import { callResponses } from "../api/_lib/ari-vnext/orchestrator.js";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { CANDIDATE_DIGEST } from "../api/_lib/ari-vnext/conversation-policy.js";

// Synthetic labels exercise mechanics only; never exported as trained weights.
function rows() {
  return ["train", "holdout"].flatMap(split => Array.from({length: 20}, (_, i) =>
    Object.keys(CONVERSATION_CANDIDATES).filter(x => x !== "baseline").map(candidate => ({
      caseId: `${split}-${i}`, groupId: `${split}-${i}`, split, model: "test-model", servedModel: "test-model", candidate,
      features: [1, 0, 0, 0, 0, 0, 0], preference: candidate === "direct" ? 1 : 0,
      reviewSource: "human", constraintsPass: true, baselineConstraintsPass: true,
      baselineTokens: 100, candidateTokens: 110, baselineLatencyMs: 100, candidateLatencyMs: 110
    })))).flat();
}

test("learns pairwise weights and selects only a model with heldout gains", () => {
  const learned = trainConversationPolicy(rows());
  assert.equal(learned.status, "validated");
  const args = { learned, policy: { model: "test-model", accessClass: "owner" }, safety: {level: "ordinary"} };
  assert.equal(selectConversationPolicy(args).id, "direct");
  assert.equal(selectConversationPolicy({...args, policy: {model: "different-model", accessClass: "owner"}}).id, "baseline");
  assert.equal(selectConversationPolicy({...args, policy: {model: "test-model", accessClass: "premium"}}).id, "baseline");
  assert.equal(selectConversationPolicy({...args, safety: { highStakes: true }}).id, "baseline");
  assert.equal(selectConversationPolicy({...args, learned: {...learned, candidateDigest: "changed"}}).id, "baseline");
  assert.equal(selectConversationPolicy({...args, policy: {...args.policy, persistReasoning: true}, turn: {context: {reasoningContinuity: {previousResponseId: "resp-existing"}}}}).id, "baseline");
});

test("provider uses a validated strategy without altering model, user input or tool authority", async t => {
  const previous = structuredClone(artifact), key = process.env.OPENAI_API_KEY;
  Object.assign(artifact, trainConversationPolicy(rows()));
  process.env.OPENAI_API_KEY = "test-only";
  t.after(() => {
    for (const name of Object.keys(artifact)) delete artifact[name];
    Object.assign(artifact, previous);
    if (key === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = key;
  });
  let body;
  t.mock.method(globalThis, "fetch", async (_, options) => {
    body = JSON.parse(options.body);
    return { ok: true, json: async () => ({ model: "test-model", output: [{type: "message", content: [{type: "output_text", text: "Hello"}]}] }) };
  });
  const input = [{role: "user", content: "Hello"}];
  const result = await callResponses({turn: {message: "Hello"}, policy: {model: "test-model", accessClass: "owner"}, instructions: "Original instructions", input});
  assert.equal(body.model, "test-model");
  assert.deepEqual(body.input, input);
  assert.equal(body.tools, undefined);
  assert.ok(body.instructions.startsWith("Original instructions"));
  assert.match(body.instructions, /explicit preferences take precedence/);
  assert.equal(result._ariConversationPolicy.id, "direct");
});

test("heldout labels cannot affect learned weights, but can reject promotion", () => {
  const data = rows(), before = trainConversationPolicy(data);
  for (const row of data.filter(x => x.split === "holdout")) row.preference = 0;
  const after = trainConversationPolicy(data);
  assert.deepEqual(after.models["test-model"].weights, before.models["test-model"].weights);
  assert.equal(after.status, "rejected");
});

test("rejects leakage, incomplete comparisons, duplicate feedback and missing human ratings", () => {
  const mutations = [
    data => { data.find(x => x.split === "holdout").groupId = "train-0"; },
    data => data.pop(),
    data => data.push({...data[0]}),
    data => { data[0].preference = null; },
    data => { data[0].reviewSource = "self_assessed"; },
    data => { data[0].baselineTokens = NaN; },
    data => { data[0].features[2] = Infinity; }
  ];
  for (const mutate of mutations) { const data = rows(); mutate(data); assert.throws(() => trainConversationPolicy(data)); }
});

test("gates cost, latency, and constraint regressions even when preferences favor candidate", () => {
  for (const mutation of [
    row => { row.candidateTokens = 150; },
    row => { row.candidateLatencyMs = 200; },
    row => { if (row.caseId === "holdout-0") row.constraintsPass = false; }
  ]) {
    const data = rows(); data.filter(x => x.split === "holdout" && x.candidate === "direct").forEach(mutation);
    assert.equal(trainConversationPolicy(data).status, "rejected");
  }
});

test("ties do not demonstrate improvement and malformed artifacts fall back", () => {
  const data = rows(); data.forEach(x => {x.preference = 0.5;});
  assert.equal(trainConversationPolicy(data).status, "rejected");
  assert.equal(selectConversationPolicy({policy: {accessClass: "owner"}}).id, "baseline");
  const learned = trainConversationPolicy(rows());
  delete learned.models["test-model"].validation.latencyRatio;
  assert.equal(selectConversationPolicy({ learned, policy: {accessClass: "owner", model: "test-model"} }).id, "baseline");
  assert.deepEqual(conversationFeatures({message: "I meant a story. I am frustrated. Could it work?"}).slice(3), [1,1,1,1]);
});

test("CLI blind review and training round trip measured pairs, while incomplete ratings fail", async t => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ari-learning-test-"));
  t.after(() => fs.rm(directory, {recursive: true, force: true}));
  const data = rows(), requests = [];
  for (const row of data.filter(x => x.candidate === "direct")) {
    for (const candidate of Object.keys(CONVERSATION_CANDIDATES)) requests.push({
      id: `${row.caseId}:${candidate}`, caseId: row.caseId, groupId: row.groupId, split: row.split,
      features: row.features, message: "Synthetic mechanics test", history: [], candidate, body: {model: "test-model", max_output_tokens: 100}
    });
  }
  const digest = createHash("sha256").update(JSON.stringify(requests)).digest("hex");
  await fs.writeFile(path.join(directory, "manifest.json"), JSON.stringify({candidateDigest: CANDIDATE_DIGEST, requests, digest}));
  await fs.writeFile(path.join(directory, "responses.jsonl"), requests.map(r => JSON.stringify({id: r.id, digest, status: "completed", reply: r.candidate, usage: {total_tokens: 100}, latencyMs: 100, model: "test-model"})).join("\n"));
  const script = new URL("../scripts/ari-conversation-learning.mjs", import.meta.url).pathname;
  const run = command => spawnSync(process.execPath, [script, command, directory], {encoding: "utf8"});
  assert.equal(run("review").status, 0);
  const failed = run("train");
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /explicit human rating/);
  const reviews = JSON.parse(await fs.readFile(path.join(directory, "review.json"), "utf8"));
  for (const review of reviews) {
    review.winner = review.A === "direct" ? "A" : review.B === "direct" ? "B" : review.A === "baseline" ? "A" : "B";
    review.AconstraintsPass = true; review.BconstraintsPass = true;
  }
  await fs.writeFile(path.join(directory, "review.json"), JSON.stringify(reviews));
  const trained = run("train");
  assert.equal(trained.status, 0, trained.stderr);
  assert.equal(JSON.parse(await fs.readFile(path.join(directory, "learned-policy.json"), "utf8")).status, "validated");
});
