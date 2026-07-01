# 999
# Ari Architect Decisions

Version: 1.0

Status: Active

Owner: Jose — Chief Cognitive Architect

---

# Purpose

This file records major architectural decisions for Ari.

It exists so future Jose, future Ari, and any future developer can understand why the system was designed a certain way.

Architecture should not depend on memory alone.

---

# Decision Template

## ADR-000
## Title

Date:

Status:
Proposed / Accepted / Rejected / Deprecated / Superseded

---

## Context

What problem are we solving?

---

## Decision

What did we decide?

---

## Reasoning

Why did we choose this?

---

## Alternatives Considered

What other options were considered?

---

## Trade-Offs

What do we gain?

What do we lose?

---

## Risks

What could go wrong?

---

## Future Review

When should this be reviewed again?

---

# Decisions

## ADR-001
## Ari will be built as a cognitive operating system, not a chatbot.

Date: 2026-07-01

Status: Accepted

---

## Context

Ari began as an assistant inside CalBuddy, but the project evolved beyond simple chatbot behavior.

The goal became to build a system capable of understanding, reasoning, learning, reflecting, and improving over time.

---

## Decision

Ari will be designed as a cognitive operating system.

Language models are tools Ari can use, not Ari herself.

---

## Reasoning

This keeps Ari independent from any one model provider.

It allows OpenAI, local models, web search, Supabase, and future tools to become replaceable components inside Ari's architecture.

---

## Alternatives Considered

Build Ari as a normal chatbot wrapper around an LLM.

Build Ari as a collection of disconnected features.

---

## Trade-Offs

Gain:
- Long-term flexibility
- Stronger identity
- Better architecture
- Model independence

Lose:
- Simplicity
- Faster short-term development

---

## Risks

The architecture could become too complex if not carefully governed.

---

## Future Review

Review after the first working Executive Controller is implemented.