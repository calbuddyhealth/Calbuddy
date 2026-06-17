// ari/context/ari-entity-reference-resolver.js
// Ari Subject Graph / Entity & Reference Resolver
// Purpose: Track conversational subjects and resolve references without domain keyword routing.
// V4.0.0 — Universal, advisory-only

window.Ari = window.Ari || {};

window.AriEntityReferenceResolver = {
  version: "4.0.0",

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

    const candidates = [
      ...this.extractStructuralSubjects(recentMessages),
      ...this.subjectsFromThread(thread)
    ];

    const subjects = this.mergeSubjects([
      ...(priorState.subjects || []),
      ...candidates
    ]);

    const references = this.resolveReferences({
      currentText,
      subjects,
      thread
    });

    const activeSubject =
      this.chooseActiveSubject(subjects, references, thread) || null;

    const state = {
      entityReferenceResolverRan: true,
      entityReferenceResolverVersion: this.version,
      entityReferenceResolverSource: "ari-subject-graph",

      subjectGraphRan: true,
      subjectGraphVersion: this.version,
      subjectGraphSource: "ari-subject-graph",

      currentText,
      subjects,
      references,
      activeSubject,
      activeEntity: activeSubject,

      confidence: this.scoreConfidence(subjects, references, activeSubject),

      authority: "advisory_context_only",

      cannotSet: [
        "primaryLane",
        "primaryLaneSuggestion",
        "triagePrimaryLane",
        "situationContractPrimary",
        "riskLevel",
        "override",
        "finalResponse",
        "medicalEscalation"
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

      activeSubjects: subjects,
      activeEntities: subjects,

      resolvedReferences: references,

      activeSubject,
      activeEntity: activeSubject,

      activeReference: references[0] || null
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

    return [...fromFacts, currentText]
      .filter(Boolean)
      .slice(-10);
  },

  extractStructuralSubjects(messages = []) {
    const subjects = [];

    messages.forEach((message, index) => {
      const text = this.clean(message);

      // Possessive subject: my ___ / our ___
      for (const match of text.matchAll(/\b(my|our)\s+([a-zA-Z][a-zA-Z'_-]{1,40})\b/g)) {
        subjects.push(this.makeSubject({
          surface: `${match[1]} ${match[2]}`,
          kind: "possessive_subject",
          relationToUser: match[1],
          evidence: match[0],
          messageIndex: index,
          source: "structural_possessive"
        }));
      }

      // Definite/current object: the ___ / this ___ / that ___
      for (const match of text.matchAll(/\b(the|this|that)\s+([a-zA-Z][a-zA-Z'_-]{1,40})\b/g)) {
        subjects.push(this.makeSubject({
          surface: `${match[1]} ${match[2]}`,
          kind: "referenced_subject",
          relationToUser: null,
          evidence: match[0],
          messageIndex: index,
          source: "structural_reference"
        }));
      }

      // Named subject: capitalized terms
      for (const match of text.matchAll(/\b[A-Z][a-zA-Z'_-]{2,}(?:\s+[A-Z][a-zA-Z'_-]{2,})?\b/g)) {
        const surface = match[0];
        if (this.isCommonSentenceStarter(surface)) continue;

        subjects.push(this.makeSubject({
          surface,
          kind: "named_subject",
          relationToUser: null,
          evidence: surface,
          messageIndex: index,
          source: "structural_named_subject"
        }));
      }
    });

    return subjects;
  },

  subjectsFromThread(thread = {}) {
    const subjects = [];

    if (thread.activeSubject && thread.activeSubject.type !== "unknown") {
      subjects.push(this.makeSubject({
        surface:
          thread.activeSubject.label ||
          thread.activeSubject.evidence ||
          "active subject",
        kind: "thread_active_subject",
        evidence: thread.activeSubject.evidence || null,
        source: "thread_understanding",
        salienceBoost: 0.35,
        attributes: {
          threadSubject: thread.activeSubject
        }
      }));
    }

    if (thread.activeIssue && thread.activeIssue.type !== "unknown") {
      subjects.push(this.makeSubject({
        surface:
          thread.activeIssue.label ||
          thread.activeIssue.evidence ||
          "active issue",
        kind: "thread_active_issue",
        evidence: thread.activeIssue.evidence || null,
        source: "thread_understanding",
        salienceBoost: 0.28,
        attributes: {
          threadIssue: thread.activeIssue
        }
      }));
    }

    return subjects;
  },

  makeSubject(data = {}) {
    return {
      id: data.id || this.createId("subject"),
      surface: data.surface || data.evidence || "unknown subject",
      kind: data.kind || "subject",
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
      const existing = merged.find(s => this.key(s.surface) === key);

      if (existing) {
        existing.mentions += subject.mentions || 1;
        existing.recency = Math.max(existing.recency || 0, subject.recency || 0);
        existing.confidence = Math.max(existing.confidence || 0, subject.confidence || 0);
        existing.salience = Math.min(
          1,
          (existing.salience || 0.5) + 0.1 + (subject.salienceBoost || 0)
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
      .map(s => ({
        ...s,
        score: this.subjectScore(s)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  },

  subjectScore(subject = {}) {
    return (
      (subject.salience || 0) * 0.45 +
      Math.min(1, (subject.mentions || 1) / 4) * 0.2 +
      (subject.recency || 0.5) * 0.2 +
      (subject.confidence || 0.5) * 0.15
    );
  },

  resolveReferences({ currentText = "", subjects = [], thread = {} } = {}) {
    const text = this.clean(currentText).toLowerCase();
    const refs = [];

    const pronouns = [
      "it",
      "this",
      "that",
      "this one",
      "that one",
      "he",
      "him",
      "his",
      "she",
      "her",
      "they",
      "them",
      "their"
    ];

    pronouns.forEach(term => {
      const regex = new RegExp(`\\b${term.replace(" ", "\\s+")}\\b`, "i");
      if (!regex.test(text)) return;

      refs.push({
        reference: term,
        resolvedTo: subjects[0] || null,
        reason: "Resolved by active subject salience, recency, and thread focus.",
        confidence: subjects[0] ? 0.72 : 0.2,
        source: "ari-subject-graph"
      });
    });

    if (this.isImplicitFollowUpQuestion(text, thread)) {
      refs.push({
        reference: "implicit_current_subject",
        resolvedTo: subjects[0] || null,
        reason: "Short follow-up question appears to depend on the active subject.",
        confidence: subjects[0] ? 0.82 : 0.25,
        source: "ari-subject-graph"
      });
    }

    if (thread.activeIssue && thread.activeIssue.type !== "unknown") {
      refs.push({
        reference: "implicit_current_issue",
        resolvedTo: thread.activeIssue,
        reason: "Thread Understanding identified an active issue.",
        confidence: thread.activeIssue.confidence || 0.75,
        source: "thread_understanding"
      });
    }

    return refs.slice(0, 10);
  },

  isImplicitFollowUpQuestion(text = "", thread = {}) {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const hasQuestion = text.includes("?");

    return (
      hasQuestion &&
      wordCount <= 12 &&
      (
        thread.continuityUsed === true ||
        thread.impliedQuestion?.type ||
        thread.activeSubject?.type
      )
    );
  },

  chooseActiveSubject(subjects = [], references = [], thread = {}) {
    const refTarget = references.find(r => r.resolvedTo)?.resolvedTo;
    if (refTarget?.surface || refTarget?.label) return refTarget;

    return subjects[0] || null;
  },

  scoreConfidence(subjects = [], references = [], activeSubject = null) {
    let score = 25;
    if (subjects.length) score += 30;
    if (references.length) score += 25;
    if (activeSubject) score += 15;
    if (subjects[0]?.score >= 0.7) score += 10;
    return Math.min(95, score);
  },

  isCommonSentenceStarter(surface = "") {
    return [
      "What", "Why", "How", "When", "Where", "Should",
      "Can", "Do", "Does", "Is", "Are", "Will", "Would",
      "Okay", "Yes", "No", "Done", "Next"
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