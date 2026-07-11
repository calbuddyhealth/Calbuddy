// ari/pipelines/ari-perception-pipeline.js
// Ari Perception Pipeline
// Purpose: Collect and structure evidence about the current user message.
// V1.0.0 — Five-Layer Architecture Foundation

window.Ari = window.Ari || {};

window.AriPerceptionPipeline = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},
      runEngine = async (_engine, _methods, fallback = {}) => fallback
    } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "perception"
    };

    const merge = result => {
      state = {
        ...state,
        ...(result || {})
      };

      return state;
    };

    /*
      Existing perception-stage engine calls will be moved here.

      Planned ownership:

      1. Early Safety Context Gate
      2. Observer Network
      3. Conversation Function Engine
      4. Universal Conversation Classifier
      5. Observer Routing Evidence
      6. Semantic Frame Builder

      Input normalization and thread-state loading remain in the
      master lifecycle pipeline for now.
    */

    state.perceptionPacket = this.buildPerceptionPacket(state);

    state.perceptionPipelineRan = true;
    state.perceptionPipelineSource = "ari-perception-pipeline";
    state.perceptionPipelineVersion = this.version;

    return state;
  },

  buildPerceptionPacket(summary = {}) {
    return {
      ready: true,
      source: "ari-perception-pipeline",
      version: this.version,

      message: {
        raw:
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",

        normalized:
          summary.normalizedMessage ||
          ""
      },

      safetyScreen:
        summary.safetyContextGate ||
        null,

      observerEvidence:
        summary.observerEvidence ||
        null,

      conversationFunction:
        summary.conversationFunction ||
        null,

      universalClassification:
        summary.universalConversationClassification ||
        null,

      routingEvidence:
        summary.routingEvidence ||
        null,

      semanticFrame:
        summary.semanticFrameOutput ||
        null,

      authority: {
        canChooseFinalRoute: false,
        canChoosePlanner: false,
        canAnswerUser: false,
        role: "evidence_and_meaning_only"
      }
    };
  }
};

console.log(
  "ARI PERCEPTION PIPELINE LOADED:",
  window.AriPerceptionPipeline?.version
);