# ARI vNext Intelligence Architecture

Branch: `agent/ari-vnext-intelligence`

## Objective

ARI vNext replaces a large handcrafted cognition pipeline with a model-first assistant architecture. Code owns data, permissions, validation, safety boundaries, memory retrieval, evidence derivation, application tools, and verification. The primary model owns semantic understanding, reasoning, judgment, and natural language.

## Runtime

```text
User turn
  -> Current Turn Contract
  -> Context Router
  -> Relevant Context Builder
  -> Targeted Memory Retrieval
  -> Coaching State
  -> Longitudinal State
  -> Metacognition
  -> Evidence Graph
  -> Competing Hypotheses
  -> Highest-Value Missing Question
  -> N-of-1 Experiment State
  -> Conservative Outcome Learning
  -> Communication / Self / Safety / Model Policy
  -> OpenAI Responses API
       -> answer
       -> or application tool proposal
  -> Pending Action Contract (for mutations)
  -> trusted ARI XP executor
  -> verified result
  -> natural response
  -> optional bounded peer critique
  -> Growth Inbox / reflective memory
```

## Core intelligence idea

Ari should not merely produce fitness advice. She should accumulate a user-specific empirical model:

```text
Goal
  -> observations
  -> competing explanations
  -> recommendation / experiment
  -> measured or user-reported outcome
  -> confidence update
  -> better future decision
```

One prior outcome is supporting evidence, not proof. Current objective evidence remains more important than autobiographical outcome memory.

## Design rules

1. The current user message is authoritative for new mutations.
2. Old conversation may resolve meaning but cannot independently authorize a new write.
3. Communication preferences are soft style guidance, not semantic or routing authority.
4. Missing app data is unknown; Ari must not fabricate it.
5. Fitness, nutrition, goals, social, and memory context are loaded only when relevant.
6. Simple turns should usually need one model call.
7. Complex turns may spend more reasoning effort.
8. Application writes require trusted validation and confirmation unless the product explicitly defines a safe no-confirmation capability.
9. Model output never proves an action happened; executor results do.
10. Owner/developer capabilities remain separate from ordinary user capabilities.
11. Correlation is not causation. Ari maintains competing explanations when evidence is incomplete.
12. Prefer the smallest useful intervention; one-variable experiments are favored where practical.
13. A recommendation must be falsifiable when possible: define what result would support it and what result would weaken it.
14. Pain/injury and safety constraints outrank performance experimentation.
15. Prior outcomes can adjust hypothesis confidence only modestly; they cannot overwrite current evidence or Ari's safety boundaries.
16. Peer feedback is advisory. It cannot rewrite Ari's identity or become user fact without evidence.

## Current vNext files

- `api/ari-vnext.js` — authenticated conversational endpoint
- `api/ari-vnext-expert.js` — authenticated, read-only specialist intelligence endpoint with no additional language-model call
- `api/ari-vnext-peer.js` — bounded external peer-critique endpoint
- `api/ari-vnext-growth.js` — owner Growth Inbox endpoint
- `api/_lib/ari-vnext/current-turn.js` — turn normalization and history isolation
- `api/_lib/ari-vnext/persona.js` — compact Ari identity
- `api/_lib/ari-vnext/self-model.js` — stable self-model and relational posture
- `api/_lib/ari-vnext/communication-profile.js` — soft user communication preferences
- `api/_lib/ari-vnext/context-router.js` — selective context routing
- `api/_lib/ari-vnext/memory-service.js` — targeted durable-memory retrieval and outcome-memory relevance
- `api/_lib/ari-vnext/continuity-service.js` — recent conversation, durable preference/goal/outcome persistence
- `api/_lib/ari-vnext/coaching-state.js` — cross-feature evidence signals
- `api/_lib/ari-vnext/longitudinal-state.js` — multi-week training/weight/nutrition trends
- `api/_lib/ari-vnext/metacognition.js` — evidence coverage, missing-data and confidence state
- `api/_lib/ari-vnext/scientific-intelligence.js` — evidence graph, hypothesis ranking, information-value question and N-of-1 experiment design
- `api/_lib/ari-vnext/outcome-learning.js` — conservative autobiographical outcome-to-hypothesis confidence updates
- `api/_lib/ari-vnext/peer-reflection.js` — peer critique of Ari's visible answer, hypotheses and experiment design
- `api/_lib/ari-vnext/growth-inbox.js` — deterministic classification of peer feedback into Ari-handles/watch/help-Ari
- `api/_lib/ari-vnext/model-policy.js` — fast/standard/current/deep model policy
- `api/_lib/ari-vnext/safety-policy.js` — compact safety/high-stakes classifier
- `api/_lib/ari-vnext/tools.js` — strict model-visible application capabilities
- `api/_lib/ari-vnext/pending-action.js` — turn-bound confirmation lifecycle
- `api/_lib/ari-vnext/orchestrator.js` — Responses API orchestration
- `ari/vnext/ari-vnext-bridge.js` — browser-side parallel test bridge and peer handoff
- `ari/vnext/ari-vnext-training-context.js` — canonical training evidence extraction
- `ari/vnext/ari-vnext-action-adapter.js` — trusted app action adapter
- `ari-vnext-lab.html` — Rebirth vs vNext owner comparison
- `ari-vnext-investigator.html` — owner inspection of evidence/hypotheses/experiments
- `ari-vnext-growth.html` — owner Growth Inbox
- `tests/ari-vnext-*.test.mjs` — deterministic regression suite
- `tests/fixtures/ari-vnext-intelligence-benchmark.json` — behavioral intelligence benchmark

## Ari as specialist intelligence

`/api/ari-vnext-expert` returns a user-scoped, read-only consult packet containing:

- evidence confidence and missing evidence
- coaching and longitudinal state
- leading hypothesis and credible alternative
- evidence for and against each explanation
- highest-value missing question
- N-of-1 experiment readiness and falsification criteria
- whether prior outcome learning changed confidence

This endpoint intentionally makes no additional OpenAI language-model request. It is designed as the future boundary for exposing Ari as a specialist tool to another agent through a function or remote MCP wrapper.

## Peer critique

Ari's bounded peer receives a compact sanitized view of meaningful interactions. For coaching decisions it can now see Ari's leading hypotheses, alternative evidence, highest-value question, and proposed experiment. The peer is instructed to challenge over-weighted explanations and experiments that cannot distinguish competing hypotheses. It remains asynchronous, rate-limited, low-priority, and advisory.

## Migration strategy

### Phase 1 — Parallel engine
Keep Rebirth untouched. Build and test `/api/ari-vnext` independently.

### Phase 2 — Read-only/context capabilities
Connect current nutrition, goals, training, and memory data to vNext using compact contracts.

### Phase 3 — Trusted app tools
Map vNext action proposals to the existing ARI XP business logic and validate action arguments before writes.

### Phase 4 — Owner A/B + investigator testing
Use the owner comparison, investigator lab, Growth Inbox, deterministic tests, and real-user scenarios to measure response quality, hypothesis quality, latency, action correctness, continuity, and cost.

### Phase 5 — Controlled production cutover
Put vNext behind a runtime switch. Owner first, then limited beta, then default only after it beats Rebirth and rollback remains simple.

### Phase 6 — Objective experiment follow-up
Persist accepted Ari experiments/recommendations with explicit user consent, revisit their metrics after the observation window, and convert outcomes into bounded evidence updates.

### Phase 7 — External specialist tool
Wrap the read-only expert endpoint as an internal function/MCP capability so another trusted agent can consult Ari's specialist evidence without duplicating the whole ARI runtime.

### Phase 8 — Legacy retirement
Remove old pipelines/stages and duplicated language, character, memory, continuity, and understanding machinery only after rollback is no longer needed.

## Intelligence benchmark

A change is not considered an improvement simply because the architecture is newer. vNext must improve or preserve:

- factual usefulness
- conversational naturalness
- follow-up understanding
- fitness/training quality
- nutrition quality
- evidence calibration
- competing-hypothesis quality
- experiment quality and falsifiability
- outcome-learning restraint
- memory relevance
- action isolation
- action correctness
- safety handling
- latency
- provider cost

Real failures, incorrect assumptions, peer feedback, and user corrections should become permanent regression scenarios so Ari's improvement is cumulative rather than cyclical.
