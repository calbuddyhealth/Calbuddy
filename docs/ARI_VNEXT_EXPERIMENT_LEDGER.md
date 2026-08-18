# ARI vNext Persistent Experiment Ledger

Branch: `agent/ari-vnext-intelligence`

## Purpose

The experiment ledger turns Ari's N-of-1 investigator proposals into persistent, reviewable evidence. It records what Ari believed before an intervention, what changed, what was held stable, what outcome was predicted, and what happened afterward.

The ledger is supporting evidence. It never proves causation by itself, and completed experiments can only make small confidence adjustments to future hypotheses.

## Lifecycle

```text
Investigator state
  -> hypothesis + evidence + alternative
  -> experiment readiness
  -> user explicitly asks to track experiment
  -> pending action + confirmation
  -> active experiment stored
  -> future fitness turns preserve the observation window
  -> review becomes due
  -> current metrics compared with baseline
  -> user explicitly confirms completion/result
  -> completed structured outcome
  -> bounded hypothesis-confidence update
  -> future Ari decisions
```

Experiment writes never occur from a casual statement or historical conversation. Start, completion, and cancellation all require a current-turn explicit request and the normal vNext pending-confirmation boundary.

## Storage

Supabase table: `public.ari_vnext_experiments`

The table stores:

- user ID
- source turn ID
- domain
- lifecycle status
- hypothesis ID/label/confidence
- prediction
- intervention
- controlled variables
- baseline snapshot
- measurements
- supporting/disconfirming criteria
- duration and review timestamp
- final result/outcome
- confidence before/after
- evaluation source

RLS is enabled. `anon` and `authenticated` roles have no direct table privileges. vNext accesses the ledger server-side through the service role after authenticating the request and deriving the user ID from the session token.

## Runtime files

- `api/_lib/ari-vnext/experiment-ledger.js` — storage, lifecycle summaries and deterministic review snapshots
- `api/ari-vnext-experiments.js` — authenticated start/list/complete/cancel boundary
- `api/ari-vnext.js` — hydrates relevant experiment history during fitness turns
- `api/_lib/ari-vnext/orchestrator.js` — prevents conflicting changes and injects active/review-due state
- `api/_lib/ari-vnext/outcome-learning.js` — applies bounded structured outcomes to future hypothesis confidence
- `api/_lib/ari-vnext/tools.js` — confirmation-required experiment lifecycle proposals
- `ari/vnext/ari-vnext-bridge.js` — executes confirmed experiment actions
- `api/ari-vnext-expert.js` — exposes the same structured experiment evidence to authenticated read-only expert consults
- `api/ari-vnext-peer.js` — lets the bounded peer inspect experiment/review state

## Learning weights

Structured completed experiment outcomes are intentionally weak modifiers:

- positive: `+0.07`
- negative: `-0.06`
- mixed: `+0.01`
- inconclusive: `0`

Legacy user-reported outcome memories remain supported:

- positive: `+0.06`
- negative: `-0.05`
- mixed: `+0.01`

The combined adjustment to one hypothesis is capped at `±0.12`. Current objective evidence therefore remains more important than historical intervention outcomes.

## Review behavior

An active experiment includes a review timestamp. On a later relevant fitness turn, vNext loads the active experiment and builds a deterministic current-vs-baseline snapshot.

A deterministic review may suggest `positive`, `negative`, or `inconclusive`, but it cannot close the experiment automatically. Ari must account for missing logs/confounders, and the user must explicitly ask to record the result and confirm the action.

There is currently no scheduled notification or automatic background review. A due experiment is surfaced when Ari next receives a relevant fitness turn. Proactive resurfacing can be added later without changing the ledger contract.

## Validation

The experiment table lifecycle was transaction-tested against the live Supabase project: insert active -> update completed -> verify -> delete. No verification rows were left behind.

Deterministic tests cover routing, tool validation, due-date summaries, review suggestions, structured outcome learning, inconclusive outcomes and the global confidence-adjustment cap.
