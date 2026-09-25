# ARI Authorization Cache Failure Experiment

This experiment compares two isolated authorization-cache designs without changing the production owner authorization gate in server/ari-owner-auth.js.

## Designs

1. ETag-only validation. Every ALLOW requires successful request-time validation. Source failure denies. ETags prove equality with the source that answered but do not establish ordering.
2. Expiry plus durable revision. A validated decision may be reused during a bounded monotonic lease. The revision high-water mark survives verifier restart; the active lease does not. Any observed revision below high-water is rejected.

## Security contract

Authority-relative stale ALLOW means the verifier allows while canonical authority is DENY.

Contract-violating stale ALLOW means stale access that is not covered by the declared bounded lease. A stale ALLOW served from a valid revision lease is permitted only when the lease began from canonical-current state, is measured with monotonic time, and remains in the same verifier process.

False suppression means the verifier denies while canonical authority is ALLOW.

After lease expiry or restart, the revision design must revalidate before another ALLOW. Wall-clock rollback cannot extend a lease.

## Failure matrix

The deterministic suite covers stable outages, revocation during outage, lease expiry, replica regression after a newer revision was observed, unseen replica lag, verifier restart, wall-clock rollback, and authority revision rollback.

Default revision leases are 0 ms, 1 s, 5 s, 30 s, and 5 min.

A durable high-water revision blocks known regression but cannot detect a newer canonical revision that the verifier has never observed. The harness counts that unseen replica-lag case as a contract violation for both designs.

Authority revision rollback is treated as a broken infrastructure invariant. A production revision generator must remain monotonic across restore/failover or add an epoch/generation that cannot move backward with the restored data.

## Run

npm run auth-cache:experiment

Custom leases:

node scripts/ari-authorization-cache-harness.mjs --leases 0,250,1000,10000,60000

Machine-readable ledger:

node scripts/ari-authorization-cache-harness.mjs --json

Interpret all three primary measures together: contract-violating stale ALLOWs, all authority-relative stale ALLOWs, and false suppression. Longer leases can improve availability while increasing bounded revocation latency without necessarily increasing contract violations.
