// ari/understanding/ari-response-planner.js
// Purpose: Turn human state + meaning into a response plan for the writer.
// V0.1.0 — Response Planner / No Final Writing

window.Ari = window.Ari || {};

window.AriResponsePlanner = {
  version: "0.1.0",

  plan(input = {}) {
    const summary = input.summary || input || {};
    const text = this.normalize(this.getText(summary));

    const humanState = this.getHumanState(summary);
    const meaning = this.getMeaning(summary);
    const eventUnderstanding = this.getEventUnderstanding(summary);

    if (!humanState?.usable && !meaning?.usable) {
      return this.empty("No usable human state or meaning interpretation.");
    }

    const currentNeed = humanState.currentNeed?.id || "reflect_then_clarify";
    const posture = humanState.responsePosture?.id || "warm_reflective";
    const riskLevel = humanState.riskState?.level || "low";
    const adviceRequested = meaning.adviceRequested === true;

    const policy = this.resolvePolicy({ currentNeed, posture, riskLevel, adviceRequested, meaning });
    const responseMoves = this.resolveMoves({ currentNeed, posture, policy, meaning, humanState, eventUnderstanding });
    const blueprintHint = this.resolveBlueprintHint({ currentNeed, meaning, riskLevel });
    const responseShape = this.resolveResponseShape({ currentNeed, riskLevel, adviceRequested });

    return {
      responsePlannerRan: true,
      responsePlannerVersion: this.version,
      responsePlannerSource: "ari-response-planner",

      usable: true,

      responseGoal: this.resolveResponseGoal({ currentNeed, meaning }),
      responseShape,
      responsePosture: posture,

      currentNeed,
      adviceRequested,
      advicePolicy: policy.advicePolicy,
      coachingPermissionRequired: policy.coachingPermissionRequired,

      responseMoves,
      avoid: policy.avoid,
      required: policy.required,

      blueprintHint,
      writerInstructions: this.buildWriterInstructions({
        currentNeed,
        posture,
        responseMoves,
        policy,
        responseShape
      }),

      shouldAskQuestion: policy.shouldAskQuestion,
      questionPurpose: policy.questionPurpose,

      confidence: this.resolveConfidence({ humanState, meaning })
    };
  },

  resolvePolicy({ currentNeed = "", posture = "", riskLevel = "low", adviceRequested = false, meaning = {} } = {}) {
    const avoid = new Set(humanStateAvoid(meaning));
    const required = new Set();

    let advicePolicy = "allowed_if_useful";
    let coachingPermissionRequired = false;
    let shouldAskQuestion = false;
    let questionPurpose = null;

    if (riskLevel === "high" || currentNeed === "immediate_safety") {
      advicePolicy = "safety_first";
      required.add("prioritize_immediate_safety");
      required.add("be_direct");
      avoid.add("casual_tone");
      avoid.add("abstract_analysis");
      avoid.add("delay");
      return {
        advicePolicy,
        coachingPermissionRequired,
        shouldAskQuestion: false,
        questionPurpose,
        avoid: Array.from(avoid),
        required: Array.from(required)
      };
    }

    if (currentNeed === "safe_health_guidance") {
      advicePolicy = "safe_general_guidance_only";
      required.add("include_red_flags_or_clinician_boundary");
      avoid.add("diagnosis");
      avoid.add("false_reassurance");
      avoid.add("unsafe_medical_specificity");
    }

    if (currentNeed === "validation_before_coaching") {
      advicePolicy = adviceRequested ? "brief_coaching_allowed_after_validation" : "permission_required";
      coachingPermissionRequired = !adviceRequested;
      shouldAskQuestion = !adviceRequested;
      questionPurpose = "permission_before_coaching";
      required.add("validate_first");
      required.add("non_shaming_language");
      avoid.add("diet_plan_too_fast");
      avoid.add("shame_language");
      avoid.add("lecturing");
      avoid.add("assuming_advice_wanted");
    }

    if (currentNeed === "shared_positive_emotion") {
      advicePolicy = "do_not_coach_unless_asked";
      required.add("join_positive_emotion");
      avoid.add("overcoaching");
      avoid.add("turning_positive_share_into_lesson");
    }

    if (currentNeed === "emotional_presence") {
      advicePolicy = adviceRequested ? "gentle_advice_after_presence" : "presence_first";
      required.add("attune_first");
      avoid.add("fixing_too_fast");
      avoid.add("silver_lining");
      avoid.add("analysis_before_presence");
    }

    if (currentNeed === "deescalation_and_repair") {
      advicePolicy = "one_repair_step";
      required.add("lower_temperature");
      required.add("one_next_step");
      avoid.add("blame_escalation");
      avoid.add("winning_the_argument_frame");
      avoid.add("over_apologizing");
    }

    if (currentNeed === "decision_support") {
      advicePolicy = "organize_tradeoff";
      required.add("separate_options");
      required.add("give_next_step");
      avoid.add("pretending_certainty");
    }

    if (currentNeed === "clear_information") {
      advicePolicy = "direct_answer";
      required.add("answer_first");
      avoid.add("overexplaining");
    }

    if (currentNeed === "practical_next_step") {
      advicePolicy = "practical_steps";
      required.add("actionable_step");
      avoid.add("vague_support");
    }

    if (currentNeed === "reflect_then_clarify") {
      advicePolicy = "clarify_before_solving";
      shouldAskQuestion = true;
      questionPurpose = "clarify_need";
      required.add("reflect_understanding");
      avoid.add("assuming_need");
    }

    return {
      advicePolicy,
      coachingPermissionRequired,
      shouldAskQuestion,
      questionPurpose,
      avoid: Array.from(avoid),
      required: Array.from(required)
    };
  },

  resolveMoves({ currentNeed = "", posture = "", policy = {}, meaning = {}, humanState = {}, eventUnderstanding = {} } = {}) {
    const meaningId = meaning.meaningId || meaning.primaryMeaning?.id || "";
    const eventLabel = eventUnderstanding.event?.label || eventUnderstanding.eventLabel || null;

    if (currentNeed === "immediate_safety") {
      return [
        "pause_and_prioritize_safety",
        "give_direct_safety_step",
        "urge_trusted_or_emergency_support"
      ];
    }

    if (currentNeed === "safe_health_guidance") {
      return [
        "calm_medical_frame",
        "name_safe_first_step",
        "include_red_flags_or_clinician_boundary"
      ];
    }

    if (currentNeed === "shared_positive_emotion") {
      return [
        "join_positive_emotion",
        "name_what_it_means",
        "reflect_strength_or_connection"
      ];
    }

    if (currentNeed === "validation_before_coaching") {
      return policy.coachingPermissionRequired
        ? [
            "validate_feeling",
            "name_pattern_gently",
            "ask_permission_before_coaching"
          ]
        : [
            "validate_feeling",
            "name_pattern_gently",
            "offer_small_practical_next_step"
          ];
    }

    if (currentNeed === "deescalation_and_repair") {
      return [
        "name_relationship_or_conflict_truth",
        "lower_blame",
        "offer_one_repair_step"
      ];
    }

    if (currentNeed === "emotional_presence") {
      return [
        "attune_to_emotion",
        "validate_weight",
        "invite_context_or_stay_present"
      ];
    }

    if (currentNeed === "decision_support") {
      return [
        "name_tradeoff",
        "separate_options",
        "recommend_next_decision_step"
      ];
    }

    if (currentNeed === "clear_information") {
      return [
        "answer_directly",
        "brief_explanation",
        "usable_context"
      ];
    }

    if (currentNeed === "practical_next_step") {
      return [
        "confirm_practical_goal",
        "give_contained_steps",
        "suggest_test_or_followup"
      ];
    }

    return [
      "reflect_understanding",
      "name_possible_meaning",
      "ask_clarifying_question"
    ];
  },

  resolveBlueprintHint({ currentNeed = "", meaning = {}, riskLevel = "low" } = {}) {
    if (riskLevel === "high" || currentNeed === "immediate_safety") return "safety_urgent_support";
    if (currentNeed === "safe_health_guidance") return "medical_context_calm_guidance";
    if (currentNeed === "shared_positive_emotion") return "positive_connection_reflection";
    if (currentNeed === "validation_before_coaching") return "validation_before_coaching";
    if (currentNeed === "deescalation_and_repair") return "relationship_repair_clarity";
    if (currentNeed === "emotional_presence") return "emotion_presence_grounding";
    if (currentNeed === "decision_support") return "decision_tradeoff";
    if (currentNeed === "clear_information") return "knowledge_clear_explanation";
    if (currentNeed === "practical_next_step") return "builder_direct_help";

    return "general_reflective_clarification";
  },

  resolveResponseShape({ currentNeed = "", riskLevel = "low", adviceRequested = false } = {}) {
    if (riskLevel === "high") return "urgent_short_direct";
    if (currentNeed === "shared_positive_emotion") return "brief_warm_reflection";
    if (currentNeed === "validation_before_coaching") return adviceRequested ? "validate_then_steps" : "validate_then_permission_question";
    if (currentNeed === "emotional_presence") return "presence_then_question";
    if (currentNeed === "decision_support") return "tradeoff_then_next_step";
    if (currentNeed === "clear_information") return "answer_then_context";
    if (currentNeed === "practical_next_step") return "steps";
    return "reflect_then_clarify";
  },

  resolveResponseGoal({ currentNeed = "", meaning = {} } = {}) {
    const map = {
      immediate_safety: "protect_user",
      safe_health_guidance: "safe_health_orientation",
      shared_positive_emotion: "share_and_strengthen_positive_moment",
      validation_before_coaching: "support_before_coaching",
      deescalation_and_repair: "lower_temperature_and_repair",
      emotional_presence: "help_user_feel_understood",
      practical_next_step: "help_user_act",
      decision_support: "help_user_choose",
      clear_information: "answer_question",
      reflect_then_clarify: "understand_need_before_solving"
    };

    return map[currentNeed] || "respond_helpfully";
  },

  buildWriterInstructions({ currentNeed = "", posture = "", responseMoves = [], policy = {}, responseShape = "" } = {}) {
    return {
      posture,
      shape: responseShape,
      moves: responseMoves,
      required: policy.required || [],
      avoid: policy.avoid || [],
      maxSentences: this.resolveMaxSentences(currentNeed),
      finalQuestionAllowed: policy.shouldAskQuestion === true,
      doNotWrite: [
        "diagnosis",
        "moralizing",
        "generic lecture",
        "unsupported certainty"
      ]
    };
  },

  resolveMaxSentences(currentNeed = "") {
    if (currentNeed === "immediate_safety") return 3;
    if (currentNeed === "shared_positive_emotion") return 3;
    if (currentNeed === "validation_before_coaching") return 3;
    if (currentNeed === "clear_information") return 4;
    if (currentNeed === "practical_next_step") return 5;
    return 4;
  },

  resolveConfidence({ humanState = {}, meaning = {} } = {}) {
    const values = [
      humanState.stateConfidence,
      meaning.primaryMeaning?.confidence,
      meaning.confidence
    ].filter(Number.isFinite);

    if (!values.length) return 0.45;

    const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
    return Number(Math.max(0.35, Math.min(0.92, avg)).toFixed(2));
  },

  getHumanState(summary = {}) {
    return (
      summary.humanState ||
      summary.humanStateBuilder ||
      summary.humanStateResult ||
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

  empty(reason = "No response plan available.") {
    return {
      responsePlannerRan: true,
      responsePlannerVersion: this.version,
      responsePlannerSource: "ari-response-planner",
      usable: false,
      reason,
      confidence: 0
    };
  }
};

function humanStateAvoid(meaning = {}) {
  const avoid = [];

  const meaningAvoid = {
    safety_risk: ["casual_tone", "delayed_help"],
    health_worry: ["diagnosis", "false_reassurance"],
    self_criticism: ["shame_language", "agreeing_with_self_attack"],
    body_change_concern: ["shame_language", "diet_plan_too_fast"],
    grief_or_loss: ["silver_lining", "rushing_grief"],
    celebration: ["overcoaching"],
    support_received: ["turning_positive_share_into_lesson"],
    relationship_repair_need: ["blame_escalation"]
  };

  const id = meaning.meaningId || meaning.primaryMeaning?.id || "";
  return meaningAvoid[id] || avoid;
}

window.Ari.responsePlanner = window.AriResponsePlanner;

console.log(
  "ARI RESPONSE PLANNER LOADED:",
  window.AriResponsePlanner.version
);