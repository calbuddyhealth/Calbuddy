// ari/understanding/ari-human-state-builder.js
// Purpose: Infer the user's likely current human state from language, event, and meaning.
// V0.1.0 — Human State Builder / No Final Writing

window.Ari = window.Ari || {};

window.AriHumanStateBuilder = {
  version: "0.1.0",

  build(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(this.getText(summary));

    const language = this.getLanguage(summary);
    const semantic = this.getSemantic(summary);
    const eventUnderstanding = this.getEventUnderstanding(summary);
    const meaning = this.getMeaning(summary);

    if (!text && !meaning?.usable && !eventUnderstanding?.usable) {
      return this.empty("No usable text, meaning, or event understanding.");
    }

    const emotionalState = this.inferEmotionalState({ text, language, meaning, eventUnderstanding });
    const cognitiveState = this.inferCognitiveState({ text, language, semantic, meaning });
    const motivationalState = this.inferMotivationalState({ text, meaning, eventUnderstanding });
    const physicalState = this.inferPhysicalState({ text, meaning, eventUnderstanding });
    const relationalState = this.inferRelationalState({ text, meaning, eventUnderstanding });
    const riskState = this.inferRiskState({ text, meaning, eventUnderstanding });

    const currentNeed = this.resolveCurrentNeed({
      emotionalState,
      cognitiveState,
      motivationalState,
      physicalState,
      relationalState,
      riskState,
      meaning
    });

    const responsePosture = this.resolveResponsePosture({ currentNeed, riskState, meaning });

    return {
      humanStateBuilderRan: true,
      humanStateBuilderVersion: this.version,
      humanStateBuilderSource: "ari-human-state-builder",

      usable: true,

      emotionalState,
      cognitiveState,
      motivationalState,
      physicalState,
      relationalState,
      riskState,

      currentNeed,
      responsePosture,

      stateConfidence: this.resolveStateConfidence({
        emotionalState,
        cognitiveState,
        motivationalState,
        physicalState,
        relationalState,
        riskState,
        meaning
      }),

      responsePlanningReady: true,
      needsResponsePlanner: true,
      needsBlueprintWriter: true,

      humanStateSummary: this.buildSummary({
        emotionalState,
        cognitiveState,
        motivationalState,
        physicalState,
        relationalState,
        riskState,
        currentNeed,
        responsePosture
      })
    };
  },

  inferEmotionalState({ text = "", language = {}, meaning = {}, eventUnderstanding = {} } = {}) {
    const signals = [];
    const emotionSignals = Array.isArray(language.emotionSignals) ? language.emotionSignals : [];
    const meaningId = meaning.meaningId || meaning.primaryMeaning?.id || "";
    const emotionalWeight = meaning.emotionalWeight || "low_to_moderate";

    for (const e of emotionSignals) {
      if (e?.label) signals.push(e.label);
    }

    if (/\b(happy|excited|proud|grateful|relieved|made my day)\b/.test(text)) signals.push("positive");
    if (/\b(sad|down|crying|heavy|hurt)\b/.test(text)) signals.push("sadness");
    if (/\b(anxious|nervous|worried|panic|scared)\b/.test(text)) signals.push("anxiety");
    if (/\b(angry|mad|furious|frustrated|annoyed)\b/.test(text)) signals.push("anger");
    if (/\b(ashamed|guilty|embarrassed|regret)\b/.test(text)) signals.push("shame_or_guilt");
    if (/\b(overwhelmed|too much|drowning)\b/.test(text)) signals.push("overwhelm");
    if (/\b(lonely|alone|isolated)\b/.test(text)) signals.push("loneliness");

    const meaningEmotionMap = {
      celebration: "positive",
      achievement_shared: "positive",
      support_received: "gratitude",
      belonging_gain: "belonging",
      self_criticism: "shame_or_self_judgment",
      body_change_concern: "self_conscious_or_frustrated",
      goal_frustration: "frustration",
      habit_drift: "frustration_or_guilt",
      health_worry: "concern",
      rejection_or_exclusion: "hurt",
      grief_or_loss: "grief",
      relationship_repair_need: "hurt_or_tension",
      trust_threat: "hurt_or_suspicion",
      future_uncertainty: "uncertainty",
      overwhelm: "overwhelm",
      burnout_or_depletion: "depleted",
      safety_risk: "distress_or_urgent_fear"
    };

    if (meaningEmotionMap[meaningId]) signals.push(meaningEmotionMap[meaningId]);

    const primary =
      this.pickFirst(signals, [
        "distress_or_urgent_fear",
        "grief",
        "overwhelm",
        "anxiety",
        "sadness",
        "anger",
        "hurt",
        "shame_or_self_judgment",
        "shame_or_guilt",
        "self_conscious_or_frustrated",
        "frustration",
        "concern",
        "depleted",
        "loneliness",
        "gratitude",
        "belonging",
        "positive"
      ]) || "unclear";

    return {
      primary,
      signals: this.unique(signals),
      weight: emotionalWeight,
      likelyValence: this.resolveValence(primary),
      confidence: signals.length ? 0.74 : 0.42
    };
  },

  inferCognitiveState({ text = "", language = {}, semantic = {}, meaning = {} } = {}) {
    const signals = [];
    const meaningId = meaning.meaningId || meaning.primaryMeaning?.id || "";
    const uncertainty = meaning.uncertainty || "moderate";

    if (/\b(why|what does this mean|what's going on|explain)\b/.test(text)) signals.push("seeking_understanding");
    if (/\b(should i|what should i do|which one|decide|choice)\b/.test(text)) signals.push("decision_mode");
    if (/\b(not sure|confused|uncertain|maybe|I think)\b/.test(text)) signals.push("uncertain");
    if (/\b(can't stop thinking|overthinking|spiraling|what if)\b/.test(text)) signals.push("ruminating");
    if (/\b(send me|build|fix|make|write|patch)\b/.test(text)) signals.push("task_focused");

    if (meaningId === "knowledge_request") signals.push("seeking_information");
    if (meaningId === "meaning_request") signals.push("seeking_interpretation");
    if (meaningId === "decision_pressure") signals.push("decision_mode");
    if (meaningId === "future_uncertainty") signals.push("future_oriented_uncertainty");
    if (meaningId === "practical_help_request") signals.push("task_focused");

    const primary =
      this.pickFirst(signals, [
        "task_focused",
        "decision_mode",
        "ruminating",
        "seeking_interpretation",
        "seeking_understanding",
        "seeking_information",
        "future_oriented_uncertainty",
        "uncertain"
      ]) || "open_or_unspecified";

    return {
      primary,
      signals: this.unique(signals),
      uncertainty,
      adviceRequested: meaning.adviceRequested === true,
      confidence: signals.length ? 0.72 : 0.44
    };
  },

  inferMotivationalState({ text = "", meaning = {}, eventUnderstanding = {} } = {}) {
    const signals = [];
    const meaningId = meaning.meaningId || meaning.primaryMeaning?.id || "";

    if (/\b(help me|what should i do|how do i|I want to|I'm trying to|let's do it)\b/.test(text)) signals.push("ready_for_action");
    if (/\b(I can't|no motivation|don't care|stuck|hopeless)\b/.test(text)) signals.push("low_motivation");
    if (/\b(start|restart|fix|change|get better|improve)\b/.test(text)) signals.push("change_oriented");
    if (/\b(just venting|just saying|I feel|I'm feeling)\b/.test(text)) signals.push("not_action_first");

    if (["achievement_shared", "hope_or_progress", "celebration"].includes(meaningId)) signals.push("momentum_positive");
    if (["goal_frustration", "habit_drift", "body_change_concern"].includes(meaningId)) signals.push("possibly_open_to_coaching");
    if (["burnout_or_depletion", "overwhelm", "grief_or_loss"].includes(meaningId)) signals.push("low_capacity");
    if (meaning.adviceRequested === true) signals.push("ready_for_action");

    const primary =
      this.pickFirst(signals, [
        "ready_for_action",
        "change_oriented",
        "possibly_open_to_coaching",
        "momentum_positive",
        "low_capacity",
        "low_motivation",
        "not_action_first"
      ]) || "unknown_or_neutral";

    return {
      primary,
      signals: this.unique(signals),
      coachingReadiness: this.resolveCoachingReadiness(primary, meaning),
      confidence: signals.length ? 0.7 : 0.4
    };
  },

  inferPhysicalState({ text = "", meaning = {}, eventUnderstanding = {} } = {}) {
    const signals = [];
    const event = eventUnderstanding.event || eventUnderstanding || {};
    const meaningId = meaning.meaningId || meaning.primaryMeaning?.id || "";

    if (/\b(pain|hurts|sick|fever|symptom|tired|fatigue|sleep|pregnant|weight|fat|body)\b/.test(text)) {
      signals.push("body_relevant");
    }

    if (/\b(severe|worsening|can't breathe|chest pain|bleeding|emergency)\b/.test(text)) {
      signals.push("possible_urgent_physical_concern");
    }

    if (/\b(tired|exhausted|fatigue|no energy|sleep deprived)\b/.test(text)) signals.push("low_energy");
    if (/\b(weight|fat|body|fitness|calorie|eating)\b/.test(text)) signals.push("body_or_weight_focus");

    if (event.category === "health_event") signals.push("health_event");
    if (meaningId === "health_worry") signals.push("health_worry");
    if (meaningId === "body_change_concern") signals.push("body_or_weight_focus");

    const primary =
      this.pickFirst(signals, [
        "possible_urgent_physical_concern",
        "health_event",
        "health_worry",
        "body_or_weight_focus",
        "low_energy",
        "body_relevant"
      ]) || "not_primary";

    return {
      primary,
      signals: this.unique(signals),
      medicalBoundaryNeeded: ["possible_urgent_physical_concern", "health_event", "health_worry"].includes(primary),
      confidence: signals.length ? 0.73 : 0.38
    };
  },

  inferRelationalState({ text = "", meaning = {}, eventUnderstanding = {} } = {}) {
    const signals = [];
    const event = eventUnderstanding.event || eventUnderstanding || {};
    const meaningId = meaning.meaningId || meaning.primaryMeaning?.id || "";

    if (/\b(wife|husband|girlfriend|boyfriend|partner|spouse|fiance|fiancée)\b/.test(text)) signals.push("partner_relevant");
    if (/\b(friend|friends|social circle|community|group)\b/.test(text)) signals.push("friendship_relevant");
    if (/\b(family|mom|dad|baby|child|daughter|son|parent)\b/.test(text)) signals.push("family_relevant");

    if (/\b(argument|fight|conflict|tension|trust|betray|cheat|lied)\b/.test(text)) signals.push("relationship_tension");
    if (/\b(helped me|supported me|made my day|thoughtful|real friends|accepted)\b/.test(text)) signals.push("relationship_strengthening");
    if (/\b(lonely|alone|rejected|excluded|ignored|ghosted)\b/.test(text)) signals.push("connection_pain");

    if (["support_received", "belonging_gain"].includes(meaningId)) signals.push("relationship_strengthening");
    if (["relationship_repair_need", "trust_threat"].includes(meaningId)) signals.push("relationship_tension");
    if (["connection_need", "rejection_or_exclusion", "belonging_loss"].includes(meaningId)) signals.push("connection_pain");

    const primary =
      this.pickFirst(signals, [
        "relationship_tension",
        "connection_pain",
        "relationship_strengthening",
        "partner_relevant",
        "friendship_relevant",
        "family_relevant"
      ]) || "not_primary";

    return {
      primary,
      signals: this.unique(signals),
      relationshipContextLikely: primary !== "not_primary",
      confidence: signals.length ? 0.72 : 0.39
    };
  },

  inferRiskState({ text = "", meaning = {}, eventUnderstanding = {} } = {}) {
    const event = eventUnderstanding.event || eventUnderstanding || {};
    const meaningRisk = meaning.riskLevel || "low";

    const urgentSafety =
      /\b(kill myself|suicidal|self harm|hurt myself|danger|unsafe right now|emergency|can't breathe|chest pain)\b/.test(text) ||
      meaning.meaningId === "safety_risk";

    const medicalCaution =
      /\b(severe|worsening|bleeding|fever|pregnant|baby.*fever|symptom|pain|doctor|hospital)\b/.test(text) ||
      event.category === "health_event";

    const legalFinancialCaution =
      /\b(court|legal|uscis|immigration|bankruptcy|fraud|arrested)\b/.test(text) ||
      event.category === "finance_legal_event";

    let level = "low";
    if (urgentSafety) level = "high";
    else if (meaningRisk === "moderate" || medicalCaution || legalFinancialCaution) level = "moderate";

    return {
      level,
      urgentSafety,
      medicalCaution,
      legalFinancialCaution,
      requiresBoundary: urgentSafety || medicalCaution || legalFinancialCaution,
      confidence: urgentSafety ? 0.9 : medicalCaution || legalFinancialCaution ? 0.72 : 0.48
    };
  },

  resolveCurrentNeed(states = {}) {
    const { emotionalState, cognitiveState, motivationalState, physicalState, relationalState, riskState, meaning } = states;
    const meaningId = meaning.meaningId || meaning.primaryMeaning?.id || "";
    const responseNeed = meaning.responseNeed || "";

    if (riskState.level === "high") {
      return {
        id: "immediate_safety",
        label: "Immediate Safety",
        priority: "critical",
        description: "The person needs safety-first support before anything else."
      };
    }

    if (physicalState.medicalBoundaryNeeded && riskState.level === "moderate") {
      return {
        id: "safe_health_guidance",
        label: "Safe Health Guidance",
        priority: "high",
        description: "The person needs calm medical framing, red flags, and clinician boundaries."
      };
    }

    if (responseNeed === "join_positive_emotion") {
      return {
        id: "shared_positive_emotion",
        label: "Shared Positive Emotion",
        priority: "normal",
        description: "The person needs Ari to join the positive emotion instead of over-coaching."
      };
    }

    if (["self_criticism", "body_change_concern", "goal_frustration", "habit_drift"].includes(meaningId)) {
      return {
        id: "validation_before_coaching",
        label: "Validation Before Coaching",
        priority: "normal",
        description: "The person may be open to coaching, but needs non-shaming validation first."
      };
    }

    if (responseNeed === "deescalate_then_next_step") {
      return {
        id: "deescalation_and_repair",
        label: "Deescalation and Repair",
        priority: "high",
        description: "The person needs the temperature lowered and one repair-oriented next step."
      };
    }

    if (responseNeed === "presence_first") {
      return {
        id: "emotional_presence",
        label: "Emotional Presence",
        priority: "high",
        description: "The person needs to feel accompanied before advice or analysis."
      };
    }

    if (cognitiveState.adviceRequested || motivationalState.primary === "ready_for_action") {
      return {
        id: "practical_next_step",
        label: "Practical Next Step",
        priority: "normal",
        description: "The person is likely ready for direct help or a concrete step."
      };
    }

    if (cognitiveState.primary === "decision_mode") {
      return {
        id: "decision_support",
        label: "Decision Support",
        priority: "normal",
        description: "The person needs tradeoff organization and a next decision step."
      };
    }

    if (cognitiveState.primary === "seeking_information") {
      return {
        id: "clear_information",
        label: "Clear Information",
        priority: "normal",
        description: "The person needs a direct answer with enough context."
      };
    }

    return {
      id: "reflect_then_clarify",
      label: "Reflect Then Clarify",
      priority: "normal",
      description: "The person’s need is not fully clear; Ari should reflect and avoid assuming."
    };
  },

  resolveResponsePosture({ currentNeed = {}, riskState = {}, meaning = {} } = {}) {
    const map = {
      immediate_safety: "calm_direct_protective",
      safe_health_guidance: "calm_careful_medical_boundary",
      shared_positive_emotion: "warm_joining",
      validation_before_coaching: "warm_non_shaming_permission_based",
      deescalation_and_repair: "steady_deescalating",
      emotional_presence: "gentle_present",
      practical_next_step: "clear_practical",
      decision_support: "organized_tradeoff",
      clear_information: "direct_clear",
      reflect_then_clarify: "warm_reflective"
    };

    return {
      id: map[currentNeed.id] || "warm_reflective",
      adviceAllowed:
        ["practical_next_step", "decision_support", "clear_information", "safe_health_guidance"].includes(currentNeed.id),
      permissionBeforeCoaching:
        currentNeed.id === "validation_before_coaching",
      avoid: this.resolveAvoidList(currentNeed, meaning)
    };
  },

  resolveAvoidList(currentNeed = {}, meaning = {}) {
    const avoid = [];

    if (currentNeed.id === "validation_before_coaching") {
      avoid.push("shame_language", "diet_plan_too_fast", "lecturing", "assuming_advice_wanted");
    }

    if (currentNeed.id === "shared_positive_emotion") {
      avoid.push("overcoaching", "turning_positive_share_into_lesson");
    }

    if (currentNeed.id === "emotional_presence") {
      avoid.push("fixing_too_fast", "silver_lining", "analysis_before_presence");
    }

    if (currentNeed.id === "deescalation_and_repair") {
      avoid.push("blame_escalation", "winning_the_argument_frame", "over_apologizing");
    }

    if (currentNeed.id === "safe_health_guidance") {
      avoid.push("diagnosis", "false_reassurance", "unsafe_medical_specificity");
    }

    if (currentNeed.id === "immediate_safety") {
      avoid.push("casual_tone", "delay", "abstract_analysis");
    }

    return avoid;
  },

  resolveCoachingReadiness(primary = "", meaning = {}) {
    if (meaning.adviceRequested === true) return "ready";
    if (primary === "possibly_open_to_coaching") return "ask_permission";
    if (primary === "ready_for_action" || primary === "change_oriented") return "ready";
    if (primary === "low_capacity" || primary === "not_action_first") return "not_first";
    return "unknown";
  },

  resolveValence(primary = "") {
    if (["positive", "gratitude", "belonging"].includes(primary)) return "positive";
    if (["grief", "sadness", "anxiety", "anger", "hurt", "shame_or_guilt", "distress_or_urgent_fear"].includes(primary)) return "negative";
    if (["concern", "uncertainty", "overwhelm", "depleted", "self_conscious_or_frustrated"].includes(primary)) return "mixed_or_negative";
    return "unclear";
  },

  resolveStateConfidence(states = {}) {
    const values = [
      states.emotionalState?.confidence,
      states.cognitiveState?.confidence,
      states.motivationalState?.confidence,
      states.physicalState?.confidence,
      states.relationalState?.confidence,
      states.riskState?.confidence
    ].filter(Number.isFinite);

    if (!values.length) return 0.4;

    const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
    return Number(Math.max(0.35, Math.min(0.92, avg)).toFixed(2));
  },

  buildSummary({ emotionalState, cognitiveState, motivationalState, physicalState, relationalState, riskState, currentNeed, responsePosture } = {}) {
    return {
      likelyEmotion: emotionalState.primary,
      cognitiveMode: cognitiveState.primary,
      motivation: motivationalState.primary,
      physicalContext: physicalState.primary,
      relationalContext: relationalState.primary,
      riskLevel: riskState.level,
      currentNeed: currentNeed.id,
      responsePosture: responsePosture.id
    };
  },

  pickFirst(values = [], priority = []) {
    const set = new Set(values);
    return priority.find(item => set.has(item)) || values[0] || null;
  },

  unique(items = []) {
    return [...new Set(items.map(item => String(item || "").trim()).filter(Boolean))];
  },

  getLanguage(summary = {}) {
    return (
      summary.languageUnderstanding ||
      summary.languageUnderstandingPacket ||
      summary.languageUnderstandingResult ||
      {}
    );
  },

  getSemantic(summary = {}) {
    return (
      summary.semanticUnderstanding?.semanticUnderstanding ||
      summary.semanticUnderstanding ||
      summary.semanticUnderstandingPacket ||
      summary.semanticUnderstandingResult ||
      {}
    );
  },

  getEventUnderstanding(summary = {}) {
    return (
      summary.eventUnderstanding ||
      summary.eventUnderstandingPacket ||
      summary.eventUnderstandingResult ||
      {}
    );
  },

  getMeaning(summary = {}) {
    return (
      summary.meaningInterpretation ||
      summary.meaningInterpreter ||
      summary.meaning ||
      {}
    );
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

  empty(reason = "No human state available.") {
    return {
      humanStateBuilderRan: true,
      humanStateBuilderVersion: this.version,
      humanStateBuilderSource: "ari-human-state-builder",
      usable: false,
      reason,
      confidence: 0
    };
  }
};

window.Ari.humanStateBuilder = window.AriHumanStateBuilder;

console.log(
  "ARI HUMAN STATE BUILDER LOADED:",
  window.AriHumanStateBuilder.version
);