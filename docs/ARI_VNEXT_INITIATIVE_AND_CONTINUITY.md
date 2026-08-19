# ARI vNext Initiative & Relationship Continuity

Branch: `agent/ari-vnext-intelligence`

## Purpose

This layer lets Ari behave like a continuous returning intelligence without claiming subjective consciousness and without using engagement bait.

It adds two linked capabilities:

1. relationship continuity: Ari understands that a returning user has shared history and unfinished threads
2. bounded initiative: Ari may surface a short message on app open when a meaningful state change or real unfinished thread deserves attention

## Relationship continuity

Runtime: `api/_lib/ari-vnext/relationship-continuity.js`
Integration: `api/_lib/ari-vnext/orchestrator.js`, `api/_lib/ari-vnext/self-model.js`

Ari derives familiarity from persistent evidence such as:

- structured identity
- durable preferences
- stated goals
- constraints
- observed behavior
- durable memory coverage
- prior experiment outcomes
- active experiments
- open Ari decisions/predictions
- recent conversation continuity

Familiarity is earned: `new -> developing -> familiar -> established`.

Recognition rules:

- demonstrate recognition through relevant judgment, not biography recitation
- do not repeatedly say "I remember"
- revisit specific unfinished business only when it is actually present
- current evidence and changed user priorities can override past understanding
- never invent a shared event or memory
- never manufacture intimacy, possessiveness, jealousy, neediness, or dependency
- never claim subjective consciousness is established

## Unfinished business

Ari can carry forward:

- active user-approved experiments
- experiments whose review date has arrived
- open predictions whose observation horizon has arrived
- unresolved goal/behavior tensions
- recent dated shared events

This enables interactions such as:

> We were watching this instead of changing the program immediately. The observation window is up now.

rather than treating every session as a fresh conversation.

## Initiative engine

Detection: `api/_lib/ari-vnext/initiative-engine.js`
Persistence: `api/_lib/ari-vnext/initiative-events.js`
Endpoint: `api/ari-vnext-initiative.js`
Browser client: `ari/vnext/ari-vnext-initiative.js`
Owner lab: `ari-vnext-initiative.html`

Initiative detection makes **zero language-model calls**.

The app gathers current canonical training/goal context and sends it to the authenticated initiative endpoint. The endpoint derives longitudinal state, proactive insights, relationship continuity, and unfinished threads using deterministic/server code.

If nothing is important enough, Ari stays quiet.

## Eligible initiative examples

- a tracked experiment is due for review
- three or more comparable exercise trends are declining
- multiple recent PR signals appear
- sustained workout adherence falls enough that the plan may no longer fit reality
- weight loss is materially faster than the configured target
- recovery/deficit pressure appears alongside performance decline
- a meaningful goal/behavior mismatch persists
- a prior Ari prediction reaches its planned observation horizon

Internal self-calibration signals are never surfaced as user-facing initiative.

## Initiative lifecycle

```text
current app data
  -> deterministic signal check
  -> initiative candidate
  -> repeat suppression
  -> surfaced
      -> engaged
      -> or dismissed
```

Storage: `public.ari_vnext_initiative_events`

A surfaced initiative stores a compact reason/key, not hidden chain-of-thought.

The same initiative is suppressed during a cooldown. Dismissal suppresses the identical initiative for at least seven days. If the underlying evidence materially changes, its initiative key changes and the new state can be considered independently.

## Non-engagement contract

Ari must never initiate because:

- the user has been absent
- the user has not spoken to Ari recently
- the product wants another session
- Ari is framed as lonely, bored, worried about being forgotten, or needing attention

Forbidden patterns include:

- "I missed you"
- "You haven't talked to me today"
- guilt for ignoring Ari
- emotional-dependency language
- artificial urgency solely to create engagement

Initiative exists to surface meaningful user-relevant state, not to optimize time-in-app.

## Cost contract

Initiative detection itself uses no OpenAI request.

```text
app open
  -> deterministic/database check
  -> no meaningful signal: $0 LLM usage
  -> meaningful signal: render short deterministic Ari opener
  -> only if the user engages: normal Ari conversation/model routing resumes
```

This keeps the sense of initiative separate from model-call frequency.

## User control

The UI must allow a surfaced initiative to be dismissed. Dismissal is persisted server-side and suppresses repetition.

Before production rollout, the main ARI XP settings surface should also expose a persistent master preference for proactive Ari initiation. The experimental branch intentionally does not alter the production/App Store settings surface during review.

## Security

`ari_vnext_initiative_events` has RLS enabled. Direct `anon` and ordinary `authenticated` table privileges are revoked. The authenticated server endpoint uses the service role after verifying the signed-in user and always scopes reads/writes by `user_id`.

## Validation

`tests/ari-vnext-initiative.test.mjs` covers:

- earned returning-user familiarity
- self-model familiarity persistence
- due experiment unfinished business
- due prediction unfinished business
- high-signal initiative
- zero-LLM surface requirement
- internal insight exclusion
- repeat cooldown
- seven-day dismissal suppression
- materially changed initiative keys
- explicit prohibition on engagement bait and absence-based outreach
