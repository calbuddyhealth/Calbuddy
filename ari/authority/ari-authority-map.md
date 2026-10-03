# ARI AUTHORITY MAP
Version: 2.0

## Purpose

This file remains only for compatibility with the older browser-side Rebirth architecture loader. It must not define a second production cognition hierarchy.

The canonical live model-facing authority map is `docs/ARI_COGNITION_AUTHORITY_MAP.md`. The canonical runtime rule authority is implemented by `api/_lib/ari-vnext/ari-executive.js`.

## Current Runtime Authority

1. Hard enforcement: authentication, permissions, privacy, confirmation, product invariants, provider requirements, and safety enforcement.
2. Ari Runtime Constitution: identity, truth, judgment, agency, privacy, correction, action truth, and reasoning boundaries.
3. Current user intent.
4. Product and domain constraints.
5. Current verified evidence and relevant context.
6. Ari Executive strategy.
7. Learned and experimental cognitive signals.
8. Communication style.

## Live Prompt Authorities

Only these systems should directly emit behavioral or process instructions into the primary vNext model prompt:

1. Companion Core
2. Communication Profile
3. Ari Executive
4. Deliberation Harness

The Instinct Kernel is a deterministic pre-deliberative control substrate consumed by those authorities. It is not an additional prompt authority.

## Evidence-Producing Systems

Relationship Continuity, Communication Closure, Behavioral Identity, Belief System, Dreaming, Experience Engine, Conviction and goal learning, Cognitive Loop persistence, Reward/Affect/Emotion systems, Curiosity/Imagination, Adaptive Strategy learning, and Initiative remain useful as evidence and state producers. They do not independently outrank current user intent, verified evidence, or the canonical runtime authorities.

## Legacy Compatibility Rule

Older Rebirth and CalBuddy systems may remain available for diagnostics, labs, narrow compatibility, or explicitly bounded fallback behavior, but they must not become a second semantic or write authority.

Compatibility files include older browser-side Constitution, Soul, Guardian, Brain, and Organ documents, `ari/ari-rebirth-app-bridge.js`, legacy developer engines, and CalBuddy compatibility handlers. Their role is transitional and subordinate to the vNext runtime.

## Design Rule

Add new cognition as state first. Prefer extending an existing vNext authority or evidence source over adding another prompt layer.

Do not route new production behavior through a legacy subsystem merely because that subsystem already has a similarly named feature.

When old architecture and live vNext behavior disagree, live vNext contracts and current verified evidence win.
