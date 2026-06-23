// ari/developer/ari-rebirth-self-improvement-engine.js
// Purpose: Detect Ari behavior flaws and turn them into safe improvement work.
// V1.0.0 — Semantic Self-Improvement / No Self-Editing Without Evidence

window.Ari = window.Ari || {};

window.AriRebirthSelfImprovementEngine = {
  version: "1.0.0",

  improve(input = {}) {
    const summary = input.summary || input || {};
    const text = this.getText(summary);
    const appContext = summary.appContext || {};

    if (!appContext.ownerMode) return null;

    const request = this.understandRequest(text);
    if (!request.isSelfImprovement) return null;

    return {
      enabled: true,
      type: "developer_investigation",
      planner: "ari-rebirth-self-improvement-engine",
      plannerVersion: this.version,
      title: request.title,
      summary: request.summary,
      priority: request.priority,
      ownerCommand: true,

      intent: "improve_ari_behavior",
      target: {
        kind: "ari_behavior",
        behavior: request.behavior,
        raw: text
      },

      likelyFiles: request.likelyFiles,

      steps: [
        ...request.searchQueries.map(query => ({
          tool: "github_search",
          query,
          reason: "Find the exact Ari behavior code before proposing changes."
        })),

        ...request.likelyFiles.map(filePath => ({
          tool: "github_read",
          filePath,
          reason: "Read likely Ari behavior file before editing."
        })),

        {
          tool: "rebirth_analyze",
          reason: "Compare current Ari behavior against owner requested improvement."
        },

        {
          tool: "propose_edit",
          reason: "Only propose an edit after exact code evidence exists.",
          requiresExactFindText: true,
          requiresOwnerConfirmation: true
        }
      ],

      canEditNow: false,
      requiresReadBeforeEdit: true,

      editPolicy: {
        neverGuessFindText: true,
        requireExactFileContent: true,
        requireOwnerConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT"
      }
    };
  },

  getText(summary = {}) {
    return String(
      summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        ""
    ).trim();
  },

  understandRequest(text = "") {
    const t = text.toLowerCase();

    const behavior = this.detectBehavior(t);

    if (!behavior) {
      return {
        isSelfImprovement: false
      };
    }

    const likelyFiles = this.inferLikelyFiles(behavior);
    const searchQueries = this.buildSearchQueries(behavior, text);

    return {
      isSelfImprovement: true,
      behavior,
      title: this.buildTitle(behavior),
      summary: this.buildSummary(behavior, text),
      priority: this.inferPriority(t),
      likelyFiles,
      searchQueries
    };
  },

  detectBehavior(text = "") {
    if (
      this.hasAny(text, [
        "speak more naturally",
        "sound more natural",
        "less robotic",
        "more human",
        "talk better",
        "answer better",
        "better response",
        "direct answer",
        "stop sounding",
        "too generic",
        "too vague"
      ])
    ) {
      return "natural_language_quality";
    }

    if (
      this.hasAny(text, [
        "understand better",
        "misunderstood",
        "wrong intent",
        "not what i asked",
        "context",
        "follow up",
        "remember conversation"
      ])
    ) {
      return "understanding_and_context";
    }

    if (
      this.hasAny(text, [
        "ask too many questions",
        "too many follow ups",
        "keeps asking",
        "doesn't answer",
        "does not answer"
      ])
    ) {
      return "answer_discipline";
    }

    if (
      this.hasAny(text, [
        "fix herself",
        "improve herself",
        "self improve",
        "update herself",
        "patch herself",
        "ari bug"
      ])
    ) {
      return "self_repair_loop";
    }

    return null;
  },

  inferLikelyFiles(behavior) {
    const files = new Set();

    if (behavior === "natural_language_quality") {
      files.add("ari/language/ari-language-composer.js");
      files.add("ari/language/ari-communication-planner.js");
      files.add("ari/ari-rebirth-app-bridge.js");
      files.add("api/ask-calbuddy.js");
    }

    if (behavior === "understanding_and_context") {
      files.add("ari/meaning/ari-semantic-frame-builder.js");
      files.add("ari/context/ari-thread-understanding-engine.js");
      files.add("ari/context/ari-context-assembler.js");
      files.add("ari/integration/ari-rebirth-pipeline.js");
    }

    if (behavior === "answer_discipline") {
      files.add("ari/language/ari-language-composer.js");
      files.add("ari/language/ari-communication-planner.js");
      files.add("ari/triage/ari-situation-contract-engine.js");
      files.add("ari/ari-rebirth-app-bridge.js");
    }

    if (behavior === "self_repair_loop") {
      files.add("ari/developer/ari-rebirth-developer-planner.js");
      files.add("ari/developer/ari-rebirth-code-understanding-engine.js");
      files.add("ari/developer/ari-rebirth-patch-decision-engine.js");
      files.add("calbuddy-core.js");
    }

    return Array.from(files);
  },

  buildSearchQueries(behavior, originalText = "") {
    const queries = new Set();

    if (behavior === "natural_language_quality") {
      queries.add("finalResponse");
      queries.add("languageComposer");
      queries.add("communicationPlan");
      queries.add("compose");
      queries.add("cleanReply");
    }

    if (behavior === "understanding_and_context") {
      queries.add("semanticFrame");
      queries.add("threadUnderstanding");
      queries.add("conversationMeaningHistory");
      queries.add("resolvedUserQuestion");
      queries.add("contextAssembler");
    }

    if (behavior === "answer_discipline") {
      queries.add("followUpNeeded");
      queries.add("recommendedQuestion");
      queries.add("Answer the primary lane directly");
      queries.add("clarifying");
      queries.add("primary lane");
    }

    if (behavior === "self_repair_loop") {
      queries.add("developerIntent");
      queries.add("developer_investigation");
      queries.add("githubEdit");
      queries.add("runDeveloperInvestigation");
      queries.add("CONFIRM GITHUB EDIT");
    }

    const meaningfulWords = String(originalText)
      .replace(/[^\w\s.-]/g, " ")
      .split(/\s+/)
      .filter(word => word.length >= 5)
      .slice(0, 6)
      .join(" ");

    if (meaningfulWords) queries.add(meaningfulWords);

    return Array.from(queries).slice(0, 8);
  },

  buildTitle(behavior) {
    const titles = {
      natural_language_quality: "Improve Ari natural speech",
      understanding_and_context: "Improve Ari understanding",
      answer_discipline: "Improve Ari answer discipline",
      self_repair_loop: "Improve Ari self-repair loop"
    };

    return titles[behavior] || "Improve Ari behavior";
  },

  buildSummary(behavior, text) {
    return `Owner requested Ari behavior improvement. Ari should inspect the relevant Rebirth files, identify the bottleneck, and only propose a safe patch after exact code evidence exists. Request: ${text}`;
  },

  inferPriority(text = "") {
    if (
      this.hasAny(text, [
        "broken",
        "can't answer",
        "cannot answer",
        "useless",
        "major",
        "critical"
      ])
    ) {
      return "high";
    }

    return "medium";
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(term));
  }
};

console.log(
  "ARI REBIRTH SELF IMPROVEMENT ENGINE LOADED:",
  window.AriRebirthSelfImprovementEngine.version
);