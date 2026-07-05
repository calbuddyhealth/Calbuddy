// ari/understanding/ari-semantic-understanding-engine.js
// Purpose: Convert language primitives into interaction-level semantic meaning.
// V0.1.0 — Semantic Frame Scorer / Language Packet First / No Retrieval / No Final Writing

window.Ari = window.Ari || {};

window.AriSemanticUnderstandingEngine = {
  version: "0.1.0",

  understand(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(this.getText(summary));
    const language =
      summary.languageUnderstanding ||
      summary.languageUnderstandingPacket ||
      summary.languageUnderstandingResult ||
      {};

    if (!text && !language?.usable) {
      return this.empty("No usable text or language-understanding packet.");
    }

    const frames = this.scoreFrames({ text, language });
    const primaryFrame = frames[0] || this.fallbackFrame();

    const semanticPacket = {
      situationType: primaryFrame.id,
      situationLabel: primaryFrame.label,
      userIntent: primaryFrame.userIntent,
      impliedNeed: primaryFrame.impliedNeed,
      responseMode: primaryFrame.responseMode,
      responseRisk: primaryFrame.responseRisk,
      shouldAskQuestion: primaryFrame.shouldAskQuestion,
      shouldRetrieveKnowledge: primaryFrame.shouldRetrieveKnowledge,
      knowledgeSource: primaryFrame.knowledgeSource || "none",
      confidence: primaryFrame.confidence,
      rankedFrames: frames,
      semanticUncertainty: this.buildUncertainty(primaryFrame, frames),
      evidence: primaryFrame.evidence || []
    };

    return {
      semanticUnderstandingRan: true,
      semanticUnderstandingVersion: this.version,
      semanticUnderstandingSource: "ari-semantic-understanding-engine",

      usable: true,
      semanticUnderstanding: semanticPacket,

      situationType: semanticPacket.situationType,
      userIntent: semanticPacket.userIntent,
      impliedNeed: semanticPacket.impliedNeed,
      responseMode: semanticPacket.responseMode,
      responseRisk: semanticPacket.responseRisk,
      confidence: semanticPacket.confidence,

      shouldAskQuestion: semanticPacket.shouldAskQuestion,
      shouldRetrieveKnowledge: semanticPacket.shouldRetrieveKnowledge,
      knowledgeSource: semanticPacket.knowledgeSource,

      needsDownstreamInterpretation: semanticPacket.confidence < 0.72
    };
  },

  scoreFrames({ text = "", language = {} } = {}) {
    const frameDefs = this.frameDefinitions();

    return frameDefs
      .map(frame => this.scoreFrame(frame, { text, language }))
      .filter(frame => frame.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(frame => ({
        ...frame,
        confidence: this.scoreToConfidence(frame.score, frame.threshold)
      }));
  },

  frameDefinitions() {
    return [
      {
        id: "achievement_shared",
        label: "Achievement Shared",
        threshold: 5,
        userIntent: "share_success",
        impliedNeed: "celebrate_and_reflect",
        responseMode: "celebrate_then_name_meaning",
        responseRisk: "low",
        shouldAskQuestion: false,
        shouldRetrieveKnowledge: false,
        signals: [
          ["action", "achievement", 3],
          ["polarity", "positive", 2],
          ["speechAct", "event_share", 1],
          ["domainAny", ["school", "work"], 1],
          ["emotion", "pride", 2],
          ["emotion", "joy", 1]
        ]
      },

      {
        id: "support_received",
        label: "Support Received",
        threshold: 5,
        userIntent: "share_meaningful_support",
        impliedNeed: "celebrate_connection",
        responseMode: "warm_acknowledgment",
        responseRisk: "low",
        shouldAskQuestion: false,
        shouldRetrieveKnowledge: false,
        signals: [
          ["action", "supportReceived", 3],
          ["polarity", "positive", 2],
          ["actorAny", ["friends", "partner", "family"], 2],
          ["emotion", "gratitude", 2],
          ["emotion", "joy", 1]
        ]
      },

      {
        id: "distress_disclosure",
        label: "Distress Disclosure",
        threshold: 4,
        userIntent: "express_distress",
        impliedNeed: "emotional_presence",
        responseMode: "presence_then_gentle_question",
        responseRisk: "medium",
        shouldAskQuestion: true,
        shouldRetrieveKnowledge: false,
        signals: [
          ["speechAct", "emotional_disclosure", 2],
          ["polarity", "negative", 2],
          ["emotionAny", ["sadness", "anxiety", "anger", "loneliness"], 2]
        ]
      },

      {
        id: "connection_seeking",
        label: "Connection Seeking",
        threshold: 5,
        userIntent: "seek_relationship_or_friendship",
        impliedNeed: "connection_support",
        responseMode: "normalize_then_small_social_step",
        responseRisk: "medium",
        shouldAskQuestion: false,
        shouldRetrieveKnowledge: false,
        signals: [
          ["action", "connectionSeeking", 3],
          ["emotion", "loneliness", 2],
          ["domainAny", ["friendship", "relationship"], 2],
          ["polarity", "negative", 1]
        ]
      },

      {
        id: "relationship_repair",
        label: "Relationship Repair",
        threshold: 5,
        userIntent: "repair_or_understand_conflict",
        impliedNeed: "reduce_blame_and_find_next_step",
        responseMode: "name_pattern_then_repair_move",
        responseRisk: "medium",
        shouldAskQuestion: false,
        shouldRetrieveKnowledge: false,
        signals: [
          ["action", "conflict", 3],
          ["domain", "relationship", 2],
          ["actor", "partner", 1],
          ["polarity", "negative", 1]
        ]
      },

      {
        id: "decision_request",
        label: "Decision Request",
        threshold: 4,
        userIntent: "ask_for_decision_help",
        impliedNeed: "clarify_tradeoff",
        responseMode: "compare_tradeoffs_then_recommend",
        responseRisk: "medium",
        shouldAskQuestion: false,
        shouldRetrieveKnowledge: false,
        signals: [
          ["speechAct", "question", 1],
          ["raw", /\b(should i|which one|what would you do|best move|decide|choice)\b/, 3]
        ]
      },

      {
        id: "knowledge_question",
        label: "Knowledge Question",
        threshold: 4,
        userIntent: "ask_for_explanation",
        impliedNeed: "direct_answer",
        responseMode: "answer_then_explain",
        responseRisk: "low",
        shouldAskQuestion: false,
        shouldRetrieveKnowledge: true,
        knowledgeSource: "world_or_stored_knowledge",
        signals: [
          ["speechAct", "question", 1],
          ["knowledgeNeed", true, 3]
        ]
      },

      {
        id: "task_request",
        label: "Task Request",
        threshold: 4,
        userIntent: "request_action_or_creation",
        impliedNeed: "perform_or_guide",
        responseMode: "complete_task_directly",
        responseRisk: "low",
        shouldAskQuestion: false,
        shouldRetrieveKnowledge: false,
        signals: [
          ["speechAct", "request", 3],
          ["raw", /\b(write|draft|rewrite|make|create|send me|update|fix|build)\b/, 1]
        ]
      },

      {
        id: "medical_concern",
        label: "Medical Concern",
        threshold: 5,
        userIntent: "ask_or_report_health_issue",
        impliedNeed: "safe_health_guidance",
        responseMode: "calm_guidance_with_red_flags",
        responseRisk: "high",
        shouldAskQuestion: false,
        shouldRetrieveKnowledge: true,
        knowledgeSource: "medical_knowledge",
        signals: [
          ["domain", "health", 3],
          ["knowledgeMedical", true, 2],
          ["polarity", "negative", 1]
        ]
      },

      {
        id: "developer_debug",
        label: "Developer Debug",
        threshold: 5,
        userIntent: "debug_or_build_system",
        impliedNeed: "technical_diagnosis_or_patch",
        responseMode: "technical_direct",
        responseRisk: "medium",
        shouldAskQuestion: false,
        shouldRetrieveKnowledge: true,
        knowledgeSource: "project_or_code_knowledge",
        signals: [
          ["domain", "developer", 3],
          ["knowledgeProject", true, 2],
          ["speechActAny", ["question", "request"], 1]
        ]
      },

      {
        id: "memory_instruction",
        label: "Memory Instruction",
        threshold: 4,
        userIntent: "store_or_use_memory",
        impliedNeed: "memory_acknowledgment",
        responseMode: "acknowledge_memory_boundary",
        responseRisk: "medium",
        shouldAskQuestion: false,
        shouldRetrieveKnowledge: true,
        knowledgeSource: "user_memory",
        signals: [
          ["speechAct", "memory_instruction", 3],
          ["knowledgeMemory", true, 1]
        ]
      },

      {
        id: "casual_share",
        label: "Casual Share",
        threshold: 2,
        userIntent: "share_context",
        impliedNeed: "natural_acknowledgment",
        responseMode: "brief_human_response",
        responseRisk: "low",
        shouldAskQuestion: false,
        shouldRetrieveKnowledge: false,
        signals: [
          ["speechActAny", ["statement", "event_share"], 1],
          ["knowledgeNeed", false, 1]
        ]
      }
    ];
  },

  scoreFrame(frame = {}, context = {}) {
    let score = 0;
    const evidence = [];

    for (const signal of frame.signals || []) {
      const [kind, expected, weight] = signal;
      const matched = this.matchSignal(kind, expected, context);

      if (matched) {
        score += weight;
        evidence.push({ kind, expected, weight });
      }
    }

    return {
      id: frame.id,
      label: frame.label,
      score,
      threshold: frame.threshold,
      userIntent: frame.userIntent,
      impliedNeed: frame.impliedNeed,
      responseMode: frame.responseMode,
      responseRisk: frame.responseRisk,
      shouldAskQuestion: frame.shouldAskQuestion,
      shouldRetrieveKnowledge: frame.shouldRetrieveKnowledge,
      knowledgeSource: frame.knowledgeSource || "none",
      evidence
    };
  },

  matchSignal(kind = "", expected, { text = "", language = {} } = {}) {
    const speechAct = language.speechAct?.label;
    const polarity = language.polarity?.label;
    const domain = language.domains?.primary;
    const actors = Array.isArray(language.actors) ? language.actors : [];
    const action = language.action?.label;
    const emotions = Array.isArray(language.emotionSignals)
      ? language.emotionSignals.map(e => e.label)
      : [];

    const knowledge = language.knowledgeNeed || {};

    switch (kind) {
      case "speechAct":
        return speechAct === expected;

      case "speechActAny":
        return Array.isArray(expected) && expected.includes(speechAct);

      case "polarity":
        return polarity === expected;

      case "domain":
        return domain === expected;

      case "domainAny":
        return Array.isArray(expected) && expected.includes(domain);

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

      case "knowledgeNeed":
        return Boolean(knowledge.needsKnowledge) === expected;

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

  scoreToConfidence(score = 0, threshold = 5) {
    if (!threshold) return 0.5;

    const ratio = score / threshold;
    const confidence = Math.max(0.3, Math.min(0.95, ratio * 0.72 + 0.18));

    return Number(confidence.toFixed(2));
  },

  buildUncertainty(primaryFrame = {}, frames = []) {
    const second = frames[1] || null;
    const gap = second ? primaryFrame.score - second.score : primaryFrame.score;

    return {
      level:
        primaryFrame.confidence >= 0.8 && gap >= 2
          ? "low"
          : primaryFrame.confidence >= 0.62
            ? "medium"
            : "high",
      confidenceGap: gap,
      competingFrame: second?.id || null,
      shouldDeferToEventInterpreter: primaryFrame.confidence < 0.72,
      shouldDeferToHumanStateBuilder: true
    };
  },

  fallbackFrame() {
    return {
      id: "unclear_general",
      label: "Unclear General",
      score: 0,
      threshold: 1,
      userIntent: "unknown_or_general",
      impliedNeed: "respond_naturally_with_low_assumption",
      responseMode: "brief_acknowledgment_or_clarify",
      responseRisk: "medium",
      shouldAskQuestion: true,
      shouldRetrieveKnowledge: false,
      knowledgeSource: "none",
      confidence: 0.35,
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

  empty(reason = "No semantic understanding.") {
    return {
      semanticUnderstandingRan: true,
      semanticUnderstandingVersion: this.version,
      semanticUnderstandingSource: "ari-semantic-understanding-engine",
      usable: false,
      reason,
      confidence: 0
    };
  }
};

window.Ari.semanticUnderstandingEngine = window.AriSemanticUnderstandingEngine;

console.log(
  "ARI SEMANTIC UNDERSTANDING ENGINE LOADED:",
  window.AriSemanticUnderstandingEngine.version
);