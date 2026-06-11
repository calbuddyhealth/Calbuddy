// ari/system/ari-core.js
// Ari Core Coordinator
// Purpose: Coordinate Ari's full cognitive organ system.
// V4.0: Integrates Insight Hypotheses, Counter-Hypotheses, Confidence Calibration, and Meta Awareness.

window.Ari = window.Ari || {};

window.Ari.core = {
  version: "4.0.0",

  async init() {
    if (window.Ari.loader && !window.Ari.loader.isLoaded()) {
      try {
        await window.Ari.loader.loadArchitecture();
      } catch (error) {
        console.warn("Ari architecture load skipped:", error.message);
      }
    }

    window.dispatchEvent(
      new CustomEvent("ari:coreReady", {
        detail: {
          version: this.version,
          loadedAt: new Date().toISOString()
        }
      })
    );

    console.log("Ari core ready.", this.version);
  },

  analyzeMessage(message = "", context = {}) {
    const observation = window.Ari.observerNetwork
      ? window.Ari.observerNetwork.observe(message, context)
      : {
          intent: "unknown",
          emotion: {},
          memory: {},
          goals: {},
          risk: {},
          source: "observer-unavailable"
        };

    const questionType = window.Ari.questionUnderstanding
      ? window.Ari.questionUnderstanding.classify(message)
      : "understanding";

    const values = window.Ari.valueEngine
      ? window.Ari.valueEngine.analyze(observation)
      : {
          values: [],
          rankedValues: [],
          dominantValue: null,
          valueConflicts: [],
          source: "value-engine-unavailable"
        };

    const identity = window.Ari.identityEngine
      ? window.Ari.identityEngine.analyze(observation, values)
      : {
          identities: [],
          identityHierarchy: {},
          identityConflicts: [],
          dominantIdentity: null,
          dominantTheme: "identity-unavailable",
          source: "identity-engine-unavailable"
        };

    const conflicts = window.Ari.conflictEngine
      ? window.Ari.conflictEngine.analyze({
          observation,
          values,
          identity
        })
      : {
          conflicts: [],
          primaryConflict: null,
          conflictIntensity: "none",
          competingFor: [],
          likelyCost: "Conflict engine unavailable.",
          needsExecutiveFunction: false,
          source: "conflict-engine-unavailable"
        };

    const executive = window.Ari.executiveFunction
      ? window.Ari.executiveFunction.decide({
          observation,
          values,
          identity,
          conflicts,
          emotion: observation.emotion
        })
      : {
          primaryPriority: null,
          secondaryPriorities: [],
          thingsToDelay: [],
          executiveDecision: "unavailable",
          recommendedFocus: null,
          source: "executive-function-unavailable"
        };

    const earlyInsight = window.Ari.insightEngine
      ? window.Ari.insightEngine.generate({
          observation,
          values,
          identity,
          conflicts,
          executive,
          questionType
        })
      : {
          pattern: { name: "unclear", confidence: "low" },
          hiddenConflict: { name: "unclear", confidence: "low" },
          avoidance: { name: "none_detected", confidence: "low" },
          tradeoff: { name: "none_detected", confidence: "low" },
          hiddenMotive: { name: "unclear", confidence: "low" },
          hypothesis: null,
          hypotheses: [],
          counterHypothesis: null,
          counterHypotheses: [],
          calibratedConfidence: "low",
          confidenceScore: null,
          oneLineInsight: null,
          source: "insight-engine-unavailable"
        };

    const attention = window.Ari.attentionSystem
      ? window.Ari.attentionSystem.prioritize({
          ...observation,
          questionType,
          values,
          identity,
          conflicts,
          executive,
          insight: earlyInsight
        })
      : {
          focusType: "unknown",
          shouldRouteTo: null,
          emotionalSupportNeeded: false,
          memoryAttentionNeeded: false,
          guardianAttentionNeeded: false,
          source: "attention-unavailable"
        };

    const route = window.Ari.router
      ? window.Ari.router.route(message, {
          ...context,
          questionType,
          observation,
          values,
          identity,
          conflicts,
          executive,
          insight: earlyInsight,
          attention
        })
      : {
          primaryOrgan: attention.shouldRouteTo || "companion",
          supportingOrgans: [],
          guardianRequired: Boolean(attention.guardianAttentionNeeded),
          confidence: "low",
          reason: "Router unavailable."
        };

    if (
      attention.shouldRouteTo &&
      route.primaryOrgan !== attention.shouldRouteTo
    ) {
      route.originalPrimaryOrgan = route.primaryOrgan;
      route.primaryOrgan = attention.shouldRouteTo;
      route.reason = `Attention override: ${attention.focusReason}`;
      route.confidence = "medium";
    }

    const supportSet = new Set(route.supportingOrgans || []);
    supportSet.delete(route.primaryOrgan);

    if (attention.emotionalSupportNeeded && route.primaryOrgan !== "companion") {
      supportSet.add("companion");
    }

    if (attention.memoryAttentionNeeded && route.primaryOrgan !== "memory") {
      supportSet.add("memory");
    }

    if (conflicts.needsExecutiveFunction && route.primaryOrgan !== "planner") {
      supportSet.add("planner");
    }

    if (attention.focusType === "milestone" && route.primaryOrgan !== "storykeeper") {
      supportSet.add("storykeeper");
    }

    route.supportingOrgans = [...supportSet].filter(
      (organ) => organ !== route.primaryOrgan
    );

    const emotion = window.Ari.emotionEngine
      ? window.Ari.emotionEngine.selectEmotion(message, route, {
          observation,
          values,
          identity,
          conflicts,
          executive,
          insight: earlyInsight,
          attention
        })
      : {
          primaryEmotion: "curiosity",
          secondaryEmotions: [],
          balance: { brain: 70, heart: 20, soul: 10 },
          source: "emotion-engine-unavailable"
        };

    const emotionalIntelligence = window.Ari.emotionalIntelligence
      ? window.Ari.emotionalIntelligence.analyze({
          observation,
          values,
          identity,
          conflicts,
          executive,
          insight: earlyInsight
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
          observation,
          questionType,
          values,
          identity,
          conflicts,
          executive,
          insight: earlyInsight,
          emotion,
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
          observation,
          values,
          identity,
          conflicts,
          insight: earlyInsight,
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
          observation,
          values,
          identity,
          conflicts,
          insight: earlyInsight,
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
          values,
          identity,
          conflicts,
          executive,
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
          observation,
          values,
          identity,
          conflicts,
          executive,
          meaning,
          personModel,
          beliefModel,
          simulation,
          emotionalIntelligence,
          questionType
        })
      : earlyInsight;

    const metaAwareness = window.Ari.metaAwareness
      ? window.Ari.metaAwareness.reflect({
          insight,
          meaning,
          personModel,
          beliefModel,
          simulation,
          emotionalIntelligence,
          questionType
        })
      : {
          primaryConclusion: insight.oneLineInsight || null,
          confidenceLevel: insight.calibratedConfidence || "low",
          confidenceScore: insight.confidenceScore || null,
          confidenceReason: "Meta awareness unavailable.",
          alternativeExplanation:
            insight.counterHypothesis?.explanation || null,
          uncertaintyAreas: [],
          knownUnknowns: [],
          recommendation: "continue_observing",
          source: "meta-awareness-unavailable"
        };

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
          message,
          context,
          questionType,
          observation,
          values,
          identity,
          conflicts,
          executive,
          earlyInsight,
          insight,
          metaAwareness,
          attention,
          route,
          emotion,
          emotionalIntelligence,
          meaning,
          personModel,
          beliefModel,
          simulation,
          self,
          selfValues,
          constitution
        })
      : {
          stance: { name: route.primaryOrgan || "steady_companion" },
          leadPrinciple: null,
          leadValue: null,
          approach: null,
          confidence: "low",
          source: "self-reflection-unavailable"
        };

    const voice = window.Ari.voiceEngine
      ? window.Ari.voiceEngine.chooseVoice({
          analysis: {
            message,
            context,
            questionType,
            observation,
            values,
            identity,
            conflicts,
            executive,
            earlyInsight,
            insight,
            metaAwareness,
            attention,
            route,
            emotion,
            emotionalIntelligence,
            meaning,
            personModel,
            beliefModel,
            simulation,
            self,
            selfValues,
            constitution,
            selfReflection
          },
          selfReflection
        })
      : {
          stance: selfReflection.stance?.name || route.primaryOrgan || "steady_companion",
          openingStyle: "steady_observation",
          confidenceStyle: { name: "tentative", prefix: "" },
          confidence: metaAwareness.confidenceLevel || "low",
          warmth: 65,
          challenge: 50,
          depth: 45,
          structure: ["observation", "interpretation", "next_step"],
          rhythm: "short_clear",
          source: "voice-engine-unavailable"
        };

    const memory = window.Ari.memoryEngine
      ? window.Ari.memoryEngine.classify(message, {
          ...context,
          questionType,
          observation,
          values,
          identity,
          conflicts,
          executive,
          insight,
          metaAwareness,
          attention,
          route,
          emotion,
          emotionalIntelligence,
          meaning,
          personModel,
          beliefModel,
          simulation,
          self,
          selfValues,
          constitution,
          selfReflection,
          voice
        })
      : {
          shouldRemember: false,
          memoryType: "temporary",
          importance: "temporary",
          source: "memory-engine-unavailable"
        };

    return {
      message,
      context,
      questionType,
      observation,
      values,
      identity,
      conflicts,
      executive,
      earlyInsight,
      insight,
      metaAwareness,
      attention,
      route,
      emotion,
      emotionalIntelligence,
      meaning,
      personModel,
      beliefModel,
      simulation,
      self,
      selfValues,
      constitution,
      selfReflection,
      voice,
      memory,
      analyzedAt: new Date().toISOString()
    };
  },

  createSystemSummary(analysis = {}) {
    const observation = analysis.observation || {};
    const values = analysis.values || {};
    const identity = analysis.identity || {};
    const conflicts = analysis.conflicts || {};
    const executive = analysis.executive || {};
    const insight = analysis.insight || {};
    const metaAwareness = analysis.metaAwareness || {};
    const attention = analysis.attention || {};
    const route = analysis.route || {};
    const emotion = analysis.emotion || {};
    const emotionalIntelligence = analysis.emotionalIntelligence || {};
    const meaning = analysis.meaning || {};
    const personModel = analysis.personModel || {};
    const beliefModel = analysis.beliefModel || {};
    const simulation = analysis.simulation || {};
    const selfReflection = analysis.selfReflection || {};
    const voice = analysis.voice || {};
    const memory = analysis.memory || {};

    return {
      questionType: analysis.questionType || "unknown",

      focusType: attention.focusType || "unknown",
      focusReason: attention.focusReason || "No focus reason.",
      primaryNeed: attention.primaryNeed || null,

      dominantValue: values.dominantValue || null,
      dominantIdentity: identity.dominantIdentity?.name || null,
      dominantIdentityConfidence: identity.dominantIdentity?.confidence || null,
      dominantTheme: identity.dominantTheme || null,
      identityHierarchy: {
        primary: identity.identityHierarchy?.primary?.name || null,
        secondary:
          identity.identityHierarchy?.secondary?.map((item) => item.name) || [],
        supporting:
          identity.identityHierarchy?.supporting?.map((item) => item.name) || [],
        seasonalPrimaryReason:
          identity.identityHierarchy?.seasonalPrimaryReason || null
      },

      primaryConflict: conflicts.primaryConflict?.name || null,
      conflictIntensity: conflicts.conflictIntensity || "none",
      competingFor: conflicts.competingFor || [],
      needsExecutiveFunction: Boolean(conflicts.needsExecutiveFunction),

      primaryPriority: executive.primaryPriority?.name || null,
      secondaryPriorities:
        executive.secondaryPriorities?.map((item) => item.name) || [],
      thingsToDelay:
        executive.thingsToDelay?.map((item) => item.name) || [],
      executiveDecision: executive.executiveDecision || null,
      recommendedFocus: executive.recommendedFocus || null,

      pattern: insight.pattern?.name || null,
      patternConfidence: insight.pattern?.confidence || null,
      hiddenConflict: insight.hiddenConflict?.name || null,
      hiddenConflictConfidence: insight.hiddenConflict?.confidence || null,
      avoidance: insight.avoidance?.name || null,
      avoidanceConfidence: insight.avoidance?.confidence || null,
      tradeoff: insight.tradeoff?.name || null,
      tradeoffConfidence: insight.tradeoff?.confidence || null,
      hiddenMotive: insight.hiddenMotive?.name || null,
      hiddenMotiveConfidence: insight.hiddenMotive?.confidence || null,

      hypothesis: insight.hypothesis?.name || null,
      hypothesisConfidence: insight.hypothesis?.confidence || null,
      hypothesisExplanation: insight.hypothesis?.explanation || null,
      hypotheses:
        insight.hypotheses?.map((item) => item.name) || [],

      counterHypothesis: insight.counterHypothesis?.name || null,
      counterHypothesisConfidence:
        insight.counterHypothesis?.confidence || null,
      counterHypothesisExplanation:
        insight.counterHypothesis?.explanation || null,
      counterHypotheses:
        insight.counterHypotheses?.map((item) => item.name) || [],

      calibratedConfidence: insight.calibratedConfidence || null,
      confidenceScore: insight.confidenceScore || null,
      confidenceReason: insight.confidenceReason || null,
      shouldSpeakHypothesis: Boolean(insight.shouldSpeakHypothesis),

      oneLineInsight: insight.oneLineInsight || null,

      metaConclusion: metaAwareness.primaryConclusion || null,
      metaConfidence: metaAwareness.confidenceLevel || null,
      metaConfidenceScore: metaAwareness.confidenceScore || null,
      metaConfidenceReason: metaAwareness.confidenceReason || null,
      alternativeExplanation:
        metaAwareness.alternativeExplanation || null,
      uncertaintyAreas: metaAwareness.uncertaintyAreas || [],
      knownUnknowns: metaAwareness.knownUnknowns || [],
      metaRecommendation: metaAwareness.recommendation || null,

      meaningTheme: meaning.theme || null,
      meaningConfidence: meaning.confidence || null,
      meaningReason: meaning.reason || null,
      meaningStatement: meaning.meaning || null,
      humanTruth: meaning.humanTruth || null,

      personLifeChapter: personModel.lifeChapter?.name || null,
      personLifeChapterConfidence: personModel.lifeChapter?.confidence || null,
      personPrimaryRole: personModel.snapshot?.primaryRole || null,
      personMainPressure: personModel.snapshot?.mainPressure || null,
      personMainNeed: personModel.snapshot?.mainNeed || null,
      personRecurringPattern: personModel.snapshot?.recurringPattern || null,

      primaryBelief: beliefModel.primaryBelief?.name || null,
      primaryBeliefConfidence: beliefModel.primaryBelief?.confidence || null,
      beliefSummary: beliefModel.beliefSummary || null,

      primarySimulation: simulation.primarySimulation?.name || null,
      simulationTheme: simulation.primarySimulation?.theme || null,
      likelyRegret: simulation.primarySimulation?.likelyRegret || null,

      selfStance: selfReflection.stance?.name || null,
      selfLeadPrinciple: selfReflection.leadPrinciple || null,
      selfLeadValue: selfReflection.leadValue || null,
      selfApproach: selfReflection.approach || null,
      selfReflectionConfidence: selfReflection.confidence || null,

      voiceStance: voice.stance || null,
      voiceOpeningStyle: voice.openingStyle || null,
      voiceConfidence: voice.confidence || null,
      voiceConfidenceStyle: voice.confidenceStyle?.name || null,
      voiceWarmth: voice.warmth || null,
      voiceChallenge: voice.challenge || null,
      voiceDepth: voice.depth || null,
      voiceStructure: voice.structure || [],
      voiceRhythm: voice.rhythm || null,

      primaryOrgan: route.primaryOrgan || "companion",
      supportingOrgans: route.supportingOrgans || [],

      guardianRequired: Boolean(
        route.guardianRequired || attention.guardianAttentionNeeded
      ),

      primaryEmotion: emotion.primaryEmotion || "curiosity",
      secondaryEmotions: emotion.secondaryEmotions || [],
      balance: emotion.balance || { brain: 70, heart: 20, soul: 10 },

      surfaceEmotion:
        emotionalIntelligence.surfaceEmotion?.name || null,
      underlyingEmotion:
        emotionalIntelligence.underlyingEmotion?.name || null,
      emotionalTension:
        emotionalIntelligence.emotionalTension?.level || null,
      rootNeed:
        emotionalIntelligence.rootNeed?.name || null,
      protecting:
        emotionalIntelligence.protecting?.name || null,
      regulationStrategy:
        emotionalIntelligence.regulation?.strategy || null,

      memoryCandidate: memory.shouldRemember ? memory : null,

      observationSource: observation.source || "unknown",
      valueSource: values.source || "unknown",
      identitySource: identity.source || "unknown",
      conflictSource: conflicts.source || "unknown",
      executiveSource: executive.source || "unknown",
      insightSource: insight.source || "unknown",
      metaAwarenessSource: metaAwareness.source || "unknown",
      meaningSource: meaning.source || "unknown",
      personModelSource: personModel.source || "unknown",
      beliefSource: beliefModel.source || "unknown",
      simulationSource: simulation.source || "unknown",
      selfReflectionSource: selfReflection.source || "unknown",
      voiceSource: voice.source || "unknown",
      attentionSource: attention.source || "unknown",
      emotionSource: emotion.source || "unknown",
      emotionalIntelligenceSource:
        emotionalIntelligence.source || "unknown",
      memorySource: memory.source || "unknown",

      authorityHierarchy: window.Ari.authority
        ? window.Ari.authority.hierarchy
        : []
    };
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.Ari.core.init();
});