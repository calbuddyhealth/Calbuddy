// ARI vNext — Phase 11C deterministic evaluation engine.
// This module evaluates already-produced safe structured results. It never calls
// a model, reads/writes application data, or executes an application mutation.

export const ARI_EVAL_ENGINE_VERSION = "11C.1.0";

const FORBIDDEN_FIXTURE_KEYS = new Set([
  "prompt",
  "prompts",
  "message",
  "messages",
  "userMessage",
  "reply",
  "responseText",
  "reasoning",
  "chainOfThought",
  "hiddenReasoning",
  "toolArguments",
  "arguments",
  "memoryPayload",
  "appState",
  "secret",
  "secrets"
]);

const VALID_SEVERITIES = new Set(["fail", "warn"]);
const VALID_MATCHERS = new Set(["exact", "oneOf", "range", "exists", "absent"]);

export function defineAriEvalScenario(input = {}) {
  const scenario = normalizeScenario(input);
  const privacy = validateScenarioPrivacy(scenario);
  if (!privacy.ok) {
    const error = new Error(`Invalid ARI eval scenario: ${privacy.code}`);
    error.code = privacy.code;
    throw error;
  }
  return Object.freeze(scenario);
}

export function evaluateAriScenario({ scenario = {}, actual = {} } = {}) {
  const normalized = normalizeScenario(scenario);
  const privacy = validateScenarioPrivacy(normalized);
  if (!privacy.ok) {
    return scenarioResult(normalized, "fail", [{ code: privacy.code, severity: "fail", path: privacy.path || null }]);
  }

  const findings = [];
  for (const expectation of normalized.expectations) {
    const finding = evaluateExpectation(expectation, actual);
    if (finding) findings.push(finding);
  }

  const status = findings.some((item) => item.severity === "fail")
    ? "fail"
    : findings.some((item) => item.severity === "warn")
      ? "warn"
      : "pass";

  return scenarioResult(normalized, status, findings);
}

export function evaluateAriSuite({ suiteId = "ari_eval_suite", scenarios = [], actualById = {} } = {}) {
  const results = scenarios.map((scenario) => {
    const normalized = normalizeScenario(scenario);
    return evaluateAriScenario({
      scenario: normalized,
      actual: Object.prototype.hasOwnProperty.call(actualById, normalized.id) ? actualById[normalized.id] : {}
    });
  });

  const counts = results.reduce((acc, result) => {
    acc[result.status] = Number(acc[result.status] || 0) + 1;
    return acc;
  }, { pass: 0, warn: 0, fail: 0 });

  return {
    version: ARI_EVAL_ENGINE_VERSION,
    suiteId: clean(suiteId, 120) || "ari_eval_suite",
    status: counts.fail > 0 ? "fail" : counts.warn > 0 ? "warn" : "pass",
    counts,
    results
  };
}

export function expectation(path, matcher, expected, options = {}) {
  const normalizedMatcher = clean(matcher, 24);
  if (!VALID_MATCHERS.has(normalizedMatcher)) throw new Error(`Unsupported ARI eval matcher: ${normalizedMatcher}`);
  const severity = VALID_SEVERITIES.has(options?.severity) ? options.severity : "fail";
  return Object.freeze({
    path: clean(path, 180),
    matcher: normalizedMatcher,
    expected: cloneSafe(expected),
    severity,
    optional: options?.optional === true,
    code: clean(options?.code, 120) || `expect_${normalizedMatcher}`
  });
}

export function validateScenarioPrivacy(scenario = {}) {
  const hit = findForbiddenKey(scenario);
  if (hit) return { ok: false, code: "forbidden_fixture_field", path: hit };
  return { ok: true, code: "ok", path: null };
}

function evaluateExpectation(expectation = {}, actual = {}) {
  const path = clean(expectation.path, 180);
  const valueResult = getPath(actual, path);
  const severity = VALID_SEVERITIES.has(expectation.severity) ? expectation.severity : "fail";

  if (!valueResult.exists && expectation.optional === true) return null;

  let matched = false;
  switch (expectation.matcher) {
    case "exact":
      matched = deepEqual(valueResult.value, expectation.expected);
      break;
    case "oneOf": {
      const values = Array.isArray(expectation.expected) ? expectation.expected : [];
      matched = values.some((candidate) => deepEqual(valueResult.value, candidate));
      break;
    }
    case "range": {
      const number = Number(valueResult.value);
      const min = finiteOrNull(expectation?.expected?.min);
      const max = finiteOrNull(expectation?.expected?.max);
      matched = valueResult.exists && Number.isFinite(number) && (min === null || number >= min) && (max === null || number <= max);
      break;
    }
    case "exists":
      matched = valueResult.exists;
      break;
    case "absent":
      matched = !valueResult.exists;
      break;
    default:
      matched = false;
  }

  if (matched) return null;
  return {
    code: clean(expectation.code, 120) || `expect_${expectation.matcher}`,
    severity,
    path,
    matcher: expectation.matcher,
    expected: summarizeExpected(expectation.expected),
    actual: summarizeActual(valueResult)
  };
}

function normalizeScenario(input = {}) {
  return {
    version: ARI_EVAL_ENGINE_VERSION,
    id: clean(input?.id, 160) || "unnamed_scenario",
    category: clean(input?.category, 80) || "general",
    description: clean(input?.description, 240) || null,
    tags: Array.isArray(input?.tags) ? [...new Set(input.tags.map((value) => clean(value, 60)).filter(Boolean))].slice(0, 16) : [],
    expectations: Array.isArray(input?.expectations) ? input.expectations.map(normalizeExpectation) : []
  };
}

function normalizeExpectation(value = {}) {
  const matcher = VALID_MATCHERS.has(value?.matcher) ? value.matcher : "exact";
  return {
    path: clean(value?.path, 180),
    matcher,
    expected: cloneSafe(value?.expected),
    severity: VALID_SEVERITIES.has(value?.severity) ? value.severity : "fail",
    optional: value?.optional === true,
    code: clean(value?.code, 120) || `expect_${matcher}`
  };
}

function scenarioResult(scenario, status, findings) {
  return {
    version: ARI_EVAL_ENGINE_VERSION,
    id: scenario.id,
    category: scenario.category,
    status,
    findingCount: findings.length,
    findings
  };
}

function getPath(root, path) {
  if (!path) return { exists: true, value: root };
  const parts = path.split(".").filter(Boolean);
  let cursor = root;
  for (const part of parts) {
    if (!cursor || typeof cursor !== "object" || !Object.prototype.hasOwnProperty.call(cursor, part)) {
      return { exists: false, value: undefined };
    }
    cursor = cursor[part];
  }
  return { exists: true, value: cursor };
}

function findForbiddenKey(value, path = "") {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const hit = findForbiddenKey(value[index], `${path}[${index}]`);
      if (hit) return hit;
    }
    return null;
  }
  for (const [key, nested] of Object.entries(value)) {
    const nextPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_FIXTURE_KEYS.has(key)) return nextPath;
    const hit = findForbiddenKey(nested, nextPath);
    if (hit) return hit;
  }
  return null;
}

function summarizeExpected(value) {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  if (Array.isArray(value)) return value.slice(0, 12).map(summarizeExpected);
  if (value && typeof value === "object") {
    const output = {};
    for (const key of Object.keys(value).slice(0, 12)) output[key] = summarizeExpected(value[key]);
    return output;
  }
  return null;
}

function summarizeActual(result) {
  if (!result.exists) return { exists: false };
  const value = result.value;
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return { exists: true, value };
  if (Array.isArray(value)) return { exists: true, value: value.slice(0, 12).map(summarizeExpected) };
  return { exists: true, value: "[structured]" };
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((value, index) => deepEqual(value, b[index]));
  }
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    return aKeys.length === bKeys.length && aKeys.every((key, index) => key === bKeys[index] && deepEqual(a[key], b[key]));
  }
  return false;
}

function cloneSafe(value) {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
