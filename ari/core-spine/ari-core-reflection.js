// ari/core-spine/ari-core-reflection.js
// Ari Core Reflection Spine
// Purpose: Handle Ari's self model, values, constitution, and self reflection.
// Answers: Who is Ari in this moment?
// V1.0

window.Ari = window.Ari || {};

window.Ari.coreReflection = {
  version: "1.0.0",

  run(state = {}) {
    const self = window.Ari.selfModel
      ? window.Ari.selfModel.getSelf()
      : null;

    const selfValues = window.Ari.selfValues
      ? window.Ari.selfValues.getValues()
      : [];

    const constitution = window.Ari.constitution
      ? window.Ari.constitution.getHierarchy()
      : [];

    const selfReflection = window.Ari.selfReflection
      ? window.Ari.selfReflection.reflect({
          message: state.message,
          context: state.context,
          questionType: state.questionType,
          observation: state.observation,
          values: state.values,
          identity: state.identity,
          conflicts: state.conflicts,
          executive: state.executive,
          earlyInsight: state.earlyInsight,
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
          self,
          selfValues,
          constitution
        })
      : {
          stance: {
            name: state.route?.primaryOrgan || "steady_companion"
          },
          leadPrinciple: null,
          leadValue: null,
          approach: null,
          confidence: "low",
          source: "self-reflection-unavailable"
        };

    return {
      ...state,
      self,
      selfValues,
      constitution,
      selfReflection
    };
  }
};