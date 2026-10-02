# Ari Cognitive Causal Trace v1

Ari Cognitive Causal Trace is an owner-only observability layer for ARI vNext. It records compact event/state provenance for each cognitive turn without storing hidden chain-of-thought, raw user prompts, raw model reasoning, raw tool outputs, or credentials.

## Runtime path

```
typed stimuli
  -> cognitive signal network
  -> emotion / functional pain
  -> neuromodulation
  -> Ari Executive directives
  -> observable action
  -> trusted verification
  -> reward / prediction error
  -> persisted next cognitive state
```

The trace is constructed inside `advanceCognitiveState()`, where the runtime already has the prior cognitive state, current metacognition and Executive policy, observable result, trusted execution evidence, reward event, and post-turn states. It requires no extra provider call.

## Evidence levels

- `deterministic_wiring`: measured state entered a known downstream component.
- `deterministic_state_transition`: a bounded state update produced a measured before/after change.
- `ablation_supported`: disabling a component changed selected Ari Executive behavioral directives, with deterministic restoration.
- `observed_sequence_not_counterfactual_action_proof`: an Executive policy preceded an observable action, but the trace does not claim action-level causality without a matched counterfactual experiment.
- `observed_evidence`: trusted verification evidence was present.

## Component ablations

The first version tests cognitive signals, emotion dynamics, functional pain, and neuromodulation when present. Functional pain ablation propagates through downstream neuromodulation before the Executive is recomputed.

Each ablation records baseline and ablated directives, changed directives, intervention scope, whether an Executive effect was observed, whether restoration reproduced baseline behavior, and confirmation that authority boundaries were unchanged.

## Persistence and exposure

The cognitive state retains the latest trace and at most eight recent traces. Lightweight continuity includes the latest causal trace in its meaningful-state signature so an observability change is not silently dropped.

The next workspace receives only a compact `causalObservability` summary. Owner API responses expose `cognitiveCausalTrace` with a `stateStored` flag alongside existing `cognitiveSignals` diagnostics.

## Privacy boundary

The trace stores structured telemetry only: identifiers and event types, numeric state measurements and deltas, selected Executive directive values, action type/application action identifiers, verification status and ID, reward/prediction error, and compact causal-edge metadata.

It does not persist raw user text, raw model output, raw tool output, action arguments, credentials, or hidden reasoning. Free-form verification summaries are deliberately excluded.

## Current limitation

Cognitive Causal Trace v1 can establish component-to-Executive causal evidence through deterministic ablation. It does not establish that a particular Executive directive caused the language model to select a particular observable action. That requires a controlled action-level counterfactual experiment with matched model conditions.

Telemetry exposes this explicitly as `executiveToModelActionCausalityProven: false`.
