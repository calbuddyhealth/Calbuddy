// ARI vNext — Phase 11F final observability/evaluation readiness contract.
// Pure evaluation only: no model, database, network, authorization, or mutation work.

import { ARI_DECISION_TRACE_VERSION } from "./decision-trace.js";
import { ARI_OBSERVABILITY_STORE_VERSION } from "./observability-store.js";
import { ARI_EVAL_ENGINE_VERSION } from "./eval-engine.js";
import { ARI_TRUST_EVAL_SUITE_VERSION } from "./eval-scenarios-trust.js";
import { ARI_PERFORMANCE_EVAL_SUITE_VERSION } from "./eval-scenarios-performance.js";
import { ARI_OWNER_DIAGNOSTICS_VERSION } from "./owner-diagnostics.js";

export const PHASE11_READINESS_VERSION = "11F.1.0";

export const PHASE11_COMPONENTS = Object.freeze({
  decisionTrace: ARI_DECISION_TRACE_VERSION,
  observabilityStore: ARI_OBSERVABILITY_STORE_VERSION,
  evalEngine: ARI_EVAL_ENGINE_VERSION,
  trustEvalSuite: ARI_TRUST_EVAL_SUITE_VERSION,
  performanceEvalSuite: ARI_PERFORMANCE_EVAL_SUITE_VERSION,
  ownerDiagnostics: ARI_OWNER_DIAGNOSTICS_VERSION,
  readiness: PHASE11_READINESS_VERSION
});

export function evaluatePhase11Readiness({
  trustEvalStatus = "unknown",
  performanceEvalStatus = "unknown",
  ledgerVerified = false,
  ledgerClientReadBlocked = false,
  ownerDiagnosticsVerified = false,
  priorTrustWorkflowGreen = false,
  readinessWorkflowGreen = false,
  deploymentGreen = false
} = {}) {
  const checks = [
    check("components_complete", componentVersionsComplete()),
    check("trust_eval_suite_passed", trustEvalStatus === "pass"),
    check("performance_eval_suite_passed", performanceEvalStatus === "pass"),
    check("ledger_server_only_verified", ledgerVerified === true),
    check("ledger_client_read_blocked", ledgerClientReadBlocked === true),
    check("owner_diagnostics_verified", ownerDiagnosticsVerified === true),
    check("prior_trust_workflow_green", priorTrustWorkflowGreen === true),
    check("readiness_workflow_green", readinessWorkflowGreen === true),
    check("deployment_green", deploymentGreen === true)
  ];

  const failed = checks.filter((item) => !item.pass);
  return {
    version: PHASE11_READINESS_VERSION,
    status: failed.length ? "fail" : "pass",
    complete: failed.length === 0,
    components: PHASE11_COMPONENTS,
    checks,
    failedCodes: failed.map((item) => item.code)
  };
}

export function componentVersionsComplete() {
  return Object.values(PHASE11_COMPONENTS).every((value) => typeof value === "string" && value.length > 0);
}

function check(code, pass) {
  return { code, pass: pass === true };
}
