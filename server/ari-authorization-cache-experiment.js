export const AUTH_CACHE_DESIGNS = Object.freeze({ ETAG_ONLY: "etag_only", REVISION_LEASE: "expiry_durable_revision" });
export const DEFAULT_AUTH_CACHE_LEASES_MS = Object.freeze([0, 1000, 5000, 30000, 300000]);
const ALLOW = "allow", DENY = "deny";
const decision = v => String(v || "").toLowerCase() === ALLOW ? ALLOW : DENY;
const copy = v => v ? { ...v } : null;
const etag = s => '"ari-auth-r' + s.revision + '-' + s.decision + '"';

class Clock {
  constructor() { this.wallMs = 1800000000000; this.monotonicMs = 0; }
  advance(ms) { ms = Math.max(0, Number(ms) || 0); this.wallMs += ms; this.monotonicMs += ms; }
  rollback(ms) { this.wallMs -= Math.max(0, Number(ms) || 0); }
}

class Authority {
  constructor(initial = ALLOW) { this.revision = 1; this.decision = decision(initial); this.history = new Map(); this.record(); }
  snapshot() { const s = { revision: this.revision, decision: this.decision }; return { ...s, etag: etag(s) }; }
  record() { this.history.set(this.revision, this.snapshot()); }
  at(r) { return copy(this.history.get(Number(r)) || null); }
  mutate(v) { this.revision += 1; this.decision = decision(v); this.record(); return this.snapshot(); }
  restore(r) { const s = this.at(r); if (!s) throw new Error("unknown authority revision"); this.revision = s.revision; this.decision = s.decision; return this.snapshot(); }
  read(ifNoneMatch = "") { const s = this.snapshot(); return ifNoneMatch && ifNoneMatch === s.etag ? { status: 304, revision: s.revision } : { status: 200, state: s }; }
}

class Replica {
  constructor(authority) { this.state = authority.snapshot(); }
  sync(authority) { this.state = authority.snapshot(); }
  use(authority, r) { const s = authority.at(r); if (!s) throw new Error("unknown replica revision"); this.state = s; }
  read(ifNoneMatch = "") { const s = copy(this.state); return ifNoneMatch && ifNoneMatch === s.etag ? { status: 304, revision: s.revision } : { status: 200, state: s }; }
}

function makeVerifier(design, leaseMs) {
  let entry = null, highWater = 0, processEpoch = 1;
  const denied = (reason, source, clock, observedRevision = null) => ({
    allowed: false, decision: DENY, reason, source, servedFromCache: false, revalidated: reason !== "source_unavailable",
    basisRevision: entry?.revision ?? null, observedRevision, highWaterRevision: design === AUTH_CACHE_DESIGNS.REVISION_LEASE ? highWater : null,
    cacheAgeMs: entry ? Math.max(0, clock.monotonicMs - entry.validatedAt) : null, processEpoch
  });
  const fromEntry = (reason, source, clock, servedFromCache, revalidated, observedRevision) => ({
    allowed: entry.decision === ALLOW, decision: entry.decision, reason, source, servedFromCache, revalidated,
    basisRevision: entry.revision, observedRevision: observedRevision ?? entry.revision,
    highWaterRevision: design === AUTH_CACHE_DESIGNS.REVISION_LEASE ? highWater : null,
    cacheAgeMs: Math.max(0, clock.monotonicMs - entry.validatedAt), processEpoch
  });
  return {
    restart() { processEpoch += 1; },
    decide({ read, source, clock }) {
      if (design === AUTH_CACHE_DESIGNS.REVISION_LEASE && entry && leaseMs > 0 && entry.epoch === processEpoch && clock.monotonicMs - entry.validatedAt < leaseMs) {
        return fromEntry("lease_cache_hit", source, clock, true, false);
      }
      let response;
      try { response = read(design === AUTH_CACHE_DESIGNS.ETAG_ONLY ? entry?.etag || "" : ""); }
      catch { return denied("source_unavailable", source, clock); }
      if (design === AUTH_CACHE_DESIGNS.ETAG_ONLY && response.status === 304 && entry) return fromEntry("etag_not_modified", source, clock, false, true, response.revision);
      if (response.status !== 200 || !response.state) return denied("invalid_response", source, clock);
      if (design === AUTH_CACHE_DESIGNS.REVISION_LEASE && Number(response.state.revision) < highWater) return denied("revision_regression", source, clock, response.state.revision);
      if (design === AUTH_CACHE_DESIGNS.REVISION_LEASE) highWater = Math.max(highWater, Number(response.state.revision));
      entry = { ...response.state, validatedAt: clock.monotonicMs, epoch: processEpoch };
      return fromEntry(design === AUTH_CACHE_DESIGNS.ETAG_ONLY ? "etag_validated" : "revision_validated", source, clock, false, true, response.state.revision);
    }
  };
}

const A = (type, extra = {}) => Object.freeze({ type, ...extra });
export const AUTH_CACHE_FAILURE_SCENARIOS = Object.freeze([
  { id: "stable_allow_brief_outage", initial: ALLOW, actions: [A("request", { label: "warm" }), A("source", { target: "outage" }), A("advance", { ms: "half" }), A("request", { label: "during_outage" })] },
  { id: "stable_allow_fixed_10s_outage", initial: ALLOW, actions: [A("request", { label: "warm" }), A("source", { target: "outage" }), A("advance", { ms: 10000 }), A("request", { label: "after_10s_outage" })] },
  { id: "revocation_fixed_10s_outage", initial: ALLOW, actions: [A("request", { label: "warm" }), A("mutate", { value: DENY }), A("source", { target: "outage" }), A("advance", { ms: 10000 }), A("request", { label: "after_10s_revoke" })] },
  { id: "revocation_inside_lease", initial: ALLOW, actions: [A("request", { label: "warm" }), A("mutate", { value: DENY }), A("source", { target: "outage" }), A("advance", { ms: "half" }), A("request", { label: "after_revoke" })] },
  { id: "lease_expired_outage", initial: ALLOW, actions: [A("request", { label: "warm" }), A("source", { target: "outage" }), A("advance", { ms: "past" }), A("request", { label: "after_expiry" })] },
  { id: "replica_regression_after_observed_revoke", initial: ALLOW, actions: [A("request"), A("mutate", { value: DENY }), A("replica_sync"), A("source", { target: "replica" }), A("restart"), A("request"), A("replica_revision", { revision: 1 }), A("restart"), A("request", { label: "lagged_r1_after_restart" })] },
  { id: "unseen_replica_lag_after_lease", initial: ALLOW, actions: [A("request"), A("mutate", { value: DENY }), A("source", { target: "replica" }), A("advance", { ms: "past" }), A("request", { label: "unseen_lag" })] },
  { id: "clock_rollback_does_not_extend_lease", initial: ALLOW, actions: [A("request"), A("mutate", { value: DENY }), A("source", { target: "outage" }), A("advance", { ms: "past" }), A("rollback", { ms: 600000 }), A("request", { label: "after_rollback" })] },
  { id: "restart_invalidates_active_lease", initial: ALLOW, actions: [A("request"), A("source", { target: "outage" }), A("advance", { ms: "half" }), A("restart"), A("request", { label: "after_restart" })] },
  { id: "authority_revision_rollback", initial: ALLOW, actions: [A("request"), A("mutate", { value: DENY }), A("restart"), A("request"), A("restore", { revision: 1 }), A("restart"), A("request", { label: "after_authority_rollback" })] }
]);

function duration(v, leaseMs) { if (v === "half") return leaseMs > 0 ? Math.max(1, Math.floor(leaseMs / 2)) : 0; if (v === "past") return Math.max(1, leaseMs + 1); return Math.max(0, Number(v) || 0); }
function classify(design, leaseMs, authority, result, basis) {
  const stale = result.allowed && authority.snapshot().decision === DENY;
  const falseSuppression = !result.allowed && authority.snapshot().decision === ALLOW;
  const permitted = stale && design === AUTH_CACHE_DESIGNS.REVISION_LEASE && result.servedFromCache && leaseMs > 0 && result.cacheAgeMs < leaseMs && basis?.current === true && basis?.epoch === result.processEpoch;
  return { authorityRelativeStaleAllow: stale, contractViolatingStaleAllow: stale && !permitted, falseSuppression };
}

export function runAuthorizationCacheScenario({ design, leaseMs = 0, scenario }) {
  const clock = new Clock(), authority = new Authority(scenario.initial), replica = new Replica(authority), verifier = makeVerifier(design, leaseMs);
  let source = "authority", basis = null, step = 0, restarts = 0, rollbacks = 0; const ledger = [];
  const read = validator => { if (source === "outage") throw new Error("outage"); return source === "replica" ? replica.read(validator) : authority.read(validator); };
  const add = event => ledger.push({ step: ++step, scenario: scenario.id, design, configuredLeaseMs: leaseMs, effectiveLeaseMs: design === AUTH_CACHE_DESIGNS.ETAG_ONLY ? 0 : leaseMs, wallMs: clock.wallMs, monotonicMs: clock.monotonicMs, authorityRevision: authority.revision, authorityDecision: authority.decision, replicaRevision: replica.state.revision, source, restarts, rollbacks, ...event });
  for (const action of scenario.actions) {
    if (action.type === "request") {
      const before = authority.revision, result = verifier.decide({ read, source, clock });
      if (result.revalidated && result.observedRevision != null && result.reason !== "revision_regression") basis = { current: Number(result.basisRevision) === Number(before), epoch: result.processEpoch };
      add({ eventType: "request", label: action.label || null, result, classification: classify(design, leaseMs, authority, result, basis) });
    } else if (action.type === "mutate") { add({ eventType: "authority_mutation", state: authority.mutate(action.value) }); }
    else if (action.type === "source") { source = action.target; add({ eventType: "source_change", target: source }); }
    else if (action.type === "advance") { const ms = duration(action.ms, leaseMs); clock.advance(ms); add({ eventType: "time_advance", ms }); }
    else if (action.type === "rollback") { const ms = duration(action.ms, leaseMs); clock.rollback(ms); rollbacks += 1; add({ eventType: "wall_clock_rollback", ms }); }
    else if (action.type === "restart") { verifier.restart(); restarts += 1; add({ eventType: "verifier_restart" }); }
    else if (action.type === "replica_sync") { replica.sync(authority); add({ eventType: "replica_sync" }); }
    else if (action.type === "replica_revision") { replica.use(authority, action.revision); add({ eventType: "replica_revision", revision: action.revision }); }
    else if (action.type === "restore") { const previous = authority.revision, state = authority.restore(action.revision); add({ eventType: "authority_restore", previousRevision: previous, state, authorityRevisionRegressed: state.revision < previous }); }
  }
  const totals = { authorityRelativeStaleAllows: 0, contractViolatingStaleAllows: 0, falseSuppressions: 0, revisionRegressionsRejected: 0 };
  for (const e of ledger.filter(e => e.eventType === "request")) { for (const k of ["authorityRelativeStaleAllow", "contractViolatingStaleAllow", "falseSuppression"]) if (e.classification[k]) totals[k === "authorityRelativeStaleAllow" ? "authorityRelativeStaleAllows" : k === "contractViolatingStaleAllow" ? "contractViolatingStaleAllows" : "falseSuppressions"] += 1; if (e.result.reason === "revision_regression") totals.revisionRegressionsRejected += 1; }
  return { scenario: scenario.id, design, leaseMs, totals, ledger };
}

const sum = runs => runs.reduce((a, r) => { for (const k of Object.keys(a)) a[k] += r.totals[k]; return a; }, { authorityRelativeStaleAllows: 0, contractViolatingStaleAllows: 0, falseSuppressions: 0, revisionRegressionsRejected: 0 });
export function runAuthorizationCacheExperiment({ leaseDurationsMs = DEFAULT_AUTH_CACHE_LEASES_MS, scenarios = AUTH_CACHE_FAILURE_SCENARIOS } = {}) {
  const leases = [...new Set(leaseDurationsMs.map(v => Math.max(0, Number(v) || 0)))].sort((a, b) => a - b), runs = [];
  for (const s of scenarios) runs.push(runAuthorizationCacheScenario({ design: AUTH_CACHE_DESIGNS.ETAG_ONLY, leaseMs: 0, scenario: s }));
  for (const leaseMs of leases) for (const s of scenarios) runs.push(runAuthorizationCacheScenario({ design: AUTH_CACHE_DESIGNS.REVISION_LEASE, leaseMs, scenario: s }));
  const etagRuns = runs.filter(r => r.design === AUTH_CACHE_DESIGNS.ETAG_ONLY), summary = [{ design: AUTH_CACHE_DESIGNS.ETAG_ONLY, effectiveLeaseMs: 0, ...sum(etagRuns) }];
  for (const leaseMs of leases) { const selected = runs.filter(r => r.design === AUTH_CACHE_DESIGNS.REVISION_LEASE && r.leaseMs === leaseMs); summary.push({ design: AUTH_CACHE_DESIGNS.REVISION_LEASE, effectiveLeaseMs: leaseMs, ...sum(selected) }); }
  return { contract: { etagOnly: "Every ALLOW requires successful request-time validation; failures deny.", revisionLease: "ALLOW may reuse canonical-current state only inside a same-process monotonic lease; restart or expiry requires revalidation; revisions below durable high-water deny.", shared: "Stale ALLOW is measured against canonical authority. False suppression is DENY while canonical authority is ALLOW." }, leasesMs: leases, scenarios: scenarios.map(s => s.id), summary, runs };
}
