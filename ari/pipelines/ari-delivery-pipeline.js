// ari/pipelines/ari-delivery-pipeline.js
// Ari Delivery and Learning Pipeline
// Purpose: Execute approved actions and persist post-response state.
// V1.0.0 — Five-Layer Architecture Foundation

window.Ari = window.Ari || {};

window.AriDeliveryPipeline = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},
      runEngine = async (_engine, _methods, fallback = {}) => fallback
    } = runtime;

    let state = {
      ...summary,
      activePipelineLayer: "delivery_and_learning"
    };

    const merge = result => {
      state = {
        ...state,
        ...(result || {})
      };

      return state;
    };

    /*
      Existing post-response calls will be moved here.

      Planned ownership:

      1. Rebirth Action Planner
      2. Conversation Meaning History
      3. Memory Candidate Detection
      4. Memory Candidate Storage
      5. Thread-State Save
      6. Conversation-History Save
      7. Optional Situation Review Console
      8. Delivery diagnostics
      9. UI delivery events, when added
    */

    state.deliveryResult =
      this.buildDeliveryResult(state);

    state.deliveryPipelineRan = true;
    state.deliveryPipelineSource = "ari-delivery-pipeline";
    state.deliveryPipelineVersion = this.version;

    return state;
  },

  buildDeliveryResult(summary = {}) {
    return {
      ready: true,
      source: "ari-delivery-pipeline",
      version: this.version,

      finalResponseDelivered:
        Boolean(String(summary.finalResponse || "").trim()),

      actionPlanningRan:
        Boolean(summary.rebirthActionPlan),

      threadSaved:
        summary.threadSaveRan === true,

      memoryCandidateDetectionRan:
        summary.memoryCandidateRan === true,

      memorySaved:
        summary.memorySaveRan === true,

      conversationHistorySaved:
        summary.conversationHistorySaveRan === true,

      authority: {
        canChangeFinalResponse: false,
        canChangeRouting: false,
        canExecuteApprovedActions: true,
        canPersistState: true,
        role: "delivery_persistence_and_learning"
      }
    };
  }
};

console.log(
  "ARI DELIVERY PIPELINE LOADED:",
  window.AriDeliveryPipeline?.version
);