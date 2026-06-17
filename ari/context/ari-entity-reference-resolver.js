// ari/context/ari-entity-reference-resolver.js
// Ari Subject Graph / Entity & Reference Resolver
// Purpose: Resolve who/what the user is referring to across turns.
// V5.1.0 — Reference Resolver / Advisory Only

window.Ari = window.Ari || {};

window.AriEntityReferenceResolver = {
  version: "5.1.0",

  resolve(input = {}) {
    const summary = input.summary || input || {};
    const thread = summary.threadUnderstanding || {};

    const currentText = this.clean(
      summary.userMessage || summary.message || summary.input || ""
    );

    const priorState =
      summary.entityReferenceState ||
      window.Ari.subjectGraphState ||
      {};

    const recentMessages = this.getRecentMessages(summary, currentText);

    const candidates = this.mergeSubjects([
      ...(priorState.subjects || []),
      ...this.extractEntitiesFromMessages(recentMessages),
      ...this.entitiesFromThread(thread)
    ]);

    const references = this.resolveReferences({
      currentText,
      candidates,
      thread
    });

    const activeEntity = this.chooseActiveEntity({
      candidates,
      references,
      thread
    });

    const state = {
      entityReferenceResolverRan: true,
      entityReferenceResolverVersion: this.version,
      entityReferenceResolverSource: "ari-subject-graph",

      subjectGraphRan: true,
      subjectGraphVersion: this.version,
      subjectGraphSource: "ari-subject-graph",

      currentText,
      recentMessages,

      subjects: candidates,
      entities: candidates,
      references,

      activeSubject: activeEntity,
      activeEntity,

      confidence: this.scoreConfidence({
        candidates,
        references,
        activeEntity
      }),

      authority: "advisory_context_only",

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "medicalEscalation",
        "situationType",
        "recommendation"
      ]
    };

    window.Ari.subjectGraphState = state;

    return {
      entityReferenceResolverRan: true,
      entityReferenceResolverVersion: this.version,
      entityReferenceResolverSource: "ari-subject-graph",

      subjectGraphRan: true,
      subjectGraphVersion: this.version,
      subjectGraphSource: "ari-subject-graph",

      entityReferenceState: state,
      subjectGraphState: state,

      activeSubjects: candidates,
      activeEntities: candidates,

      resolvedReferences: references,

      activeSubject: activeEntity,
      activeEntity,

      activeReference: references[0] || null,

      confidence: state.confidence,
      authority: "advisory_context_only"
    };
  },

  getRecentMessages(summary = {}, currentText = "") {
    const facts = Array.isArray(summary.activeThreadFacts)
      ? summary.activeThreadFacts
      : [];

    const fromFacts = facts
      .filter(f => f?.type === "recent_message" && f.claim)
      .map(f => this.clean(f.claim))
      .filter(Boolean);

    const threadTimeline =
      summary.threadUnderstanding?.workingContext?.timeline ||
      summary.threadWorkingContext?.timeline ||
      [];

    const fromTimeline = threadTimeline
      .map(item => this.clean(item.text || item.claim || ""))
      .filter(Boolean);

    return [...fromFacts, ...fromTimeline, currentText]
      .filter(Boolean)
      .filter((value, index, list) => list.indexOf(value) === index)
      .slice(-12);
  },

  extractEntitiesFromMessages(messages = []) {
    const entities = [];

    messages.forEach((message, index) => {
      const text = this.clean(message);

      this.extractPossessiveEntities(text, index, entities);
      this.extractDefiniteEntities(text, index, entities);
      this.extractPronounMentions(text, index, entities);
      this.extractNamedEntities(text, index, entities);
      this.extractRoleEntities(text, index, entities);
    });

    return entities;
  },

  extractPossessiveEntities(text = "", index = 0, entities = []) {
    for (const match of text.matchAll(/\b(my|our)\s+([a-zA-Z][a-zA-Z'_-]{1,40})\b/g)) {
      entities.push(this.makeEntity({
        surface: `${match[1]} ${match[2]}`,
        kind: "possessive_entity",
        relationToUser: match[1],
        evidence: match[0],
        messageIndex: index,
        source: "possessive_entity_extraction"
      }));
    }
  },

  extractDefiniteEntities(text = "", index = 0, entities = []) {
    for (const match of text.matchAll(/\b(the|this|that)\s+([a-zA-Z][a-zA-Z'_-]{1,40})\b/g)) {
      entities.push(this.makeEntity({
        surface: `${match[1]} ${match[2]}`,
        kind: "referenced_entity",
        evidence: match[0],
        messageIndex: index,
        source: "definite_entity_extraction"
      }));
    }
  },

  extractPronounMentions(text = "", index = 0, entities = []) {
    for (const match of text.matchAll(/\b(he|him|his|she|her|hers|they|them|their|theirs|it|its|this|that)\b/gi)) {
      entities.push(this.makeEntity({
        surface: match[0],
        kind: "pronoun_mention",
        evidence: match[0],
        messageIndex: index,
        source: "pronoun_mention_extraction",
        salience: 0.35,
        confidence: 0.45
      }));
    }
  },

  extractNamedEntities(text = "", index = 0, entities = []) {
    for (const match of text.matchAll(/\b[A-Z][a-zA-Z'_-]{2,}(?:\s+[A-Z][a-zA-Z'_-]{2,})?\b/g)) {
      const surface = match[0];
      if (this.isCommonSentenceStarter(surface)) continue;

      entities.push(this.makeEntity({
        surface,
        kind: "named_entity",
        evidence: surface,
        messageIndex: index,
        source: "named_entity_extraction",
        confidence: 0.7
      }));
    }
  },

  extractRoleEntities(text = "", index = 0, entities = []) {
    const roles = [
      "coworker",
      "boss",
      "manager",
      "leadership",
      "team",
      "employee",
      "staff",
      "friend",
      "wife",
      "husband",
      "spouse",
      "partner",
      "girlfriend",
      "boyfriend",
      "fiance",
      "fiancé",
      "father",
      "dad",
      "mother",
      "mom",
      "child",
      "kid",
      "baby",
      "cat",
      "dog",
      "pet"
    ];

    roles.forEach(role => {
      const regex = new RegExp(`\\b${this.escapeRegex(role)}\\b`, "i");
      if (!regex.test(text)) return;

      entities.push(this.makeEntity({
        surface: role,
        kind: "role_entity",
        evidence: role,
        messageIndex: index,
        source: "role_entity_extraction",
        confidence: 0.75,
        attributes: {
          role
        }
      }));
    });
  },

  entitiesFromThread(thread = {}) {
    const entities = [];

    const possibleThreadEntities = [
      thread.activeSubject,
      thread.activeObject,
      thread.activeEntity,
      thread.resolvedMeaning?.resolvedSubject,
      thread.resolvedMeaning?.resolvedObject
    ].filter(Boolean);

    possibleThreadEntities.forEach(item => {
      if (!item || item.type === "unknown") return;

      entities.push(this.makeEntity({
        surface:
          item.label ||
          item.surface ||
          item.evidence ||
          item.kind ||
          "thread entity",
        kind: "thread_entity",
        evidence: item.evidence || item.label || null,
        source: "thread_understanding",
        salienceBoost: 0.3,
        confidence: item.confidence ?? 0.72,
        attributes: {
          threadEntity: item
        }
      }));
    });

    return entities;
  },

  resolveReferences({ currentText = "", candidates = [], thread = {} } = {}) {
    const text = this.clean(currentText).toLowerCase();
    const references = [];

    const pronouns = [
      "he",
      "him",
      "his",
      "she",
      "her",
      "hers",
      "they",
      "them",
      "their",
      "theirs",
      "it",
      "its",
      "this",
      "that",
      "this one",
      "that one"
    ];

    pronouns.forEach(term => {
      const regex = new RegExp(`\\b${term.replace(" ", "\\s+")}\\b`, "i");
      if (!regex.test(text)) return;

      const target = this.resolveReferenceTarget(term, candidates, thread);

      references.push({
        reference: term,
        resolvedTo: target,
        reason: target
          ? "Resolved by entity salience, recency, and thread context."
          : "No reliable target found.",
        confidence: target ? 0.76 : 0.25,
        source: "ari-subject-graph"
      });
    });

    if (this.isImplicitFollowUp(text, thread)) {
      const target =
        candidates.find(item => item.kind !== "pronoun_mention") ||
        candidates[0] ||
        null;

      references.push({
        reference: "implicit_active_context",
        resolvedTo: target,
        reason: target
          ? "Short follow-up appears to depend on the active context."
          : "Short follow-up detected, but no active entity was available.",
        confidence: target ? 0.78 : 0.25,
        source: "ari-subject-graph"
      });
    }

    return references.slice(0, 10);
  },

  resolveReferenceTarget(term = "", candidates = [], thread = {}) {
    const lower = term.toLowerCase();

    const nonPronounCandidates = candidates.filter(
      item => item.kind !== "pronoun_mention"
    );

    if (["he", "him", "his", "she", "her", "hers"].includes(lower)) {
      return (
        nonPronounCandidates.find(item =>
          this.isLikelyPersonEntity(item)
        ) ||
        nonPronounCandidates[0] ||
        null
      );
    }

    if (["they", "them", "their", "theirs"].includes(lower)) {
      return (
        nonPronounCandidates.find(item =>
          this.isLikelyGroupEntity(item)
        ) ||
        nonPronounCandidates.find(item =>
          this.isLikelyPersonEntity(item)
        ) ||
        nonPronounCandidates[0] ||
        null
      );
    }

    if (["it", "its", "this", "that", "this one", "that one"].includes(lower)) {
      return (
        nonPronounCandidates.find(item =>
          this.isLikelyObjectOrIssueEntity(item)
        ) ||
        nonPronounCandidates[0] ||
        null
      );
    }

    return nonPronounCandidates[0] || null;
  },

  isImplicitFollowUp(text = "", thread = {}) {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const hasQuestion = text.includes("?");

    return Boolean(
      hasQuestion &&
      wordCount <= 18 &&
      (
        thread.resolvedMeaning?.isContextual ||
        thread.impliedQuestion?.type ||
        thread.workingContext?.activeSubject ||
        thread.workingContext?.activeObject ||
        thread.workingContext?.activeIssue
      )
    );
  },

  chooseActiveEntity({ candidates = [], references = [], thread = {} } = {}) {
    const referenced = references.find(ref => ref.resolvedTo)?.resolvedTo;
    if (referenced) return referenced;

    const threadEntity = candidates.find(item =>
      item.source === "thread_understanding" &&
      item.kind !== "pronoun_mention"
    );

    if (threadEntity) return threadEntity;

    return candidates.find(item => item.kind !== "pronoun_mention") || candidates[0] || null;
  },

  makeEntity(data = {}) {
    return {
      id: data.id || this.createId("entity"),
      surface: data.surface || data.evidence || "unknown entity",
      kind: data.kind || "entity",
      relationToUser: data.relationToUser || null,
      evidence: data.evidence || null,
      aliases: data.aliases || [],
      mentions: data.mentions || 1,
      recency: data.recency ?? 1,
      salience: data.salience ?? 0.55,
      confidence: data.confidence ?? 0.65,
      source: data.source || "ari-subject-graph",
      messageIndex: data.messageIndex ?? null,
      attributes: data.attributes || {},
      salienceBoost: data.salienceBoost || 0
    };
  },

  mergeSubjects(subjects = []) {
    const merged = [];

    subjects.forEach(subject => {
      if (!subject?.surface) return;

      const key = this.key(subject.surface);
      const existing = merged.find(item => this.key(item.surface) === key);

      if (existing) {
        existing.mentions += subject.mentions || 1;
        existing.recency = Math.max(existing.recency || 0, subject.recency || 0);
        existing.confidence = Math.max(existing.confidence || 0, subject.confidence || 0);
        existing.salience = Math.min(
          1,
          (existing.salience || 0.5) + 0.08 + (subject.salienceBoost || 0)
        );
        existing.aliases = [...new Set([...(existing.aliases || []), ...(subject.aliases || [])])];
        existing.sources = [...new Set([...(existing.sources || []), subject.source])];
        existing.attributes = {
          ...(existing.attributes || {}),
          ...(subject.attributes || {})
        };
        return;
      }

      merged.push({
        ...subject,
        sources: [subject.source],
        salience: Math.min(
          1,
          (subject.salience || 0.55) + (subject.salienceBoost || 0)
        )
      });
    });

    return merged
      .map(item => ({
        ...item,
        score: this.entityScore(item)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 16);
  },

  entityScore(entity = {}) {
    const kindBoost =
      entity.kind === "thread_entity" ? 0.14 :
      entity.kind === "role_entity" ? 0.1 :
      entity.kind === "named_entity" ? 0.08 :
      entity.kind === "possessive_entity" ? 0.06 :
      entity.kind === "referenced_entity" ? 0.04 :
      entity.kind === "pronoun_mention" ? -0.12 :
      0;

    return (
      (entity.salience || 0) * 0.4 +
      Math.min(1, (entity.mentions || 1) / 4) * 0.2 +
      (entity.recency || 0.5) * 0.2 +
      (entity.confidence || 0.5) * 0.15 +
      kindBoost
    );
  },

  scoreConfidence({ candidates = [], references = [], activeEntity = null } = {}) {
    let score = 25;

    if (candidates.length) score += 25;
    if (references.length) score += 25;
    if (activeEntity) score += 15;
    if (candidates[0]?.score >= 0.7) score += 10;

    return Math.min(95, score);
  },

  isLikelyPersonEntity(entity = {}) {
    const value = this.key(entity.surface);
    const role = entity.attributes?.role;

    return [
      "coworker",
      "boss",
      "manager",
      "leadership",
      "team",
      "employee",
      "staff",
      "friend",
      "wife",
      "husband",
      "spouse",
      "partner",
      "girlfriend",
      "boyfriend",
      "fiance",
      "fiancé",
      "father",
      "dad",
      "mother",
      "mom",
      "child",
      "kid",
      "baby"
    ].includes(value) || Boolean(role);
  },

  isLikelyGroupEntity(entity = {}) {
    const value = this.key(entity.surface);

    return [
      "team",
      "leadership",
      "family",
      "kids",
      "children",
      "staff",
      "employees",
      "coworkers"
    ].includes(value);
  },

  isLikelyObjectOrIssueEntity(entity = {}) {
    return [
      "referenced_entity",
      "thread_entity",
      "possessive_entity"
    ].includes(entity.kind);
  },

  isCommonSentenceStarter(surface = "") {
    return [
      "What",
      "Why",
      "How",
      "When",
      "Where",
      "Should",
      "Can",
      "Do",
      "Does",
      "Is",
      "Are",
      "Will",
      "Would",
      "Okay",
      "Yes",
      "No",
      "Done",
      "Next",
      "If",
      "And",
      "But",
      "So"
    ].includes(surface);
  },

  key(value = "") {
    return this.clean(value)
      .toLowerCase()
      .replace(/^(my|our|the|this|that)\s+/, "")
      .trim();
  },

  createId(prefix = "id") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  },

  escapeRegex(value = "") {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  clean(value = "") {
    return String(value || "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }
};

console.log(
  "ARI SUBJECT GRAPH LOADED:",
  window.AriEntityReferenceResolver?.version
);