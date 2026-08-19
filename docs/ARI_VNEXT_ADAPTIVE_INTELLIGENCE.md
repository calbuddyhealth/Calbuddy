# ARI vNext Adaptive Intelligence

Branch: `agent/ari-vnext-intelligence`

## Purpose

This layer makes Ari adapt from longitudinal evidence without treating correlation as causation, manipulating users for engagement, or hiding what she persistently remembers.

It adds four linked capabilities:

1. goal hierarchy and tradeoff reasoning
2. communication/outcome association learning
3. user-visible persistent-memory controls
4. Growth Inbox fix verification and reopening

## Goal hierarchy

Runtime: `api/_lib/ari-vnext/goal-hierarchy.js`

Ari distinguishes primary goals, secondary goals, and constraints. Explicit current user priority outranks inferred/profile priority. Ari may identify tradeoffs such as:

- fat-loss speed vs strength preservation
- fat loss vs muscle-gain rate
- training stimulus vs recovery margin
- ambitious plans vs observed adherence
- training ambition vs actual time constraints

Ari must not pretend all goals can be maximized simultaneously. If priority is genuinely ambiguous and would change the decision, ask one concise priority question.

Observed adherence can make a plan more realistic, but it never erases the user's aspiration or becomes a character judgment.

## Communication/outcome learning

Runtime: `api/_lib/ari-vnext/communication-outcomes.js`
Storage: `public.ari_vnext_communication_outcomes`

Ari can record high-signal response strategies and later compare them with follow-through signals such as training adherence or nutrition logging coverage.

This is **association learning only**. It is not causal proof that tone, directness, or response length caused a behavior change.

Safety/agency rules:

- explicit current user style request always wins
- stored explicit communication preference outranks learned associations
- require repeated scorable examples before adapting
- only use communication history as a tie-breaker
- never optimize guilt, coercion, pressure, emotional dependency, deception, or manipulation
- no extra OpenAI call is required to detect/aggregate communication outcomes

## What Ari Knows About Me

API: `api/ari-vnext-knowledge.js`
UI: `ari-vnext-knowledge.html`
World model: `api/_lib/ari-vnext/user-world-model.js`
Memory retrieval: `api/_lib/ari-vnext/memory-service.js`
Durable persistence: `api/_lib/ari-vnext/continuity-service.js`

Persistent-memory categories:

- identity
- preferences
- goals
- constraints
- behavior
- fitness outcomes
- relationship

A blocked category is removed from the structured world model, matching durable memories are deleted, future durable writes in that category are rejected, and retrieved memories are filtered before they reach the model or Ari Expert.

The category controls govern **persistent memory**, not intentionally supplied live current-turn app data. A user can still ask Ari about a goal currently on screen without giving Ari permission to persist that goal across sessions.

Users can independently clear:

- recent seven-day conversation continuity
- durable memories
- structured world model
- completed/cancelled experiment history
- decision/calibration history
- communication/outcome learning

Broad clears preserve active user-approved experiments unless the user explicitly cancels them through the experiment lifecycle.

## Growth Inbox verification lifecycle

Runtime: `api/_lib/ari-vnext/growth-fixes.js`
API: `api/ari-vnext-growth.js`
UI: `ari-vnext-growth.html`
Storage: `public.ari_vnext_growth_fixes`

Lifecycle:

```text
HELP ARI
  -> candidate
  -> fix_in_progress
  -> verification_pending
  -> verified_fixed
```

`verified_fixed` requires all of:

- regression test identity
- fix commit SHA
- original scenario reproduced
- at least two deterministic passing verification runs
- no regression observed in the verification scenario

If a matching peer-reflection fingerprint appears after verification, the issue automatically becomes `reopened`.

The Growth API is server-side owner gated using `profiles.owner_access` / `profiles.is_admin`; client-side hiding is not treated as authorization.

## Peer and Expert alignment

Ari's bounded peer can critique:

- hypothesis weighting
- goal hierarchy/tradeoffs
- calibration
- communication-learning misuse
- world-model tensions
- temporal causal overreach
- proactive insight thresholds
- experiment design

The read-only Ari Expert endpoint receives the same privacy-filtered memory, goal hierarchy, communication-learning state, world model, calibration, timeline, experiments, and scientific state.

## Database security

New adaptive-learning tables use RLS. Direct `anon` and `authenticated` table privileges are revoked. vNext accesses them server-side through the service role only after authenticating the current user.

## Validation contract

Deterministic tests live under `tests/ari-vnext-*.test.mjs`. The branch workflow `.github/workflows/ari-vnext-tests.yml` runs the complete deterministic suite on vNext pushes.

The adaptive-intelligence regression file specifically covers:

- explicit goal priority
- goal tradeoffs under low adherence
- minimum communication-learning sample sizes
- non-causal communication-learning rules
- memory privacy filtering
- prevention of blocked world-model reconstruction
- durable-memory category mapping
- Verified Fixed evidence requirements
- automatic reopening after recurring peer feedback
