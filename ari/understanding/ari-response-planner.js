// =====================================================
// ARI REBIRTH
// File: ari/understanding/ari-response-planner.js
// Version: 3.0.0
// Purpose:
//   Compatibility planner for the OpenAI-authoritative response architecture.
//
// Authority model:
//   - OpenAI cognition owns semantic interpretation and response strategy.
//   - This module does NOT choose a conversational blueprint.
//   - This module does NOT replace, narrow, or reinterpret OpenAI's plan.
//   - Binding application safety constraints remain binding upstream.
//   - Proposed application actions remain proposals until an authorized
//     application layer executes them.
//
// This file intentionally preserves the historical plan/create/build API so
// older routing code can call it without restoring the legacy blueprint and
// response-move decision system.
// =====================================================

window.Ari = window.Ari || {};

window.AriResponsePlanner = {
  version: "3.0.0",
  schemaVersion: "2.0.0",
  source: "ari-response-planner-openai-authority-passthrough",

  async plan(input = {}) {
    return this.buildEnvelope(input);
  },

  async create(input = {}) {
    return this.buildEnvelope(input);
  },

  async build(input = {}) {
    return this.buildEnvelope(input);
  },

  buildEnvelope(input = {}) {
    const summary = this.asObject(input);

    const cognitivePlan =
      this.firstObject(
        summary.cognitiveResponsePlan,
        summary.canonicalResponsePlan,
        summary.ariResponsePlan,
        summary.responsePlan
      );

    const cognitive =
      this.firstObject(
        summary.cognitiveReasoningResult,
        summary.reasoningResult,
        summary.cognition
      );

    const responseStrategy =
      this.firstObject(
        cognitivePlan.responseStrategy,
        cognitive.responseStrategy
      );

    const draftResponse =
      this.firstText(
        cognitivePlan.draftResponse,
        cognitive.authoritativeDraft,
        cognitive.draftResponse,
        cognitive.responseText
      );

    const responsePlan = Object.keys(cognitivePlan).length
      ? {
          ...cognitivePlan,
          source:
            cognitivePlan.source ||
            "openai-cognitive-response-plan",
          authority: {
            ...(this.asObject(cognitivePlan.authority)),
            semanticSource: "openai_cognitive_reasoning",
            mayReinterpretMeaning: false,
            mayReplaceAuthoritativeDraft: false,
            mayOverrideSafety: false,
            mayExecuteActions: false
          }
        }
      : {
          schema: "ari_response_plan",
          schemaVersion: this.schemaVersion,
          source: "openai-cognitive-response-strategy-passthrough",
          ready: cognitive.ready === true || Boolean(draftResponse),
          usable: cognitive.ready === true || Boolean(draftResponse),
          fallback: false,
          responseGoal:
            responseStrategy.responseGoal ||
            responseStrategy.goal ||
            "answer_current_request",
          responseShape:
            responseStrategy.responseShape ||
            responseStrategy.shape ||
            null,
          responsePosture:
            responseStrategy.responsePosture ||
            responseStrategy.posture ||
            responseStrategy.tone ||
            null,
          responseMoves: this.toArray(
            responseStrategy.responseMoves ||
            responseStrategy.moves ||
            responseStrategy.orderedPoints
          ),
          responseOrder: this.toArray(
            responseStrategy.responseOrder ||
            responseStrategy.order
          ),
          adviceRequested:
            responseStrategy.adviceRequested === true,
          advicePolicy:
            responseStrategy.advicePolicy || null,
          coachingPermissionRequired:
            responseStrategy.coachingPermissionRequired === true,
          shouldAskQuestion:
            responseStrategy.shouldAskQuestion === true,
          questionPurpose:
            responseStrategy.questionPurpose || null,
          requiredBehaviors: this.toArray(
            responseStrategy.requiredBehaviors
          ),
          forbiddenBehaviors: this.toArray(
            responseStrategy.forbiddenBehaviors
          ),
          constraints: this.toArray(
            responseStrategy.constraints
          ),
          rules: this.toArray(responseStrategy.rules),
          blueprintHint: null,
          writerInstructions:
            responseStrategy.writerInstructions || null,
          communicationPlan:
            responseStrategy.communicationPlan || null,
          composerDirective:
            responseStrategy.composerDirective || null,
          draftResponse,
          proposedActions: this.toArray(
            cognitive.reasoningDecision?.proposedActions
          ),
          grounding: cognitive.grounding || null,
          confidence: cognitive.confidence ?? null,
          authority: {
            semanticSource: "openai_cognitive_reasoning",
            mayRefineStructure: false,
            mayReinterpretMeaning: false,
            mayReplaceAuthoritativeDraft: false,
            mayExecuteActions: false,
            mayOverrideSafety: false
          }
        };

    return {
      ok: true,
      success: true,
      ready: responsePlan.ready !== false,
      usable: responsePlan.usable !== false,
      responsePlannerRan: true,
      source: this.source,
      version: this.version,
      responsePlan,
      ariResponsePlan: responsePlan,
      canonicalResponsePlan: responsePlan,
      plan: responsePlan,
      result: responsePlan,
      diagnostics: {
        mode: "openai_authority_passthrough",
        legacyBlueprintSelectionDisabled: true,
        legacyMoveSelectionDisabled: true,
        semanticReinterpretationDisabled: true,
        authoritativeDraftReplacementDisabled: true
      }
    };
  },

  asObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  },

  firstObject(...values) {
    for (const value of values) {
      const object = this.asObject(value);
      if (Object.keys(object).length) return object;
    }
    return {};
  },

  firstText(...values) {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    return "";
  },

  toArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (value === null || value === undefined || value === "") return [];
    return [value];
  }
};

window.Ari.responsePlanner = window.AriResponsePlanner;
