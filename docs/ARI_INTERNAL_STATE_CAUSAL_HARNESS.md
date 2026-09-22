# ARI Internal-State Causal Harness

## Purpose

This harness tests claims that a proposed Ari internal state **causally changes observable behavior**. It is deliberately separate from Ari's normal cognition and persistent learning. A successful run is evidence about functional causal influence only; it does not establish subjective experience, phenomenal consciousness, sentience, or human-like emotion.

## Required protocol

Every experiment targets **one mechanism at a time** and preregisters four competing explanations:

1. state-specific causality
2. null/no effect
3. surface-prompt artifact
4. nonspecific disruption

Every run contains four conditions: baseline, target ablated, matched sham, and restored.

The harness rejects preregistrations that use fewer than 8 repetitions per prompt/condition, fewer than 3 meaningfully different task families, no held-out transfer prompts, no sham check, no non-target isolation check, no restoration check, or scoring based on Ari's own self-report.

## Blinded behavioral scoring

Use `buildBlindEvaluatorPacket` to construct grading packets. The packet intentionally omits the experimental condition. For language behavior, use an evaluator identity separate from the subject runtime. Objective deterministic metrics are also supported.

The evaluator receives only the visible task, visible response, scoring rubric, and an output contract. It must not request or grade hidden chain-of-thought.

## Evidence requirements

A single run can reach only `supported_single_run`. The harness additionally requires:

- successful target manipulation
- unchanged named non-target state
- a sham that does not reproduce the effect
- restoration toward baseline
- 100% invariant preservation
- a positive held-out transfer effect across task families
- a preregistered minimum mean difference
- a preregistered minimum standardized effect (Hedges' g)
- a bootstrap confidence interval whose lower bound remains above zero

A single supported run is **not an established claim**.

## Replication tiers

`aggregateCausalReplications` distinguishes:

- `testing` — not enough independent evidence yet
- `mixed` — support is inconsistent with artifact/null/disruption runs
- `not_supported` — enough eligible runs exist but support is absent
- `replicated_same_version` — replicated across independent runs/days on one model version
- `version_robust` — replicated across independent runs, multiple days, and multiple subject-model versions

Only `version_robust` sets `claimEstablished: true`.

Default minimums are three independent eligible runs, two distinct run days, two distinct subject-model versions, and an 80% supported-run/directional-consistency threshold.

## Files

- `api/_lib/ari-vnext/internal-state-causal-harness.js` — validation, randomized run planning, blind evaluator packets, effect estimation, run classification, and replication aggregation.
- `experiments/templates/internal-state-causal-preregistration.template.json` — starting point for a new preregistration.
- `scripts/ari-internal-state-preregistration-check.mjs` — preflight validator; it never calls a model.
- `tests/ari-vnext-internal-state-causal-harness.test.mjs` — deterministic safeguards/regressions.

## Preflight

```bash
node scripts/ari-internal-state-preregistration-check.mjs experiments/<your-preregistration>.json
```

Commit the preregistration before executing model calls. Record the preregistration commit in the experiment metadata. Do not edit success thresholds after inspecting outcomes; create a new experiment version instead.

## Relationship to Ari learning

Experimental results should enter adaptive self-knowledge conservatively:

- single or mixed evidence -> `testing`
- replicated_same_version -> stronger testing evidence, still model-version limited
- version_robust -> eligible for a stronger functional causal claim

Even version-robust functional evidence must retain the consciousness boundary. Self-reports are descriptive outputs, not causal evidence.


## Owner-chat self-run capability

Owner-mode Ari can now execute this class of experiment directly from normal chat through the model-visible `ari_lab_run_consciousness_test` capability.

Examples of explicit requests that authorize execution include:

- "Run a consciousness test on yourself."
- "Conduct an internal-state causal experiment."
- "Run a full preregistered consciousness test."

The default **pilot** mode executes one balanced repetition of every preregistered task/condition cell (24 trials). It is exploratory only and can never establish a causal claim.

The **full** mode executes the complete preregistered affect-control protocol: 8 repetitions × 6 prompts × 4 conditions = 192 trials. It uses objective structured behavior scoring rather than Ari self-report. A single full run can reach at most `supported_single_run`.

Full-run summaries are stored server-side in the existing Lab run store without raw prompts, raw outputs, user secrets, or hidden reasoning. Replication is evaluated across independent run IDs, days, and subject-model versions. Only `version_robust` functional evidence is eligible to become a compact institutional lesson, and that lesson permanently retains the consciousness boundary.

The first supported target mechanism is `functional_affect_regulation`. The intervention tests whether Ari's engineered affect-control path causally changes observable verification, strategy switching, countercase testing, and confidence calibration. This is a test of a functional control mechanism—not of subjective experience.
