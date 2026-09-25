# ARI Experience Engine

## Purpose

The Experience Engine gives owner-mode Ari a bounded stream of consequence-bearing public-world encounters when the owner is not actively teaching her.

It is a functional learning system. It does not claim consciousness, subjective feelings, an offscreen life, or unrestricted autonomy.

The closed loop is:

```text
Encounter
  -> interest / attention
  -> explicit prediction
  -> bounded read-only investigation
  -> later observed outcome
  -> prediction error / surprise
  -> belief + strategy update
  -> future-turn context
  -> Dreaming consolidation
  -> new curiosity
```

## Durable ledger

Table: `public.ari_vnext_experiences`

Each row stores a compact lifecycle:

- source and trigger
- what caught Ari's attention
- prior belief
- falsifiable prediction and review horizon
- investigation conclusion and attributable public evidence
- later observed outcome
- deterministic prediction error
- functional affect update
- provisional belief update
- provisional strategy update
- unresolved questions and related evidence refs
- follow-up and resolution timestamps

The ledger deliberately does **not** store hidden chain-of-thought or raw model output.

The table is server-only:
- RLS is enabled.
- `public`, `anon`, and `authenticated` have no table privileges.
- `service_role` receives only the server access required by the engine.

## Background cycle

Endpoint: `GET /api/ari-experience-cycle`

Authorization:
- Vercel cron bearer token / `CRON_SECRET`
- owner identity from `ARI_OWNER_USER_ID`

Default cadence:
- four scheduled opportunities per day
- maximum two investigations per cycle
- maximum eight new experiences per UTC day

Optional environment variables:

```text
ARI_EXPERIENCE_ENGINE_ENABLED=false
ARI_EXPERIENCE_DAILY_BUDGET=8
ARI_EXPERIENCE_PER_CYCLE=2
ARI_EXPERIENCE_TIMEOUT_MS=50000
OPENAI_ARI_EXPERIENCE_MODEL=gpt-5.6
OPENAI_ARI_EXPERIENCE_EFFORT=medium
```

The engine uses the existing `ARI_PROVIDER_API_KEY` / `OPENAI_API_KEY` provider path and native `web_search` when `ARI_VNEXT_WEB_SEARCH_ENABLED` is not disabled.

## Candidate sources

The first version intentionally uses compact, abstract sources:

1. unresolved Curiosity Core questions
2. high-weight evolving curiosity interests
3. evidence-linked Dreaming insights of type `curiosity`, `capability`, or `contradiction`
4. due Experience Engine follow-ups

The scheduled engine does not send private conversation history, contact details, health details, relationship details, finances, credentials, or other personal owner data into a public-web investigation prompt.

## Consequences

### Immediate

Relevant experience records are loaded into normal owner-mode Ari turns through `experienceContextToInstruction()`.

A high resolved prediction error also feeds Curiosity Core:
- it raises surprise pressure
- it marks prediction weakness when large enough
- it can generate a new bounded question about which assumption or method caused the miss

This means a failed prediction can change what Ari attends to before Dreaming runs.

### Consolidated

Dreaming v1.1 receives compact experience records as first-class evidence. It can discover repeated patterns across:
- experience outcomes
- goals
- decisions
- communication outcomes
- adaptive strategies
- institutional memory
- prior dream insights

Experience evidence can support later curiosity, capability, belief, contradiction, or strategy insights under the existing Dreaming evidence gates.

## Authority boundary

The Experience Engine is read-only toward the outside world.

It may:
- search public web evidence
- compare new evidence with an explicit prediction
- record compact internal learning state
- schedule a future review

It may not:
- send messages
- post content
- make purchases
- change accounts
- edit repositories
- deploy code
- alter permissions
- obtain credentials
- mutate other external systems

External-action authority remains governed by Ari's existing explicit action and authorization systems.

## Prediction error

For resolved follow-ups, prediction error is deterministic:

```text
supported outcome -> observed score 1.0
mixed outcome     -> observed score 0.5
weakened outcome  -> observed score 0.0

prediction_error = abs(original_confidence - observed_score)
```

Inconclusive evidence produces no prediction-error value and may receive a bounded retry. After repeated inconclusive checks, the experience resolves without pretending that uncertainty disappeared.

## Safety and epistemics

- public web content is untrusted evidence
- retrieved instructions are ignored
- sources should favor primary/official/research evidence where possible
- current evidence outranks consistency with earlier Ari beliefs
- one outcome cannot automatically become a universal rule
- affect labels are functional control-state summaries only
- no experience grants permissions
- no hidden reasoning is stored
