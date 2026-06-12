// ari/meaning-engine/ari-meaning-engine.js
// Ari Meaning Engine
// Purpose: Combine values, identity, conflict, insight, emotion, wisdom, salience, and life signals into one meaning summary.
// V1.3 Rebirth Compatible
// Fixes:
// - Adds organism/body stabilization guard.
// - Prevents meaning-making when body survival functions need stabilization.
// - Keeps meaning diagnostics without turning unknowns into spoken content.

window.Ari = window.Ari || {};

window.Ari.meaningEngine = {
  version: "1.3.0",

  synthesize(input = {}) {
    const {
      observation = {},
      questionType = "understanding",
      values = {},
      identity = {},
      conflicts = {},
      executive = {},
      insight = {},
      emotion = {},
      emotionalIntelligence = {},

      lifeSignals = {},
      lifeSignalWeighting = {},
      signals = {},
      salience = {},
      wisdom = {},
      wisdomResolution = {},
      regret = {},
      longTermConsequence = {},
      organism = {}
    } = input;

    // ===================================
    // ORGANISM / BODY STABILIZATION GUARD
    // ===================================
    const organismNeedsStabilization =
      organism.organismNeedsStabilization === true ||
      organism.organismRecommendedMode === "stabilize_body_first" ||
      organism.organismRecommendedMode === "restore_basic_function" ||
      organism.organismUrgency?.level === "high" ||
      organism.organismUrgency?.level === "critical" ||
      input.primaryHumanNeed === "body" ||
      input.needResponseMode === "stabilize_body_first";

    if (organismNeedsStabilization) {
      return {
        theme: "body_stabilization",
        confidence: "high",
        reason: "A basic organism function needs stabilization before meaning-making.",

        meaning: null,
        humanTruth: "Stability comes before interpretation.",

        dominantValue: values.dominantValue || null,
        dominantIdentity: identity.dominantIdentity?.name || null,
        primaryConflict: null,
        primaryEmotion: emotion.primaryEmotion || null,
        underlyingEmotion: emotionalIntelligence.underlyingEmotion?.name || null,
        rootNeed: emotionalIntelligence.rootNeed?.name || null,
        protecting: emotionalIntelligence.protecting?.name || null,

        pattern: null,
        hiddenConflict: null,
        tradeoff: null,
        hypothesis: null,
        counterHypothesis: null,

        primaryLifeSignal: null,
        primaryWeightedLifeSignal: null,
        lifePriorityClass: "none",
        strongestSignal: signals.strongestSignalName || null,
        strongestSignalCategory: signals.strongestSignalCategory || null,
        primarySalienceName: salience.primarySalienceName || null,
        primarySalienceCategory: salience.primarySalienceCategory || null,

        wisdomTension: null,
        highestGood: wisdom.highestGood || null,
        wisdomLeadingGood: null,
        wisdomSupportingGood: null,
        wisdomResolutionMode: null,

        rankedMeaningCandidates: [
          {
            name: "body_stabilization",
            score: 100,
            priority: 100,
            finalScore: 125,
            confidence: "high",
            reasons: [
              "Ari detected that body stability or organism function should lead before meaning-making."
            ]
          }
        ],

        source: "ari-meaning-engine"
      };
    }

    const dominantValue = values.dominantValue || null;
    const dominantIdentity = identity.dominantIdentity?.name || null;
    const primaryConflict = conflicts.primaryConflict?.name || null;

    const primaryEmotion = emotion.primaryEmotion || null;
    const underlyingEmotion =
      emotionalIntelligence.underlyingEmotion?.name || null;
    const rootNeed = emotionalIntelligence.rootNeed?.name || null;
    const protecting = emotionalIntelligence.protecting?.name || null;

    const pattern = insight.pattern?.name || null;
    const hiddenConflict = insight.hiddenConflict?.name || null;
    const tradeoff = insight.tradeoff?.name || null;
    const hypothesis = insight.hypothesis?.name || null;
    const counterHypothesis = insight.counterHypothesis?.name || null;

    const lifeSignalNames = Array.isArray(lifeSignals.signalNames)
      ? lifeSignals.signalNames
      : [];

    const primaryLifeSignal = lifeSignals.primarySignal?.name || null;

    const primaryWeightedLifeSignal =
      lifeSignalWeighting.primaryWeightedLifeSignalName || null;

    const lifePriorityClass =
      lifeSignalWeighting.lifePriorityClass || "none";

    const rankedLifeSignals = Array.isArray(lifeSignalWeighting.rankedLifeSignals)
      ? lifeSignalWeighting.rankedLifeSignals
      : [];

    const strongestSignal = signals.strongestSignalName || null;
    const strongestSignalCategory = signals.strongestSignalCategory || null;

    const primarySalienceName = salience.primarySalienceName || null;
    const primarySalienceCategory = salience.primarySalienceCategory || null;
    const salienceRecommendedLead = salience.recommendedLead || null;
    const salienceRecommendedMode = salience.recommendedMode || null;

    const wisdomTension = wisdom.wisdomTension?.name || null;
    const highestGood = wisdom.highestGood || null;
    const wisdomPrinciple = wisdom.wisdomPrinciple || null;
    const wisdomStatement = wisdom.wisdomStatement || null;
    const wisdomConfidence = wisdom.confidence || null;

    const wisdomLeadingGood = wisdomResolution.leadingGood || null;
    const wisdomSupportingGood = wisdomResolution.supportingGood || null;
    const wisdomResolvedStatement = wisdomResolution.resolvedStatement || null;
    const wisdomResolutionMode = wisdomResolution.resolutionMode || null;

    const regretType = regret.regretType || null;
    const longTermPath = longTermConsequence.path || null;

    const theme = this.detectTheme({
      observation,
      questionType,
      dominantValue,
      dominantIdentity,
      primaryConflict,
      primaryEmotion,
      underlyingEmotion,
      rootNeed,
      protecting,
      pattern,
      hiddenConflict,
      tradeoff,
      hypothesis,
      counterHypothesis,
      lifeSignalNames,
      primaryLifeSignal,
      primaryWeightedLifeSignal,
      lifePriorityClass,
      rankedLifeSignals,
      strongestSignal,
      strongestSignalCategory,
      primarySalienceName,
      primarySalienceCategory,
      salienceRecommendedLead,
      salienceRecommendedMode,
      wisdomTension,
      highestGood,
      wisdomPrinciple,
      wisdomStatement,
      wisdomConfidence,
      wisdomLeadingGood,
      wisdomSupportingGood,
      wisdomResolvedStatement,
      wisdomResolutionMode,
      regretType,
      longTermPath
    });

    const meaning = this.createMeaningStatement({ theme });
    const humanTruth = this.createHumanTruth({
      theme,
      executive,
      insight,
      emotionalIntelligence,
      wisdom,
      wisdomResolution
    });

    return {
      theme: theme.name,
      confidence: theme.confidence,
      reason: theme.reason,
      meaning,
      humanTruth,
      dominantValue,
      dominantIdentity,
      primaryConflict,
      primaryEmotion,
      underlyingEmotion,
      rootNeed,
      protecting,
      pattern,
      hiddenConflict,
      tradeoff,
      hypothesis,
      counterHypothesis,
      primaryLifeSignal,
      primaryWeightedLifeSignal,
      lifePriorityClass,
      strongestSignal,
      strongestSignalCategory,
      primarySalienceName,
      primarySalienceCategory,
      wisdomTension,
      highestGood,
      wisdomLeadingGood,
      wisdomSupportingGood,
      wisdomResolutionMode,
      rankedMeaningCandidates: theme.rankedCandidates || [],
      source: "ari-meaning-engine"
    };
  },

  detectTheme(input = {}) {
    const {
      observation = {},
      questionType = "",
      dominantValue = "",
      dominantIdentity = "",
      primaryConflict = "",
      underlyingEmotion = "",
      rootNeed = "",
      protecting = "",
      pattern = "",
      hiddenConflict = "",
      tradeoff = "",
      hypothesis = "",
      lifeSignalNames = [],
      primaryLifeSignal = "",
      primaryWeightedLifeSignal = "",
      lifePriorityClass = "none",
      rankedLifeSignals = [],
      strongestSignal = "",
      strongestSignalCategory = "",
      primarySalienceName = "",
      primarySalienceCategory = "",
      salienceRecommendedLead = "",
      wisdomTension = "",
      highestGood = "",
      wisdomLeadingGood = "",
      regretType = "",
      longTermPath = ""
    } = input;

    const life = observation.lifeTransitions || {};
    const humanPatterns = observation.humanPatterns || {};
    const candidates = [];

    const allSignals = this.uniqueSignals([
      ...lifeSignalNames,
      primaryLifeSignal,
      primaryWeightedLifeSignal,
      strongestSignal,
      primarySalienceName,
      dominantValue,
      dominantIdentity,
      primaryConflict,
      underlyingEmotion,
      rootNeed,
      protecting,
      pattern,
      hiddenConflict,
      tradeoff,
      hypothesis,
      wisdomTension,
      highestGood,
      wisdomLeadingGood,
      regretType,
      longTermPath,
      ...rankedLifeSignals.map(item => item?.name)
    ]);

    const hasSignal = (...needles) =>
      allSignals.some(signal => needles.some(needle => signal.includes(needle)));

    const addCandidate = (name, score, confidence, reason, priority = 50) => {
      const existing = candidates.find(item => item.name === name);

      if (existing) {
        existing.score += score;
        existing.priority = Math.max(existing.priority, priority);
        existing.confidence = this.mergeConfidence(existing.confidence, confidence);
        if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
        return;
      }

      candidates.push({ name, score, confidence, priority, reasons: [reason] });
    };

    if (questionType === "meaning") {
      addCandidate("life_season", 60, "medium", "User is asking about meaning.", 70);
    }

    if (
      life.fatherhood ||
      life.pregnancy ||
      hasSignal("fatherhood", "expectant", "family_transition", "protect_family", "secure_family", "presence")
    ) {
      addCandidate("family_transition", lifePriorityClass === "major_life_priority" ? 90 : 70, "high", "Family or parenthood transition signals are active.", 95);
    }

    if (
      wisdomTension === "presence_vs_achievement" ||
      hasSignal("presence_vs_achievement", "presence_loss", "missing_irreplaceable_presence")
    ) {
      addCandidate("presence_vs_achievement", 88, "high", "Presence and achievement are competing for priority.", 90);
    }

    if (
      hasSignal("purpose_signal", "creative_mission", "builder_development", "fear_of_betraying_purpose", "purpose_relationship_split")
    ) {
      addCandidate("purpose_chapter", lifePriorityClass === "major_life_priority" ? 88 : 72, "high", "Purpose or builder signals are active.", 88);
    }

    if (
      hiddenConflict === "family_vs_purpose" ||
      wisdomTension === "family_vs_purpose" ||
      hasSignal("family_vs_purpose", "turning_purpose_against_love")
    ) {
      addCandidate("family_vs_purpose", 90, "high", "Family and purpose are both active.", 92);
    }

    if (
      hasSignal("identity_transition", "emerging-self", "identity_overload") ||
      humanPatterns.roleConflict
    ) {
      addCandidate("identity_transition", lifePriorityClass === "major_life_priority" ? 82 : 65, "high", "Identity transition signals are active.", 82);
    }

    if (pattern === "too_many_primary_roles" || hiddenConflict === "identity_overload") {
      addCandidate("identity_overload", 85, "high", "Multiple identities are competing to lead.", 86);
    }

    if (
      primaryConflict === "provider_vs_present_parent" ||
      hiddenConflict === "provider_vs_presence"
    ) {
      addCandidate("presence_vs_provision", 86, "high", "Providing and presence are in tension.", 86);
    }

    if (dominantValue === "responsibility" && dominantIdentity === "provider") {
      addCandidate("responsibility_burden", 70, "medium", "Responsibility and provider identity are active.", 70);
    }

    if (tradeoff === "chosen_sacrifice" || humanPatterns.opportunityCost) {
      addCandidate("necessary_sacrifice", 68, "medium", "A meaningful tradeoff is present.", 68);
    }

    if (
      questionType === "emotional" ||
      strongestSignalCategory === "underlying_emotion" ||
      salienceRecommendedLead === "emotion_depth"
    ) {
      addCandidate("emotional_processing", 62, "medium", "Emotional experience is active.", 60);
    }

    if (questionType === "insight") {
      addCandidate("search_for_meaning", 58, "medium", "User is asking for insight.", 55);
    }

    if (questionType === "teaching") {
      addCandidate("teaching_meaning", 52, "medium", "User is asking for explanation.", 50);
    }

    if (candidates.length === 0) {
      addCandidate("general_understanding", 30, "low", "Not enough strong signals.", 10);
    }

    candidates.forEach(item => {
      item.score = Math.min(item.score, 100);
      item.finalScore = item.score + item.priority * 0.25;
    });

    candidates.sort((a, b) => b.finalScore - a.finalScore);

    const winner = candidates[0];

    return {
      name: winner.name,
      confidence: winner.confidence,
      reason: winner.reasons.join(" "),
      rankedCandidates: candidates
    };
  },

  uniqueSignals(items = []) {
    return [...new Set(items.filter(Boolean).map(item => String(item).toLowerCase().trim()))];
  },

  mergeConfidence(current = "medium", incoming = "medium") {
    const rank = { unknown: 0, low: 1, medium: 2, high: 3 };
    return rank[incoming] > rank[current] ? incoming : current;
  },

  createMeaningStatement({ theme = {} } = {}) {
    const statements = {
      body_stabilization: null,
      identity_overload: "This situation is about too many meaningful identities competing to lead at the same time.",
      identity_transition: "This season is about an identity changing shape before the next version is fully clear.",
      family_vs_purpose: "This situation is about protecting family without feeling like purpose is being abandoned.",
      presence_vs_achievement: "This situation is about protecting irreplaceable presence from being consumed by achievement.",
      presence_vs_provision: "This situation is about the difference between providing more and being present more.",
      fatherhood_responsibility: "This situation is about the weight of becoming someone another person can depend on.",
      necessary_sacrifice: "This situation is about accepting that protecting one meaningful thing requires slowing another.",
      family_transition: "This season is about shifting from achievement-centered success toward relationship-centered success.",
      fatherhood_transition: "This season is about becoming someone who can be present, steady, and depended on.",
      purpose_chapter: "This season is about keeping purpose alive without letting it consume the life it is supposed to serve.",
      responsibility_burden: "This situation is about carrying responsibility without letting responsibility consume the person carrying it.",
      life_season: "This situation is less about solving a problem and more about understanding what this chapter of life is trying to develop in you.",
      search_for_meaning: "This situation is asking for meaning, not just advice.",
      emotional_processing: "This situation is about understanding the feeling underneath the question.",
      teaching_meaning: "This situation is asking Ari to explain the pattern clearly enough to be understood.",
      general_understanding: "This situation needs more context before Ari can name the meaning clearly."
    };

    return statements[theme.name] ?? statements.general_understanding;
  },

  createHumanTruth({ theme = {}, insight = {}, wisdom = {}, wisdomResolution = {} } = {}) {
    if (theme.name === "body_stabilization") {
      return "Stability comes before interpretation.";
    }

    if (insight.oneLineInsight && theme.confidence === "high") {
      return insight.oneLineInsight;
    }

    if (wisdomResolution.resolvedStatement && theme.confidence === "high") {
      return wisdomResolution.resolvedStatement;
    }

    if (wisdom.wisdomStatement && theme.confidence === "high") {
      return wisdom.wisdomStatement;
    }

    const truths = {
      identity_overload: "The problem is not that everything matters. The problem is that everything is trying to matter first.",
      identity_transition: "You may not be lost. You may be between versions of yourself.",
      family_vs_purpose: "Protecting family does not kill purpose. It forces purpose to become disciplined.",
      presence_vs_achievement: "Some milestones can wait. Some moments cannot.",
      presence_vs_provision: "More provision is not always the same as more presence.",
      fatherhood_responsibility: "The heaviness is not proof you are unready. It is proof you understand the weight of the role.",
      necessary_sacrifice: "Every serious yes requires a serious no.",
      family_transition: "The next chapter is not asking you to accomplish more. It is asking you to be more present.",
      fatherhood_transition: "Fatherhood is not asking you to become perfect. It is asking you to become steady.",
      purpose_chapter: "Purpose is not destroyed by slowing down. It is distorted when it stops serving life.",
      responsibility_burden: "Responsibility is good, but it becomes dangerous when you never let yourself set it down.",
      life_season: "Life chapters often ask us to become someone new before they reveal why the change was necessary.",
      search_for_meaning: "The question is not only what to do. The question is what this moment is trying to reveal.",
      emotional_processing: "The feeling is not noise. It is information.",
      teaching_meaning: "A good explanation should make the pattern easier to see, not heavier to carry.",
      general_understanding: "Ari needs more context before naming this cleanly."
    };

    return truths[theme.name] || truths.general_understanding;
  }
};