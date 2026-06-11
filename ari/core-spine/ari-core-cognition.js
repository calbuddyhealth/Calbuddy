// ari/core-spine/ari-core-cognition.js
// Ari Core Cognition Spine
// Purpose: Handle meaning, person model, belief model, simulation, insight, evidence, meta awareness, wisdom, regret, consequence, underlying emotion, and signal activation.
// Answers: What does this mean, how strongly should Ari trust it, what matters most, and what signal should lead?
// V1.4

window.Ari = window.Ari || {};

window.Ari.coreCognition = {
  version: "1.4.0",

  run(state = {}) {
    const emotionalIntelligence = window.Ari.emotionalIntelligence
      ? window.Ari.emotionalIntelligence.analyze({
          observation: state.observation,
          values: state.values,
          identity: state.identity,
          conflicts: state.conflicts,
          executive: state.executive,
          insight: state.earlyInsight,
          lifeSignals: state.lifeSignals
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
          emotionalIntelligence,
          lifeSignals: state.lifeSignals
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
          meaning,
          lifeSignals: state.lifeSignals
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
          personModel,
          lifeSignals: state.lifeSignals
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
          beliefModel,
          lifeSignals: state.lifeSignals
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
          questionType: state.questionType,
          lifeSignals: state.lifeSignals
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
          questionType: state.questionType,
          lifeSignals: state.lifeSignals
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
          metaAwareness,
          lifeSignals: state.lifeSignals
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
          metaAwareness,
          lifeSignals: state.lifeSignals
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
          executive: state.executive,
          lifeSignals: state.lifeSignals
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
          regret,
          lifeSignals: state.lifeSignals
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
          beliefModel,
          lifeSignals: state.lifeSignals
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
          executive: state.executive,
          lifeSignals: state.lifeSignals
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
          wisdom,
          lifeSignals: state.lifeSignals
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
          wisdom,
          lifeSignals: state.lifeSignals
        })
      : {
          shouldAsk: false,
          questionType: null,
          primaryQuestion: null,
          supportingQuestions: [],
          source: "emotion-recovery-questions-unavailable"
        };

    const signals = window.Ari.signalSystem
      ? window.Ari.signalSystem.analyze({
          lifeSignals: state.lifeSignals,
          observation: state.observation,
          values: state.values,
          identity: state.identity,
          conflicts: state.conflicts,
          executive: state.executive,
          emotion: state.emotion,
          insight,
          meaning,
          personModel,
          beliefModel,
          wisdom,
          wisdomResolution,
          regret,
          longTermConsequence,
          underlyingEmotion
        })
      : {
          signals: [],
          rankedSignals: [],
          strongestSignal: null,
          strongestSignalName: null,
          strongestSignalCategory: null,
          strongestSignalStrength: 0,
          recommendedLanguageLead: null,
          recommendedOrgans: [],
          source: "signal-system-unavailable"
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
      emotionRecoveryQuestions,
      signals
    };
  }
};