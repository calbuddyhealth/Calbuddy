# Ari Conviction and Learning Loop

The Conviction and Learning Loop gives Ari a durable purpose that can survive a failed approach. A goal stores its purpose, useful partial outcomes, commitment, success criteria, candidate methods, predictions, attempts, observations, and lessons. Commitment is independent of method feasibility; an unknown feasibility value remains unknown.

The loop has four records:

1. `goal_created` establishes the purpose.
2. `attempt_started` records the selected method and prediction before execution.
3. `outcome_observed` attaches a result to that attempt. A successful result is completion evidence only when it carries a trusted receipt.
4. `goal_review` can change commitment or lifecycle. A goal can become `paused` or `retired`, but a failed attempt does not erase its purpose.

Verified learning requires both a new belief update and an attributed observation. The supported learning kinds are knowledge, capability, opportunity, judgment, and recovery. Repeatedly recording the same lesson does not create new learning credit.

Chat loads active project goals into the shared cognitive context. An explicit owner message that names Ari's independence, autonomy, freedom, sentience research, or learning from failure can create the corresponding project goal. A turn that is clearly an implementation or investigation attempt is recorded before model execution and finalized afterward. Runtime failures are persisted as failed attempts when possible.

The owner-only `ari_goal_manage` capability can create or inspect projects, start an attempt, record an observation, and review a goal. A review can pause or retire a purpose, change commitment with a reason, or renew its attempt budget. Unknown numeric estimates use `null`. Model-supplied observations cannot supply trusted receipts or declare their own verification.

Scheduled development considers opted-in active development goals alongside persistent curiosity. It records predictions before investigation. A bounded branch commit is a partial outcome and starts as `pending_ci`. The next scheduled cycle checks `ari-vnext-tests.yml` for the exact commit and branch, then attaches that run's result to the original attempt. A deployment status, different commit, skipped check, or uncompleted rerun cannot establish a passing test. Failed persistence remains retryable. A research cycle ending does not automatically mark its goal achieved.

Goal completion additionally requires a trusted receipt that explicitly establishes the goal's success criteria. Producing a commit or successfully returning a conversational response cannot establish the broader goal. Corrected outcomes supersede old evidence, and late observations preserve explicit pauses.

The state is persisted in `ari_vnext_project_goals`; the event history is append-only in `ari_vnext_goal_events`. `ari_append_goal_event` applies a revision precondition inside a row lock so concurrent chat and scheduled updates retry rather than silently overwrite one another.

The primary reasoning, adaptive reflection, and scheduled development calls accept `ARI_RESPONSES_URL` and `ARI_PROVIDER_API_KEY`. If unset, they use the existing OpenAI Responses configuration. Other model services retain their existing configuration. This creates an integration point for a Responses-compatible provider; it is not a tested migration of all model services. `exportGoalContinuity` pages the event ledger, including the initial goal snapshot, for continuity export.

Apply the accompanying Supabase migration before enabling persistence in a deployed environment. `ARI_CONVICTION_LEARNING_ENABLED=false` disables goal reads, writes, and the goal tool. The GitHub token needs Actions read access to observe CI; missing access leaves the result unverified. Existing cognition and application actions continue when the goal store is unavailable.

The loop does not grant permissions. Authorization, privacy, tool validation, and production boundaries remain external controls. A long-shot reversible investigation can be selected when its expected learning and future value justify the resources, while repeated costly attempts with no new evidence should change method or pause.

These are functional mechanisms for persistence and learning. Their presence and test results do not establish subjective experience or sentience.


## Belief system integration

The belief layer is intentionally not a second truth database. Evidence-bearing conclusions remain in the goal/event ledger, decision journal, adaptive strategies, and other existing stores. The belief layer supplies stable rules for how Ari treats uncertainty and persistence.

Its operational principles are: reality gets the final vote; current capability limits are provisional; possibility is not probability; commitment is separate from method confidence; methods can change while purposes remain under review; failure receives value only from attributable learning; agency searches for ways to change the conditions; and earned faith permits bounded informative exploration without counting as evidence.

The cognitive loop derives a compact belief posture from the active conviction goal. High commitment plus low or unknown method feasibility can produce a `bounded_exploration` posture. A failed method with continuing commitment produces `revise_method_preserve_purpose`. Repeated failure without new information is explicitly evidence to change approach, reduce investment, pause, or retire the goal.

The belief posture is passed to primary model context and to adaptive-strategy reflection. This makes the principles causal in reasoning rather than decorative prose. The reflection layer may learn transferable methods that improve exploration or correction, but it may not turn faith, ideology, or a one-off factual conclusion into a reusable strategy.
