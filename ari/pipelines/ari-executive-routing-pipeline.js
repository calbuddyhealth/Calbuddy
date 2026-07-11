// ari/pipelines/ari-executive-routing-pipeline.js
// Ari Executive Routing Pipeline
// Purpose: Select Ari's authoritative route and determine applicable systems.
// V1.0.0 — Five-Layer Architecture Foundation

window.Ari = window.Ari || {};

window.AriExecutiveRoutingPipeline = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},
      runEngine = async (_engine, _methods, fallback = {}) => fallback
    } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "executive_routing"
    };

    const merge = result => {
      state = {
        ...state,
        ...(result || {})
      };

      return state;
    };

    /*
      Existing and future routing-stage calls will live here.

      Planned ownership:

      1. New Conversation Routing Pipeline
      2. Lane Splitter
      3. Continuity eligibility
      4. Memory eligibility
      5. Developer-layer eligibility
      6. Capability selection
      7. Planner selection
      8. Fast-path selection
      9. Routing validation

      This layer chooses where processing goes.
      It does not perform the full reasoning.
    */

    state.routingContract =
      state.routingContract ||
      this.buildCompatibilityRoutingContract(state);

    state.executiveRoutingPipelineRan = true;
    state.executiveRoutingPipelineSource =
      "ari-executive-routing-pipeline";
    state.executiveRoutingPipelineVersion = this.version;

    return state;
  },

  buildCompatibilityRoutingContract(summary = {}) {
    return {
      ready: false,
      source: "legacy-routing-compatibility",
      version: this.version,

      speechAct:
        summary.conversationFunction?.primaryFunction ||
        "unknown",

      mode:
        summary.conversationType ||
        "unknown",

      primaryIntent:
        summary.conversationIntent ||
        "unknown",

      secondaryIntents: [],

      domain:
        summary.semanticFrameOutput?.domain ||
        "general",

      primaryLane:
        summary.laneSplit?.lane ||
        summary.primaryLaneSuggestion ||
        null,

      capabilities: [],

      planner: null,

      run: {
        continuity:
          Boolean(
            summary.laneSplit?.routing?.useThread ||
            summary.laneSplit?.routing?.useMemory ||
            summary.laneSplit?.routing?.useRelationship
          ),

        deepSafety: false,

        situationMap: true,
        triage: true,

        memory:
          summary.laneSplit?.routing?.useMemory === true,

        developer: false,
        heavyReasoning: true
      },

      authority: {
        authoritative: false,
        compatibilityMode: true,
        reason:
          "New conversation routing system has not been installed yet."
      }
    };
  }
};

console.log(
  "ARI EXECUTIVE ROUTING PIPELINE LOADED:",
  window.AriExecutiveRoutingPipeline?.version
);