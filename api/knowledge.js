// =====================================================
// ARI REBIRTH
// File: api/knowledge.js
// Version: 8.0.1-experimental
// Purpose: lean server-side OpenAI cognitive authority transport.
// =====================================================
const OPENAI_URL = process.env.OPENAI_CHAT_COMPLETIONS_URL || "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_REASONING_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
const TIMEOUT_MS = positiveInt(process.env.OPENAI_REASONING_TIMEOUT_MS, 90000);
const MAX_TOKENS = positiveInt(process.env.OPENAI_REASONING_MAX_TOKENS, 8000);

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json(failure("method_not_allowed", "Method not allowed."));
  if (!process.env.OPENAI_API_KEY) return res.status(500).json(failure("missing_environment_configuration", "Missing OPENAI_API_KEY."));
  const started = Date.now();
  try {
    const body = await bodyOf(req);
    const packet = object(body.cognitivePacket);
    const requestText = firstText([body.requestText, packet.requestText, packet.request?.effective, packet.request?.resolved, packet.request?.original, packet.currentTurn?.effectiveText, packet.currentTurn?.originalText, body.message]);
    if (!requestText) return res.status(400).json(failure("request_text_missing", "No usable user request was supplied."));
    const context = { request: packet.request || { effective: requestText }, currentTurn: packet.currentTurn || null, continuity: packet.continuity || packet.continuityContext || null, memory: packet.memory || packet.memoryContext || null, evidence: packet.evidence || packet.evidenceContext || null, knowledge: packet.knowledge || packet.knowledgeContext || null, preferences: packet.preferenceContext || body.preferenceContext || null, restrictions: packet.restrictions || packet.safety || body.restrictions || null, applicationContext: packet.applicationContext || body.applicationContext || null, developerContext: packet.developerContext || body.developerContext || null, operationContract: body.operationContract || packet.operationContract || null, instructions: body.instructions || packet.instructions || null };
    const developerPrompt = `You are the primary cognitive intelligence for ARI Rebirth.
Interpret the user's meaning yourself. Reason from supplied evidence and context. Decide what matters, choose the response strategy, and write the authoritative user-facing answer.
Do not expose private chain-of-thought. Return conclusions and concise rationale only when useful.
Do not claim an app action, tool call, persistence operation, or external side effect occurred unless supplied context proves it occurred.
Treat explicit safety and authorization restrictions in supplied context as binding. Communication preferences control style but do not override safety, factual accuracy, or authorization.
Do not let local labels, intent names, semantic categories, missing registries, or validator expectations prevent you from understanding an otherwise understandable request.
Do not require a canonical semantic-operation registry merely to answer conversationally.
If an application operation is appropriate but not authorized or executed, propose it rather than claiming completion.
Return JSON only with: interpretation, semanticFrame, reasoningDecision, responseStrategy, authoritativeDraft, proposedActions, evidenceReferences, warnings.`;
    const userPrompt = `USER REQUEST:\n${requestText}\n\nARI CONTEXT:\n${safeJson(context)}`;
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT_MS); let response;
    try { response = await fetch(OPENAI_URL, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` }, signal: controller.signal, body: JSON.stringify({ model: MODEL, messages: [{ role: "developer", content: developerPrompt }, { role: "user", content: userPrompt }], response_format: { type: "json_object" }, max_tokens: MAX_TOKENS }) }); }
    finally { clearTimeout(timer); }
    const raw = await response.text(); let provider; try { provider = raw ? JSON.parse(raw) : {}; } catch { provider = {}; }
    if (!response.ok) return res.status(response.status || 502).json({ ...failure("openai_provider_failure", provider?.error?.message || raw || "OpenAI request failed."), model: MODEL, providerError: provider?.error || null, timing: { totalMs: Date.now() - started } });
    const modelText = firstText([provider?.choices?.[0]?.message?.content, provider?.output_text]);
    if (!modelText) return res.status(502).json(failure("openai_empty_output", "OpenAI returned no cognitive output."));
    let result; try { result = JSON.parse(modelText); } catch { result = { interpretation: { summary: requestText, primaryIntent: "openai_interpreted_request" }, semanticFrame: { primaryIntent: "openai_interpreted_request", topic: null, userGoal: requestText }, reasoningDecision: { answerable: true, decision: "respond" }, responseStrategy: { mode: "direct", tone: "adaptive", requirements: [] }, authoritativeDraft: modelText, proposedActions: [], evidenceReferences: [], warnings: ["provider_output_was_not_json"] }; }
    const draft = firstText([result.authoritativeDraft, result.draftResponse, result.responseText]);
    if (!draft) return res.status(502).json(failure("authoritative_draft_missing", "OpenAI did not return an authoritative response draft."));
    const cognitiveReasoningResult = { ...result, authoritativeDraft: draft, draftResponse: draft, semanticFrame: object(result.semanticFrame, { primaryIntent: "openai_interpreted_request" }), responseStrategy: object(result.responseStrategy, { mode: "direct" }), model: MODEL, source: "openai", ready: true, modelInvocation: { available: true, attempted: true, succeeded: true, model: MODEL, source: "api/knowledge.js", usage: provider?.usage || null }, authority: { semanticSource: "openai", reasoningSource: "openai", responseStrategySource: "openai", draftSource: "openai" } };
    return res.status(200).json({ success: true, ready: true, source: "openai_reasoning", model: MODEL, cognitiveReasoningResult, result: cognitiveReasoningResult, authoritativeDraft: draft, timing: { totalMs: Date.now() - started } });
  } catch (error) {
    const timeout = error?.name === "AbortError";
    return res.status(timeout ? 504 : 500).json({ ...failure(timeout ? "openai_reasoning_timeout" : "knowledge_api_failure", timeout ? "OpenAI reasoning request timed out." : (error?.message || "Knowledge API failure.")), model: MODEL, timing: { totalMs: Date.now() - started } });
  }
}
function failure(code, message) { return { success: false, ready: false, error: message, failureType: code, source: "knowledge_api" }; }
function object(value, fallback = {}) { return value && typeof value === "object" && !Array.isArray(value) ? value : fallback; }
function firstText(values = []) { for (const value of values) if (typeof value === "string" && value.trim()) return value.trim(); return ""; }
function positiveInt(value, fallback) { const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback; }
function safeJson(value) { try { return JSON.stringify(value); } catch { return "{}"; } }
async function bodyOf(req) { if (req.body && typeof req.body === "object") return req.body; if (typeof req.body === "string") return JSON.parse(req.body || "{}"); const chunks = []; for await (const chunk of req) chunks.push(chunk); const text = Buffer.concat(chunks).toString("utf8"); return text ? JSON.parse(text) : {}; }
function setHeaders(res) { res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS"); res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization"); }