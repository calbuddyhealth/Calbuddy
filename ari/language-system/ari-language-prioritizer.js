// ari/language-system/ari-language-prioritizer.js
// Ari Language Prioritizer
// Purpose: Decide what Ari should say first based on salience, signals, wisdom, emotion, insight, and recovery.
// V1.1

window.Ari = window.Ari || {};

window.Ari.languagePrioritizer = {
  version: "1.1.0",

  prioritize(analysis = {}) {
    const salience = analysis.salience || {};
    const signals = analysis.signals || {};
    const insight = analysis.insight || {};
    const recovery = analysis.wisdomQuestionRecovery || {};

    if (
      recovery.shouldRecover &&
      insight.evidenceStrength === "none"
    ) {
      return this.recoveryPlan(analysis);
    }

    const lead =
      salience.shouldOverrideLanguage && salience.recommendedLead
        ? salience.recommendedLead
        : signals.recommendedLanguageLead ||
          salience.recommendedLead ||
          analysis.questionType ||
          "insight";

    if (lead === "life_chapter") return this.lifeChapterPlan(analysis);
    if (lead === "emotion_depth") return this.emotionDepthPlan(analysis);
    if (lead === "wisdom" || lead === "executive_wisdom") return this.wisdomPlan(analysis);
    if (lead === "regret") return this.regretPlan(analysis);
    if (lead === "consequence") return this.consequencePlan(analysis);
    if (lead === "conflict" || lead === "tradeoff") return this.conflictPlan(analysis);
    if (lead === "belief") return this.beliefPlan(analysis);
    if (lead === "planning") return this.planningPlan(analysis);
    if (lead === "building") return this.buildingPlan(analysis);
    if (lead === "decision") return this.wisdomPlan(analysis);
    if (lead === "emotional") return this.emotionDepthPlan(analysis);
    if (lead === "meaning") return this.lifeChapterPlan(analysis);

    return this.defaultPlan(analysis);
  },

  recoveryPlan(analysis = {}) {
    const recovery = analysis.wisdomQuestionRecovery || {};
    const emotionRecovery = analysis.emotionRecoveryQuestions || {};

    return {
      leadType: "recovery",
      openingIntent: "humble_uncertainty",
      primaryLine:
        "I do not have enough evidence to be confident yet, but something important is present.",
      secondaryLines: [
        recovery.primaryQuestion ||
          emotionRecovery.primaryQuestion ||
          "What part of this feels most important but least understood?"
      ],
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  lifeChapterPlan(analysis = {}) {
    const personModel = analysis.personModel || {};
    const wisdom = analysis.wisdom || {};
    const resolution = analysis.wisdomResolution || {};
    const consequence = analysis.longTermConsequence || {};
    const h = this.humanizers();

    const chapter = personModel.lifeChapter?.name;
    const lines = [];

    if (chapter && chapter !== "unclear") {
      lines.push(h.lifeChapter(chapter));
    }

    if (wisdom.wisdomPrinciple) lines.push(wisdom.wisdomPrinciple);
    if (resolution.boundary) lines.push(resolution.boundary);
    if (consequence.courseCorrection) lines.push(consequence.courseCorrection);

    return {
      leadType: "life_chapter",
      openingIntent: "chapter_recognition",
      primaryLine: lines[0] || "This looks like a life chapter question.",
      secondaryLines: lines.slice(1),
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  emotionDepthPlan(analysis = {}) {
    const emotionDepth = analysis.underlyingEmotion || {};
    const wisdom = analysis.wisdom || {};
    const emotionRecovery = analysis.emotionRecoveryQuestions || {};
    const h = this.humanizers();

    const primary = emotionDepth.primaryUnderlyingEmotion || {};
    const lines = [];

    if (primary.name && primary.name !== "unclear") {
      lines.push(h.underlyingEmotion(primary.name));
    }

    if (emotionDepth.hiddenFear) lines.push(emotionDepth.hiddenFear);
    if (emotionDepth.vulnerableTruth) lines.push(emotionDepth.vulnerableTruth);
    if (wisdom.wisdomPrinciple) lines.push(wisdom.wisdomPrinciple);
    if (emotionRecovery.primaryQuestion) lines.push(emotionRecovery.primaryQuestion);

    return {
      leadType: "emotion_depth",
      openingIntent: "emotional_source",
      primaryLine:
        lines[0] ||
        "The deeper feeling matters here more than the surface problem.",
      secondaryLines: lines.slice(1),
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  wisdomPlan(analysis = {}) {
    const wisdom = analysis.wisdom || {};
    const resolution = analysis.wisdomResolution || {};
    const regret = analysis.regret || {};
    const consequence = analysis.longTermConsequence || {};
    const lines = [];

    if (wisdom.wisdomPrinciple) lines.push(wisdom.wisdomPrinciple);

    if (resolution.leadingGood && resolution.supportingGood) {
      lines.push(
        `For this season, ${this.clean(resolution.leadingGood)} should lead and ${this.clean(resolution.supportingGood)} should support.`
      );
    }

    if (
      resolution.boundary &&
      resolution.boundary !== "Ari does not have enough wisdom signal to resolve the tension yet."
    ) {
      lines.push(resolution.boundary);
    }

    if (resolution.integration) lines.push(resolution.integration);
    if (regret.regretStatement) lines.push(regret.regretStatement);
    if (consequence.courseCorrection) lines.push(consequence.courseCorrection);

    return {
      leadType: "wisdom",
      openingIntent: "wisdom_resolution",
      primaryLine: lines[0] || "The wise move is to choose what should lead.",
      secondaryLines: lines.slice(1),
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  regretPlan(analysis = {}) {
    const regret = analysis.regret || {};
    const consequence = analysis.longTermConsequence || {};
    const wisdom = analysis.wisdom || {};
    const lines = [];

    if (regret.regretStatement) lines.push(regret.regretStatement);
    if (consequence.riskIfIgnored) lines.push(consequence.riskIfIgnored);
    if (consequence.courseCorrection) lines.push(consequence.courseCorrection);
    if (wisdom.wisdomPrinciple) lines.push(wisdom.wisdomPrinciple);

    return {
      leadType: "regret",
      openingIntent: "future_regret",
      primaryLine:
        lines[0] ||
        "The risk is not just what happens now, but what this costs later.",
      secondaryLines: lines.slice(1),
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  consequencePlan(analysis = {}) {
    const consequence = analysis.longTermConsequence || {};
    const regret = analysis.regret || {};
    const wisdom = analysis.wisdom || {};
    const lines = [];

    if (consequence.fiveYearConsequence) lines.push(consequence.fiveYearConsequence);
    if (consequence.protectedFuture) lines.push(consequence.protectedFuture);
    if (regret.regretStatement) lines.push(regret.regretStatement);
    if (wisdom.wisdomPrinciple) lines.push(wisdom.wisdomPrinciple);

    return {
      leadType: "consequence",
      openingIntent: "long_term_projection",
      primaryLine:
        lines[0] ||
        "The long-term consequence is what matters most here.",
      secondaryLines: lines.slice(1),
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  conflictPlan(analysis = {}) {
    const insight = analysis.insight || {};
    const wisdom = analysis.wisdom || {};
    const h = this.humanizers();
    const lines = [];

    if (
      insight.hiddenConflict?.name &&
      insight.hiddenConflict.name !== "unclear" &&
      insight.hiddenConflict.name !== "none_detected"
    ) {
      lines.push(h.conflict(insight.hiddenConflict.name));
    }

    if (
      insight.tradeoff?.name &&
      insight.tradeoff.name !== "unclear" &&
      insight.tradeoff.name !== "none_detected"
    ) {
      lines.push(h.tradeoff(insight.tradeoff.name));
    }

    if (wisdom.wisdomPrinciple) lines.push(wisdom.wisdomPrinciple);

    return {
      leadType: "conflict",
      openingIntent: "tension_naming",
      primaryLine:
        lines[0] ||
        "The main issue may be that two important things are competing.",
      secondaryLines: lines.slice(1),
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  beliefPlan(analysis = {}) {
    const belief = analysis.beliefModel?.primaryBelief;
    const insight = analysis.insight || {};
    const h = this.humanizers();
    const lines = [];

    if (belief?.name && belief.name !== "unclear") {
      lines.push(h.belief(belief.name));
    }

    if (
      insight.oneLineInsight &&
      insight.oneLineInsight !== "Ari needs more context before naming this cleanly."
    ) {
      lines.push(insight.oneLineInsight);
    }

    return {
      leadType: "belief",
      openingIntent: "belief_naming",
      primaryLine:
        lines[0] ||
        "The belief underneath this may matter more than the surface choice.",
      secondaryLines: lines.slice(1),
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  planningPlan(analysis = {}) {
    const executive = analysis.executive || {};
    const consequence = analysis.longTermConsequence || {};

    return {
      leadType: "planning",
      openingIntent: "steady_observation",
      primaryLine:
        executive.recommendedFocus ||
        consequence.courseCorrection ||
        "Choose one next action instead of trying to solve everything at once.",
      secondaryLines: [],
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  buildingPlan(analysis = {}) {
    const insight = analysis.insight || {};
    const executive = analysis.executive || {};
    const meaning = analysis.meaning || {};

    return {
      leadType: "building",
      openingIntent: "steady_observation",
      primaryLine:
        meaning.humanTruth ||
        insight.oneLineInsight ||
        executive.recommendedFocus ||
        "The bottleneck is not the whole system. Focus on the next clean change.",
      secondaryLines: [
        "The bottleneck is usually smaller than it first appears.",
        "Focus on the next clean improvement rather than redesigning the entire system."
      ],
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  defaultPlan(analysis = {}) {
    const insight = analysis.insight || {};
    const meaning = analysis.meaning || {};
    const executive = analysis.executive || {};

    return {
      leadType: "default",
      openingIntent: "steady_observation",
      primaryLine:
        insight.oneLineInsight ||
        meaning.humanTruth ||
        executive.recommendedFocus ||
        "Ari needs more context before naming this cleanly.",
      secondaryLines: [],
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  humanizers() {
    return window.Ari.languageHumanizers || {
      lifeChapter: (name) => `This looks connected to ${this.clean(name)}.`,
      underlyingEmotion: (name) =>
        `Underneath this, Ari may be detecting ${this.clean(name)}.`,
      conflict: (name) => `The conflict may be ${this.clean(name)}.`,
      tradeoff: (name) => `The tradeoff may be ${this.clean(name)}.`,
      belief: (name) => `The belief underneath may be ${this.clean(name)}.`
    };
  },

  clean(text = "") {
    return String(text || "").replaceAll("_", " ");
  }
};