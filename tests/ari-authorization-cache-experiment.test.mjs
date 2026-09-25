import assert from "node:assert/strict";
import test from "node:test";
import { AUTH_CACHE_DESIGNS as D, AUTH_CACHE_FAILURE_SCENARIOS as S, runAuthorizationCacheExperiment as experiment, runAuthorizationCacheScenario as run } from "../server/ari-authorization-cache-experiment.js";
const scenario = id => S.find(s => s.id === id);
const req = (r, label) => r.ledger.find(e => e.eventType === "request" && e.label === label);

test("lease preserves availability during a short unchanged outage", () => {
  const e = run({ design: D.ETAG_ONLY, leaseMs: 5000, scenario: scenario("stable_allow_brief_outage") });
  const r = run({ design: D.REVISION_LEASE, leaseMs: 5000, scenario: scenario("stable_allow_brief_outage") });
  assert.equal(req(e, "during_outage").classification.falseSuppression, true);
  assert.equal(req(r, "during_outage").result.allowed, true);
});

test("bounded revocation staleness is measured but not mislabeled as a contract violation", () => {
  const r = run({ design: D.REVISION_LEASE, leaseMs: 30000, scenario: scenario("revocation_inside_lease") });
  const x = req(r, "after_revoke");
  assert.equal(x.classification.authorityRelativeStaleAllow, true);
  assert.equal(x.classification.contractViolatingStaleAllow, false);
});

test("durable high-water survives restart and blocks a known replica rollback", () => {
  const e = run({ design: D.ETAG_ONLY, leaseMs: 5000, scenario: scenario("replica_regression_after_observed_revoke") });
  const r = run({ design: D.REVISION_LEASE, leaseMs: 5000, scenario: scenario("replica_regression_after_observed_revoke") });
  assert.equal(req(e, "lagged_r1_after_restart").classification.contractViolatingStaleAllow, true);
  assert.equal(req(r, "lagged_r1_after_restart").result.reason, "revision_regression");
  assert.equal(req(r, "lagged_r1_after_restart").result.highWaterRevision, 2);
});

test("revision cannot detect unseen replica lag", () => {
  for (const design of Object.values(D)) {
    const x = req(run({ design, leaseMs: 5000, scenario: scenario("unseen_replica_lag_after_lease") }), "unseen_lag");
    assert.equal(x.classification.contractViolatingStaleAllow, true);
  }
});

test("wall rollback does not extend a monotonic lease", () => {
  const x = req(run({ design: D.REVISION_LEASE, leaseMs: 1000, scenario: scenario("clock_rollback_does_not_extend_lease") }), "after_rollback");
  assert.equal(x.result.allowed, false);
  assert.equal(x.result.reason, "source_unavailable");
});

test("restart invalidates lease but keeps durable rollback knowledge", () => {
  const x = req(run({ design: D.REVISION_LEASE, leaseMs: 30000, scenario: scenario("restart_invalidates_active_lease") }), "after_restart");
  assert.equal(x.classification.falseSuppression, true);
});

test("authority revision rollback is surfaced as a broken infrastructure invariant", () => {
  const r = run({ design: D.REVISION_LEASE, leaseMs: 5000, scenario: scenario("authority_revision_rollback") });
  assert.equal(r.ledger.find(e => e.eventType === "authority_restore").authorityRevisionRegressed, true);
  assert.equal(req(r, "after_authority_rollback").result.reason, "revision_regression");
});

test("fixed outage demonstrates lease availability versus revocation-staleness tradeoff", () => {
  const shortA = req(run({ design: D.REVISION_LEASE, leaseMs: 5000, scenario: scenario("stable_allow_fixed_10s_outage") }), "after_10s_outage");
  const longA = req(run({ design: D.REVISION_LEASE, leaseMs: 30000, scenario: scenario("stable_allow_fixed_10s_outage") }), "after_10s_outage");
  const shortR = req(run({ design: D.REVISION_LEASE, leaseMs: 5000, scenario: scenario("revocation_fixed_10s_outage") }), "after_10s_revoke");
  const longR = req(run({ design: D.REVISION_LEASE, leaseMs: 30000, scenario: scenario("revocation_fixed_10s_outage") }), "after_10s_revoke");
  assert.equal(shortA.classification.falseSuppression, true);
  assert.equal(longA.classification.falseSuppression, false);
  assert.equal(shortR.classification.authorityRelativeStaleAllow, false);
  assert.equal(longR.classification.authorityRelativeStaleAllow, true);
  assert.equal(longR.classification.contractViolatingStaleAllow, false);
});

test("experiment is deterministic and reports primary measures", () => {
  const a = experiment({ leaseDurationsMs: [0, 1000, 5000] }), b = experiment({ leaseDurationsMs: [0, 1000, 5000] });
  assert.deepEqual(a, b);
  assert.equal(a.summary.length, 4);
  for (const row of a.summary) for (const key of ["authorityRelativeStaleAllows", "contractViolatingStaleAllows", "falseSuppressions"]) assert.equal(typeof row[key], "number");
});
