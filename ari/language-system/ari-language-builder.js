// ari/language-system/ari-language-builder.js
// Ari Language Builder
// Purpose: Build Ari's final response by routing to specialized language builders.
// V2.0

window.Ari = window.Ari || {};

window.Ari.languageBuilder = {
  version: "2.0.0",

  build(analysis = {}, languagePlan = null, options = {}) {
    try {
      const plan =
        languagePlan ||
        (window.Ari.languagePrioritizer
          ? window.Ari.languagePrioritizer.prioritize(analysis, options)
          : null);

      const opening = this.getOpeningLine(analysis, plan);

      if (plan?.primaryLine) {
        return this.buildFromPlan(analysis, plan, opening);
      }

      return this.buildFromRouter(analysis, options, opening);
    } catch (error) {
      console.error("[ARI LANGUAGE BUILDER]", error);
      return "Something interrupted Ari's language builder.";
    }
  },

  buildFromRouter(analysis = {}, options = {}, opening = "") {
    const route = window.Ari.languageRouter
      ? window.Ari.languageRouter.route(analysis)
      : analysis.questionType || "default";

    const builder = window.Ari.languageRouter
      ? window.Ari.languageRouter.getBuilder(route)
      : null;

    let lines = [];

    if (this.needsRecovery(analysis) && window.Ari.languageRecoveryBuilder) {
      lines = window.Ari.languageRecoveryBuilder.build(analysis);
    } else if (builder?.build) {
      lines = builder.build(analysis, options);
    } else {
      lines = this.buildDefaultLines(analysis);
    }

    return this.assemble(opening, lines, analysis);
  },

  buildFromPlan(analysis = {}, plan = {}, opening = "") {
    const lines = [];

    if (plan.primaryLine) {
      lines.push(plan.primaryLine);
    }

    if (Array.isArray(plan.secondaryLines)) {
      plan.secondaryLines.forEach((line) => {
        if (line) lines.push(line);
      });
    }

    if (
      plan.shouldAskQuestion &&
      !this.planAlreadyIncludesQuestion(plan)
    ) {
      const question = this.getReflectionQuestion(analysis);
      if (question) lines.push(question);
    }

    return this.assemble(opening, lines, analysis);
  },

  buildDefaultLines(analysis = {}) {
    const lines = [];

    if (
      analysis.meaning?.humanTruth &&
      analysis.meaning.humanTruth !== "Ari needs more context before naming this cleanly."
    ) {
      lines.push(analysis.meaning.humanTruth);
    } else if (
      analysis.insight?.oneLineInsight &&
      analysis.insight.oneLineInsight !== "Ari needs more context before naming this cleanly."
    ) {
      lines.push(analysis.insight.oneLineInsight);
    } else if (analysis.executive?.recommendedFocus) {
      lines.push(analysis.executive.recommendedFocus);
    } else {
      lines.push("I need a little more context before I can name this cleanly.");
    }

    return lines;
  },

  needsRecovery(analysis = {}) {
    return Boolean(
      analysis.wisdomQuestionRecovery?.shouldRecover &&
        analysis.insight?.evidenceStrength === "none"
    );
  },

  assemble(opening = "", lines = [], analysis = {}) {
    const output = [];

    if (opening) output.push(opening);

    const cleanLines = this.unique(lines);

    cleanLines.forEach((line) => {
      if (line) {
        output.push("");
        output.push(line);
      }
    });

    return this.finalize(output.join("\n"));
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

    return allLines.some((line) =>
      String(line).trim().endsWith("?")
    );
  },

  unique(lines = []) {
    return [...new Set(lines.filter(Boolean))];
  },

  helpers() {
    return window.Ari.languageHelpers || {};
  },

  finalize(response = "") {
    if (this.helpers().finalize) {
      return this.helpers().finalize(response);
    }

    return String(response || "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
};