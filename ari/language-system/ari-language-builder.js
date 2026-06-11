// ari/language-system/ari-language-builder.js
// Ari Language Builder
// Purpose: Build Ari's final response from language plans, salience, signals, wisdom, emotion, insight, and recovery.
// V1.0

window.Ari = window.Ari || {};

window.Ari.languageBuilder = {
  version: "1.0.0",

  build(analysis = {}, languagePlan = null, options = {}) {
    const plan =
      languagePlan ||
      (window.Ari.languagePrioritizer
        ? window.Ari.languagePrioritizer.prioritize(analysis)
        : null);

    if (plan?.primaryLine) {
      return this.buildFromPlan(analysis, plan);
    }

    return this.buildFallback(analysis, options);
  },

  buildFromPlan(analysis = {}, plan = {}) {
    const lines = [];
    const opening = this.getOpeningLine(analysis, plan);

    if (opening) {
      lines.push(opening);
    }

    if (plan.primaryLine) {
      lines.push("");
      lines.push(plan.primaryLine);
    }

    if (Array.isArray(plan.secondaryLines)) {
      plan.secondaryLines.forEach((line) => {
        if (line) {
          lines.push("");
          lines.push(line);
        }
      });
    }

    if (
      plan.shouldAskQuestion &&
      !this.planAlreadyIncludesQuestion(plan)
    ) {
      const question = this.getReflectionQuestion(analysis);

      if (question) {
        lines.push("");
        lines.push(question);
      }
    }

    return this.finalize(lines.join("\n"));
  },

  buildFallback(analysis = {}, options = {}) {
    const questionType = analysis.questionType || "understanding";

    if (this.needsRecovery(analysis)) {
      return this.buildRecovery(analysis);
    }

    if (questionType === "emotional") {
      return this.buildEmotional(analysis);
    }

    if (questionType === "decision") {
      return this.buildDecision(analysis);
    }

    if (questionType === "planning") {
      return this.buildPlanning(analysis);
    }

    if (questionType === "building") {
      return this.buildBuilding(analysis);
    }

    if (questionType === "meaning") {
      return this.buildMeaning(analysis);
    }

    if (questionType === "insight") {
      return this.buildInsight(analysis);
    }

    return this.buildDefault(analysis);
  },

  buildRecovery(analysis = {}) {
    const recovery = analysis.wisdomQuestionRecovery || {};
    const emotionRecovery = analysis.emotionRecoveryQuestions || {};
    const lines = [];

    lines.push(this.getOpeningLine(analysis));

    lines.push("");
    lines.push(
      "I do not think Ari has enough evidence to name this honestly yet."
    );

    lines.push("");
    lines.push(
      recovery.primaryQuestion ||
        emotionRecovery.primaryQuestion ||
        "What part of this feels most important but least understood?"
    );

    return this.finalize(lines.join("\n"));
  },

  buildEmotional(analysis = {}) {
    const lines = [];

    lines.push(this.getOpeningLine(analysis));

    const emotionLines = this.getEmotionDepthLines(analysis, {
      includeQuestion: false
    });

    if (emotionLines.length > 0) {
      lines.push("");
      lines.push(...this.spaceLines(emotionLines));
    } else {
      const surface = analysis.emotionalIntelligence?.surfaceEmotion?.name;

      lines.push("");
      lines.push(
        surface && surface !== "curiosity"
          ? this.humanizers().protecting(surface)
          : "The feeling matters. It is information, not noise."
      );
    }

    const rootNeed = analysis.emotionalIntelligence?.rootNeed?.name;
    if (rootNeed) {
      lines.push("");
      lines.push(this.humanizers().rootNeed(rootNeed));
    }

    const protecting = analysis.emotionalIntelligence?.protecting?.name;
    if (protecting) {
      lines.push("");
      lines.push(this.humanizers().protecting(protecting));
    }

    const wisdomLines = this.getWisdomLines(analysis, {
      includeRegret: false,
      includeConsequence: false
    });

    if (wisdomLines.length > 0) {
      lines.push("");
      lines.push(wisdomLines[0]);
    }

    const question = analysis.emotionRecoveryQuestions?.primaryQuestion;
    if (question) {
      lines.push("");
      lines.push(question);
    }

    return this.finalize(lines.join("\n"));
  },

  buildDecision(analysis = {}) {
    const lines = [];

    lines.push(this.getOpeningLine(analysis));

    const wisdomLines = this.getWisdomLines(analysis, {
      includeRegret: true,
      includeConsequence: true
    });

    if (wisdomLines.length > 0) {
      lines.push("");
      lines.push(...this.spaceLines(wisdomLines));
    } else if (analysis.executive?.recommendedFocus) {
      lines.push("");
      lines.push(analysis.executive.recommendedFocus);
    } else {
      lines.push("");
      lines.push("One thing needs to lead. The rest need to support.");
    }

    return this.finalize(lines.join("\n"));
  },

  buildPlanning(analysis = {}) {
    const lines = [];

    lines.push(this.getOpeningLine(analysis));

    const wisdomLines = this.getWisdomLines(analysis, {
      includeRegret: false,
      includeConsequence: true
    });

    if (wisdomLines.length > 0) {
      lines.push("");
      lines.push(...this.spaceLines(wisdomLines));
    }

    const emotionLines = this.getEmotionDepthLines(analysis, {
      includeQuestion: false
    });

    if (emotionLines.length > 0) {
      lines.push("");
      lines.push(...this.spaceLines(emotionLines));
    }

    lines.push("");
    lines.push(
      analysis.executive?.recommendedFocus ||
        "Choose one next action instead of trying to solve everything at once."
    );

    return this.finalize(lines.join("\n"));
  },

  buildBuilding(analysis = {}) {
    const lines = [];

    lines.push(this.getOpeningLine(analysis));

    const salience = analysis.salience || {};
    const lead = salience.recommendedLead || analysis.signals?.recommendedLanguageLead;

    if (lead === "emotion_depth") {
      const emotionLines = this.getEmotionDepthLines(analysis, {
        includeQuestion: false
      });

      if (emotionLines.length > 0) {
        lines.push("");
        lines.push(...this.spaceLines(emotionLines));
      }
    }

    const wisdomLines = this.getWisdomLines(analysis, {
      includeRegret: false,
      includeConsequence: true
    });

    if (wisdomLines.length > 0) {
      lines.push("");
      lines.push(...this.spaceLines(wisdomLines));
    }

    if (analysis.insight?.oneLineInsight) {
      lines.push("");
      lines.push(analysis.insight.oneLineInsight);
    }

    lines.push("");
    lines.push(
      analysis.executive?.recommendedFocus ||
        "The bottleneck is not the whole system. Focus on the next clean change."
    );

    return this.finalize(lines.join("\n"));
  },

  buildMeaning(analysis = {}) {
    const lines = [];

    lines.push(this.getOpeningLine(analysis));

    const chapter = analysis.personModel?.lifeChapter?.name;
    if (chapter && chapter !== "unclear") {
      lines.push("");
      lines.push(this.humanizers().lifeChapter(chapter));
    }

    const wisdomLines = this.getWisdomLines(analysis, {
      includeRegret: true,
      includeConsequence: true
    });

    if (wisdomLines.length > 0) {
      lines.push("");
      lines.push(...this.spaceLines(wisdomLines));
    }

    if (analysis.meaning?.humanTruth) {
      lines.push("");
      lines.push(analysis.meaning.humanTruth);
    }

    const emotionLines = this.getEmotionDepthLines(analysis, {
      includeQuestion: false
    });

    if (emotionLines.length > 0) {
      lines.push("");
      lines.push(...this.spaceLines(emotionLines));
    }

    return this.finalize(lines.join("\n"));
  },

  buildInsight(analysis = {}) {
    const lines = [];

    lines.push(this.getOpeningLine(analysis));

    if (analysis.insight?.oneLineInsight) {
      lines.push("");
      lines.push(analysis.insight.oneLineInsight);
    } else if (analysis.insight?.hypothesis?.explanation) {
      lines.push("");
      lines.push(analysis.insight.hypothesis.explanation);
    }

    const emotionLines = this.getEmotionDepthLines(analysis, {
      includeQuestion: false
    });

    if (emotionLines.length > 0) {
      lines.push("");
      lines.push(...this.spaceLines(emotionLines));
    }

    const wisdomLines = this.getWisdomLines(analysis, {
      includeRegret: false,
      includeConsequence: false
    });

    if (wisdomLines.length > 0) {
      lines.push("");
      lines.push(wisdomLines[0]);
    }

    const question = this.getReflectionQuestion(analysis);
    if (question) {
      lines.push("");
      lines.push(question);
    }

    return this.finalize(lines.join("\n"));
  },

  buildDefault(analysis = {}) {
    const lines = [];

    lines.push(this.getOpeningLine(analysis));

    if (analysis.meaning?.humanTruth) {
      lines.push("");
      lines.push(analysis.meaning.humanTruth);
    } else if (analysis.insight?.oneLineInsight) {
      lines.push("");
      lines.push(analysis.insight.oneLineInsight);
    } else if (analysis.executive?.recommendedFocus) {
      lines.push("");
      lines.push(analysis.executive.recommendedFocus);
    } else {
      lines.push("");
      lines.push("I need a little more context before I can name this cleanly.");
    }

    return this.finalize(lines.join("\n"));
  },

  needsRecovery(analysis = {}) {
    return Boolean(
      analysis.wisdomQuestionRecovery?.shouldRecover &&
        analysis.insight?.evidenceStrength === "none"
    );
  },

  getOpeningLine(analysis = {}, plan = {}) {
    if (plan?.openingIntent === "humble_uncertainty") {
      return "Something is unclear here.";
    }

    if (plan?.openingIntent === "chapter_recognition") {
      return "Something feels important about this chapter.";
    }

    if (plan?.openingIntent === "emotional_source") {
      return "That sounds heavier than it looks.";
    }

    if (plan?.openingIntent === "wisdom_resolution") {
      return "The wise move may be simpler than it feels.";
    }

    if (plan?.openingIntent === "future_regret") {
      return "The future cost matters here.";
    }

    if (window.Ari.voiceEngine?.getOpeningLine) {
      return window.Ari.voiceEngine.getOpeningLine(
        analysis.voice || {
          openingStyle: "steady_observation",
          confidence: "low"
        }
      );
    }

    return "The thing I notice first is this.";
  },

  getWisdomLines(analysis = {}, options = {}) {
    const wisdom = analysis.wisdom || {};
    const resolution = analysis.wisdomResolution || {};
    const regret = analysis.regret || {};
    const consequence = analysis.longTermConsequence || {};
    const lines = [];

    if (wisdom.wisdomPrinciple) {
      lines.push(wisdom.wisdomPrinciple);
    }

    if (
      resolution.resolvedStatement &&
      resolution.resolvedStatement !==
        "Ari does not have enough wisdom signal to resolve the tension yet."
    ) {
      if (resolution.leadingGood && resolution.supportingGood) {
        lines.push(
          `For this season, ${this.clean(resolution.leadingGood)} should lead and ${this.clean(resolution.supportingGood)} should support.`
        );
      }

      if (resolution.boundary) lines.push(resolution.boundary);
      if (resolution.integration) lines.push(resolution.integration);
    }

    if (options.includeRegret && regret.regretStatement) {
      lines.push(regret.regretStatement);
    } else if (options.includeRegret && wisdom.likelyRegret) {
      lines.push(`The regret to avoid is ${this.lowercaseFirst(wisdom.likelyRegret)}`);
    }

    if (options.includeConsequence && consequence.courseCorrection) {
      lines.push(consequence.courseCorrection);
    }

    return lines;
  },

  getEmotionDepthLines(analysis = {}, options = {}) {
    const depth = analysis.underlyingEmotion || {};
    const recovery = analysis.emotionRecoveryQuestions || {};
    const primary = depth.primaryUnderlyingEmotion || {};
    const lines = [];

    if (primary.name && primary.name !== "unclear") {
      lines.push(this.humanizers().underlyingEmotion(primary.name));
    }

    if (depth.hiddenFear) {
      lines.push(depth.hiddenFear);
    }

    if (depth.vulnerableTruth) {
      lines.push(depth.vulnerableTruth);
    }

    if (options.includeQuestion && recovery.primaryQuestion) {
      lines.push(recovery.primaryQuestion);
    }

    return lines;
  },

  getReflectionQuestion(analysis = {}) {
    if (window.Ari.languageReflectionQuestions) {
      return window.Ari.languageReflectionQuestions.generate(analysis);
    }

    return "What part of this feels most true?";
  },

  planAlreadyIncludesQuestion(plan = {}) {
    const allLines = [
      plan.primaryLine,
      ...(plan.secondaryLines || [])
    ].filter(Boolean);

    return allLines.some((line) => String(line).trim().endsWith("?"));
  },

  spaceLines(lines = []) {
    return lines.filter(Boolean);
  },

  humanizers() {
    return window.Ari.languageHumanizers || {
      underlyingEmotion: (name) =>
        `Underneath this, Ari may be detecting ${this.clean(name)}.`,
      lifeChapter: (name) =>
        `This chapter appears to be about ${this.clean(name)}.`,
      belief: (name) =>
        `Ari may be detecting this belief: ${this.clean(name)}.`,
      rootNeed: (name) =>
        `The need underneath may be ${this.clean(name)}.`,
      protecting: (name) =>
        `What you are protecting may be ${this.clean(name)}.`
    };
  },

  helpers() {
    return window.Ari.languageHelpers || {};
  },

  clean(text = "") {
    if (this.helpers().cleanConcept) {
      return this.helpers().cleanConcept(text);
    }

    return String(text || "").replaceAll("_", " ");
  },

  lowercaseFirst(text = "") {
    if (this.helpers().lowercaseFirst) {
      return this.helpers().lowercaseFirst(text);
    }

    if (!text) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
  },

  finalize(response = "") {
    if (this.helpers().finalize) {
      return this.helpers().finalize(response);
    }

    return String(response || "").trim();
  }
};