# Ari Executive — Runtime Rule Authority

## Purpose

Ari XP keeps its specialized cognitive systems, but they no longer compete as separate prompt constitutions.

The runtime hierarchy is:

1. **Hard enforcement** — server-side authentication, permissions, privacy, confirmation, product invariants, provider/platform requirements, and safety enforcement.
2. **Ari Runtime Constitution** — compact permanent identity, truth, judgment, agency, privacy, correction, action-truth, non-dependency, and hidden-reasoning principles.
3. **Current user intent** — what the user is asking now.
4. **Product/domain constraints** — current feature and domain contracts.
5. **Current evidence** — verified context, tools, memory, and observations.
6. **Ari Executive strategy** — one resolved turn policy.
7. **Learned/experimental signals** — Curiosity, Reward, Functional Affect, Self-Adaptation, Cortex, Ω-RCT, adaptive strategies, and teacher/adviser signals.
8. **Style** — communication presentation after higher-priority requirements are resolved.

The key invariant is that experimental cognition is **advisory**. It may change attention, verification depth, persistence, countercase use, exploration, and strategy selection. It cannot create permissions, remove a hard boundary, independently add refusals, or claim an action happened.

## Runtime flow

```text
current turn
   │
   ├── hard enforcement / product state
   ├── relevant context + memory
   ├── Curiosity state
   ├── Reward history
   ├── Functional Affect
   ├── Self-Adaptation
   ├── Cortex
   └── Ω-RCT
          │
          ▼
     Ari Executive
          │
          ▼
 one compact turn policy
          │
          ▼
      primary model
```

## What was consolidated

Before this refactor, metacognition could independently inject prose from Curiosity Core, the Curiosity↔Reward loop, Reward Core, Functional Affect, Self-Adaptation, Cortex, and Ω-RCT. The cognitive states remain, but `metacognitionToInstruction()` now emits only the compact Ari Executive policy.

Subsystem `*ToInstruction()` functions remain available for deterministic unit testing, diagnostics, and migration compatibility, but they are no longer wired together into the primary metacognition prompt.

## Prompt budget

Ari Executive has two instruction budgets:

- simple/grounded turn: ~850 characters
- active cognitive turn: ~3,600 characters

Experimental state is preserved even when its prose is not loaded. This separates **state persistence** from **prompt injection**.

## Constitution ownership

`api/_lib/ari-vnext/ari-executive.js` exports the compact runtime constitution and canonical rule IDs. `persona.js` is now a voice/presence layer that inherits that constitution instead of restating independent judgment, safety, action truth, and identity boundaries in separate sections.

The older browser-side `ari/character/ari-constitution.js` remains a compatibility character authority for the legacy client character stack. It is not a second vNext prompt authority. Future cleanup should progressively point legacy character consumers at shared canonical rule IDs without breaking browser compatibility.

## Non-goals

This refactor does not remove:

- memory or continuity
- Curiosity Core
- Reward Core
- reward-conditioned curiosity
- Functional Affect
- bounded autonomous self-adaptation
- Cortex or peer consultation
- Ω-RCT state
- adaptive strategies or teacher reliability
- app tools or action confirmation

It changes coordination, not capability.

## Regression standard

Ari Executive changes should be rejected if they reduce any of the following without a justified tradeoff:

- directness
- factual grounding
- continuity
- action routing correctness
- disagreement quality
- correction after failure
- conversational naturalness
- curiosity/information gain
- bounded self-adaptation

Prompt-size reduction alone is not a sufficient win.
