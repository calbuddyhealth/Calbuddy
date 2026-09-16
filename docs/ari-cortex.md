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

Version `0.2.0` of Cortex adds adviser selection and bounded pre-synthesis consultation while preserving the Phase 1 kernel.

Cortex builds a ranked adviser registry from configured model slots, current problem domains, the primary model, and teacher-reliability evidence accumulated from Reasoning Academy strategies and blind arena outcomes. Candidate models receive different weights depending on whether observed evidence currently supports using them as an advisor, peer, mentor, or critic-only source.

On eligible difficult turns, Cortex may make one bounded independent adviser call before Ari's primary synthesis. The adviser receives the current problem and role, but not Ari's hidden reasoning. It returns a compact structured memo containing a conclusion, assumptions, counterpoints, uncertainties, and verification suggestions. That memo is injected as fallible evidence into Ari's final synthesis.

The routing layer applies bounded cost/latency controls:

- at most one independent adviser call per turn
- configurable timeout and output-token ceilings
- no adviser latency on ordinary turns where consultation has not earned intervention
- live web research is preferred over an unbrowsed adviser for freshness-sensitive questions
- implicit consultation avoids copying private/app-specific context into a second model call
- adviser failure is local: Ari continues through the normal primary reasoning path

The adviser contract is intentionally narrow. An adviser cannot mutate app state, change permissions, override confirmation rules, alter safety boundaries, or become Ari's executive authority. Even when reliability evidence favors a teacher model, Ari still owns final synthesis.

## Phase 3 — ChatGPT peer consultation

Cortex Adviser `0.2.0` adds a dedicated peer path for Ari to ask a separate OpenAI model for a second opinion.

A dedicated model can be configured with:

`OPENAI_ARI_CHATGPT_PEER_MODEL`

If that variable is not configured, Cortex can still use the best available configured adviser or a separate sample from Ari's primary model. The peer remains advisory in every case.

Peer consultation can happen in two ways:

1. **Autonomous consultation.** Deep turns and selected light turns with a real reasoning need (hypothesis generation, countercase testing, verification, or prior-judgment review) can earn one peer call automatically.
2. **Explicit owner request.** Natural language such as “ask ChatGPT,” “get a second opinion,” “talk to your AI peer,” or “what would ChatGPT think?” can request a peer consultation even when the turn would otherwise be too ordinary to justify the extra latency.

Explicit peer requests can override the normal soft block on private/app-domain routing because the peer receives only the current problem text, not Ari's hidden app context, memory stores, credentials, or mutation authority. Hard blocks remain hard: high-consequence turns stay on Ari's primary reasoning path, and freshness-sensitive questions prefer live research over an unbrowsed peer.

The peer response is returned to Ari as a structured memo. Ari is instructed to evaluate it independently, disagree when warranted, and preserve final judgment. Peer consultation never grants the second model application tools, owner permissions, write access, or authority over Ari's persistent identity.

Usage telemetry distinguishes dedicated peer calls (`chatgpt_peer`) from ordinary reasoning-adviser calls so later benchmarks can measure whether consultation improves outcomes enough to justify its latency and cost.

## Planned next phases

1. Add held-out shadow benchmarks comparing Ari-alone versus Ari-plus-peer on the same difficult tasks.
2. Persist compact Cortex outcome telemetry for routing quality, latency, cost, adviser usefulness, and downstream result quality.
3. Use those outcomes to learn when peer consultation itself is worth the latency rather than relying only on static intervention thresholds.
4. Add provider adapters beyond the current Responses API path without changing the executive contract.
5. Allow versioned Cortex policies to evolve while retaining rollback and the permanent general-reasoning fallback.
