// Durable developer task state: goal, done criteria, questions, evidence,
// revision freshness, artifacts, verification, and adaptive budget.

import {
  developerTaskBudgetDecision,
  developerTaskControllerSummary,
  normalizeDeveloperTaskController,
  startDeveloperTaskController
} from "./developer-task-controller.js";

export const ARI_DEVELOPER_TASK_EXECUTION_VERSION = "1.0.0";
const STAGES = new Set(["planning","investigating","ready_to_change","changed","verifying","verified","blocked","failed","abandoned"]);

export function createDeveloperTaskExecution({ taskId, executionSessionId, goal, completionCriteria = [], questions = [], now = null } = {}) {
  const at = iso(now) || new Date().toISOString();
  const state = {
    version: ARI_DEVELOPER_TASK_EXECUTION_VERSION,
    taskId: clean(taskId, 180),
    executionSessionId: clean(executionSessionId, 180),
    goal: clean(goal, 1200) || "Complete the requested developer task.",
    stage: questions.length ? "investigating" : "planning",
    completionCriteria: criteria(completionCriteria),
    questions: taskQuestions(questions),
    evidence: [], artifacts: [], dependencies: [],
    verification: { status: "not_requested", summary: null, evidenceRef: null },
    budget: startDeveloperTaskController(null, { now: at }),
    nextStep: null, createdAt: at, updatedAt: at, completedAt: null,
    hiddenChainOfThoughtStored: false
  };
  if (!state.completionCriteria.length) state.completionCriteria = [{ id: "criterion_1", label: "Requested behavior is implemented and verified by observable evidence.", status: "pending", evidenceRefs: [] }];
  return refresh(state);
}

export function normalizeDeveloperTaskExecution(value = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const taskId = clean(value.taskId, 180), executionSessionId = clean(value.executionSessionId, 180);
  if (!taskId || !executionSessionId) return null;
  return {
    version: ARI_DEVELOPER_TASK_EXECUTION_VERSION,
    taskId, executionSessionId,
    goal: clean(value.goal, 1200) || "Complete the requested developer task.",
    stage: STAGES.has(value.stage) ? value.stage : "planning",
    completionCriteria: criteria(value.completionCriteria),
    questions: taskQuestions(value.questions),
    evidence: (Array.isArray(value.evidence) ? value.evidence : []).filter(Boolean).slice(-48),
    artifacts: (Array.isArray(value.artifacts) ? value.artifacts : []).filter(Boolean).slice(-24),
    dependencies: (Array.isArray(value.dependencies) ? value.dependencies : []).filter(Boolean).slice(0, 24),
    verification: verification(value.verification),
    budget: normalizeDeveloperTaskController(value.budget) || startDeveloperTaskController(),
    nextStep: clean(value.nextStep, 1200) || null,
    createdAt: iso(value.createdAt), updatedAt: iso(value.updatedAt), completedAt: iso(value.completedAt),
    hiddenChainOfThoughtStored: false
  };
}

export function recordDeveloperTaskEvidence(state, item = {}) {
  const base = must(state);
  const source = clean(item.source, 420) || null, revision = clean(item.revision, 160) || null, summary = clean(item.summary, 700);
  const same = base.evidence.find(e => source && revision && e.source === source && e.revision === revision && e.summary === summary);
  if (same) return { state: base, evidence: same, reused: true, revisionChanged: false };
  const changed = Boolean(source && revision && base.evidence.some(e => e.source === source && e.revision && e.revision !== revision && e.stale !== true));
  const evidence = base.evidence.map(e => changed && e.source === source && e.revision !== revision ? { ...e, stale: true } : e);
  const entry = {
    id: clean(item.id, 180) || `evidence_${hash(`${source}|${revision}|${summary}|${Date.now()}`)}`,
    kind: clean(item.kind, 80) || "observation", source, revision,
    summary: summary || "Evidence observed.", verified: item.verified === true, stale: false,
    observedAt: iso(item.observedAt) || new Date().toISOString()
  };
  evidence.push(entry);
  const resolved = new Set((item.resolvesQuestionIds || []).map(x => clean(x, 120)));
  const satisfied = new Set((item.criterionIds || []).map(x => clean(x, 120)));
  const questions = base.questions.map(q => resolved.has(q.id) ? { ...q, status: "resolved", evidenceRefs: unique([...q.evidenceRefs, entry.id]) } : q);
  const completionCriteria = base.completionCriteria.map(c => satisfied.has(c.id) && entry.verified ? { ...c, status: "satisfied", evidenceRefs: unique([...c.evidenceRefs, entry.id]) } : c);
  return { state: refresh({ ...base, evidence: evidence.slice(-48), questions, completionCriteria, stage: questions.some(q => q.status === "open") ? "investigating" : readyStage(base.stage) }), evidence: entry, reused: false, revisionChanged: changed };
}

export function planDeveloperEvidenceBatch(state, maxItems = 4) {
  const base = must(state), resolved = new Set(base.questions.filter(q => q.status === "resolved").map(q => q.id));
  const selected = [], resources = new Set();
  for (const q of base.questions) {
    if (q.status !== "open" || !q.operation || !q.dependsOn.every(id => resolved.has(id) || !base.questions.some(x => x.id === id))) continue;
    const key = q.resourceKey || q.id;
    if (resources.has(key)) continue;
    selected.push({ questionId: q.id, operation: q.operation, resourceKey: key }); resources.add(key);
    if (selected.length >= Math.max(1, Math.min(8, Number(maxItems) || 4))) break;
  }
  return { count: selected.length, operations: selected, independent: selected.length > 1 };
}

export function recordDeveloperTaskArtifact(state, artifact = {}) {
  const base = must(state);
  const normalized = { id: clean(artifact.id, 180) || `artifact_${hash(JSON.stringify(artifact))}`, kind: clean(artifact.kind, 80) || "artifact", label: clean(artifact.label, 300) || "artifact", locator: clean(artifact.locator || artifact.url || artifact.ref, 700) || null, revision: clean(artifact.revision, 160) || null, verified: artifact.verified === true };
  const map = new Map(base.artifacts.map(a => [a.id, a])); map.set(normalized.id, normalized);
  return refresh({ ...base, artifacts: [...map.values()].slice(-24), stage: normalized.kind === "code_commit" ? "changed" : base.stage });
}

export function markDeveloperTaskVerification(state, { status, summary = "", evidenceRef = null, criterionIds = [] } = {}) {
  const base = must(state), s = ["not_requested","requested","attempted","passed","failed"].includes(status) ? status : "attempted";
  const ids = new Set(criterionIds.map(x => clean(x, 120))), ref = clean(evidenceRef, 180) || null;
  const completionCriteria = base.completionCriteria.map(c => ids.has(c.id) ? { ...c, status: s === "passed" ? "satisfied" : s === "failed" ? "failed" : c.status, evidenceRefs: ref ? unique([...c.evidenceRefs, ref]) : c.evidenceRefs } : c);
  let stage = ["requested","attempted"].includes(s) ? "verifying" : s === "failed" ? "blocked" : base.stage;
  if (s === "passed") stage = completionCriteria.every(c => c.status === "satisfied") && !base.questions.some(q => q.status === "open") ? "verified" : "ready_to_change";
  return refresh({ ...base, completionCriteria, verification: { status: s, summary: clean(summary, 900) || null, evidenceRef: ref }, stage, completedAt: stage === "verified" ? new Date().toISOString() : null });
}

export function updateDeveloperTaskBudget(state, budget) {
  const base = must(state), normalized = normalizeDeveloperTaskController(budget);
  return normalized ? refresh({ ...base, budget: normalized }) : base;
}

export function developerTaskCompletionDecision(state) {
  const base = must(state), openQuestions = base.questions.filter(q => q.status === "open").length, pendingCriteria = base.completionCriteria.filter(c => c.status !== "satisfied").length;
  const complete = base.verification.status === "passed" && openQuestions === 0 && pendingCriteria === 0;
  return { complete, openQuestions, pendingCriteria, verification: base.verification.status, budget: developerTaskBudgetDecision(base.budget), reason: complete ? "completion_criteria_and_verification_passed" : openQuestions ? "unresolved_questions_remain" : base.verification.status !== "passed" ? "verification_not_passed" : "completion_criteria_pending" };
}

export function publicDeveloperTaskExecution(state) {
  const base = must(state);
  return { ...base, budget: developerTaskControllerSummary(base.budget), completion: developerTaskCompletionDecision(base), hiddenChainOfThoughtStored: false };
}

export function deriveDeveloperTaskNextStep(state) {
  const base = state || {}, budget = developerTaskBudgetDecision(base.budget);
  if (!budget.continue) return `Resume from the highest-value unresolved step after the ${budget.reason} pause.`;
  const open = (base.questions || []).find(q => q.status === "open");
  if (open) return `Resolve: ${open.text}`;
  if (base.stage === "planning") return "Define unresolved questions and the smallest evidence needed before changing code.";
  if (base.stage === "ready_to_change") return "Apply the smallest evidence-supported change on an isolated task branch.";
  if (base.stage === "changed") return "Run verification against the exact changed revision.";
  if (base.stage === "verifying") return "Inspect the verification result before claiming completion.";
  if (base.stage === "blocked") return "Change approach using the blocking evidence; do not repeat the same failed step.";
  if (base.stage === "verified") return "Completion criteria and verification passed.";
  return "Choose the smallest evidence-producing next action.";
}

function refresh(value) { const base = normalizeDeveloperTaskExecution({ ...value, updatedAt: new Date().toISOString() }); return { ...base, nextStep: deriveDeveloperTaskNextStep(base) }; }
function must(value) { const state = normalizeDeveloperTaskExecution(value); if (!state) throw new Error("Valid developer task state required."); return state; }
function readyStage(stage) { return ["changed","verifying","verified"].includes(stage) ? stage : "ready_to_change"; }
function criteria(items) { return (Array.isArray(items) ? items : []).map((x,i) => typeof x === "string" ? { id:`criterion_${i+1}`,label:clean(x,700),status:"pending",evidenceRefs:[] } : { id:clean(x?.id,120)||`criterion_${i+1}`,label:clean(x?.label||x?.text,700),status:["pending","satisfied","failed"].includes(x?.status)?x.status:"pending",evidenceRefs:unique((x?.evidenceRefs||[]).map(v=>clean(v,180))) }).filter(x=>x.label).slice(0,20); }
function taskQuestions(items) { return (Array.isArray(items) ? items : []).map((x,i) => typeof x === "string" ? { id:`question_${i+1}`,text:clean(x,900),status:"open",dependsOn:[],operation:null,resourceKey:null,evidenceRefs:[] } : { id:clean(x?.id,120)||`question_${i+1}`,text:clean(x?.text||x?.question,900),status:["open","resolved","blocked"].includes(x?.status)?x.status:"open",dependsOn:unique((x?.dependsOn||[]).map(v=>clean(v,120))),operation:x?.operation&&typeof x.operation==="object"?{name:clean(x.operation.name,120),arguments:x.operation.arguments||{}}:null,resourceKey:clean(x?.resourceKey,240)||null,evidenceRefs:unique((x?.evidenceRefs||[]).map(v=>clean(v,180))) }).filter(x=>x.text).slice(0,32); }
function verification(v={}) { return { status:["not_requested","requested","attempted","passed","failed"].includes(v?.status)?v.status:"not_requested",summary:clean(v?.summary,900)||null,evidenceRef:clean(v?.evidenceRef,180)||null }; }
function unique(items=[]) { return [...new Set(items.filter(Boolean))].slice(-8); }
function iso(v) { const t=Date.parse(String(v||"")); return Number.isFinite(t)?new Date(t).toISOString():null; }
function hash(v="") { let h=2166136261; for(const ch of String(v)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);} return (h>>>0).toString(16).padStart(8,"0"); }
function clean(v,max=1000){return String(v??"").replace(/\s+/g," ").trim().slice(0,max);}
