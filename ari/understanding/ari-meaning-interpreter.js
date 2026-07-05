// ari/understanding/ari-meaning-interpreter.js
// Purpose: Interpret why an event matters to the person.
// V0.1.0 — Meaning Hypothesis Scorer / No Final Writing

window.Ari = window.Ari || {};

window.AriMeaningInterpreter = {
  version: "0.1.0",

  interpret(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(this.getText(summary));

    const language = this.getLanguage(summary);
    const semantic = this.getSemantic(summary);
    const eventUnderstanding = this.getEventUnderstanding(summary);

    if (!text && !eventUnderstanding?.usable) {
      return this.empty("No usable text or event understanding.");
    }

    const meanings = this.scoreMeanings({ text, language, semantic, eventUnderstanding });
    const primaryMeaning = meanings[0] || this.fallbackMeaning();

    const modifiers = this.inferModifiers({ text, language, semantic, eventUnderstanding, primaryMeaning });
    const impacts = this.inferImpacts({ eventUnderstanding, primaryMeaning, meanings });
    const adviceRequested = this.detectAdviceRequested({ text, language });
    const emotionalWeight = this.resolveEmotionalWeight({ eventUnderstanding, primaryMeaning, modifiers });
    const responseNeed = this.resolveResponseNeed({
      primaryMeaning,
      modifiers,
      impacts,
      adviceRequested,
      emotionalWeight
    });

    return {
      meaningInterpreterRan: true,
      meaningInterpreterVersion: this.version,
      meaningInterpreterSource: "ari-meaning-interpreter",

      usable: true,

      primaryMeaning,
      meaningId: primaryMeaning.id,
      meaningFamily: primaryMeaning.family,
      meaningLabel: primaryMeaning.label,

      competingMeanings: meanings.slice(1, 5),
      rankedMeanings: meanings,

      modifiers,
      impacts,

      adviceRequested,
      emotionalWeight,
      uncertainty: this.resolveUncertainty(primaryMeaning, meanings),

      responseNeed,
      supportNeed: this.resolveSupportNeed(responseNeed, primaryMeaning),
      riskLevel: this.resolveRiskLevel({ eventUnderstanding, primaryMeaning }),

      whyItMatters: this.buildWhyItMatters({
        primaryMeaning,
        modifiers,
        impacts,
        eventUnderstanding,
        adviceRequested
      }),

      needsHumanStateBuilder: true,
      needsBlueprintWriter: true
    };
  },

  scoreMeanings(context = {}) {
    const meanings = this.getMeanings();

    return meanings
      .map(meaning => this.scoreMeaning(meaning, context))
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(m => ({
        ...m,
        confidence: this.scoreToConfidence(m.score)
      }));
  },

  scoreMeaning(meaning = {}, context = {}) {
    let score = 0;
    const evidence = [];

    const event = context.eventUnderstanding?.event || context.eventUnderstanding || {};
    const text = context.text || "";
    const semanticType = context.semantic?.situationType || "";
    const speechAct = context.language?.speechAct?.label || "";
    const action = context.language?.action?.label || "";
    const emotions = Array.isArray(context.language?.emotionSignals)
      ? context.language.emotionSignals.map(e => e.label)
      : [];

    const eventText = [
      event.category,
      event.type,
      event.subtype,
      event.label,
      event.polarity,
      event.outcome,
      event.object
    ].join(" ").toLowerCase();

    const add = (points, reason) => {
      score += points;
      evidence.push(reason);
    };

    // Meaning family from event category/type/outcome
    if (meaning.id === "body_change_concern" && /\b(weight|body|fat|appearance|fitness|nutrition|health_behavior|weight_loss)\b/.test(text + " " + eventText)) add(4, "body_or_weight_signal");
    if (meaning.id === "health_worry" && /\b(health|medical|symptom|pain|diagnosis|urgent|pregnancy|child_health)\b/.test(eventText)) add(4, "health_event_signal");
    if (meaning.id === "self_criticism" && /\b(i'm getting fat|i am getting fat|i suck|hate myself|failure|worthless|pathetic)\b/.test(text)) add(4, "self_judgment_language");
    if (meaning.id === "confidence_threat" && /\b(failure|setback|criticism|rejection|confidence|shame|mistake)\b/.test(text + " " + eventText)) add(3, "confidence_threat_signal");

    if (meaning.id === "achievement_shared" && (action === "achievement" || /\b(success|achievement|passed|won|completed|promotion|certification|accepted)\b/.test(eventText))) add(4, "achievement_signal");
    if (meaning.id === "setback_shared" && /\b(setback|failure|rejection|loss|job_loss|failed|denied|negative)\b/.test(text + " " + eventText)) add(4, "setback_signal");

    if (meaning.id === "future_uncertainty" && /\b(future|uncertain|unsure|unknown|planning|decision|what next|next)\b/.test(text + " " + eventText)) add(3, "future_uncertainty_signal");
    if (meaning.id === "decision_pressure" && (speechAct === "question" || /\b(should i|do i|which|decide|decision|tradeoff|stay or leave)\b/.test(text))) add(4, "decision_signal");

    if (meaning.id === "life_transition_meaning" && /\blife_transition|transition|birth|marriage|career_transition|relocation|retirement|parenthood\b/.test(eventText)) add(4, "life_transition_event");
    if (meaning.id === "identity_shift" && /\bidentity|becoming|role|transition|career|parent|military|civilian|purpose\b/.test(text + " " + eventText)) add(3, "identity_shift_signal");
    if (meaning.id === "increased_responsibility" && /\bresponsibility|parent|leadership|caregiving|promotion|baby|family|new_role\b/.test(text + " " + eventText)) add(3, "responsibility_signal");
    if (meaning.id === "loss_of_control" && /\b(out of control|can't control|slipping|getting worse|forced|uncontrollable|overwhelmed)\b/.test(text + " " + eventText)) add(3, "loss_of_control_signal");

    if (meaning.id === "connection_need" && /\b(lonely|alone|friends|connection|relationship|belong|dating|social circle)\b/.test(text + " " + eventText)) add(4, "connection_signal");
    if (meaning.id === "support_received" && /\b(support_received|helped|showed up|thoughtful|care|support)\b/.test(text + " " + eventText)) add(4, "support_received_signal");
    if (meaning.id === "support_needed" && /\b(need help|support|comfort|backup|resources|someone)\b/.test(text)) add(4, "support_needed_signal");
    if (meaning.id === "rejection_or_exclusion" && /\b(rejected|ignored|ghosted|excluded|left out|not invited)\b/.test(text + " " + eventText)) add(4, "rejection_signal");

    if (meaning.id === "relationship_repair_need" && /\b(argument|fight|repair|apology|conflict|misunderstanding|relationship_tension)\b/.test(text + " " + eventText)) add(4, "relationship_repair_signal");
    if (meaning.id === "trust_threat" && /\b(trust|betray|lied|cheated|hidden|deceived|trust_breach)\b/.test(text + " " + eventText)) add(4, "trust_threat_signal");
    if (meaning.id === "belonging_gain" && /\b(real friends|accepted|included|belonged|community|felt seen)\b/.test(text + " " + eventText)) add(4, "belonging_gain_signal");
    if (meaning.id === "belonging_loss" && /\b(outsider|don't belong|lost community|left group|isolated|excluded)\b/.test(text + " " + eventText)) add(4, "belonging_loss_signal");

    if (meaning.id === "grief_or_loss" && /\b(grief|loss|died|death|passed away|mourning|pet loss|bereavement)\b/.test(text + " " + eventText)) add(5, "grief_loss_signal");
    if (meaning.id === "safety_risk" && /\b(safety_risk|urgent|danger|self harm|suicidal|kill myself|emergency|physical danger)\b/.test(text + " " + eventText)) add(6, "safety_signal");

    if (meaning.id === "practical_help_request" && /\b(how do i|what should i do|help me|make me|send me|write|fix|patch|build)\b/.test(text)) add(4, "practical_request_signal");
    if (meaning.id === "knowledge_request" && /\b(what is|why|how does|explain|define|when|where|who)\b/.test(text)) add(3, "knowledge_request_signal");
    if (meaning.id === "meaning_request" && /\b(what does this mean|why does this matter|what's going on|am i wrong|is this normal)\b/.test(text)) add(4, "meaning_request_signal");

    if (meaning.id === "celebration" && /\b(happy|excited|made my day|celebrate|great news|got an a|passed|won|baby was born)\b/.test(text + " " + eventText)) add(4, "celebration_signal");
    if (meaning.id === "hope_or_progress" && /\b(progress|better|improving|getting better|hope|momentum|finally)\b/.test(text + " " + eventText)) add(3, "progress_signal");

    if (meaning.id === "shame_or_guilt" && /\b(ashamed|guilty|regret|embarrassed|bad person|shouldn't have)\b/.test(text + " " + eventText)) add(4, "shame_guilt_signal");
    if (meaning.id === "conflict_or_threat" && /\b(conflict|threat|danger|hostile|fight|argument|court|legal|unsafe)\b/.test(text + " " + eventText)) add(4, "conflict_threat_signal");
    if (meaning.id === "values_conflict" && /\b(torn|values|right thing|wrong thing|loyalty|priority|tradeoff)\b/.test(text + " " + eventText)) add(3, "values_conflict_signal");

    if (meaning.id === "goal_frustration" && /\b(goal|failing|falling off|not making progress|getting fat|weight|habit|discipline)\b/.test(text + " " + eventText)) add(4, "goal_frustration_signal");
    if (meaning.id === "habit_drift" && /\b(habit|routine|fell off|slipping|eating out|not working out|discipline)\b/.test(text + " " + eventText)) add(4, "habit_drift_signal");

    if (meaning.id === "overwhelm" && /\b(overwhelmed|too much|drowning|can't handle|everything at once)\b/.test(text + " " + eventText)) add(4, "overwhelm_signal");
    if (meaning.id === "burnout_or_depletion" && /\b(burned out|burnt out|exhausted|depleted|drained|fatigue)\b/.test(text + " " + eventText)) add(4, "burnout_signal");
    if (meaning.id === "unclear_need" && score === 0 && speechAct !== "question") add(1, "unclear_non_question_statement");

    // Emotion boosts
    if (emotions.includes("anxiety") && ["health_worry", "future_uncertainty", "overwhelm"].includes(meaning.id)) add(1, "anxiety_boost");
    if (emotions.includes("sadness") && ["grief_or_loss", "rejection_or_exclusion", "belonging_loss"].includes(meaning.id)) add(1, "sadness_boost");
    if (emotions.includes("anger") && ["conflict_or_threat", "trust_threat", "relationship_repair_need"].includes(meaning.id)) add(1, "anger_boost");

    // Semantic boosts
    if (semanticType && this.semanticMeaningBoost(semanticType, meaning.id)) {
      add(2, `semantic_boost:${semanticType}`);
    }

    return {
      ...meaning,
      score,
      confidence: 0,
      evidence
    };
  },

  semanticMeaningBoost(semanticType = "", meaningId = "") {
    const map = {
      support_received: ["support_received", "belonging_gain", "celebration"],
      achievement_shared: ["achievement_shared", "celebration", "confidence_threat"],
      medical_concern: ["health_worry", "body_change_concern"],
      developer_debug: ["practical_help_request", "knowledge_request"],
      connection_seeking: ["connection_need", "belonging_loss"],
      relationship_repair: ["relationship_repair_need", "trust_threat"],
      casual_share: ["unclear_need"]
    };

    return (map[semanticType] || []).includes(meaningId);
  },

  inferModifiers({ text = "", eventUnderstanding = {}, primaryMeaning = {} } = {}) {
    const modifiers = new Set();
    const event = eventUnderstanding.event || eventUnderstanding || {};
    const joined = `${text} ${event.stage || ""} ${event.time || ""} ${event.polarity || ""} ${event.importance || ""}`.toLowerCase();

    if (/\b(today|just|started|new|recent|recently|found out)\b/.test(joined)) modifiers.add("new");
    if (/\b(ongoing|still|keeps|again|every time|always|currently|active)\b/.test(joined)) modifiers.add("ongoing");
    if (/\b(again|keeps happening|recurring|always)\b/.test(joined)) modifiers.add("recurring");
    if (/\b(tomorrow|soon|upcoming|anticipated|future|next week|next month)\b/.test(joined)) modifiers.add("anticipated");

    if (/\b(maybe|might|I think|not sure|unsure|could be|seems)\b/.test(text)) modifiers.add("uncertain");
    else modifiers.add("certain");

    if (/\b(chose|decided|want to|planning to)\b/.test(text)) modifiers.add("voluntary");
    if (/\b(forced|had to|got fired|lost|denied|rejected|happened to me)\b/.test(text)) modifiers.add("forced");

    if (/\b(can't control|out of my control|uncontrollable)\b/.test(text)) modifiers.add("uncontrollable");
    if (/\b(plan|step|goal|habit|budget|schedule|practice)\b/.test(text)) modifiers.add("controllable");

    if (event.confidence >= 0.8 || /\b(critical|major|life changing|huge|big deal)\b/.test(joined)) modifiers.add("major");
    else modifiers.add("moderate");

    if (/\b(public|everyone knows|in front of everyone|posted|recognized)\b/.test(text)) modifiers.add("public");
    else modifiers.add("private");

    if (/\b(we|us|together|family|wife|husband|friends|team)\b/.test(text)) modifiers.add("shared");
    if (/\b(alone|by myself|no one|isolated)\b/.test(text)) modifiers.add("isolated");

    if (/\b(happy|excited|proud|relieved|made my day|grateful)\b/.test(text)) modifiers.add("hopeful");
    if (/\b(sad|failed|rejected|discouraged|hopeless)\b/.test(text)) modifiers.add("discouraging");
    if (/\b(danger|unsafe|emergency|urgent|risk)\b/.test(joined)) modifiers.add("threatening");

    if (["achievement_shared", "celebration", "hope_or_progress", "belonging_gain"].includes(primaryMeaning.id)) {
      modifiers.add("celebratory");
      modifiers.add("identity_building");
    }

    if (["self_criticism", "confidence_threat", "setback_shared", "rejection_or_exclusion"].includes(primaryMeaning.id)) {
      modifiers.add("identity_threatening");
    }

    if (["support_received", "belonging_gain"].includes(primaryMeaning.id)) modifiers.add("relationship_strengthening");
    if (["relationship_repair_need", "trust_threat", "conflict_or_threat"].includes(primaryMeaning.id)) modifiers.add("relationship_straining");

    if (["goal_frustration", "habit_drift"].includes(primaryMeaning.id)) modifiers.add("goal_blocking");
    if (["achievement_shared", "hope_or_progress"].includes(primaryMeaning.id)) modifiers.add("goal_aligned");

    return Array.from(modifiers).map(id => this.getModifier(id)).filter(Boolean);
  },

  inferImpacts({ eventUnderstanding = {}, primaryMeaning = {}, meanings = [] } = {}) {
    const ids = new Set();

    for (const impact of primaryMeaning.commonImpacts || []) ids.add(impact);

    const event = eventUnderstanding.event || eventUnderstanding || {};
    for (const impact of event.affects || []) ids.add(impact);

    for (const meaning of meanings.slice(0, 3)) {
      for (const impact of meaning.commonImpacts || []) ids.add(impact);
    }

    return Array.from(ids)
      .map(id => this.getImpact(id))
      .filter(Boolean)
      .slice(0, 8);
  },

  detectAdviceRequested({ text = "", language = {} } = {}) {
    const speechAct = language.speechAct?.label || "";

    if (speechAct === "question") return true;

    return /\b(what should i do|how do i|help me|give me advice|should i|can you help|what's the best way)\b/.test(text);
  },

  resolveEmotionalWeight({ eventUnderstanding = {}, primaryMeaning = {}, modifiers = [] } = {}) {
    const event = eventUnderstanding.event || eventUnderstanding || {};
    const modifierIds = modifiers.map(m => m.id);

    if (primaryMeaning.id === "safety_risk" || event.importance === "critical" || modifierIds.includes("threatening")) {
      return "critical";
    }

    if (
      event.importance === "major" ||
      modifierIds.includes("major") ||
      ["grief_or_loss", "trust_threat", "setback_shared", "overwhelm", "burnout_or_depletion"].includes(primaryMeaning.id)
    ) {
      return "high";
    }

    if (["body_change_concern", "goal_frustration", "connection_need", "future_uncertainty"].includes(primaryMeaning.id)) {
      return "moderate";
    }

    return "low_to_moderate";
  },

  resolveResponseNeed({ primaryMeaning = {}, modifiers = [], adviceRequested = false, emotionalWeight = "moderate" } = {}) {
    const modifierIds = modifiers.map(m => m.id);

    if (primaryMeaning.id === "safety_risk") return "immediate_safety";
    if (modifierIds.includes("needs_action")) return "action_first";
    if (adviceRequested && emotionalWeight !== "critical") return "answer_then_support";

    if (["celebration", "achievement_shared", "support_received", "belonging_gain", "hope_or_progress"].includes(primaryMeaning.id)) {
      return "join_positive_emotion";
    }

    if (["self_criticism", "body_change_concern", "goal_frustration", "habit_drift"].includes(primaryMeaning.id)) {
      return "validate_then_clarify";
    }

    if (["relationship_repair_need", "trust_threat", "conflict_or_threat"].includes(primaryMeaning.id)) {
      return "deescalate_then_next_step";
    }

    if (["grief_or_loss", "rejection_or_exclusion", "belonging_loss", "loneliness"].includes(primaryMeaning.id)) {
      return "presence_first";
    }

    if (primaryMeaning.id === "knowledge_request") return "direct_answer";
    if (primaryMeaning.id === "practical_help_request") return "practical_steps";
    if (primaryMeaning.id === "unclear_need") return "reflect_then_clarify";

    return primaryMeaning.commonResponseNeeds?.[0] || "supportive_direct";
  },

  resolveSupportNeed(responseNeed = "", primaryMeaning = {}) {
    const map = {
      immediate_safety: "protect",
      action_first: "urgent_practical_support",
      answer_then_support: "answer_with_context",
      join_positive_emotion: "celebrate",
      validate_then_clarify: "emotional_validation_before_coaching",
      deescalate_then_next_step: "repair_or_boundary_support",
      presence_first: "emotional_presence",
      direct_answer: "information",
      practical_steps: "practical_help",
      reflect_then_clarify: "clarify_need"
    };

    return map[responseNeed] || primaryMeaning.commonResponseNeeds?.[0] || "general_support";
  },

  resolveRiskLevel({ eventUnderstanding = {}, primaryMeaning = {} } = {}) {
    const event = eventUnderstanding.event || eventUnderstanding || {};
    const text = [
      primaryMeaning.id,
      event.category,
      event.type,
      event.subtype,
      event.polarity,
      event.outcome
    ].join(" ").toLowerCase();

    if (/\bsafety_risk|urgent|emergency|self_harm|suicidal|physical_danger\b/.test(text)) return "high";
    if (/\bhealth|medical|legal|crisis|critical\b/.test(text)) return "moderate";
    return "low";
  },

  resolveUncertainty(primaryMeaning = {}, meanings = []) {
    if (!primaryMeaning || primaryMeaning.confidence < 0.55) return "high";
    if (meanings[1] && Math.abs(primaryMeaning.confidence - meanings[1].confidence) < 0.12) return "moderate";
    return "low";
  },

  buildWhyItMatters({ primaryMeaning = {}, modifiers = [], impacts = [], eventUnderstanding = {}, adviceRequested = false } = {}) {
    const event = eventUnderstanding.event || eventUnderstanding || {};
    const lines = [];

    lines.push(primaryMeaning.description || "This has personal significance.");

    if (event.label && event.label !== "Unknown Event") {
      lines.push(`The event appears to involve: ${event.label}.`);
    }

    const impactLabels = impacts.slice(0, 4).map(i => i.label).join(", ");
    if (impactLabels) lines.push(`It may affect: ${impactLabels}.`);

    const modifierLabels = modifiers.slice(0, 4).map(m => m.label).join(", ");
    if (modifierLabels) lines.push(`The experience appears: ${modifierLabels}.`);

    if (!adviceRequested) {
      lines.push("Advice was not clearly requested, so Ari should not rush into coaching.");
    }

    return lines;
  },

  getMeanings() {
    return window.AriMeaningOntology?.meanings || window.Ari?.meaningOntology?.meanings || [];
  },

  getModifier(id = "") {
    const modifiers = window.AriMeaningModifiers?.modifiers || window.Ari?.meaningModifiers?.modifiers || [];
    return modifiers.find(m => m.id === id) || null;
  },

  getImpact(id = "") {
    const impacts = window.AriMeaningImpacts?.impacts || window.Ari?.meaningImpacts?.impacts || [];
    return impacts.find(i => i.id === id) || null;
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

  scoreToConfidence(score = 0) {
    return Number(Math.max(0.28, Math.min(0.96, score / 8)).toFixed(2));
  },

  fallbackMeaning() {
    return {
      id: "unclear_need",
      family: "uncertainty",
      label: "Unclear Need",
      description: "The statement has meaning, but Ari should avoid assuming the user’s need.",
      commonImpacts: ["communication"],
      commonResponseNeeds: ["reflect_then_clarify"],
      score: 1,
      confidence: 0.35,
      evidence: ["fallback"]
    };
  },

  empty(reason = "No meaning interpretation.") {
    return {
      meaningInterpreterRan: true,
      meaningInterpreterVersion: this.version,
      meaningInterpreterSource: "ari-meaning-interpreter",
      usable: false,
      reason,
      confidence: 0
    };
  }
};

window.Ari.meaningInterpreter = window.AriMeaningInterpreter;

console.log(
  "ARI MEANING INTERPRETER LOADED:",
  window.AriMeaningInterpreter.version
);