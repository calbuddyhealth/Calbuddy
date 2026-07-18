// ari/contracts/ari-operation-registry.js
// Ari Operation Registry
//
// Purpose:
// Provide one deterministic registry for cognitive operation names and their
// structural contracts. This registry does not select an operation.
//
// V1.0.0 — Shared Cognitive Operation Contract

window.Ari = window.Ari || {};

window.AriOperationRegistry = {
  version: "1.0.0",
  schema: "ari.operation_registry",
  schemaVersion: "1.0.0",
  source: "ari-operation-registry",
  authorityLevel: "operation_contract_registry_only",

  operations: {
    respond: {
      requestType: "general",
      frameType: "general_request",
      interactionFamily: "general",
      intentFamily: "general_response",
      defaultDomain: "general_understanding",
      defaultRequestedOutput: "response",
      requiredSlots: [],
      responseMode: "normal_response",
      conversationStyle: "normal",
      executionKind: null
    },

    provide_information: {
      requestType: "information",
      frameType: "information_request",
      interactionFamily: "information",
      intentFamily: "fact_retrieval",
      defaultDomain: "general_understanding",
      defaultRequestedOutput: "direct_information",
      requiredSlots: ["object"],
      responseMode: "direct_answer",
      conversationStyle: "information_request",
      executionKind: null
    },

    interpret_meaning: {
      requestType: "explanation",
      frameType: "meaning_interpretation_request",
      interactionFamily: "information",
      intentFamily: "interpretation",
      defaultDomain: "general_understanding",
      defaultRequestedOutput: "interpretation",
      requiredSlots: ["object"],
      responseMode: "direct_answer",
      conversationStyle: "meaning_request",
      executionKind: null
    },

    explain_or_teach: {
      requestType: "explanation",
      frameType: "explanation_request",
      interactionFamily: "information",
      intentFamily: "explanation",
      defaultDomain: "general_understanding",
      defaultRequestedOutput: "explanation",
      requiredSlots: ["object"],
      responseMode: "direct_answer",
      conversationStyle: "information_request",
      executionKind: null
    },

    decide_or_prioritize: {
      requestType: "decision",
      frameType: "decision_request",
      interactionFamily: "decision",
      intentFamily: "recommendation",
      defaultDomain: "decision",
      defaultRequestedOutput: "recommendation_or_priority",
      requiredSlots: ["object"],
      responseMode: "recommendation",
      conversationStyle: "recommendation_request",
      executionKind: null
    },

    evaluate_and_recommend: {
      requestType: "decision",
      frameType: "decision_request",
      interactionFamily: "decision",
      intentFamily: "recommendation",
      defaultDomain: "decision",
      defaultRequestedOutput: "architectural_recommendation",
      requiredSlots: ["object"],
      responseMode: "recommendation",
      conversationStyle: "recommendation_request",
      executionKind: null
    },

    create_plan: {
      requestType: "planning",
      frameType: "planning_request",
      interactionFamily: "planning",
      intentFamily: "planning",
      defaultDomain: "general_understanding",
      defaultRequestedOutput: "plan_or_roadmap",
      requiredSlots: ["object"],
      responseMode: "plan",
      conversationStyle: "planning_request",
      executionKind: null
    },

    produce_or_revise_text: {
      requestType: "writing",
      frameType: "writing_request",
      interactionFamily: "writing",
      intentFamily: "text_generation",
      defaultDomain: "writing",
      defaultRequestedOutput: "written_text",
      requiredSlots: ["object"],
      responseMode: "written_output",
      conversationStyle: "writing_request",
      executionKind: "creation"
    },

    translate: {
      requestType: "translation",
      frameType: "translation_request",
      interactionFamily: "translation",
      intentFamily: "language_transformation",
      defaultDomain: "language",
      defaultRequestedOutput: "translated_text",
      requiredSlots: ["object"],
      responseMode: "translated_output",
      conversationStyle: "translation_request",
      executionKind: null
    },

    calculate_or_convert: {
      requestType: "calculation",
      frameType: "calculation_request",
      interactionFamily: "calculation",
      intentFamily: "calculation",
      defaultDomain: "calculation",
      defaultRequestedOutput: "calculated_result",
      requiredSlots: ["object"],
      responseMode: "calculated_output",
      conversationStyle: "calculation_request",
      executionKind: null
    },

    verify_or_review: {
      requestType: "verification",
      frameType: "verification_request",
      interactionFamily: "verification",
      intentFamily: "verification",
      defaultDomain: "general_understanding",
      defaultRequestedOutput: "verification_result",
      requiredSlots: ["object"],
      responseMode: "verification_result",
      conversationStyle: "verification_request",
      executionKind: null
    },

    inspect_and_explain: {
      requestType: "verification",
      frameType: "verification_request",
      interactionFamily: "verification",
      intentFamily: "analysis",
      defaultDomain: "project",
      defaultRequestedOutput: "architectural_analysis",
      requiredSlots: ["object"],
      responseMode: "verification_result",
      conversationStyle: "verification_request",
      executionKind: null
    },

    retrieve_prior_context: {
      requestType: "memory",
      frameType: "memory_request",
      interactionFamily: "memory",
      intentFamily: "memory_action",
      defaultDomain: "memory",
      defaultRequestedOutput: "recalled_context",
      requiredSlots: [],
      responseMode: "normal_response",
      conversationStyle: "normal",
      executionKind: null
    },

    save_or_forget_memory: {
      requestType: "memory",
      frameType: "memory_request",
      interactionFamily: "memory",
      intentFamily: "memory_action",
      defaultDomain: "memory",
      defaultRequestedOutput: "memory_action",
      requiredSlots: ["object"],
      responseMode: "normal_response",
      conversationStyle: "normal",
      executionKind: null
    },

    answer_identity_question: {
      requestType: "identity",
      frameType: "identity_question",
      interactionFamily: "identity",
      intentFamily: "identity",
      defaultDomain: "identity",
      defaultRequestedOutput: "identity_answer",
      requiredSlots: [],
      responseMode: "normal_response",
      conversationStyle: "identity_question",
      executionKind: null
    },

    provide_opinion: {
      requestType: "opinion",
      frameType: "opinion_request",
      interactionFamily: "opinion",
      intentFamily: "judgment",
      defaultDomain: "general_understanding",
      defaultRequestedOutput: "opinion",
      requiredSlots: ["object"],
      responseMode: "normal_response",
      conversationStyle: "opinion_request",
      executionKind: null
    },

    create_artifact: {
      requestType: "creation",
      frameType: "creation_request",
      interactionFamily: "creation",
      intentFamily: "artifact_creation",
      defaultDomain: "project",
      defaultRequestedOutput: "created_artifact",
      requiredSlots: ["object"],
      responseMode: "created_artifact",
      conversationStyle: "creation_request",
      executionKind: "creation"
    },

    implement_or_modify: {
      requestType: "implementation",
      frameType: "developer_artifact_request",
      interactionFamily: "developer_task",
      intentFamily: "artifact_execution",
      defaultDomain: "project",
      defaultRequestedOutput: "implementation_or_code",
      requiredSlots: ["object"],
      responseMode: "code_or_artifact",
      conversationStyle: "artifact_operation",
      executionKind: "modification"
    },

    provide_emotional_support: {
      requestType: "emotional_support",
      frameType: "emotional_support_request",
      interactionFamily: "emotional_support",
      intentFamily: "emotional_support",
      defaultDomain: "emotion",
      defaultRequestedOutput: "supportive_response",
      requiredSlots: [],
      responseMode: "supportive_response",
      conversationStyle: "support_request",
      executionKind: null
    },

    explain_without_execution: {
      requestType: "explanation",
      frameType: "explanation_request",
      interactionFamily: "information",
      intentFamily: "explanation",
      defaultDomain: "project",
      defaultRequestedOutput: "explanation",
      requiredSlots: ["object"],
      responseMode: "direct_answer",
      conversationStyle: "information_request",
      executionKind: null
    }
  },

  aliases: {
    general: "respond",
    information: "provide_information",
    provide_information_directly: "provide_information",
    direct_information: "provide_information",
    factual: "provide_information",
    understanding: "provide_information",
    meaning: "interpret_meaning",
    explanation: "explain_or_teach",
    explain: "explain_or_teach",
    teaching: "explain_or_teach",
    decision: "decide_or_prioritize",
    decide: "decide_or_prioritize",
    recommend: "decide_or_prioritize",
    planning: "create_plan",
    plan: "create_plan",
    writing: "produce_or_revise_text",
    translation: "translate",
    calculation: "calculate_or_convert",
    calculate: "calculate_or_convert",
    verification: "verify_or_review",
    verify: "verify_or_review",
    review: "verify_or_review",
    recall: "retrieve_prior_context",
    memory: "save_or_forget_memory",
    identity: "answer_identity_question",
    opinion: "provide_opinion",
    creation: "create_artifact",
    implementation: "implement_or_modify",
    implement: "implement_or_modify",
    modify: "implement_or_modify",
    emotional: "provide_emotional_support",
    emotional_support: "provide_emotional_support"
  },

  normalizeOperation(value = "") {
    const key = this.normalizeKey(value);
    if (!key) return null;
    if (this.operations[key]) return key;
    return this.aliases[key] || null;
  },

  getOperation(value = "") {
    const operation = this.normalizeOperation(value);
    return operation ? this.operations[operation] || null : null;
  },

  hasOperation(value = "") {
    return Boolean(this.getOperation(value));
  },

  normalizeKey(value = "") {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  authority: {
    canDefineOperationContracts: true,
    canNormalizeOperationAliases: true,
    canSelectOperation: false,
    canInterpretMeaning: false,
    canAuthorizeExecution: false,
    role: "operation_contract_registry"
  }
};

window.Ari.operationRegistry = window.AriOperationRegistry;

console.log(
  "ARI OPERATION REGISTRY LOADED:",
  window.AriOperationRegistry?.version
);