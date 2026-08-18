# ARI vNext Intelligence Architecture

Branch: `agent/ari-vnext-intelligence`

## Objective

ARI vNext replaces a large handcrafted cognition pipeline with a model-first assistant architecture. Code owns data, permissions, validation, safety boundaries, memory retrieval, application tools, and verification. The primary model owns semantic understanding, reasoning, judgment, and natural language.

## Runtime

```text
User turn
  -> Current Turn Contract
  -> Context Router
  -> Relevant Context Builder
  -> Communication Profile
  -> Safety Policy
  -> Model Policy
  -> OpenAI Responses API
       -> answer
       -> or application tool proposal
  -> Pending Action Contract (for mutations)
  -> trusted ARI XP executor
  -> verified result
  -> natural response
```

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

## Current vNext files

- `api/ari-vnext.js` — authenticated server endpoint
- `api/_lib/ari-vnext/current-turn.js` — turn normalization and history isolation
- `api/_lib/ari-vnext/persona.js` — compact Ari identity
- `api/_lib/ari-vnext/communication-profile.js` — soft user communication preferences
- `api/_lib/ari-vnext/context-router.js` — selective context routing
- `api/_lib/ari-vnext/model-policy.js` — fast/standard/deep model policy
- `api/_lib/ari-vnext/safety-policy.js` — compact safety/high-stakes classifier
- `api/_lib/ari-vnext/tools.js` — strict model-visible application capabilities
- `api/_lib/ari-vnext/pending-action.js` — turn-bound confirmation lifecycle
- `api/_lib/ari-vnext/orchestrator.js` — Responses API orchestration
- `ari/vnext/ari-vnext-bridge.js` — browser-side parallel test bridge
- `tests/ari-vnext-foundation.test.mjs` — deterministic foundation tests
- `tests/fixtures/ari-vnext-intelligence-benchmark.json` — behavioral intelligence benchmark

## Migration strategy

### Phase 1 — Parallel engine
Keep Rebirth untouched. Build and test `/api/ari-vnext` independently.

### Phase 2 — Read-only/context capabilities
Connect current nutrition, goals, training, and memory data to vNext using compact contracts.

### Phase 3 — Trusted app tools
Map vNext action proposals to the existing ARI XP business logic and validate action arguments before writes.

### Phase 4 — Owner A/B switch
Allow owner-only side-by-side testing between Rebirth and vNext. Measure latency, action accuracy, continuity, response preference, and cost.

### Phase 5 — Production cutover
Make vNext the default assistant only after the benchmark and real-world owner testing beat Rebirth.

### Phase 6 — Legacy retirement
Remove old pipelines/stages and duplicated language, character, memory, continuity, and understanding machinery only after rollback is no longer needed.

## Intelligence benchmark

A change is not considered an improvement simply because the architecture is newer. vNext must improve or preserve:

- factual usefulness
- conversational naturalness
- follow-up understanding
- fitness/training quality
- nutrition quality
- memory relevance
- action isolation
- action correctness
- safety handling
- latency
- provider cost

The benchmark fixture is the beginning of this evaluation suite and should grow from real user failures and corrections.
