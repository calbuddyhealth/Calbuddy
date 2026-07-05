// ari/understanding/ari-event-understanding-engine.js
// Purpose: Interpret what objectively happened / is happening / may happen.
// V0.3.0 — Stable Event Scorer / Ontology-Driven / No Meaning / No Final Writing

window.Ari = window.Ari || {};

window.AriEventUnderstandingEngine = {
  version: "0.3.0",

  understand(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(this.getText(summary));

    const language =
      summary.languageUnderstanding ||
      summary.languageUnderstandingPacket ||
      summary.languageUnderstandingResult ||
      {};

    const semantic =
      summary.semanticUnderstanding?.semanticUnderstanding ||
      summary.semanticUnderstanding ||
      summary.semanticUnderstandingPacket ||
      summary.semanticUnderstandingResult ||
      {};

    if (!text && !language?.usable && !semantic?.situationType) {
      return this.empty("No usable text, language packet, or semantic packet.");
    }

    const events = this.scoreEventFrames({ text, language, semantic });
    const primaryEvent = events[0] || this.fallbackEvent();

    return {
      eventUnderstandingRan: true,
      eventUnderstandingVersion: this.version,
      eventUnderstandingSource: "ari-event-understanding-engine",

      usable: true,

      event: primaryEvent,

      eventCategory: primaryEvent.category,
      eventType: primaryEvent.type,
      eventSubtype: primaryEvent.subtype,

      eventPolarity: primaryEvent.polarity,
      eventTime: primaryEvent.time,
      eventStage: primaryEvent.stage,
      eventOutcome: primaryEvent.outcome,
      eventActors: primaryEvent.actors,
      eventObject: primaryEvent.object,
      eventConfidence: primaryEvent.confidence,

      rankedEvents: events,
      competingEvents: events.slice(1, 4),

      eventOntologyVersion: window.AriEventOntology?.version || null,

      needsMeaningInterpretation: true,
      needsHumanStateBuilder: true,
      needsClarification: primaryEvent.confidence < 0.62,

      evidence: primaryEvent.evidence || []
    };
  },

  getEventDefinitions() {
    const ontology =
      window.AriEventOntology ||
      window.Ari?.eventOntology ||
      null;

    if (ontology && Array.isArray(ontology.definitions)) {
      return ontology.definitions;
    }

    return [];
  },

  scoreEventFrames(context = {}) {
    return this.getEventDefinitions()
      .map(frame => this.scoreEventFrame(frame, context))
      .filter(frame => frame.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(frame => ({
        ...frame,
        confidence: this.scoreToConfidence(frame.score, frame.threshold)
      }));
  },

  scoreEventFrame(frame = {}, context = {}) {
    let score = 0;
    const evidence = [];

    for (const signal of frame.signals || []) {
      const [kind, expected, weight] = signal;
      const matched = this.matchSignal(kind, expected, context);

      if (matched) {
        score += Number(weight || 0);
        evidence.push({
          kind,
          expected: expected instanceof RegExp ? expected.toString() : String(expected),
          weight
        });
      }
    }

    const time = this.resolveTime(context.text);
    const actors = this.resolveActors(context.language, context.text);
    const object = this.resolveObject(context.text, frame);

    return {
      category: frame.category || "unknown_event",
      type: frame.type || "unknown",
      subtype: frame.subtype || "unclear",
      label: frame.label || "Unknown Event",

      score,
      threshold: frame.threshold || 5,
      confidence: 0,

      polarity: frame.polarity || "unknown",
      outcome: frame.outcome || "unknown",
      stage: this.resolveStage(frame.stage, time),
      time,
      actors,
      object,

      evidence
    };
  },

  matchSignal(kind = "", expected, { text = "", language = {}, semantic = {} } = {}) {
    const speechAct = language.speechAct?.label;
    const domain = language.domains?.primary;

    const domains = [
      language.domains?.primary,
      ...(Array.isArray(language.domains?.secondary) ? language.domains.secondary : [])
    ].filter(Boolean);

    const action = language.action?.label;
    const actors = Array.isArray(language.actors) ? language.actors : [];

    const emotions = Array.isArray(language.emotionSignals)
      ? language.emotionSignals.map(e => e.label)
      : [];

    const knowledge = language.knowledgeNeed || {};
    const situationType = semantic.situationType;

    switch (kind) {
      case "speechAct":
        return speechAct === expected;

      case "speechActAny":
        return Array.isArray(expected) && expected.includes(speechAct);

      case "domain":
        return domain === expected || domains.includes(expected);

      case "domainAny":
        return Array.isArray(expected) && expected.some(d => domains.includes(d));

      case "actor":
        return actors.includes(expected);

      case "actorAny":
        return Array.isArray(expected) && expected.some(actor => actors.includes(actor));

      case "action":
        return action === expected;

      case "emotion":
        return emotions.includes(expected);

      case "emotionAny":
        return Array.isArray(expected) && expected.some(emotion => emotions.includes(emotion));

      case "semantic":
        return situationType === expected;

      case "semanticAny":
        return Array.isArray(expected) && expected.includes(situationType);

      case "knowledgeMedical":
        return Boolean(knowledge.medical) === expected;

      case "knowledgeProject":
        return Boolean(knowledge.project) === expected;

      case "knowledgeMemory":
        return Boolean(knowledge.memory) === expected;

      case "raw":
        return expected instanceof RegExp ? expected.test(text) : false;

      default:
        return false;
    }
  },

  resolveActors(language = {}, text = "") {
    const actors = Array.isArray(language.actors) ? [...language.actors] : [];

    if (/\bwife|husband|girlfriend|boyfriend|partner|spouse|fiance|fiancée\b/.test(text)) {
      actors.push("partner");
    }

    if (/\bfriends?\b/.test(text)) actors.push("friends");
    if (/\bfamily|mom|dad|mother|father|parents|baby|child|daughter|son\b/.test(text)) actors.push("family");
    if (/\bi\b|\bme\b|\bmy\b/.test(text)) actors.push("user");

    return this.unique(actors).length ? this.unique(actors) : ["unknown"];
  },

  resolveTime(text = "") {
    if (/\b(tomorrow|next week|next month|soon|upcoming|due date|in \d+ days|in \d+ weeks)\b/.test(text)) {
      return "future";
    }

    if (/\b(today|just|earlier|this morning|tonight|now|right now|currently)\b/.test(text)) {
      return "present_or_recent";
    }

    if (/\b(yesterday|last night|last week|last month|ago|previously|earlier this year)\b/.test(text)) {
      return "past";
    }

    return "unspecified";
  },

  resolveStage(defaultStage = "unknown", time = "unspecified") {
    if (time === "future") return "anticipated";
    if (time === "present_or_recent") return "active_or_recent";
    if (time === "past") return "completed_or_past";

    return defaultStage || "unknown";
  },

  resolveObject(text = "", frame = {}) {
    if (frame.category === "life_transition") {
      if (frame.type === "career_transition") return "career_or_role";
      if (frame.type === "parenthood_transition") return "family_role";
      if (frame.type === "relationship_transition") return "relationship_role";
      return "life_role";
    }

    if (frame.type === "academic_result") {
      if (/\b(final|exam|test)\b/.test(text)) return "exam_or_final";
      if (/\b(class|course)\b/.test(text)) return "class_or_course";
      return "academic_outcome";
    }

    if (frame.type === "support_received") {
      if (/\b(dinner|meal|food)\b/.test(text)) return "meal_or_dinner";
      if (/\b(chores|errands)\b/.test(text)) return "chores_or_errands";
      return "supportive_action";
    }

    if (frame.category === "connection_goal") return "social_connection";
    if (frame.category === "health_event") return "health_concern";
    if (frame.category === "technical_event") return "technical_system";
    if (frame.category === "financial_event") return "money_or_resources";
    if (frame.category === "legal_admin_event") return "process_or_case";

    return "unspecified";
  },

  scoreToConfidence(score = 0, threshold = 5) {
    const ratio = threshold ? score / threshold : 0;
    const confidence = Math.max(0.28, Math.min(0.96, ratio * 0.72 + 0.2));

    return Number(confidence.toFixed(2));
  },

  fallbackEvent() {
    return {
      category: "unknown_event",
      type: "unknown",
      subtype: "unclear",
      label: "Unknown Event",
      score: 0,
      threshold: 1,
      confidence: 0.35,
      polarity: "unknown",
      outcome: "unknown",
      stage: "unknown",
      time: "unspecified",
      actors: ["unknown"],
      object: "unspecified",
      evidence: []
    };
  },

  getText(summary = {}) {
    return String(
      summary.resolvedUserQuestion ||
      summary.threadQuestion?.resolvedUserQuestion ||
      summary.resolvedCurrentTurn?.resolvedText ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      summary.normalizedMessage ||
      ""
    ).trim();
  },

  normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  },

  unique(items = []) {
    return [...new Set(items.map(item => String(item || "").trim()).filter(Boolean))];
  },

  empty(reason = "No event understanding.") {
    return {
      eventUnderstandingRan: true,
      eventUnderstandingVersion: this.version,
      eventUnderstandingSource: "ari-event-understanding-engine",
      usable: false,
      reason,
      confidence: 0
    };
  }
};

window.Ari.eventUnderstandingEngine = window.AriEventUnderstandingEngine;

console.log(
  "ARI EVENT UNDERSTANDING ENGINE LOADED:",
  window.AriEventUnderstandingEngine.version
);