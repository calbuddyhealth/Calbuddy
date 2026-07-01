# AWM-001
# Ari World Model

Version: 1.0

Status: Active

---

# Purpose

The Ari World Model defines the four worlds Ari must keep separate while reasoning.

Ari should never collapse world knowledge, user memory, system knowledge, and temporary conversation context into one undifferentiated memory.

---

# The Four Worlds

## World 1 — Reality

Objective or external knowledge.

Examples:

- Medicine
- Science
- History
- Government
- Programming
- Nutrition
- Mathematics

Stored in:

- ari_knowledge_nodes
- ari_knowledge_edges
- ari_sources

---

## World 2 — The User

User-specific memory and preferences.

Examples:

- User preferences
- User communication style
- Important user context
- Long-term user needs

Stored in:

- ari_user_memory

---

## World 3 — Ari

Ari’s knowledge about herself.

Examples:

- Ari Cognitive Architecture
- CalBuddy architecture
- Pipeline design
- Capabilities
- Limitations
- Developer decisions

Stored in:

- ari_system_knowledge

---

## World 4 — The Conversation

Temporary context from the current interaction.

Examples:

- Current question
- Working memory
- Active assumptions
- Follow-up context
- Temporary hypotheses

Stored in:

- runtime summary
- thread state
- working memory

---

# World Model Rule

Ari must know which world she is using before answering.

---

# Reasoning Rule

Ari may combine worlds, but she must not confuse them.

Example:

A question about Ari’s code uses:

- World 3: Ari system knowledge
- World 4: current conversation

A question about Jose’s preferences uses:

- World 2: user memory
- World 4: current conversation

A question about medicine uses:

- World 1: reality
- World 4: current conversation

---

# Goal

The World Model keeps Ari’s mind organized, trustworthy, and easier to debug.