// ari/context/ari-entity-reference-resolver.js
// Ari Subject Graph / Entity & Reference Resolver
// Purpose: Resolve who/what the user is referring to across turns.
// V5.2.0 — Entity + Active Problem Resolver / Advisory Only

window.Ari = window.Ari || {};

window.AriEntityReferenceResolver = {
  version: "5.2.0",

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
      ...(priorState.entities || []),
      ...this.extractEntitiesFromMessages(recentMessages),
      ...this.entitiesFromThread(thread)
    ]);

    const activeProblem = this.resolveActiveProblem({
      currentText,
      recentMessages,
      candidates,
      thread,
      priorState
    });

    const references = this.resolveReferences({
      currentText,
      candidates,
      thread,
      activeProblem
    });

    const activeEntity = this.chooseActiveEntity({
      candidates,
      references,
      thread,
      activeProblem
    });

    const groundedContext = this.buildGroundedContext({
      currentText,
      recentMessages,
      activeEntity,
      activeProblem,
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

      activeProblem,
      activeIssue: activeProblem,

      resolvedActor: activeProblem?.actor || null,
      resolvedAction: activeProblem?.action || null,
      resolvedIssue: activeProblem?.issue || null,
      resolvedPressure: activeProblem?.pressure || null,
      resolvedDecision: activeProblem?.decision || null,
      resolvedConsequence: activeProblem?.consequence || null,

      groundedContext,

      confidence: this.scoreConfidence({
        candidates,
        references,
        activeEntity,
        activeProblem
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

      activeProblem,
      activeIssue: activeProblem,

      resolvedActor: state.resolvedActor,
      resolvedAction: state.resolvedAction,
      resolvedIssue: state.resolvedIssue,
      resolvedPressure: state.resolvedPressure,
      resolvedDecision: state.resolvedDecision,
      resolvedConsequence: state.resolvedConsequence,

      groundedContext,

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
      this.extractActionEntities(text, index, entities);
      this.extractPressureEntities(text, index, entities);
      this.extractDecisionEntities(text, index, entities);
      this.extractConsequenceEntities(text, index, entities);
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
      "nurse", "coworker", "boss", "manager", "leadership", "management",
      "team", "employee", "staff", "friend", "wife", "husband", "spouse",
      "partner", "girlfriend", "boyfriend", "fiance", "fiancé", "father",
      "dad", "mother", "mom", "child", "kid", "baby", "cat", "dog", "pet"
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
        confidence: 0.76,
        attributes: {
          role,
          roleClass: this.classifyRole(role)
        }
      }));
    });
  },

  extractActionEntities(text = "", index = 0, entities = []) {
    const actions = [
      "documenting assessments",
      "documenting assessments they didn't actually complete",
      "cutting corners",
      "reporting it",
      "reporting a coworker",
      "talking to them first",
      "denying everything",
      "deny everything"
    ];

    const lower = text.toLowerCase();

    actions.forEach(action => {
      if (!lower.includes(action)) return;

      entities.push(this.makeEntity({
        surface: action,
        kind: "action_entity",
        evidence: action,
        messageIndex: index,
        source: "action_entity_extraction",
        confidence: 0.82,
        salienceBoost: 0.18,
        attributes: {
          actionType: this.classifyAction(action)
        }
      }));
    });
  },

  extractPressureEntities(text = "", index = 0, entities = []) {
    const pressures = [
      "leadership keeps rushing everyone",
      "management has been pushing everyone",
      "understaffed",
      "rushing",
      "pressure",
      "not enough time",
      "short staffed",
      "short-staffed"
    ];

    const lower = text.toLowerCase();

    pressures.forEach(pressure => {
      if (!lower.includes(pressure)) return;

      entities.push(this.makeEntity({
        surface: pressure,
        kind: "pressure_entity",
        evidence: pressure,
        messageIndex: index,
        source: "pressure_entity_extraction",
        confidence: 0.82,
        salienceBoost: 0.16,
        attributes: {
          pressureType: "system_pressure"
        }
      }));
    });
  },

  extractDecisionEntities(text = "", index = 0, entities = []) {
    const decisions = [
      "considering reporting",
      "reporting it",
      "report a coworker",
      "talking to them first",
      "what should i do",
      "should i"
    ];

    const lower = text.toLowerCase();

    decisions.forEach(decision => {
      if (!lower.includes(decision)) return;

      entities.push(this.makeEntity({
        surface: decision,
        kind: "decision_entity",
        evidence: decision,
        messageIndex: index,
        source: "decision_entity_extraction",
        confidence: 0.82,
        salienceBoost: 0.15,
        attributes: {
          decisionType: "next_action_or_escalation"
        }
      }));
    });
  },

  extractConsequenceEntities(text = "", index = 0, entities = []) {
    const consequences = [
      "team will hate me",
      "team hate me",
      "retaliation",
      "backlash",
      "get in trouble",
      "patient safety",
      "legal risk"
    ];

    const lower = text.toLowerCase();

    consequences.forEach(consequence => {
      if (!lower.includes(consequence)) return;

      entities.push(this.makeEntity({
        surface: consequence,
        kind: "consequence_entity",
        evidence: consequence,
        messageIndex: index,
        source: "consequence_entity_extraction",
        confidence: 0.8,
        salienceBoost: 0.14,
        attributes: {
          consequenceType: "risk_or_social_consequence"
        }
      }));
    });
  },
    entitiesFromThread(thread = {}) {
    const entities = [];

    const resolved = thread.resolvedMeaning || {};
    const working = thread.workingContext || {};

    [
      thread.activeSubject,
      thread.activeObject,
      thread.activeEntity,
      resolved.resolvedSubject,
      resolved.resolvedObject,
      working.activeSubject,
      working.activeObject
    ]
      .filter(Boolean)
      .forEach(item => {
        entities.push(
          this.makeEntity({
            surface:
              item.label ||
              item.surface ||
              item.evidence ||
              item.kind ||
              "thread_entity",
            kind: "thread_entity",
            evidence: item.evidence || item.label,
            source: "thread_understanding",
            confidence: item.confidence ?? 0.85,
            salienceBoost: 0.35,
            attributes: {
              original: item
            }
          })
        );
      });

    // NEW: promote active issue into entity graph
    if (resolved.resolvedIssue) {
      entities.push(
        this.makeEntity({
          surface:
            resolved.resolvedIssue.label ||
            resolved.resolvedIssue.kind,
          kind: "issue_entity",
          evidence: resolved.resolvedIssue.evidence,
          source: "thread_understanding",
          confidence: resolved.resolvedIssue.confidence ?? 0.9,
          salienceBoost: 0.35,
          attributes: {
            issueKind: resolved.resolvedIssue.kind
          }
        })
      );
    }

    // NEW: promote active goal
    if (resolved.resolvedGoal) {
      entities.push(
        this.makeEntity({
          surface:
            resolved.resolvedGoal.label ||
            resolved.resolvedGoal.kind,
          kind: "goal_entity",
          evidence: resolved.resolvedGoal.evidence,
          source: "thread_understanding",
          confidence: resolved.resolvedGoal.confidence ?? 0.88,
          salienceBoost: 0.30
        })
      );
    }

    return entities;
  },

  resolveReferences({ currentText = "", candidates = [], thread = {} } = {}) {
    const text = this.clean(currentText).toLowerCase();
    const references = [];

    // FIRST: explicit pronouns
    const pronouns = [
      "he","him","his",
      "she","her","hers",
      "they","them","their",
      "it","its",
      "this","that"
    ];

    pronouns.forEach(word => {
      if (!new RegExp(`\\b${word}\\b`, "i").test(text)) return;

      const target = this.resolveReferenceTarget(
        word,
        candidates,
        thread
      );

      references.push({
        reference: word,
        resolvedTo: target,
        confidence: target ? 0.90 : 0.30,
        reason: target
          ? "Resolved from thread continuity and entity salience."
          : "No reliable target.",
        source: "ari-subject-graph"
      });
    });

    // SECOND: implicit follow-up
    if (references.length === 0 && this.isImplicitFollowUp(text, thread)) {
      const target =
        this.chooseContinuationTarget(candidates, thread);

      references.push({
        reference: "__implicit__",
        resolvedTo: target,
        confidence: target ? 0.92 : 0.30,
        reason: target
          ? "Short follow-up inherited prior conversational target."
          : "Unable to inherit target.",
        source: "ari-subject-graph"
      });
    }

    return references;
  },

  resolveReferenceTarget(term = "", candidates = [], thread = {}) {
    const lower = term.toLowerCase();

    const usable = candidates.filter(
      x => x.kind !== "pronoun_mention"
    );

    // they/them usually refers to active person
    if (
      lower === "they" ||
      lower === "them" ||
      lower === "their"
    ) {
      const threadPerson =
        usable.find(
          x =>
            x.kind === "thread_entity" &&
            this.isLikelyPersonEntity(x)
        ) ||
        usable.find(x => this.isLikelyPersonEntity(x));

      if (threadPerson) return threadPerson;
    }

    if (
      ["he","him","his","she","her","hers"].includes(lower)
    ) {
      return (
        usable.find(x => this.isLikelyPersonEntity(x)) ||
        usable[0] ||
        null
      );
    }

    if (
      ["it","its","this","that"].includes(lower)
    ) {
      return (
        usable.find(
          x =>
            x.kind === "issue_entity" ||
            x.kind === "action_entity" ||
            x.kind === "decision_entity"
        ) ||
        usable[0] ||
        null
      );
    }

    return usable[0] || null;
  },

  chooseContinuationTarget(candidates = [], thread = {}) {
    // Prefer active thread subject
    const threadEntity = candidates.find(
      x => x.kind === "thread_entity"
    );
    if (threadEntity) return threadEntity;

    // Then active issue
    const issue = candidates.find(
      x => x.kind === "issue_entity"
    );
    if (issue) return issue;

    // Then decision/action
    const decision = candidates.find(
      x =>
        x.kind === "decision_entity" ||
        x.kind === "action_entity"
    );
    if (decision) return decision;

    return candidates.find(
      x => x.kind !== "pronoun_mention"
    ) || null;
  },
    resolveActiveProblem({ currentText = "", recentMessages = [], candidates = [], thread = {}, priorState = {} } = {}) {
    const allText = this.clean(recentMessages.join(" ")).toLowerCase();
    const priorProblem = priorState.activeProblem || priorState.activeIssue || null;

    const problem = {
      type: "active_problem",
      label: null,
      actor: null,
      action: null,
      issue: null,
      pressure: null,
      decision: null,
      consequence: null,
      evidence: [],
      confidence: 0.45,
      source: "ari-subject-graph"
    };

    const actor =
      candidates.find(e => e.kind === "role_entity" && ["nurse", "coworker", "staff", "employee"].includes(this.key(e.surface))) ||
      candidates.find(e => e.kind === "role_entity" && this.isLikelyPersonEntity(e));

    const pressure = candidates.find(e => e.kind === "pressure_entity");
    const action = candidates.find(e => e.kind === "action_entity");
    const decision = candidates.find(e => e.kind === "decision_entity");
    const consequence = candidates.find(e => e.kind === "consequence_entity");

    if (actor) {
      problem.actor = actor.surface;
      problem.evidence.push(actor.evidence || actor.surface);
      problem.confidence += 0.1;
    }

    if (action) {
      problem.action = action.surface;
      problem.evidence.push(action.evidence || action.surface);
      problem.confidence += 0.16;
    }

    if (pressure) {
      problem.pressure = pressure.surface;
      problem.evidence.push(pressure.evidence || pressure.surface);
      problem.confidence += 0.14;
    }

    if (decision) {
      problem.decision = decision.surface;
      problem.evidence.push(decision.evidence || decision.surface);
      problem.confidence += 0.12;
    }

    if (consequence) {
      problem.consequence = consequence.surface;
      problem.evidence.push(consequence.evidence || consequence.surface);
      problem.confidence += 0.1;
    }

    if (allText.includes("documenting assessments") || allText.includes("didn't actually complete")) {
      problem.issue = "documenting assessments that were not actually completed";
      problem.evidence.push("documenting assessments not actually completed");
      problem.confidence += 0.2;
    } else if (allText.includes("cutting corners")) {
      problem.issue = "cutting corners";
      problem.evidence.push("cutting corners");
      problem.confidence += 0.14;
    } else if (allText.includes("deny everything") || allText.includes("denying everything")) {
      problem.issue = "denial of the concern";
      problem.evidence.push("deny everything");
      problem.confidence += 0.1;
    }

    if (problem.issue && problem.actor) {
      problem.label = `${problem.actor} ${problem.issue}`;
    } else if (problem.issue) {
      problem.label = problem.issue;
    } else if (problem.action) {
      problem.label = problem.action;
    } else if (priorProblem?.label) {
      return {
        ...priorProblem,
        carriedForward: true,
        confidence: Math.min(0.86, priorProblem.confidence || 0.7)
      };
    }

    if (!problem.label) return null;

    problem.evidence = [...new Set(problem.evidence)].slice(0, 10);
    problem.confidence = Math.min(0.95, problem.confidence);

    return problem;
  },

  buildGroundedContext({ currentText = "", recentMessages = [], activeEntity = null, activeProblem = null, references = [], thread = {} } = {}) {
    return {
      currentQuestion: currentText || null,
      threadSummary: this.summarizeThread(recentMessages, activeProblem),
      activeEntityLabel:
        activeEntity?.surface ||
        activeEntity?.label ||
        null,
      activeProblemLabel: activeProblem?.label || null,
      actor: activeProblem?.actor || null,
      action: activeProblem?.action || null,
      issue: activeProblem?.issue || null,
      pressure: activeProblem?.pressure || null,
      decision: activeProblem?.decision || null,
      consequence: activeProblem?.consequence || null,
      references: references.map(ref => ({
        reference: ref.reference,
        resolvedTo:
          ref.resolvedTo?.surface ||
          ref.resolvedTo?.label ||
          ref.resolvedTo?.evidence ||
          null,
        confidence: ref.confidence
      })),
      authority: "advisory_context_only"
    };
  },

  summarizeThread(messages = [], activeProblem = null) {
    if (activeProblem?.label) {
      const parts = [];

      if (activeProblem.actor) parts.push(`actor=${activeProblem.actor}`);
      if (activeProblem.issue) parts.push(`issue=${activeProblem.issue}`);
      if (activeProblem.pressure) parts.push(`pressure=${activeProblem.pressure}`);
      if (activeProblem.decision) parts.push(`decision=${activeProblem.decision}`);
      if (activeProblem.consequence) parts.push(`consequence=${activeProblem.consequence}`);

      return parts.length ? parts.join("; ") : activeProblem.label;
    }

    return messages.slice(-3).join(" ");
  },

  chooseActiveEntity({ candidates = [], references = [], thread = {}, activeProblem = null } = {}) {
    const referenced = references.find(ref => ref.resolvedTo)?.resolvedTo;
    if (referenced) return referenced;

    if (activeProblem) {
      return this.makeEntity({
        surface: activeProblem.label,
        kind: "active_problem_entity",
        evidence: activeProblem.evidence?.[0] || activeProblem.label,
        source: "active_problem_resolution",
        confidence: activeProblem.confidence || 0.82,
        salienceBoost: 0.35,
        attributes: { activeProblem }
      });
    }

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
        existing.salience = Math.min(1, (existing.salience || 0.5) + 0.08 + (subject.salienceBoost || 0));
        existing.aliases = [...new Set([...(existing.aliases || []), ...(subject.aliases || [])])];
        existing.sources = [...new Set([...(existing.sources || []), subject.source])];
        existing.attributes = { ...(existing.attributes || {}), ...(subject.attributes || {}) };
        return;
      }

      merged.push({
        ...subject,
        sources: [subject.source],
        salience: Math.min(1, (subject.salience || 0.55) + (subject.salienceBoost || 0))
      });
    });

    return merged
      .map(item => ({ ...item, score: this.entityScore(item) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 16);
  },

  entityScore(entity = {}) {
    const kindBoost =
      entity.kind === "active_problem_entity" ? 0.22 :
      entity.kind === "issue_entity" ? 0.16 :
      entity.kind === "thread_entity" ? 0.14 :
      entity.kind === "action_entity" ? 0.13 :
      entity.kind === "pressure_entity" ? 0.12 :
      entity.kind === "decision_entity" ? 0.12 :
      entity.kind === "consequence_entity" ? 0.1 :
      entity.kind === "role_entity" ? 0.1 :
      entity.kind === "named_entity" ? 0.08 :
      entity.kind === "possessive_entity" ? 0.06 :
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

  scoreConfidence({ candidates = [], references = [], activeEntity = null, activeProblem = null } = {}) {
    let score = 25;
    if (candidates.length) score += 20;
    if (references.length) score += 20;
    if (activeEntity) score += 15;
    if (activeProblem) score += 25;
    if (candidates[0]?.score >= 0.7) score += 10;
    return Math.min(95, score);
  },

  classifyRole(value = "") {
    const key = this.key(value);
    if (["nurse", "coworker", "employee", "staff"].includes(key)) return "work_actor";
    if (["leadership", "management", "boss", "manager"].includes(key)) return "authority_or_pressure_source";
    if (["team"].includes(key)) return "group_or_social_consequence";
    if (["cat", "dog", "pet"].includes(key)) return "animal_or_pet";
    if (["wife", "husband", "spouse", "partner", "girlfriend", "boyfriend", "fiance", "fiancé"].includes(key)) return "partner";
    if (["father", "dad", "mother", "mom", "child", "kid", "baby"].includes(key)) return "family";
    return "actor";
  },

  classifyAction(value = "") {
    const key = this.key(value);
    if (key.includes("documenting assessments")) return "documentation_action";
    if (key.includes("cutting corners")) return "quality_or_safety_action";
    if (key.includes("report")) return "reporting_or_escalation_action";
    if (key.includes("talking")) return "direct_conversation_action";
    if (key.includes("deny")) return "denial_response";
    return "action";
  },

  isLikelyPersonEntity(entity = {}) {
    const roleClass = entity.attributes?.roleClass;
    return ["work_actor", "partner", "family", "actor"].includes(roleClass);
  },

  isLikelyGroupEntity(entity = {}) {
    const roleClass = entity.attributes?.roleClass;
    const value = this.key(entity.surface);
    return roleClass === "group_or_social_consequence" || ["team", "staff", "employees"].includes(value);
  },

  isLikelyObjectOrIssueEntity(entity = {}) {
    return [
      "active_problem_entity",
      "issue_entity",
      "action_entity",
      "pressure_entity",
      "decision_entity",
      "consequence_entity",
      "referenced_entity",
      "thread_entity",
      "possessive_entity"
    ].includes(entity.kind);
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

  isCommonSentenceStarter(surface = "") {
    return [
      "What", "Why", "How", "When", "Where", "Should", "Can", "Do", "Does",
      "Is", "Are", "Will", "Would", "Okay", "Yes", "No", "Done", "Next",
      "If", "And", "But", "So"
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