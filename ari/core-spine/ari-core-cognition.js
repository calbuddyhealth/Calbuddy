// ari/core-spine/ari-core-cognition.js
// Ari Core Cognition Spine
// Purpose: Handle meaning, person model, belief model, simulation, insight, evidence, meta awareness, wisdom, regret, consequence, and underlying emotion.
// Answers: What does this mean, how strongly should Ari trust it, what matters most, and what deeper emotion may be underneath?
// V1.3

window.Ari = window.Ari || {};

window.Ari.coreCognition = {
  version: "1.3.0",

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

    const regret = window.Ari.regretEngine
      ? window.Ari.regretEngine.evaluate({
          wisdom,
          wisdomResolution,
          insight,
          meaning,
          personModel,
          beliefModel,
          simulation,
          executive: state.executive
        })
      : {
          regretType: null,
          regretStatement: null,
          regretIntensity: "low",
          preventableAction: null,
          source: "regret-engine-unavailable"
        };

    const longTermConsequence = window.Ari.longTermConsequenceEngine
      ? window.Ari.longTermConsequenceEngine.evaluate({
          insight,
          meaning,
          personModel,
          beliefModel,
          simulation,
          executive: state.executive,
          wisdom,
          regret
        })
      : {
          path: null,
          fiveYearConsequence: null,
          protectedFuture: null,
          riskIfIgnored: null,
          courseCorrection: null,
          confidence: "low",
          source: "long-term-consequence-engine-unavailable"
        };

    const wisdomSynthesis = window.Ari.wisdomSynthesizer
      ? window.Ari.wisdomSynthesizer.synthesize({
          insight,
          wisdom,
          wisdomResolution,
          consequences: longTermConsequence,
          personModel,
          beliefModel
        })
      : {
          synthesis: wisdom.wisdomStatement || insight.oneLineInsight || null,
          principles: [],
          principleStatements: [],
          primaryPrinciple: null,
          archetype: null,
          source: "wisdom-synthesizer-unavailable"
        };

    const wisdomQuestionRecovery = window.Ari.wisdomQuestionRecovery
      ? window.Ari.wisdomQuestionRecovery.recover({
          insight,
          metaAwareness,
          wisdom,
          wisdomResolution,
          meaning,
          personModel,
          beliefModel,
          emotionalIntelligence,
          executive: state.executive
        })
      : {
          shouldRecover: false,
          recoveryReason: null,
          primaryQuestion: null,
          supportingQuestions: [],
          source: "wisdom-question-recovery-unavailable"
        };

    const underlyingEmotion = window.Ari.underlyingEmotionEngine
      ? window.Ari.underlyingEmotionEngine.analyze({
          observation: state.observation,
          emotion: state.emotion,
          emotionalIntelligence,
          insight,
          meaning,
          personModel,
          beliefModel,
          simulation,
          wisdom
        })
      : {
          primaryUnderlyingEmotion: {
            name: "unclear",
            confidence: "low"
          },
          candidates: [],
          emotionalSource: null,
          protectiveStrategy: null,
          hiddenFear: null,
          vulnerableTruth: null,
          confidence: "low",
          source: "underlying-emotion-engine-unavailable"
        };

    const emotionRecoveryQuestions = window.Ari.emotionRecoveryQuestions
      ? window.Ari.emotionRecoveryQuestions.generate({
          underlyingEmotion,
          emotionalIntelligence,
          insight,
          meaning,
          personModel,
          beliefModel,
          wisdom
        })
      : {
          shouldAsk: false,
          questionType: null,
          primaryQuestion: null,
          supportingQuestions: [],
          source: "emotion-recovery-questions-unavailable"
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
      wisdomResolution,
      regret,
      longTermConsequence,
      wisdomSynthesis,
      wisdomQuestionRecovery,
      underlyingEmotion,
      emotionRecoveryQuestions
    };
  }
};