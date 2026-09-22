import { readFile } from "node:fs/promises";
import process from "node:process";

import {
  buildCausalRunPlan,
  validateCausalPreregistration
} from "../api/_lib/ari-vnext/internal-state-causal-harness.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/ari-internal-state-preregistration-check.mjs <preregistration.json>");
  process.exit(2);
}

let parsed;
try {
  parsed = JSON.parse(await readFile(file, "utf8"));
} catch (error) {
  console.error(`Unable to read preregistration: ${error?.message || error}`);
  process.exit(2);
}

const checked = validateCausalPreregistration(parsed);
if (!checked.valid) {
  console.error("Preregistration rejected:");
  for (const error of checked.errors) console.error(`- ${error}`);
  process.exit(1);
}

const plan = buildCausalRunPlan({
  spec: parsed,
  runMeta: { runId: "preregistration-dry-run" },
  seed: `${parsed.experimentId}|preflight`
});

console.log(JSON.stringify({
  valid: true,
  experimentId: parsed.experimentId,
  mechanismId: parsed.mechanismId,
  expectedTrialsPerRun: plan.plan.length,
  repetitionsPerPromptPerCondition: parsed.repetitionsPerPromptPerCondition,
  taskFamilyCount: parsed.taskFamilies.length,
  conditionCount: 4,
  conditionBlindEvaluator: parsed.evaluator.conditionBlind === true,
  selfReportExcluded: parsed.evaluator.selfReportExcluded === true,
  note: "Validation only. This command does not call a model or execute an experiment."
}, null, 2));
