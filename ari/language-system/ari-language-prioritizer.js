// ari/language-system/ari-language-prioritizer.js
// Ari Language Prioritizer
// Purpose: Decide what Ari should say first based on salience, signals, wisdom, emotion, insight, and recovery.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languagePrioritizer = {
  version: "1.0.0",

  prioritize(analysis = {}) {
    const salience = analysis.salience || {};
    const signals = analysis.signals || {};
    const insight = analysis.insight || {};
    const wisdom = analysis.wisdom || {};
    const wisdomResolution = analysis.wisdomResolution || {};
    const regret = analysis.regret || {};
    const consequence = analysis.longTermConsequence || {};
    const emotionDepth = analysis.underlyingEmotion || {};
    const recovery = analysis.wisdomQuestionRecovery || {};
    const emotionRecovery = analysis.emotionRecoveryQuestions || {};

    if (
      recovery.shouldRecover &&
      insight.evidenceStrength === "none"
    ) {
      return this.recoveryPlan(recovery, emotionRecovery);
    }

    const lead =
      salience.recommendedLead ||
      signals.recommendedLanguageLead ||
      "insight";

    if (lead === "life_chapter") {
      return this.lifeChapterPlan(analysis);
    }

    if (lead === "emotion_depth") {
      return this.emotionDepthPlan(emotionDepth, wisdom, emotionRecovery);
    }

    if (lead === "wisdom" || lead === "executive_wisdom") {
      return this.wisdomPlan(wisdom, wisdomResolution, regret, consequence);
    }

    if (lead === "regret") {
      return this.regretPlan(regret, consequence, wisdom);
    }

    if (lead === "consequence") {
      return this.consequencePlan(consequence, regret, wisdom);
    }

    if (lead === "conflict" || lead === "tradeoff") {
      return this.conflictPlan(analysis);
    }

    if (lead === "belief") {
      return this.beliefPlan(analysis);
    }

    return this.defaultPlan(analysis);
  },

  recoveryPlan(recovery = {}, emotionRecovery = {}) {
    return {
      leadType: "recovery",
      openingIntent: "humble_uncertainty",
      primaryLine:
        "I do not think Ari has enough evidence to name this honestly yet.",
      secondaryLines: [
        recovery.primaryQuestion ||
          emotionRecovery.primaryQuestion ||
          "What part of this feels most important but least understood?"
      ],
      shouldAskQuestion: true,
      source: "ari-language-prioritizer"
    };
  },

  lifeChapterPlan(analysis = {}) {
    const salience = analysis.salience || {};
    const personModel = analysis.personModel || {};
    const wisdom = analysis.wisdom || {};
    const resolution = analysis.wisdomResolution || {};
    const consequence = analysis.longTermConsequence || {};

    const chapter = personModel.lifeChapter?.name;
    const primary = salience.primarySalienceName;

    const lines = [];

    if (chapter && chapter !== "unclear") {
      lines.push(this.humanizeLifeChapter(chapter));
    } else if (primary) {
      lines.push(`The strongest signal is ${this.clean(primary)}.`);
    }

    if (wisdom.wisdomPrinciple) {
      lines.push(wisdom.wisdomPrinciple);
    }

    if (resolution.boundary) {
      lines.push(resolution.boundary);
    }

    if (consequence.courseCorrection) {
      lines.push(consequence.courseCorrection);
    }

    return {
      leadType: "life_chapter",
      openingIntent: "chapter_recognition",
      primaryLine: lines[0] || "This looks like a life chapter question.",
      secondaryLines: lines.slice(1),
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  emotionDepthPlan(emotionDepth = {}, wisdom = {}, emotionRecovery = {}) {
    const primary = emotionDepth.primaryUnderlyingEmotion || {};
    const lines = [];

    if (primary.name && primary.name !== "unclear") {
      lines.push(this.humanizeEmotionDepth(primary.name));
    }

    if (emotionDepth.hiddenFear) {
      lines.push(emotionDepth.hiddenFear);
    }

    if (emotionDepth.vulnerableTruth) {
      lines.push(emotionDepth.vulnerableTruth);
    }

    if (wisdom.wisdomPrinciple) {
      lines.push(wisdom.wisdomPrinciple);
    }

    if (emotionRecovery.primaryQuestion) {
      lines.push(emotionRecovery.primaryQuestion);
    }

    return {
      leadType: "emotion_depth",
      openingIntent: "emotional_source",
      primaryLine:
        lines[0] ||
        "The deeper feeling matters here more than the surface problem.",
      secondaryLines: lines.slice(1),
      shouldAskQuestion: Boolean(emotionRecovery.primaryQuestion),
      source: "ari-language-prioritizer"
    };
  },

  wisdomPlan(wisdom = {}, resolution = {}, regret = {}, consequence = {}) {
    const lines = [];

    if (wisdom.wisdomPrinciple) {
      lines.push(wisdom.wisdomPrinciple);
    }

    if (resolution.leadingGood && resolution.supportingGood) {
      lines.push(
        `For this season, ${this.clean(resolution.leadingGood)} should lead and ${this.clean(resolution.supportingGood)} should support.`
      );
    }

    if (resolution.boundary) {
      lines.push(resolution.boundary);
    }

    if (resolution.integration) {
      lines.push(resolution.integration);
    }

    if (regret.regretStatement) {
      lines.push(regret.regretStatement);
    }

    if (consequence.courseCorrection) {
      lines.push(consequence.courseCorrection);
    }

    return {
      leadType: "wisdom",
      openingIntent: "wisdom_resolution",
      primaryLine: lines[0] || "The wise move is to choose what should lead.",
      secondaryLines: lines.slice(1),
      shouldAskQuestion: false,
      source: "ari-language-prioritizer"
    };
  },

  regretPlan(regret = {}, consequence = {}, wisdom = {}) {
    const lines = [];

    if (regret.regretStatement) {
      lines.push(regret.regretStatement);
    }

    if (consequence.riskIfIgnored) {
      lines.push(consequence.riskIfIgnored);
    }

    if (consequence.courseCorrection) {
      lines.push(consequence.courseCorrection);
    }

    if (wisdom.wisdomPrinciple) {
      lines.push(wisdom.wisdomPrinciple);
    }

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

  consequencePlan(consequence = {}, regret = {}, wisdom = {}) {
    const lines = [];

    if (consequence.fiveYearConsequence) {
      lines.push(consequence.fiveYearConsequence);
    }

    if (consequence.protectedFuture) {
      lines.push(consequence.protectedFuture);
    }

    if (regret.regretStatement) {
      lines.push(regret.regretStatement);
    }

    if (wisdom.wisdomPrinciple) {
      lines.push(wisdom.wisdomPrinciple);
    }

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
    const lines = [];

    if (insight.hiddenConflict?.name && insight.hiddenConflict.name !== "unclear") {
      lines.push(this.humanizeConflict(insight.hiddenConflict.name));
    }

    if (insight.tradeoff?.name && insight.tradeoff.name !== "none_detected") {
      lines.push(this.humanizeTradeoff(insight.tradeoff.name));
    }

    if (wisdom.wisdomPrinciple) {
      lines.push(wisdom.wisdomPrinciple);
    }

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
    const lines = [];

    if (belief?.name) {
      lines.push(this.humanizeBelief(belief.name));
    }

    if (insight.oneLineInsight) {
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

  clean(text = "") {
    return String(text || "").replaceAll("_", " ");
  },

  humanizeLifeChapter(name = "") {
    const map = {
      fatherhood_and_transition:
        "This is not just a productivity question. This is a fatherhood and transition chapter.",
      fatherhood_transition:
        "This season is about becoming a father, not just finishing more tasks.",
      family_transition:
        "This season is asking you to measure success by presence, not just progress.",
      builder_development:
        "This is partly about what kind of builder you are becoming.",
      career_and_identity_transition:
        "This is a career and identity transition, not just a planning problem."
    };

    return map[name] || `This looks connected to ${this.clean(name)}.`;
  },

  humanizeEmotionDepth(name = "") {
    const map = {
      fear_of_betraying_purpose:
        "Underneath this, Ari may be detecting fear of betraying purpose.",
      fear_of_losing_identity:
        "Underneath this, Ari may be detecting fear of losing identity.",
      fear_of_missing_irreplaceable_moments:
        "Underneath this, Ari may be detecting fear of missing moments you cannot get back.",
      fear_of_failing_family:
        "Underneath this, Ari may be detecting fear of failing the people who matter most.",
      fear_of_collapse_if_capacity_is_ignored:
        "Underneath this, Ari may be detecting fear that capacity will collapse if ignored."
    };

    return map[name] || `Underneath this, Ari may be detecting ${this.clean(name)}.`;
  },

  humanizeConflict(name = "") {
    const map = {
      family_vs_purpose:
        "The conflict may be family versus purpose.",
      provider_vs_presence:
        "The conflict may be providing more versus being present more.",
      identity_vs_transition:
        "The conflict may be an old identity trying to survive a new chapter.",
      growth_vs_stability:
        "The conflict may be growth versus stability."
    };

    return map[name] || `The conflict may be ${this.clean(name)}.`;
  },

  humanizeTradeoff(name = "") {
    const map = {
      presence_vs_acceleration:
        "The tradeoff may be presence versus acceleration.",
      achievement_vs_presence:
        "The tradeoff may be achievement versus presence.",
      growth_vs_stability:
        "The tradeoff may be growth versus stability."
    };

    return map[name] || `The tradeoff may be ${this.clean(name)}.`;
  },

  humanizeBelief(name = "") {
    const map = {
      purpose_must_not_be_abandoned:
        "The belief underneath may be that purpose must not be abandoned.",
      achievement_creates_security:
        "The belief underneath may be that achievement creates safety.",
      responsibility_comes_before_rest:
        "The belief underneath may be that responsibility must come before rest.",
      family_moments_are_irreplaceable:
        "The belief underneath may be that family moments cannot simply be recovered later.",
      slowing_down_means_falling_behind:
        "The belief underneath may be that slowing down means falling behind."
    };

    return map[name] || `The belief underneath may be ${this.clean(name)}.`;
  }
};