// ari/core-spine/ari-core-expression.js
// Ari Core Expression Spine
// Purpose: Handle voice selection and response style preparation.
// Answers: How should Ari show up and speak?
// V1.0

window.Ari = window.Ari || {};

window.Ari.coreExpression = {
  version: "1.0.0",

  run(state = {}) {
    const voice = window.Ari.voiceEngine
      ? window.Ari.voiceEngine.chooseVoice({
          analysis: {
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
            self: state.self,
            selfValues: state.selfValues,
            constitution: state.constitution,
            selfReflection: state.selfReflection
          },
          selfReflection: state.selfReflection
        })
      : {
          stance:
            state.selfReflection?.stance?.name ||
            state.route?.primaryOrgan ||
            "steady_companion",
          openingStyle: "steady_observation",
          confidenceStyle: { name: "tentative", prefix: "" },
          confidence: state.metaAwareness?.confidenceLevel || "low",
          warmth: 65,
          challenge: 50,
          depth: 45,
          structure: ["observation", "interpretation", "next_step"],
          rhythm: "short_clear",
          source: "voice-engine-unavailable"
        };

    return {
      ...state,
      voice
    };
  }
};