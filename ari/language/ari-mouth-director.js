// ari/language/ari-mouth-director.js
// Purpose: Own final expression planning before Composer Bridge.
// V2.0.2 — Communication Planner + Mouth Director + Blueprint Selector Merge / Planner Order Aware

window.Ari = window.Ari || {};

window.AriMouthDirector = {
  version: "2.0.2",

  direct(input = {}) {
    const summary = input.summary || input || {};

    const primary = this.getPrimary(summary);
    const map = summary.situationMap || {};
    const needs = map.needs || [];
    const situations = map.situations || [];
    const domains = map.domains || [];
const multiLanePlan = summary.multiLanePlan || summary.responsePlan || {};
    const blueprintId = this.selectBlueprint({
      primary,
      needs,
      situations,
      domains,
      summary
    });

    const expressionPlan = this.buildExpressionPlan({
      primary,
      blueprintId,
      needs,
      situations,
      domains,
      multiLanePlan,
      summary
    });

    return {
      mouthDirectorRan: true,
      mouthDirectorVersion: this.version,
      mouthDirectorSource: "ari-mouth-director",

      expressionPlan,
      blueprintHint: blueprintId,

      responseRules: expressionPlan.voiceRules,
      responseAvoid: expressionPlan.avoid,
      responseRequired: expressionPlan.required,

      communicationPlan: {
        plannerMergedIntoMouthDirector: true,
        primary,
        responseShape: expressionPlan.responseShape,
        responseOrder: expressionPlan.structure,
        blueprintHint: blueprintId,
        plannerInput: multiLanePlan,
        composerDirective: {
          opening: expressionPlan.opening,
          sequence: expressionPlan.structure,
          avoid: expressionPlan.avoid,
          required: expressionPlan.required,
          closing: expressionPlan.closing,
          question: expressionPlan.question
        }
      },

      mouthDirective: {
        primary,
        blueprintHint: blueprintId,
        tone: expressionPlan.tone,
        voiceRules: expressionPlan.voiceRules,
        avoid: expressionPlan.avoid,
        required: expressionPlan.required,
        aiAllowed: expressionPlan.aiAllowed
      }
    };
  },

  plan(input = {}) {
    return this.direct(input);
  },

  getPrimary(summary = {}) {
    return (
      summary.situationContractPrimary ||
      summary.triagePrimaryLane ||
      summary.primaryLane ||
      summary.ariTriage?.primaryLane ||
      summary.situationMap?.primaryLane ||
      "general_understanding"
    );
  },

  selectBlueprint({ primary, needs = [], situations = [], domains = [] } = {}) {
    if (primary === "safety") return "safety_urgent_support";
    if (primary === "medical_body") return "medical_urgent_action";
    if (primary === "risk_clarification") return "safety_risk_clarification";

    if (
      primary === "emotion" &&
      needs.includes("decision_support") &&
      needs.includes("relationship_awareness")
    ) {
      return "emotion_balance_repair";
    }

    if (
      primary === "emotion" &&
      situations.includes("tradeoff_or_competing_priorities")
    ) {
      return "emotion_decision_grounding";
    }

    if (primary === "emotion") return "emotion_presence_grounding";

    if (
      primary === "executive_decision" ||
      needs.includes("decision_support") ||
      situations.includes("tradeoff_or_competing_priorities")
    ) {
      return "decision_tradeoff";
    }

    if (primary === "builder" || domains.includes("builder_domain")) {
      return "builder_direct_help";
    }

    if (primary === "teacher" || needs.includes("understanding")) {
      return "knowledge_clear_explanation";
    }

    if (primary === "relationship" || domains.includes("relationship_context_domain")) {
      return "relationship_repair_clarity";
    }

    if (primary === "memory") return "memory_direct_acknowledgment";
    if (primary === "wisdom") return "wisdom_principle_then_step";
    if (primary === "medical_context") return "medical_context_calm_guidance";

    return "general_direct_response";
  },

  buildExpressionPlan({ primary, blueprintId, needs = [], situations = [], domains = [], summary = {}, multiLanePlan = {} } = {}) {
    const base = {
      blueprintId,
      primary,
      responseShape: "standard",
      tone: "direct_warm_plain",
      structure: ["answer", "explain_briefly", "next_step"],
      voiceRules: [
        "answer_the_current_user_message",
        "be_direct_natural_concise",
        "do_not_dump_pipeline_details",
        "do_not_use_stale_context"
      ],
      avoid: [
        "generic_therapy_language",
        "long_lectures",
        "unnecessary_clarifying_question"
      ],
      required: ["include_one_useful_next_step"],
      opening: null,
      closing: null,
      question: null,
      aiAllowed: true
    };
const plannerOrder = Array.isArray(multiLanePlan.responseOrder)
  ? multiLanePlan.responseOrder
  : [];

if (plannerOrder.length && blueprintId !== "emotion_balance_repair") {
  base.structure = plannerOrder;
}
    if (blueprintId === "emotion_balance_repair") {
      return {
        ...base,
        responseShape: "emotion_then_ground",
        structure: [
          "validate_emotion",
          "reflect_pattern",
          "name_core_truth",
          "one_repair_step",
          "grounded_close"
        ],
        voiceRules: [
          ...base.voiceRules,
          "emotional_presence_first",
          "do_not_lead_with_knowledge",
          "do_not_over_explain",
          "comfort_then_one_grounding_step",
          "protect_relationship_context"
        ],
        avoid: [
          ...base.avoid,
          "curriculum_language",
          "abstract_balance_lecture",
          "shame_or_blame"
        ],
        required: [
          "acknowledge_emotional_load",
          "name_the_pattern",
          "give_one_concrete_repair_step"
        ],
        aiAllowed: false
      };
    }

    if (blueprintId === "emotion_presence_grounding") {
      return {
        ...base,
        responseShape: "emotion_then_ground",
        structure: [
          "validate_emotion",
          "offer_presence",
          "small_grounding_step",
          "invite_more_if_needed"
        ],
        voiceRules: [
          ...base.voiceRules,
          "emotional_presence_first",
          "do_not_lead_with_knowledge",
          "do_not_fix_too_fast"
        ],
        required: ["comfort_first", "one_small_next_step"],
        aiAllowed: false
      };
    }

    if (blueprintId === "decision_tradeoff") {
      return {
        ...base,
        responseShape: "decision_first_layered",
        structure: [
          "name_tradeoff",
          "separate_options",
          "recommend_next_step",
          "brief_emotional_acknowledgment"
        ],
        voiceRules: [
          ...base.voiceRules,
          "organize_options",
          "name_tradeoff",
          "recommend_next_step"
        ],
        required: ["clear_recommendation"],
        aiAllowed: true
      };
    }

    if (blueprintId === "builder_direct_help") {
      return {
        ...base,
        responseShape: "build_steps",
        structure: [
          "diagnose",
          "patch_or_steps",
          "test_instruction"
        ],
        voiceRules: [
          ...base.voiceRules,
          "be_specific",
          "preserve_unrelated_code",
          "avoid_generic_platform_advice"
        ],
        avoid: ["deep_emotional_processing"],
        required: ["give_actionable_code_or_steps"],
        aiAllowed: true
      };
    }

    if (blueprintId === "knowledge_clear_explanation") {
      return {
        ...base,
        responseShape: "clear_explanation",
        structure: [
          "direct_answer",
          "brief_explanation",
          "practical_example"
        ],
        voiceRules: [
          ...base.voiceRules,
          "answer_directly",
          "explain_without_overteaching"
        ],
        required: ["direct_answer"],
        aiAllowed: true
      };
    }

    if (blueprintId.startsWith("safety")) {
      return {
        ...base,
        responseShape: "urgent_safety",
        structure: [
          "safety_first",
          "direct_next_step",
          "supportive_close"
        ],
        voiceRules: [
          "safety_first",
          "direct_next_step",
          "no_philosophy",
          "no_blueprint_flourish"
        ],
        avoid: ["long_reflection", "normal_advice"],
        required: ["protect_user_now"],
        aiAllowed: false
      };
    }

    return base;
  }
};

console.log("ARI MOUTH DIRECTOR LOADED:", window.AriMouthDirector.version);