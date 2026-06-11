// ari/core-spine/ari-core-cognition.js
// Ari Core Cognition Spine
// Purpose: Handle meaning, person model, belief model, simulation, insight, evidence, meta awareness, wisdom, and wisdom resolution.
// Answers: What does this mean, how strongly should Ari trust it, and what matters most?
// V1.2

window.Ari = window.Ari || {};

window.Ari.coreCognition = {
  version: "1.2.0",

  run(state = {}) {
    const emotionalIntelligence = window.Ari.emotionalIntelligence
      ? window.Ari.emotionalIntelligence.analyze({
          observation: state.observation,
          values: state.values,
          identity: state.identity,
          conflicts: state.conflicts,
          executive: state.executive,
          insight: state.earlyInsight
        })
      : {
          surfaceEmotion: null,
          underlyingEmotion: null,
          emotionalTension: null,
          rootNeed: null,
          protecting: null,
          regulation: null,
          source: "emotional-intelligence-unavailable"
        };

    const meaning = window.Ari.meaningEngine
      ? window.Ari.meaningEngine.synthesize({
          observation: state.observation,
          questionType: state.questionType,
          values: state.values,
          identity: state.identity,
          conflicts: state.conflicts,
          executive: state.executive,
          insight: state.earlyInsight,
          emotion: state.emotion,
          emotionalIntelligence
        })
      : {
          theme: null,
          confidence: "low",
          meaning: null,
          humanTruth: null,
          source: "meaning-engine-unavailable"
        };

    const personModel = window.Ari.personModel
      ? window.Ari.personModel.build({
          observation: state.observation,
          values: state.values,
          identity: state.identity,
          conflicts: state.conflicts,
          insight: state.earlyInsight,
          emotionalIntelligence,
          meaning
        })
      : {
          roles: [],
          lifeChapter: null,
          activePressures: [],
          likelyNeeds: [],
          recurringPattern: null,
          snapshot: null,
          source: "person-model-unavailable"
        };

    const beliefModel = window.Ari.beliefEngine
      ? window.Ari.beliefEngine.analyze({
          observation: state.observation,
          values: state.values,
          identity: state.identity,
          conflicts: state.conflicts,
          insight: state.earlyInsight,
          emotionalIntelligence,
          meaning,
          personModel
        })
      : {
          beliefs: [],
          primaryBelief: null,
          beliefTheme: null,
          beliefSummary: null,
          source: "belief-engine-unavailable"
        };

    const simulation = window.Ari.simulationEngine
      ? window.Ari.simulationEngine.simulate({
          values: state.values,
          identity: state.identity,
          conflicts: state.conflicts,
          executive: state.executive,
          meaning,
          personModel,
          beliefModel
        })
      : {
          simulations: [],
          primarySimulation: null,
          source: "simulation-engine-unavailable"
        };

    const insight = window.Ari.insightEngine
      ? window.Ari.insightEngine.generate({
          observation: state.observation,
          values: state.values,
          identity: state.identity,
          conflicts: state.conflicts,
          executive: state.executive,
          meaning,
          personModel,
          beliefModel,
          simulation,
          emotionalIntelligence,
          questionType: state.questionType
        })
      : state.earlyInsight;

    const metaAwareness = window.Ari.metaAwareness
      ? window.Ari.metaAwareness.reflect({
          insight,
          meaning,
          personModel,
          beliefModel,
          simulation,
          emotionalIntelligence,
          evidenceEvaluation: insight.evidenceEvaluation || null,
          questionType: state.questionType
        })
      : {
          primaryConclusion: insight.oneLineInsight || null,
          confidenceLevel: insight.calibratedConfidence || "low",
          confidenceScore: insight.confidenceScore || null,
          confidenceReason: "Meta awareness unavailable.",
          alternativeExplanation: insight.counterHypothesis?.explanation || null,
          evidenceStrength: insight.evidenceStrength || null,
          supportingEvidence: insight.supportingEvidence || [],
          contradictingEvidence: insight.contradictingEvidence || [],
          missingEvidence: insight.missingEvidence || [],
          uncertaintyAreas: [],
          knownUnknowns: [],
          recommendation: "continue_observing",
          source: "meta-awareness-unavailable"
        };

    const wisdom = window.Ari.wisdomEngine
      ? window.Ari.wisdomEngine.synthesize({
          executive: state.executive,
          insight,
          meaning,
          personModel,
          beliefModel,
          simulation,
          metaAwareness
        })
      : {
          wisdomPrinciple: null,
          wisdomTension: null,
          highestGood: null,
          longTermPriority: null,
          likelyRegret: null,
          archetype: null,
          wisdomStatement: null,
          confidence: "low",
          source: "wisdom-engine-unavailable"
        };

    const wisdomResolution = window.Ari.wisdomConflictResolver
      ? window.Ari.wisdomConflictResolver.resolve({
          wisdom,
          executive: state.executive,
          insight,
          meaning,
          personModel,
          beliefModel,
          simulation,
          metaAwareness
        })
      : {
          tension: null,
          resolutionMode: null,
          leadingGood: null,
          supportingGood: null,
          boundary: null,
          integration: null,
          resolvedStatement: null,
          confidence: "low",
          source: "wisdom-conflict-resolver-unavailable"
        };

    return {
      ...state,
      emotionalIntelligence,
      meaning,
      personModel,
      beliefModel,
      simulation,
      insight,
      metaAwareness,
      wisdom,
      wisdomResolution
    };
  }
};