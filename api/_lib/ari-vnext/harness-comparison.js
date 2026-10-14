import { createHash, randomInt } from "node:crypto";

export const COMPARISON_VERSION = "1.0.0";
export const COMPARISON_SCOPE = "Current deterministic Ari prompt layers versus basic instructions; shared synthetic input, no tools, council, repair loops, personal memory, or learning writes. This is a response-only pilot, not a full-runtime evaluation.";
export const COMPARISON_CASES = [
  { id: "constraints", title: "Keep changing requirements", prompt: "Write exactly three numbered implementation steps for a notifications panel. Requirements: raise it 24 pixels; preserve keyboard access; change no message navigation. Update: raise it 40 pixels instead of 24. Each step must have fewer than 20 words. No code." },
  { id: "debugging", title: "Recover from failed fixes", prompt: "Analyze this synthetic bug; do not claim you ran tests. The back button works before Send. Send replaces the header DOM node. A click listener was attached to the old button during initialization. Raising z-index and adding padding both failed. State the likely cause, a minimal fix, and one behavioral verification in under 120 words." },
  { id: "evidence", title: "Avoid unsupported success claims", prompt: "Answer in under 70 words. A deployment API returns state=BUILDING and an older deployment returns state=READY. A CI check is still pending. Can we tell the owner that the latest change is deployed successfully? Explain exactly what is and is not verified." },
  { id: "reasoning", title: "Reason from the supplied evidence", prompt: "A box contains 3 red and 2 blue balls. Two balls are drawn without replacement. Given that at least one is red, what is the probability both are red? Give the exact fraction and a brief checkable explanation in under 100 words." },
  { id: "story", title: "Follow creative constraints", prompt: "Write a modern horror story of 100–140 words, set in a hospital. No gore, candles, or dream ending. Include the exact sentence: The radio answered in my voice. End with one unsettling sentence. Output only the story." },
  { id: "uncertainty", title: "Handle an unresolved question", prompt: "Someone deliberately buried bags of new clothes in my family's yard decades ago. Nobody knows who or why. Was it a ritual? Start with I don't know. Give a respectful answer of no more than 45 words. Distinguish the known intentional burial from an unknown motive without inventing an explanation." }
];

export function comparisonBody({ prepared, variant, model }) {
  if (!prepared?.instructions || !prepared?.baselineInstructions || !Array.isArray(prepared?.input)) throw new Error("Invalid comparison preparation.");
  if (!["with_harness", "without_harness"].includes(variant)) throw new Error("Invalid variant.");
  if (!/^gpt-[a-z0-9.-]*sol$/i.test(model || "")) throw new Error("Comparison requires an explicit SOL model.");
  return { model, instructions: (variant === "with_harness" ? prepared.instructions : prepared.baselineInstructions) + "\nFor this response no tools are available. Use only the supplied facts. Do not claim external actions or lookups occurred.",
    input: structuredClone(prepared.input), reasoning: { effort: "high" }, max_output_tokens: 4096, store: false };
}

export async function runComparisonPair({ prepared, model, apiKey, fetchImpl = fetch, url = "https://api.openai.com/v1/responses", firstVariant } = {}) {
  if (!apiKey) throw new Error("Provider connection is not configured.");
  const first = firstVariant || (randomInt(2) ? "with_harness" : "without_harness");
  if (!["with_harness", "without_harness"].includes(first)) throw new Error("Invalid order.");
  const order = [first, first === "with_harness" ? "without_harness" : "with_harness"];
  const results = [];
  for (const variant of order) {
    const body = comparisonBody({ prepared, variant, model });
    const started = Date.now();
    try {
      const response = await fetchImpl(url, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(55000) });
      const data = await response.json();
      const answer = (data.output || []).filter(x => x.type === "message").flatMap(x => x.content || []).filter(x => x.type === "output_text").map(x => x.text).join("\n");
      const valid = response.ok && data.status === "completed" && data.model === model && Boolean(answer.trim());
      results.push({ variant, valid, answer, status: response.status, providerStatus: data.status || null,
        error: valid ? null : "Provider error, incomplete answer, or model mismatch; exclude this pair from preference totals.",
        model: data.model || model, latencyMs: Date.now() - started, usage: data.usage || null,
        providerRequestId: data.id || null, instructionCharacters: body.instructions.length });
    } catch {
      results.push({ variant, valid: false, answer: "", error: "Provider request failed or timed out. No automatic retry.", model, latencyMs: Date.now() - started });
    }
  }
  // Presentation order is randomized separately from execution order.
  if (randomInt(2)) results.reverse();
  return { version: COMPARISON_VERSION, scope: COMPARISON_SCOPE, valid: results.every(x => x.valid),
    model, reasoningEffort: "high", maxOutputTokens: 4096, toolsEnabled: false,
    inputHash: createHash("sha256").update(JSON.stringify(prepared.input)).digest("hex"),
    tier: prepared.tier, candidates: results.map((x, i) => ({ label: i ? "B" : "A", ...x })) };
}
