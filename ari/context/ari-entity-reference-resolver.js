// ari/context/ari-entity-reference-resolver.js
// Ari Subject Graph / Entity & Reference Resolver
// Purpose: Track conversational actors, issues, actions, pressures, and references.
// V5.0.0 — Universal Context Resolver

window.Ari = window.Ari || {};

window.AriEntityReferenceResolver = {
  version: "5.0.0",

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
      ...this.extractActorsAndSubjects(recentMessages),
      ...this.extractIssues(recentMessages),
      ...this.extractPressures(recentMessages),
      ...this.subjectsFromThread(thread)
    ];

    const subjects = this.mergeSubjects([
      ...(priorState.subjects || []),
      ...candidates
    ]);

    const activeProblem = this.resolveActiveProblem({
      currentText,
      recentMessages,
      subjects,
      thread,
      priorState
    });

    const references = this.resolveReferences({
      currentText,
      subjects,
      thread,
      activeProblem
    });

    const activeSubject =
      this.chooseActiveSubject(subjects, references, thread, activeProblem) ||
      null;

    const state = {
      entityReferenceResolverRan: true,
      entityReferenceResolverVersion: this.version,
      entityReferenceResolverSource: "ari-subject-graph",

      subjectGraphRan: true,
      subjectGraphVersion: this.version,
      subjectGraphSource: "ari-subject-graph",

      currentText,
      recentMessages,
      subjects,
      references,
      activeSubject,
      activeEntity: activeSubject,
      activeProblem,
      activeIssue: activeProblem,

      confidence: this.scoreConfidence(subjects, references, activeSubject, activeProblem),

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

      activeProblem,
      activeIssue: activeProblem,

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

    const threadTimeline =
      summary.threadUnderstanding?.workingContext?.timeline || [];

    const fromTimeline = threadTimeline
      .map(item => this.clean(item.text || item.claim || ""))
      .filter(Boolean);

    return [...fromFacts, ...fromTimeline, currentText]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(-12);
  },

  extractActorsAndSubjects(messages = []) {
    const subjects = [];

    messages.forEach((message, index) => {
      const text = this.clean(message);

      const actorPatterns = [
        /\b(my|our)\s+(spouse|wife|husband|partner|fiance|fiancé|girlfriend|boyfriend|kids|children|family|friend|coworker|boss|team|leadership|manager|dad|father|mom|mother)\b/gi,
        /\b(they|them|their|he|him|his|she|her)\b/gi,
        /\b(coworker|boss|team|leadership|manager|spouse|wife|husband|partner|kids|children|family|friend)\b/gi
      ];

      actorPatterns.forEach(pattern => {
        for (const match of text.matchAll(pattern)) {
          subjects.push(this.makeSubject({
            surface: match[0],
            kind: "actor",
            evidence: match[0],
            messageIndex: index,
            source: "actor_extraction",
            attributes: {
              role: this.classifyRole(match[0])
            }
          }));
        }
      });

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

      for (const match of text.matchAll(/\b(the|this|that)\s+([a-zA-Z][a-zA-Z'_-]{1,40})\b/g)) {
        subjects.push(this.makeSubject({
          surface: `${match[1]} ${match[2]}`,
          kind: "referenced_subject",
          evidence: match[0],
          messageIndex: index,
          source: "structural_reference"
        }));
      }

      for (const match of text.matchAll(/\b[A-Z][a-zA-Z'_-]{2,}(?:\s+[A-Z][a-zA-Z'_-]{2,})?\b/g)) {
        const surface = match[0];
        if (this.isCommonSentenceStarter(surface)) continue;

        subjects.push(this.makeSubject({
          surface,
          kind: "named_subject",
          evidence: surface,
          messageIndex: index,
          source: "structural_named_subject"
        }));
      }
    });

    return subjects;
  },

  extractIssues(messages = []) {
    const issues = [];

    messages.forEach((message, index) => {
      const text = this.clean(message);
      const lower = text.toLowerCase();

      const issueSignals = [
        "cutting corners",
        "rushing",
        "reporting",
        "hate me",
        "honest",
        "haven't told",
        "didn't tell",
        "upset",
        "move",
        "promotion",
        "pressure",
        "deadline",
        "unsafe",
        "mistake",
        "conflict",
        "problem"
      ];

      issueSignals.forEach(signal => {
        if (!lower.includes(signal)) return;

        issues.push(this.makeSubject({
          surface: signal,
          kind: "active_issue",
          evidence: signal,
          messageIndex: index,
          source: "issue_extraction",
          salienceBoost: 0.25,
          attributes: {
            issueType: this.classifyIssue(signal)
          }
        }));
      });
    });

    return issues;
  },

  extractPressures(messages = []) {
    const pressures = [];

    messages.forEach((message, index) => {
      const text = this.clean(message);
      const lower = text.toLowerCase();

      const pressureSignals = [
        "rushing",
        "pressure",
        "only doing it because",
        "because leadership",
        "deadline",
        "understaffed",
        "short staffed",
        "too much",
        "no time",
        "forced",
        "required",
        "have to",
        "must"
      ];

      pressureSignals.forEach(signal => {
        if (!lower.includes(signal)) return;

        pressures.push(this.makeSubject({
          surface: signal,
          kind: "pressure_or_constraint",
          evidence: signal,
          messageIndex: index,
          source: "pressure_extraction",
          salienceBoost: 0.22,
          attributes: {
            pressureType: "system_pressure"
          }
        }));
      });
    });

    return pressures;
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
        salienceBoost: 0.35,
        attributes: {
          threadIssue: thread.activeIssue
        }
      }));
    }

    return subjects;
  },

  resolveActiveProblem({ currentText = "", recentMessages = [], subjects = [], thread = {}, priorState = {} } = {}) {
    const text = this.clean(currentText).toLowerCase();
    const allText = recentMessages.join(" ").toLowerCase();

    const priorProblem = priorState.activeProblem || priorState.activeIssue || null;

    const problem = {
      type: "active_problem",
      label: null,
      evidence: [],
      actors: [],
      pressures: [],
      issueType: "unknown",
      confidence: 0.45,
      source: "ari-subject-graph"
    };

    if (allText.includes("cutting corners")) {
      problem.label = "coworker cutting corners under possible pressure";
      problem.issueType = "work_ethics_or_safety";
      problem.evidence.push("cutting corners");
      problem.confidence += 0.2;
    }

    if (allText.includes("leadership") && allText.includes("rushing")) {
      problem.pressures.push("leadership rushing everyone");
      problem.evidence.push("leadership keeps rushing everyone");
      problem.confidence += 0.25;
    }

    if (allText.includes("reporting") || allText.includes("report a coworker")) {
      problem.evidence.push("considering reporting a coworker");
      problem.issueType = "workplace_reporting_decision";
      problem.confidence += 0.15;
    }

    if (allText.includes("hate me") || allText.includes("team hate")) {
      problem.evidence.push("fear of team backlash");
      problem.actors.push("team");
      problem.confidence += 0.15;
    }

    if (this.hasAny(allText, ["honest", "honesty", "haven't told", "didn't tell", "secret", "withheld"])) {
      problem.label = problem.label || "trust and honesty concern";
      problem.issueType = "trust_or_communication";
      problem.evidence.push("honesty or communication concern");
      problem.confidence += 0.15;
    }

    subjects.forEach(subject => {
      if (subject.kind === "actor") problem.actors.push(subject.surface);
      if (subject.kind === "pressure_or_constraint") problem.pressures.push(subject.surface);
    });

    problem.actors = [...new Set(problem.actors)].slice(0, 6);
    problem.pressures = [...new Set(problem.pressures)].slice(0, 6);
    problem.evidence = [...new Set(problem.evidence)].slice(0, 8);

    if (!problem.label && priorProblem?.label) {
      return {
        ...priorProblem,
        carriedForward: true,
        confidence: Math.min(0.82, priorProblem.confidence || 0.65)
      };
    }

    if (!problem.label && problem.evidence.length) {
      problem.label = problem.evidence[0];
    }

    if (!problem.label) return null;

    problem.confidence = Math.min(0.95, problem.confidence);

    return problem;
  },

  resolveReferences({ currentText = "", subjects = [], thread = {}, activeProblem = null } = {}) {
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

      const target =
        this.resolvePronounTarget(term, subjects, activeProblem) ||
        subjects[0] ||
        activeProblem ||
        null;

      refs.push({
        reference: term,
        resolvedTo: target,
        reason: "Resolved by actor salience, active problem, recency, and thread focus.",
        confidence: target ? 0.78 : 0.2,
        source: "ari-subject-graph"
      });
    });

    if (this.isImplicitFollowUpQuestion(text, thread, activeProblem)) {
      refs.push({
        reference: "implicit_current_problem",
        resolvedTo: activeProblem || subjects[0] || null,
        reason: "Follow-up question depends on the active problem from the prior turn.",
        confidence: activeProblem ? 0.86 : subjects[0] ? 0.72 : 0.25,
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

  resolvePronounTarget(term = "", subjects = [], activeProblem = null) {
    const lower = term.toLowerCase();

    if (["they", "them", "their"].includes(lower)) {
      const groupActor = subjects.find(s =>
        ["team", "leadership", "coworker", "family", "kids", "children"].includes(
          this.key(s.surface)
        )
      );

      return groupActor || activeProblem || subjects[0] || null;
    }

    if (["it", "this", "that"].includes(lower)) {
      return activeProblem || subjects.find(s => s.kind === "active_issue") || subjects[0] || null;
    }

    return subjects[0] || activeProblem || null;
  },

  isImplicitFollowUpQuestion(text = "", thread = {}, activeProblem = null) {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const hasQuestion = text.includes("?");

    return (
      hasQuestion &&
      wordCount <= 18 &&
      (
        activeProblem ||
        thread.continuityUsed === true ||
        thread.impliedQuestion?.type ||
        thread.activeSubject?.type
      )
    );
  },

  chooseActiveSubject(subjects = [], references = [], thread = {}, activeProblem = null) {
    const refTarget = references.find(r => r.resolvedTo)?.resolvedTo;
    if (refTarget?.surface || refTarget?.label) return refTarget;

    const actor = subjects.find(s => s.kind === "actor");
    if (actor) return actor;

    if (activeProblem) return activeProblem;

    return subjects[0] || null;
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
      .slice(0, 16);
  },

  subjectScore(subject = {}) {
    const kindBoost =
      subject.kind === "active_issue" ? 0.14 :
      subject.kind === "pressure_or_constraint" ? 0.12 :
      subject.kind === "actor" ? 0.1 :
      0;

    return (
      (subject.salience || 0) * 0.4 +
      Math.min(1, (subject.mentions || 1) / 4) * 0.2 +
      (subject.recency || 0.5) * 0.2 +
      (subject.confidence || 0.5) * 0.15 +
      kindBoost
    );
  },

  scoreConfidence(subjects = [], references = [], activeSubject = null, activeProblem = null) {
    let score = 25;
    if (subjects.length) score += 25;
    if (references.length) score += 20;
    if (activeSubject) score += 15;
    if (activeProblem) score += 20;
    if (subjects[0]?.score >= 0.7) score += 10;
    return Math.min(95, score);
  },

  classifyRole(value = "") {
    const key = this.key(value);

    if (["wife", "husband", "spouse", "partner", "girlfriend", "boyfriend", "fiance", "fiancé"].includes(key)) {
      return "close_partner";
    }

    if (["kids", "children", "family", "dad", "father", "mom", "mother"].includes(key)) {
      return "family";
    }

    if (["coworker", "boss", "team", "leadership", "manager"].includes(key)) {
      return "work_actor";
    }

    return "actor";
  },

  classifyIssue(value = "") {
    const key = this.key(value);

    if (["cutting corners", "unsafe", "mistake"].includes(key)) return "quality_or_safety";
    if (["rushing", "pressure", "deadline"].includes(key)) return "system_pressure";
    if (["honest", "honesty", "haven't told", "didn't tell"].includes(key)) return "trust_or_communication";
    if (["promotion", "move", "job", "career"].includes(key)) return "life_or_work_decision";

    return "general_issue";
  },

  isCommonSentenceStarter(surface = "") {
    return [
      "What", "Why", "How", "When", "Where", "Should",
      "Can", "Do", "Does", "Is", "Are", "Will", "Would",
      "Okay", "Yes", "No", "Done", "Next", "If"
    ].includes(surface);
  },

  hasAny(text = "", terms = []) {
    const lower = String(text || "").toLowerCase();
    return terms.some(term => lower.includes(String(term).toLowerCase()));
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