// ari/system/ari-core.js
// Ari Core Coordinator
// Purpose: Connect Loader, Observer, Question Understanding, Value, Identity, Conflict, Executive, Insight, Attention, Router, Emotion, Emotional Intelligence, Meaning, and Memory.

window.Ari = window.Ari || {};

window.Ari.core = {
  version: "1.6.0",

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

    const insight = window.Ari.insightEngine
      ? window.Ari.insightEngine.generate({
          observation,
          values,
          identity,
          conflicts,
          executive
        })
      : {
          hiddenConflict: null,
          avoidance: null,
          pattern: null,
          tradeoff: null,
          wisdom: null,
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
          insight
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
          insight,
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
          insight,
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
          insight
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
          insight,
          emotion,
          emotionalIntelligence
        })
      : {
          theme: null,
          meaning: null,
          humanTruth: null,
          source: "meaning-engine-unavailable"
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
          attention,
          route,
          emotion,
          emotionalIntelligence,
          meaning
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
      insight,
      attention,
      route,
      emotion,
      emotionalIntelligence,
      meaning,
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
    const attention = analysis.attention || {};
    const route = analysis.route || {};
    const emotion = analysis.emotion || {};
    const emotionalIntelligence = analysis.emotionalIntelligence || {};
    const meaning = analysis.meaning || {};
    const memory = analysis.memory || {};

    return {
      questionType: analysis.questionType || "unknown",

      focusType: attention.focusType || "unknown",
      focusReason: attention.focusReason || "No focus reason.",
      primaryNeed: attention.primaryNeed || null,

      dominantValue: values.dominantValue || null,
      dominantIdentity: identity.dominantIdentity?.name || null,
      dominantTheme: identity.dominantTheme || null,

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

      oneLineInsight: insight.oneLineInsight || null,
      hiddenConflict: insight.hiddenConflict?.name || null,
      avoidance: insight.avoidance?.name || null,
      pattern: insight.pattern?.name || null,
      tradeoff: insight.tradeoff?.name || null,

      meaningTheme:
        meaning.theme || null,
      meaningStatement:
        meaning.meaning || null,
      humanTruth:
        meaning.humanTruth || null,

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
      meaningSource: meaning.source || "unknown",
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