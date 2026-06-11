// ari/core-spine/ari-core-perception.js
// Ari Core Perception Spine
// Purpose: Handle the first stage of Ari's processing.
// Answers: What is happening?
// V1.2: Adds safer defaults and prepares perception state for Rebirth downstream.

window.Ari = window.Ari || {};

window.Ari.corePerception = {
  version: "1.2.0",

  run(message = "", context = {}) {
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

    const lifeSignals = window.Ari.lifeSignalExtractor
      ? window.Ari.lifeSignalExtractor.extract(message, context)
      : {
          signals: [],
          signalNames: [],
          primarySignal: null,
          hasMajorLifeSignal: false,
          source: "life-signal-unavailable"
        };

    observation.lifeSignals = lifeSignals;

    const questionType = window.Ari.questionUnderstanding
      ? window.Ari.questionUnderstanding.classify(message)
      : "understanding";

    const values = window.Ari.valueEngine
      ? window.Ari.valueEngine.analyze({
          ...observation,
          lifeSignals
        })
      : {
          values: [],
          rankedValues: [],
          dominantValue: null,
          valueConflicts: [],
          source: "value-engine-unavailable"
        };

    const identity = window.Ari.identityEngine
      ? window.Ari.identityEngine.analyze(
          {
            ...observation,
            lifeSignals
          },
          values
        )
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
          observation: {
            ...observation,
            lifeSignals
          },
          lifeSignals,
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
          observation: {
            ...observation,
            lifeSignals
          },
          lifeSignals,
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
          observation: {
            ...observation,
            lifeSignals
          },
          lifeSignals,
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
          lifeSignals,
          questionType,
          values,
          identity,
          conflicts,
          executive,
          insight: earlyInsight
        })
      : {
          focusType: "unknown",
          focusReason: "Attention system unavailable.",
          primaryNeed: null,
          shouldRouteTo: null,
          emotionalSupportNeeded: false,
          memoryAttentionNeeded: false,
          guardianAttentionNeeded: false,
          source: "attention-unavailable"
        };

    const route = this.buildRoute(message, context, {
      questionType,
      observation,
      lifeSignals,
      values,
      identity,
      conflicts,
      executive,
      earlyInsight,
      attention
    });

    const emotion = window.Ari.emotionEngine
      ? window.Ari.emotionEngine.selectEmotion(message, route, {
          observation: {
            ...observation,
            lifeSignals
          },
          lifeSignals,
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

    return {
      message,
      context,
      questionType,
      observation,
      lifeSignals,
      values,
      identity,
      conflicts,
      executive,
      earlyInsight,
      attention,
      route,
      emotion,

      perceptionReady: true,
      perceptionSource: "ari-core-perception"
    };
  },

  buildRoute(message = "", context = {}, state = {}) {
    const {
      questionType,
      observation,
      lifeSignals,
      values,
      identity,
      conflicts,
      executive,
      earlyInsight,
      attention
    } = state;

    const route = window.Ari.router
      ? window.Ari.router.route(message, {
          ...context,
          questionType,
          observation: {
            ...observation,
            lifeSignals
          },
          lifeSignals,
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

    if (
      attention.focusType === "milestone" &&
      route.primaryOrgan !== "storykeeper"
    ) {
      supportSet.add("storykeeper");
    }

    route.supportingOrgans = [...supportSet].filter(
      (organ) => organ !== route.primaryOrgan
    );

    return route;
  }
};