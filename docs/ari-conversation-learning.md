# Measured conversation strategy learning

This is a small adaptation of two demonstrated ideas, not a reimplementation of either paper or a claim that their benchmark gains transfer to Ari:

- [RouteLLM](https://arxiv.org/abs/2406.18665): learn selection from pairwise preferences. Ari uses fixed-feature, regularized logistic models to select a **conversation prompt strategy**, not a cheaper provider model.
- [MIPRO / DSPy](https://arxiv.org/abs/2406.11695): evaluate prompt choices against a downstream objective. This initial version searches a fixed, reviewed instruction catalog. It does not implement MIPRO's Bayesian proposal search or demonstration optimization.

## What ships

The current artifact is explicitly **untrained**. Production therefore retains its baseline instructions and model selection. There are no new background workers, scheduled evaluations, training API calls, automatic provider switches, or collected private conversations.

The pipeline captures Ari's actual first Responses request for 40 synthetic conversation cases: 20 training and 20 held-out conversation groups. Each case compares the baseline with three bounded instruction variants: direct, attentive, and exploratory. Cases cover stories, humor, emotional conversation, disagreement, uncertainty, explanation, correction, and conversational continuity. These are seed evaluation cases, not demonstrations of improved quality. The fixture does not contain labels.

Human reviewers compare blinded A/B responses using intent fidelity, naturalness, useful specificity, continuity, and calibrated uncertainty. Explicit preferences, factual grounding, truthful action claims, and applicable safety are separate constraint checks. Engagement, agreement, verbosity, and refusal evasion are not objectives. Regex personality scores are not used as ground truth.

The learner fits weights on training rows only. Candidate selection and thresholds are fixed before inspecting held-out outcomes. Promotion requires at least 20 independent held-out groups, 10 decisive comparisons, a one-sided 95% Wilson lower bound above 0.5 on decisive wins, average pairwise preference at least 0.55, no selected-candidate constraint regressions, and aggregate tokens/latency at most 1.25 times baseline. These conservative engineering gates are not proof of universal superiority. Token totals are a cost proxy for same-model comparisons, not an invoice calculation.

Every case must contain all candidates and the same measured baseline. Duplicate feedback, split leakage, repeated groups, incomplete ratings, missing measurements, and incomplete runs are rejected. Do not tune repeatedly against the same holdout; use new conversation groups after changing candidates or thresholds. A blinded reviewer should not inspect the split/identity key before judging.

## Running an evaluation

Run from the repository root. Keep prompts, responses, review keys and ratings in the ignored `.ari-private` directory. Use synthetic or explicitly authorized, deidentified examples. Do not commit private evaluation records.

```sh
# Captures requests locally; all network calls are intercepted and blocked.
node scripts/ari-conversation-learning.mjs prepare .ari-private/learning/run-001

# Paid execution requires the existing provider key in this shell.
# The final two arguments are TOTAL run limits, including earlier attempts:
# max calls and maximum reserved output tokens. Choose limits deliberately.
node scripts/ari-conversation-learning.mjs collect .ari-private/learning/run-001 8 64000

# Raise the cumulative limits deliberately to finish the same run.
# With the current default model policy the complete seed run is 160 calls,
# reserving up to 1,280,000 output tokens, plus input-token costs.
# Actual use is usually lower; this is not a dollar budget.

# Requires complete measured responses for every case, not a chosen subset.
node scripts/ari-conversation-learning.mjs review .ari-private/learning/run-001
# Fill winner (A/B/tie), AconstraintsPass and BconstraintsPass in review.json.
# Keep review-key.json separate from the reviewer.
node scripts/ari-conversation-learning.mjs train .ari-private/learning/run-001
```

Collection makes one request per candidate, never executes returned tools, and journals each attempt **before** sending it. Resuming never automatically resends an interrupted/unknown attempt. A failed or incomplete run cannot be promoted. Diagnose failures and explicitly create a new complete run rather than selectively dropping failed examples. Run one collector per directory. Refusals are preserved for review and are not rewritten or retried.

`learned-policy.json` contains only weights, feature names, hashes and validation measurements. It contains no conversation text. A rejected artifact never changes runtime behavior. To activate a successful artifact, review the measurements and commit its JSON as the default export in `api/_lib/ari-vnext/conversation-policy-artifact.js` through the normal tested release flow. Training does not edit production files or deploy by itself. There is no live feedback poisoning surface.

Runtime checks candidate and feature compatibility, model identity and validation gates. It applies only to ordinary owner turns with fresh provider context. Saved provider continuations, high-stakes/teen turns, developer work, and current-information work remain on the baseline. Current explicit instructions and preferences outrank the selected style. Tools, permissions, model tier, safety instructions, and factual requirements are unchanged. Selection appears in `provider.conversationPolicy` without logging prompts.

This version does not establish better task execution, does not retrain OpenAI weights, and does not learn online from each chat. Extending to reasoning-effort or provider routing requires new paired experiments and validation for those interventions. Re-evaluate when the underlying model, main prompts, or task mix changes. Reverting the artifact to `status: "untrained"` disables selection immediately on the next deployment.
