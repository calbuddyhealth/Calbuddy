# Ari vNext Cognition Authority Map

This document defines the live model-facing cognition boundary for Ari vNext.

## Four prompt authorities

Only these systems should emit behavioral/process instructions into the primary model prompt:

1. **Companion Core** — relationship behavior, continuity callbacks, repair, and restrained conversational initiative.
2. **Communication Profile** — user-facing style such as detail, directness, question burden, formatting, humor, and explicit current-turn preferences.
3. **Ari Executive** — experimental cognition signals such as curiosity, imagination, reward, functional affect, emotion dynamics, motivational arbitration, and verification/exploration pressure.
4. **Deliberation Harness** — difficult-task reasoning process, countercases, failure-mode review, task-contract preservation, and verification gates.

## Pre-deliberative control substrate

The **Instinct Kernel** runs before metacognition, Companion Core, and Deliberation Harness. It is not a fifth prompt authority.

It produces three classes of behavioral pressure:

- **Reflexes** — high-priority causal constraints such as correction repair, evidence-first truth, authorization boundaries, and verification before completion claims.
- **Drives** — persistent tendencies such as curiosity, persistence, simplicity, agency, continuity, and cost conservation. Drives bias strategy but do not override current evidence or hard enforcement.
- **Tendencies** — softer stable biases such as challenging weak assumptions and preferring reversible discriminating experiments over speculation.

The Instinct Kernel is deterministic and makes no provider call. Its outputs are consumed by the existing authorities:

- Companion Core receives relationship/initiative/repair modulation.
- Ari Executive receives verification, exploration, persistence, simplicity, agency, challenge, and cost pressure.
- Deliberation Harness receives verification, method-change, simplicity, and exploration pressure.

Instinct calibration may use already-persisted outcome and personality-evaluation state. It does not gain permissions, weaken safety, create facts, or become evidence merely because a drive is strong.

## Evidence-producing cognition systems

The following systems remain useful, but they are evidence producers rather than independent prompt authorities:

- Relationship Continuity
- Communication Closure
- Behavioral Identity
- Belief System
- Dreaming
- Experience Engine
- Conviction / goal learning
- Cognitive Loop persistence
- Reward / affect / emotion state engines
- Curiosity / imagination
- Adaptive Strategy learning
- Initiative Engine

Their state can be selected by the **Unified Cognition Coordinator** when materially relevant. Current user corrections and current verified evidence always outrank stored cognition.

## Legacy prompt emitters

The live vNext path intentionally suppresses direct prompt emission from:

- `relationshipContinuityToInstruction`
- `behavioralIdentityToInstruction`
- `communicationClosureToInstruction`
- `dreamingContextToInstruction`
- `experienceContextToInstruction`
- `convictionInstruction`
- `cognitiveWorkspaceToInstruction`

These functions may remain for unit tests, labs, diagnostics, or legacy compatibility, but should not be wired back into the primary production prompt without first changing this authority map and consolidation tests.

## Background cognition

Background AI remains opt-in behind `ARI_BACKGROUND_AI_ENABLED`. No background cognition system should become a fifth prompt authority merely because it generated a new record.

## Design rule

Add new cognition as **state first**. Prefer extending an existing authority or evidence source over creating another model-facing instruction layer. A new prompt authority requires a clear capability that cannot be represented by Companion Core, Communication Profile, Ari Executive, or Deliberation Harness.
