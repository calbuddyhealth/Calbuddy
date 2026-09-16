# Ari Cortex

Ari Cortex is the owner-only adaptive executive layer for Ari vNext. Its purpose is to expand reasoning options without turning orchestration into a rigid bottleneck.

## Kernel invariants

- Ari owns final synthesis.
- General reasoning remains available as the permanent fallback.
- Specialized orchestration must earn intervention.
- Unknown or novel problems fall back to broad reasoning instead of being forced into an existing strategy.
- Teacher, model, tool, and learned-strategy outputs are advisory evidence unless an existing authoritative safety, privacy, permission, or action rule governs execution.
- Constraints are local by default: a restriction on one capability must not disable unrelated reasoning branches.
- Existing safety and authorization requirements remain authoritative and cannot be weakened or routed around by Cortex.
- Cortex stores no hidden chain-of-thought.

## Phase 1 — executive kernel

Version `0.1.0` introduced the compact executive plan:

- reasoning mode (`general`, `adaptive`, `verify`, `research`, or `deliberate`)
- intervention level (`none`, `light`, or `deep`)
- current reasoning needs
- a replaceable capability registry
- selected capabilities for the turn
- narrowly scoped constraints
- general-reasoning fallback state
- executive authority and adaptability guarantees

The plan is wired through Ari's metacognition layer rather than replacing the base model's general reasoning.

## Phase 2 — dynamic adviser/provider routing

Version `0.2.0` adds adviser selection and bounded pre-synthesis consultation while preserving the Phase 1 kernel.

Cortex builds a ranked adviser registry from configured model slots, current problem domains, the primary model, and teacher-reliability evidence accumulated from Reasoning Academy strategies and blind arena outcomes. Candidate models receive different weights depending on whether observed evidence currently supports using them as an advisor, peer, mentor, or critic-only source.

On eligible deep, non-sensitive turns, Cortex may make one bounded independent adviser call before Ari's primary synthesis. The adviser receives the current problem and role, but not Ari's private app context or hidden reasoning. It returns a compact structured memo containing a conclusion, assumptions, counterpoints, uncertainties, and verification suggestions. That memo is injected as fallible evidence into Ari's final synthesis.

The routing layer applies bounded cost/latency controls:

- at most one independent adviser call per turn
- configurable timeout and output-token ceilings
- no adviser latency on ordinary turns where specialization has not earned deep intervention
- live web research is preferred over an unbrowsed adviser for freshness-sensitive questions
- private/app-specific and high-consequence context remains with Ari's primary reasoning path in this phase
- adviser failure is local: Ari continues through the normal primary reasoning path

The adviser contract is intentionally narrow. An adviser cannot mutate app state, change permissions, override confirmation rules, alter safety boundaries, or become Ari's executive authority. Even when reliability evidence favors a teacher model, Ari still owns final synthesis.

## Planned next phases

1. Add shadow-mode challenger routing so new Cortex policies can be benchmarked against the incumbent before promotion.
2. Persist compact Cortex outcome telemetry for routing quality, latency, cost, adviser usefulness, and downstream result quality.
3. Use those outcomes to learn when adviser consultation itself is worth the latency rather than relying only on static intervention thresholds.
4. Add provider adapters beyond the current Responses API path without changing the executive contract.
5. Allow versioned Cortex policies to evolve while retaining rollback and the permanent general-reasoning fallback.
