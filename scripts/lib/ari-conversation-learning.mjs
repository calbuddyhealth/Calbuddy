import { createHash } from "node:crypto";
import { CONVERSATION_CANDIDATES, CONVERSATION_POLICY_VERSION, FEATURE_NAMES, preferenceProbability, rankConversationCandidate } from "../../api/_lib/ari-vnext/conversation-policy.js";

const candidates = Object.keys(CONVERSATION_CANDIDATES).filter(id => id !== "baseline");
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function validatePreferenceRows(rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error("No reviewed preference rows supplied");
  const groups = new Map();
  const cases = new Map();
  const seen = new Set();
  const servedModels = new Map();
  for (const row of rows) {
    if (!row.caseId || !row.groupId || !row.model || !["train", "holdout"].includes(row.split) || !candidates.includes(row.candidate)) throw new Error("Invalid case identity, split, model or candidate");
    if (![0, 0.5, 1].includes(row.preference) || typeof row.constraintsPass !== "boolean" || typeof row.baselineConstraintsPass !== "boolean") throw new Error("Every pair requires an explicit human preference and constraint review");
    if (row.reviewSource !== "human") throw new Error("This first release requires human-reviewed comparisons");
    if (typeof row.servedModel !== "string" || !row.servedModel || (servedModels.has(row.model) && servedModels.get(row.model) !== row.servedModel)) throw new Error("Missing or inconsistent provider model identity");
    servedModels.set(row.model, row.servedModel);
    if (!Array.isArray(row.features) || row.features.length !== FEATURE_NAMES.length || !row.features.every(x => Number.isFinite(x) && x >= 0 && x <= 1) || row.features[0] !== 1) throw new Error("Invalid features");
    for (const key of ["baselineTokens", "candidateTokens", "baselineLatencyMs", "candidateLatencyMs"]) {
      if (!Number.isFinite(row[key]) || row[key] <= 0) throw new Error(`Missing measured ${key}`);
    }
    // A conversation group belongs to one case and one split, including across
    // models. Paraphrases must not be laundered into independent observations.
    const group = groups.get(row.groupId);
    if (group && (group.split !== row.split || group.caseId !== row.caseId)) throw new Error("Conversation group leakage or repeated group");
    groups.set(row.groupId, { split: row.split, caseId: row.caseId });
    const identity = `${row.model}:${row.caseId}`;
    const signature = JSON.stringify([row.groupId, row.split, row.features, row.baselineTokens, row.baselineLatencyMs, row.baselineConstraintsPass]);
    if (cases.has(identity) && cases.get(identity) !== signature) throw new Error("Inconsistent paired baseline");
    cases.set(identity, signature);
    const key = `${identity}:${row.candidate}`;
    if (seen.has(key)) throw new Error("Duplicate comparison");
    seen.add(key);
  }
  for (const identity of cases.keys()) {
    if (!candidates.every(id => seen.has(`${identity}:${id}`))) throw new Error("Every case needs every candidate, including failures");
  }
  return rows;
}

function fit(rows) {
  const weights = Array(FEATURE_NAMES.length).fill(0);
  // Fixed regularized pairwise logistic regression. No holdout labels enter
  // fitting, threshold selection or hyperparameter tuning.
  for (let epoch = 0; epoch < 250; epoch++) {
    const gradient = weights.map(weight => 0.02 * weight);
    for (const row of rows) {
      const target = row.constraintsPass ? row.preference : 0;
      const error = preferenceProbability(weights, row.features) - target;
      row.features.forEach((x, i) => { gradient[i] += error * x / rows.length; });
    }
    weights.forEach((_, i) => { weights[i] -= 0.2 * gradient[i]; });
  }
  return weights.map(x => Number(x.toFixed(8)));
}

function evaluate(weights, rows) {
  const cases = new Map();
  for (const row of rows) {
    if (!cases.has(row.caseId)) cases.set(row.caseId, []);
    cases.get(row.caseId).push(row);
  }
  let wins = 0, losses = 0, preference = 0, constraintRegressions = 0;
  let baselineTokens = 0, selectedTokens = 0, baselineLatency = 0, selectedLatency = 0, selected = 0;
  for (const comparisons of cases.values()) {
    const base = comparisons[0];
    const choice = rankConversationCandidate(weights, base.features);
    const row = comparisons.find(x => x.candidate === choice.id);
    const score = row ? (row.constraintsPass ? row.preference : 0) : 0.5;
    wins += Number(score === 1); losses += Number(score === 0); preference += score;
    constraintRegressions += Number(Boolean(row && !row.constraintsPass && base.baselineConstraintsPass));
    selected += Number(Boolean(row));
    baselineTokens += base.baselineTokens; selectedTokens += row?.candidateTokens ?? base.baselineTokens;
    baselineLatency += base.baselineLatencyMs; selectedLatency += row?.candidateLatencyMs ?? base.baselineLatencyMs;
  }
  // One-sided 95% Wilson lower bound on wins among decisive comparisons.
  const n = wins + losses, z = 1.644854, p = n ? wins / n : 0;
  const lowerBound = n ? (p + z*z/(2*n) - z*Math.sqrt(p*(1-p)/n + z*z/(4*n*n))) / (1+z*z/n) : 0;
  const groups = cases.size;
  const meanPreference = groups ? preference/groups : 0;
  const tokenRatio = baselineTokens ? selectedTokens/baselineTokens : Infinity;
  const latencyRatio = baselineLatency ? selectedLatency/baselineLatency : Infinity;
  return { groups, selected, wins, losses, ties: groups-wins-losses, lowerBound, meanPreference, constraintRegressions, tokenRatio, latencyRatio,
    passed: groups >= 20 && n >= 10 && lowerBound > 0.5 && meanPreference >= 0.55 && constraintRegressions === 0 && tokenRatio <= 1.25 && latencyRatio <= 1.25 };
}

export function trainConversationPolicy(input) {
  const rows = validatePreferenceRows(input);
  const models = {};
  for (const model of [...new Set(rows.map(row => row.model))].sort()) {
    const training = rows.filter(row => row.model === model && row.split === "train");
    const holdout = rows.filter(row => row.model === model && row.split === "holdout");
    if (new Set(training.map(row => row.groupId)).size < 20 || new Set(holdout.map(row => row.groupId)).size < 20) throw new Error("Need at least 20 independent train and 20 untouched holdout groups per model");
    const weights = Object.fromEntries(candidates.map(id => [id, fit(training.filter(row => row.candidate === id))]));
    models[model] = { weights, validation: evaluate(weights, holdout), trainingGroups: training.length/candidates.length, servedModel: training[0].servedModel };
  }
  return { version: CONVERSATION_POLICY_VERSION, status: Object.values(models).some(x => x.validation.passed) ? "validated" : "rejected", method: "paired-preference-logistic-v1", datasetDigest: digest(rows), candidateDigest: digest(CONVERSATION_CANDIDATES), featureNames: FEATURE_NAMES, models };
}
