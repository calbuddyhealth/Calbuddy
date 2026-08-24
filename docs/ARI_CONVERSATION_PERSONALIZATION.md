# ARI Conversation Personalization v2

## Purpose

Ari Conversation Personalization adapts how Ari communicates to each authenticated user from repeated direct interactions with Ari. It is a bounded presentation/recommendation layer, not a new semantic authority and not an engagement-ranking system.

The primary goal is to make Ari increasingly effective for the individual user while preserving explicit user control, safety, factual accuracy, and action permissions.

## Authority order

For communication behavior, the order of authority is:

1. Safety and factual correctness.
2. The user's explicit instruction in the current turn.
3. The user's saved explicit Ari communication preferences.
4. Learned conversation patterns with sufficient evidence.
5. Ari's normal adaptive defaults.

Learned behavior may fill only dimensions that remain adaptive. It may never silently rewrite persisted user preferences.

## What v2 can learn

From direct Ari interactions, v2 can learn bounded patterns for:

- answer detail / realized answer length;
- directness;
- complexity;
- follow-up question burden;
- structured formatting versus ordinary prose.

It does not behaviorally learn tone, humor, or profanity. Those remain explicit/default communication controls.

## Evidence model

The engine uses deterministic scoring. It makes no additional OpenAI request.

Evidence includes:

- explicit positive feedback such as “exactly,” “that helps,” or “keep answering like this”;
- explicit corrections such as “too long,” “more detail,” “be direct,” “simple terms,” or “stop asking questions”;
- conversation repair friction such as “that's not what I asked”;
- existing conservative communication/outcome associations for fitness follow-through.

The scorer applies:

- minimum sample thresholds;
- minimum repeated support for a candidate style;
- score separation before choosing between styles;
- recency decay with a 45-day half-life;
- confidence weighting;
- stronger weighting for explicit communication feedback;
- domain-scoped learning with global fallback.

A correction such as “that was too long—keep it short” penalizes the observed long response and adds positive evidence for the requested shorter alternative.

## Domain-aware adaptation

A user's preferred communication can differ by domain. When enough evidence exists, Ari can use a domain-specific profile for training, nutrition, goals, health, developer/project help, research, casual conversation, or general conversation.

If domain-specific evidence is insufficient, Ari may fall back to a sufficiently supported global conversation pattern. If neither is sufficiently supported, Ari does not adapt.

## Immediate current-turn control

The current message is parsed for explicit style instructions before learned behavior is applied. Examples include:

- “keep it short”;
- “go into detail”;
- “be direct”;
- “be gentle”;
- “simple terms”;
- “more technical”;
- “don't ask follow-up questions”;
- “use bullets”;
- “no bullets.”

These requests take effect immediately and do not need to be learned first.

## High-stakes behavior

High-stakes context can suppress learned conversation style. Clarity, safety, completeness, and uncertainty communication take priority over learned brevity/directness/formatting.

## Privacy and anti-manipulation boundaries

Conversation Personalization uses only direct Ari interaction evidence stored for that authenticated user.

It must not use:

- Ari Circle posts, likes, reactions, friends, feeds, challenges, or other social behavior;
- time in app;
- session length;
- scrolling behavior;
- notification engagement;
- emotional dependency signals;
- guilt, pressure, deceptive persuasion, or manipulation objectives.

The engine must not infer personality, intelligence, diagnosis, or other sensitive traits from conversational behavior.

## Runtime integration

`api/ari-vnext.js` loads recent user-scoped communication outcomes for substantive conversation turns, including non-fitness conversations. It builds a conversation-learning summary before the model call and adds it to the turn context.

`api/_lib/ari-vnext/orchestrator.js` resolves the explicit communication profile and then applies bounded learned personalization before constructing the model instructions.

After a substantive response, Ari records the realized response strategy. A later explicit correction can resolve the previous strategy observation immediately. Fitness-linked observations may also retain the existing delayed follow-through review path.

The existing `ari_vnext_communication_outcomes` table remains the persistence layer; v2 does not require a second competing conversation-history table.

## Cost model

The learner itself is deterministic application logic. It does not make a separate OpenAI request. It reuses the existing Ari turn and existing Supabase communication-outcome records.

## Release requirements

Regression tests must prove:

- current-turn instructions win;
- explicit saved preferences win;
- sparse evidence does not adapt;
- repeated evidence can adapt;
- high-stakes turns suppress learned style;
- explicit corrections train the intended alternative rather than the rejected style;
- substantive general conversations can be learned;
- trivial greetings are not journaled;
- Circle/social data is excluded;
- engagement/time-in-app optimization is prohibited;
- the personalization module performs no OpenAI request.
