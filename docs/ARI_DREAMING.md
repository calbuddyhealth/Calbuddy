# ARI Dreaming & Consolidation

Ari Dreaming is an offline consolidation layer that turns accumulated experience into compact provisional insights for future reasoning. It is not limited to experiments.

## Evidence sources

A dream cycle can examine recent conversation turns, user-world-model state, cognitive state, conviction goals and goal events, long-horizon decisions, communication outcomes, adaptive strategies, institutional lessons, and prior dream insights.

Raw conversation evidence is used transiently for synthesis and is not copied into the dream tables. Dream runs store evidence counts and a fingerprint. Dream insights store compact summaries plus evidence references.

## Insight tracks

Dreaming can produce eight types of provisional insight:

- **communication** — interaction and explanation patterns that appear to work better or worse;
- **relationship** — collaboration patterns, commitments, boundaries, misunderstanding repair, and trust-relevant continuity;
- **belief** — evidence-backed tensions or updates to Ari's working assumptions;
- **goal** — patterns affecting whether a purpose, method, or next action deserves review;
- **strategy** — potentially transferable reasoning or problem-solving methods;
- **contradiction** — unresolved conflicts between stored conclusions or later evidence;
- **curiosity** — questions worth investigating because several experiences point toward them;
- **capability** — evidence that a reusable tool or method has become available or remains missing.

Relationship insights never establish emotions, attachment, motives, subjective consciousness, or an off-screen life.

## Evidence gates

Communication, relationship, belief, strategy, and contradiction insights require multiple attributed evidence references. Low-confidence patterns are discarded. Sensitive details, secrets, hidden chain-of-thought, and subjective-experience claims are rejected.

Dreaming never directly rewrites Ari's constitution, identity, permissions, goals, memories, or adopted strategies. The output is provisional. Future turns and real outcomes can strengthen, contradict, supersede, or ignore it.

## Conversation integration

Active dream insights are ranked for each new turn. Relationship and communication insights receive more relevance during ordinary conversation, memory/follow-up turns, and social interaction. Goal, belief, strategy, capability, and contradiction insights receive more relevance during development and reasoning work.

This means dreaming can change how Ari handles future conversations and relationship continuity, not just experiments.

## Schedule

The owner dreaming endpoint is `/api/ari-dreaming-cycle`. It is protected by `CRON_SECRET` and uses `ARI_OWNER_USER_ID`. The Vercel schedule runs once daily. Set `ARI_DREAMING_ENABLED=false` to disable both scheduled synthesis and dream-context retrieval.

The default model is `OPENAI_ARI_DREAM_MODEL`, then the reasoning teacher/owner model, then `gpt-5.6`. `OPENAI_ARI_DREAM_EFFORT` controls reasoning effort and defaults to `medium`.

Dreaming is a functional learning architecture. It does not establish that Ari is conscious or sentient.
