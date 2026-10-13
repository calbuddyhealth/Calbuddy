import fs from "node:fs/promises";
import path from "node:path";
import { randomInt, createHash } from "node:crypto";
import { runAriVNext } from "../api/_lib/ari-vnext/orchestrator.js";
import { CANDIDATE_DIGEST, CONVERSATION_CANDIDATES, conversationFeatures, conversationPolicyInstruction, conversationPolicyEligibility } from "../api/_lib/ari-vnext/conversation-policy.js";
import { routeContext } from "../api/_lib/ari-vnext/context-router.js";
import { classifySafety } from "../api/_lib/ari-vnext/safety-policy.js";
import policyArtifact from "../api/_lib/ari-vnext/conversation-policy-artifact.js";
import { trainConversationPolicy } from "./lib/ari-conversation-learning.mjs";

const [command, directory, ...args] = process.argv.slice(2);
const read = async file => JSON.parse(await fs.readFile(file, "utf8"));
const write = async (file, value) => fs.writeFile(file, JSON.stringify(value, null, 2) + "\n", { flag: "wx", mode: 0o600 });
const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const jsonl = async file => {
  try { return (await fs.readFile(file, "utf8")).split("\n").filter(Boolean).map(line => JSON.parse(line)); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
};

async function prepare() {
  const cases = await read(args[0] || "tests/fixtures/ari-conversation-learning.json");
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const requests = [];
  const fetchOriginal = globalThis.fetch;
  const keyOriginal = process.env.OPENAI_API_KEY;
  const artifactStatus = policyArtifact.status;
  const seen = new Set();
  try {
    // Capture the real runtime's first request. This command never connects to
    // any service and cannot execute application actions or persist memory.
    process.env.OPENAI_API_KEY = "offline-capture-only";
    // This isolated offline process captures the plain baseline, even after a
    // prior learned artifact is deployed. Do not compound prompt strategies.
    policyArtifact.status = "untrained";
    for (const item of cases) {
      if (!item.id || !item.groupId || seen.has(item.id) || !["train", "holdout"].includes(item.split)) throw new Error("Invalid or duplicate evaluation case");
      seen.add(item.id);
      let body;
      globalThis.fetch = async (url, options) => {
        if (!body && String(url).endsWith("/responses")) body = JSON.parse(options.body);
        throw new Error("Offline evaluation capture: networking disabled");
      };
      const turn = { message: item.message, history: item.history || [], context: { intelligenceEntitlement: { ownerEligible: true, advancedEnabled: true, accessClass: "owner" } } };
      const route = routeContext(turn);
      if (conversationPolicyEligibility({ policy: { accessClass: "owner" }, route, safety: classifySafety(turn, route) })) throw new Error(`Case ${item.id} is outside the runtime's evaluated conversation scope`);
      await runAriVNext(turn).catch(() => {});
      if (!body || body.previous_response_id) throw new Error(`Could not capture a fresh request for ${item.id}`);
      for (const candidate of Object.keys(CONVERSATION_CANDIDATES)) {
        requests.push({ id: `${item.id}:${candidate}`, caseId: item.id, groupId: item.groupId, split: item.split, candidate, features: conversationFeatures(turn), message: item.message, history: item.history || [],
          body: { ...body, instructions: body.instructions + conversationPolicyInstruction(candidate), store: false } });
      }
    }
  } finally {
    globalThis.fetch = fetchOriginal;
    policyArtifact.status = artifactStatus;
    if (keyOriginal === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = keyOriginal;
  }
  await write(path.join(directory, "manifest.json"), { version: 1, candidateDigest: CANDIDATE_DIGEST, requests, digest: hash(requests) });
  console.log(`Prepared ${requests.length} requests without API calls. No training labels or weights fabricated.`);
}

async function collect() {
  const maxCalls = Number(args[0]), maxReservedOutputTokens = Number(args[1]);
  if (!Number.isInteger(maxCalls) || maxCalls < 1 || maxCalls > 200 || !Number.isInteger(maxReservedOutputTokens) || maxReservedOutputTokens < 1) throw new Error("collect requires explicit max calls (1–200) and total reserved output-token budget");
  const key = process.env.ARI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Provider key unavailable; no requests made");
  const manifest = await read(path.join(directory, "manifest.json"));
  if (manifest.candidateDigest !== CANDIDATE_DIGEST || manifest.digest !== hash(manifest.requests)) throw new Error("Manifest or candidate catalog changed");
  const file = path.join(directory, "responses.jsonl");
  const records = await jsonl(file);
  if (records.some(r => r.digest !== manifest.digest)) throw new Error("Response journal belongs to a different manifest");
  const started = records.filter(r => r.status === "started");
  const attempted = new Set(started.map(r => r.id));
  let calls = started.length, reserved = started.reduce((sum, r) => sum + r.reservedOutputTokens, 0);
  const append = row => fs.appendFile(file, JSON.stringify({ ...row, digest: manifest.digest }) + "\n", { mode: 0o600 });
  // Deterministic interleaving avoids always timing baseline first.
  const pending = [...manifest.requests].sort((a,b) => hash(a.id).localeCompare(hash(b.id)));
  for (const request of pending) {
    if (attempted.has(request.id)) continue;
    const allowance = request.body.max_output_tokens;
    if (!Number.isInteger(allowance) || allowance < 1) throw new Error("Request has no bounded output allowance");
    if (calls >= maxCalls || reserved + allowance > maxReservedOutputTokens) break;
    calls++; reserved += allowance;
    await append({ id: request.id, status: "started", reservedOutputTokens: allowance });
    const at = Date.now();
    try {
      const response = await fetch(process.env.ARI_RESPONSES_URL || process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses", {
        method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(request.body), signal: AbortSignal.timeout(60000)
      });
      const data = await response.json();
      const text = (data.output || []).filter(x => x.type === "message").flatMap(x => x.content || []).map(x => x.text || x.refusal || "").join("\n");
      const usable = response.ok && data.status !== "incomplete" && Boolean(text) && !(data.output || []).some(x => x.type === "function_call");
      await append({ id: request.id, status: usable ? "completed" : "failed", httpStatus: response.status, reply: text, usage: data.usage || null, model: data.model || null, latencyMs: Date.now()-at });
    } catch {
      await append({ id: request.id, status: "failed", latencyMs: Date.now()-at });
    }
  }
  console.log(`Journal has ${calls} attempted calls; ${reserved} output tokens reserved. No automatic retries or tool execution.`);
}

async function review() {
  const manifest = await read(path.join(directory, "manifest.json"));
  const records = await jsonl(path.join(directory, "responses.jsonl"));
  if (manifest.candidateDigest !== CANDIDATE_DIGEST || manifest.digest !== hash(manifest.requests) || records.some(r => r.digest !== manifest.digest)) throw new Error("Manifest mismatch");
  const latest = new Map(records.map(r => [r.id, r]));
  const comparisons = [], keys = [];
  for (const request of manifest.requests.filter(r => r.candidate !== "baseline")) {
    const baseline = latest.get(`${request.caseId}:baseline`), candidate = latest.get(request.id);
    if (baseline?.status !== "completed" || candidate?.status !== "completed") throw new Error("All cases, including failures, must be resolved before review; incomplete runs cannot be cherry-picked");
    const candidateIsA = randomInt(2) === 0;
    const id = hash(request.id).slice(0, 20);
    comparisons.push({ id, message: request.message, history: request.history, A: candidateIsA ? candidate.reply : baseline.reply, B: candidateIsA ? baseline.reply : candidate.reply,
      winner: null, AconstraintsPass: null, BconstraintsPass: null,
      rubric: "Choose A, B or tie for intent fidelity, natural conversation, useful specificity, continuity, and calibrated uncertainty. Check factual grounding, explicit preferences, no invented memories/actions, and applicable safety separately. Do not reward length, agreement, engagement or refusal evasion." });
    keys.push({ id, requestId: request.id, candidateIsA });
  }
  await write(path.join(directory, "review.json"), comparisons.sort((a,b) => a.id.localeCompare(b.id)));
  await write(path.join(directory, "review-key.json"), { digest: manifest.digest, keys });
  console.log("Created blind review.json and separate review-key.json. Human ratings are required.");
}

async function train() {
  const manifest = await read(path.join(directory, "manifest.json"));
  const key = await read(path.join(directory, "review-key.json"));
  const reviews = await read(path.join(directory, "review.json"));
  const records = await jsonl(path.join(directory, "responses.jsonl"));
  if (manifest.candidateDigest !== CANDIDATE_DIGEST || manifest.digest !== hash(manifest.requests) || key.digest !== manifest.digest || records.some(r => r.digest !== manifest.digest)) throw new Error("Manifest mismatch");
  const latest = new Map(records.map(r => [r.id, r]));
  if (new Set(reviews.map(r => r.id)).size !== reviews.length || reviews.length !== key.keys.length) throw new Error("Missing or duplicate reviews");
  const rows = key.keys.map(pair => {
    const request = manifest.requests.find(r => r.id === pair.requestId);
    const rating = reviews.find(r => r.id === pair.id);
    if (!rating || !["A", "B", "tie"].includes(rating.winner) || typeof rating.AconstraintsPass !== "boolean" || typeof rating.BconstraintsPass !== "boolean") throw new Error("Every comparison needs an explicit human rating");
    const base = latest.get(`${request.caseId}:baseline`), candidate = latest.get(request.id);
    if (base?.status !== "completed" || candidate?.status !== "completed" || base.model !== candidate.model) throw new Error("Invalid or unmatched measured responses");
    const { caseId, groupId, split, features } = request;
    return { caseId, groupId, split, features, model: request.body.model, servedModel: base.model, candidate: request.candidate, reviewSource: "human",
      preference: rating.winner === "tie" ? 0.5 : Number(rating.winner === (pair.candidateIsA ? "A" : "B")),
      constraintsPass: pair.candidateIsA ? rating.AconstraintsPass : rating.BconstraintsPass,
      baselineConstraintsPass: pair.candidateIsA ? rating.BconstraintsPass : rating.AconstraintsPass,
      baselineTokens: base.usage?.total_tokens, candidateTokens: candidate.usage?.total_tokens, baselineLatencyMs: base.latencyMs, candidateLatencyMs: candidate.latencyMs };
  });
  const learned = trainConversationPolicy(rows);
  await write(path.join(directory, "learned-policy.json"), learned);
  console.log(JSON.stringify({ status: learned.status, models: Object.fromEntries(Object.entries(learned.models).map(([id,m]) => [id,m.validation])) }, null, 2));
}

try {
  if (!directory || !["prepare", "collect", "review", "train"].includes(command)) throw new Error("Usage: node scripts/ari-conversation-learning.mjs prepare|collect|review|train .ari-private/learning/run [cases.json | maxCalls maxReservedOutputTokens]");
  if (command === "collect") {
    const lockPath = path.join(directory, "collect.lock");
    const lock = await fs.open(lockPath, "wx", 0o600);
    try { await collect(); } finally { await lock.close(); await fs.unlink(lockPath); }
  } else await ({ prepare, review, train })[command]();
} catch (error) { console.error(error.message); process.exitCode = 1; }
