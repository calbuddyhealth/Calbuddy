// ari/core-spine/ari-core-continuity.js
// Ari Core Continuity Spine
// Purpose: Handle memory and future learning hooks.
// Answers: What should continue forward?
// V1.0

window.Ari = window.Ari || {};

window.Ari.coreContinuity = {
  version: "1.0.0",

  run(state = {}) {
    const memory = window.Ari.memoryEngine
      ? window.Ari.memoryEngine.classify(state.message, {
          ...state.context,
          questionType: state.questionType,
          observation: state.observation,
          values: state.values,
          identity: state.identity,
          conflicts: state.conflicts,
          executive: state.executive,
          insight: state.insight,
          metaAwareness: state.metaAwareness,
          attention: state.attention,
          route: state.route,
          emotion: state.emotion,
          emotionalIntelligence: state.emotionalIntelligence,
          meaning: state.meaning,
          personModel: state.personModel,
          beliefModel: state.beliefModel,
          simulation: state.simulation,
          self: state.self,
          selfValues: state.selfValues,
          constitution: state.constitution,
          selfReflection: state.selfReflection,
          voice: state.voice
        })
      : {
          shouldRemember: false,
          memoryType: "temporary",
          importance: "temporary",
          source: "memory-engine-unavailable"
        };

    return {
      ...state,
      memory,

      learningCandidate: {
        shouldReview: Boolean(
          state.metaAwareness?.recommendation ||
            state.insight?.hypothesis ||
            memory?.shouldRemember
        ),
        reason:
          state.metaAwareness?.recommendation ||
          "No learning review required yet.",
        source: "ari-core-continuity"
      }
    };
  }
};