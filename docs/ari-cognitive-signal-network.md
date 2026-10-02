# Ari cognitive signal network

The owner conversation runtime now connects existing cognition through a bounded,
deterministic signal network. This is functional control, not evidence of subjective
experience. It creates no workers, schedules, new database tables, or provider calls.

## Runtime path

`runAriVNext → instincts → metacognition/affect → typed signals → activation network
→ Ari Executive → deliberation/model instructions → trusted tool results → outcome feedback`

Signals come from runtime evidence: relevant memory, continuity instincts, missing
evidence, current-information requirements, developer tasks, active goals, correction,
curiosity/imagination selection, tool failures, and the existing compute governor.
Supplied client signal objects and arbitrary tool text are not accepted as signals.
Adapters use typed identifiers and numbers; no user text enters signal instructions.

| Node | Threshold | Decision | Connections |
| --- | ---: | --- | --- |
| Memory | .65 | Attend relevant memory | Reasoning |
| Relationship | .65 | Attend relevant continuity | Memory |
| Verification | .68 | Verify evidence | Reasoning |
| Curiosity | .70 | Investigate | Imagination, reasoning |
| Imagination | .70 | Consider an alternative | Reasoning |
| Goals | .65 | Persist with a worthwhile goal | Reasoning |
| Developer | .70 | Inspect repository evidence | Verification, reasoning |
| Cost | .65 | Conserve optional compute | Inhibits curiosity and imagination |
| Reasoning | .70 | Integrate evidence | Verification |

Measured interest, concern, determination, frustration, and affiliation lower
specific thresholds within bounded ranges. Excitation and inhibition are aggregated
before firing; cost inhibition settles before optional nodes can fire. Activation
is multiplied by confidence. Urgency orders delivery without becoming permission.

## Boundaries and recurrence

Each propagation wave accepts at most 24 input signals, 64 deliveries, four hops,
12 firings (with one firing per node), and 32 diagnostic trace entries. Curiosity and
imagination have a 30-second cooldown across turns. Carry decays with a ten-minute
half-life, is capped at .35, and cannot fire without fresh stimulation. Duplicate,
expired, malformed, and unsupported signals are rejected or counted. Static routing
and refractory controls bound feedback loops.

Node activation, cooldown timestamps, and a capped failure streak persist through
the existing owner cognitive-state store. Signals and traces remain ephemeral.
New conversation IDs and clock rollback discard carry and cooldowns. Old state
versions remain readable. No migration is required for the additive JSON field.
Persistence can fail through the existing store; diagnostics report whether the
state was stored. Concurrent requests retain the store's existing last-writer-wins
behavior; this network does not provide a transactional shared bus across requests.

The executive consumes signal decisions as additional attention and strategy
pressure. Deliberation uses them for verification, alternatives, and method changes.
The final compact executive priority survives prompt compaction. Owner developer
tool results update the network before the existing follow-up model call; the
existing six-step tool bound remains unchanged. Primary failures update feedback
even when no model result returns. Delivered answers and successful file reads are
not treated as passed tests. Only trusted `verification.status = passed` clears the
failure streak; failed execution increments it.

Signals do not change tool exposure, model entitlement, escalation authorization,
privacy filters, confirmation, or the compute governor. Required verification
survives cost inhibition and signal ablation. Memory and repository decisions mean
attention/request priorities; they do not claim retrieval or execution occurred.
Existing resource routing and the provider choose among exposed tools. The network
does not automatically upgrade models or start specialist agents.

## Diagnostics and rollback

Owner responses expose `cognitiveSignals`: node measurements, bounded propagation
trace, executive priorities, limits/counters, and persistence status. The runtime
capability self-model reports when the network is active. These are functional
measurements and event metadata, not private reasoning transcripts.

Set `ARI_COGNITIVE_SIGNALS_ENABLED=false` to disable the adapters; existing cognitive
state and all original authorization/verification enforcement remain compatible.
This server-only change requires no mobile asset changes.

## Validation

`node --test tests/ari-vnext-cognitive-signals.test.mjs` exercises propagation,
inhibition ordering, TTL, confidence, threshold ablation, measured modulation,
cooldowns, decay, thread reset, rollback, storm limits, malformed/replayed signals,
entitlements, budget control, outcomes, persistence, and mocked live model/tool
flows. No paid provider requests are needed. These tests demonstrate deterministic
control effects; improvements in real conversational quality still need observation
and user feedback after deployment.
