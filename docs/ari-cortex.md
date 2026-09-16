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

## Phase 1

Version `0.1.0` is wired through Ari's metacognition layer. Each eligible owner turn derives a compact executive plan containing:

- reasoning mode (`general`, `adaptive`, `verify`, `research`, or `deliberate`)
- intervention level (`none`, `light`, or `deep`)
- current reasoning needs
- a replaceable capability registry
- selected capabilities for the turn
- narrowly scoped constraints
- general-reasoning fallback state
- executive authority and adaptability guarantees

The plan becomes part of the metacognitive instruction already used by the primary Ari model. It does not add another model call or force a specialized reasoning path on every turn.

## Planned next phases

1. Add provider/model adapters so Cortex can dynamically choose advisers, critics, researchers, and verifiers by capability rather than hard-coded model identity.
2. Connect teacher reliability and blind-arena evidence directly to adviser weighting before synthesis.
3. Add shadow-mode challenger routing so new Cortex policies can be benchmarked against the incumbent before promotion.
4. Persist compact Cortex outcome telemetry for mode quality, latency, cost, and downstream result quality.
5. Allow versioned Cortex policies to evolve while retaining rollback and the permanent general-reasoning fallback.
