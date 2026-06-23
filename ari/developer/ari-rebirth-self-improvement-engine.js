// ari/developer/ari-rebirth-self-improvement-engine.js
// Purpose: Detect Ari behavior flaws and turn them into safe improvement work.
// V1.1.0 — Semantic Self-Improvement / Consolidated Developer Flow / No Self-Editing Without Evidence

window.Ari = window.Ari || {};

window.AriRebirthSelfImprovementEngine = {
  version: "1.1.0",

  improve(input = {}) {
    const summary = input.summary || input || {};
    const text = this.getText(summary);
    const appContext = summary.appContext || {};

    if (!appContext.ownerMode) return null;

    const request = this.understandRequest(text, summary);
    if (!request.isSelfImprovement) return null;

    return {
      enabled: true,
      type: "developer_investigation",
      source: "ari-rebirth-self-improvement-engine",
      engineVersion: this.version,

      title: request.title,
      summary: request.summary,
      priority: request.priority,
      ownerCommand: true,

      intentFamily: "improve_ari_behavior",
      requestedChange: request.requestedChange,
      targetArea: "ari_response_behavior",
      behavior: request.behavior,
      behaviorGoal: request.behaviorGoal,
      failureMode: request.failureMode,

      targetObject: {
        kind: "ari_behavior",
        name: request.behavior,
        raw: text
      },

      likelyFiles: request.likelyFiles,
      searchConcepts: request.searchQueries,

      steps: this.buildSteps(request),

      canEditNow: false,
      requiresReadBeforeEdit: true,

      safeNextStep: {
        type: "investigate",
        searchConceptsFirst: true,
        readLikelyFiles: request.likelyFiles.slice(0, 4),
        reason:
          "Ari behavior changes must be evidence-based because bad patches can affect every response."
      },

      editPolicy: {
        semanticFirst: true,
        keywordOnlyRoutingForbidden: true,
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

  understandRequest(text = "", summary = {}) {
    const normalized = this.normalize(text);
    const behavior = this.detectBehavior(normalized, summary);

    if (!behavior) {
      return {
        isSelfImprovement: false
      };
    }

    const behaviorGoal = this.inferBehaviorGoal(behavior, normalized);
    const failureMode = this.inferFailureMode(behavior, normalized);
    const requestedChange = this.inferRequestedChange(behavior, normalized);
    const likelyFiles = this.inferLikelyFiles(behavior, normalized);
    const searchQueries = this.buildSearchQueries({
      behavior,
      behaviorGoal,
      failureMode,
      requestedChange,
      originalText: text
    });

    return {
      isSelfImprovement: true,
      behavior,
      behaviorGoal,
      failureMode,
      requestedChange,
      title: this.buildTitle(behavior),
      summary: this.buildSummary({ behavior, behaviorGoal, failureMode, text }),
      priority: this.inferPriority(normalized, failureMode),
      likelyFiles,
      searchQueries
    };
  },

  normalize(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  },

  detectBehavior(text = "", summary = {}) {
    const meaning = this.semanticMeaning(text);

    if (meaning.naturalLanguageQuality >= 2) {
      return "natural_language_quality";
    }

    if (meaning.understandingAndContext >= 2) {
      return "understanding_and_context";
    }

    if (meaning.answerDiscipline >= 2) {
      return "answer_discipline";
    }

    if (meaning.selfRepairLoop >= 2) {
      return "self_repair_loop";
    }

    if (meaning.developerBehavior >= 2) {
      return "developer_behavior";
    }

    return null;
  },

  semanticMeaning(text = "") {
    return {
      naturalLanguageQuality: this.scoreConcept(text, [
        "speak more naturally",
        "sound more natural",
        "less robotic",
        "more human",
        "talk better",
        "answer better",
        "better response",
        "too generic",
        "too vague",
        "sounds fake",
        "not conversational"
      ]),

      understandingAndContext: this.scoreConcept(text, [
        "understand better",
        "misunderstood",
        "wrong intent",
        "not what i asked",
        "context",
        "follow up",
        "remember conversation",
        "lost the thread",
        "current question",
        "prior conversation"
      ]),

      answerDiscipline: this.scoreConcept(text, [
        "ask too many questions",
        "too many follow ups",
        "keeps asking",
        "doesn't answer",
        "does not answer",
        "answer directly",
        "direct answer",
        "stop dodging",
        "just answer"
      ]),

      selfRepairLoop: this.scoreConcept(text, [
        "fix herself",
        "improve herself",
        "self improve",
        "update herself",
        "patch herself",
        "ari bug",
        "find her own bugs",
        "fix her own bugs"
      ]),

      developerBehavior: this.scoreConcept(text, [
        "developer mode",
        "github",
        "search files",
        "read files",
        "patch code",
        "commit",
        "developer intent",
        "bug fix"
      ])
    };
  },

  scoreConcept(text = "", phrases = []) {
    let score = 0;

    phrases.forEach(phrase => {
      if (text.includes(phrase)) score += 2;
    });

    const words = text.split(/\s+/);

    phrases.forEach(phrase => {
      const phraseWords = phrase.split(/\s+/).filter(word => word.length >= 4);
      const hits = phraseWords.filter(word => words.includes(word)).length;

      if (hits >= 2) score += 1;
    });

    return score;
  },

  inferBehaviorGoal(behavior, text = "") {
    const goals = {
      natural_language_quality:
        "Make Ari sound more natural, specific, emotionally intelligent, and less robotic.",
      understanding_and_context:
        "Improve Ari’s ability to understand the current request while using prior context correctly.",
      answer_discipline:
        "Make Ari answer directly when enough evidence exists and avoid unnecessary follow-up questions.",
      self_repair_loop:
        "Improve Ari’s ability to detect her own flaws, investigate code evidence, and request safe patches.",
      developer_behavior:
        "Improve Ari’s developer workflow: search, read, analyze, decide, then request owner-approved edits."
    };

    return goals[behavior] || "Improve Ari behavior safely.";
  },

  inferFailureMode(behavior, text = "") {
    if (text.includes("too generic") || text.includes("vague")) {
      return "generic_or_vague_response";
    }

    if (text.includes("robotic") || text.includes("fake")) {
      return "robotic_language";
    }

    if (text.includes("doesn't answer") || text.includes("does not answer") || text.includes("stop dodging")) {
      return "fails_to_answer_directly";
    }

    if (text.includes("misunderstood") || text.includes("wrong intent")) {
      return "intent_misread";
    }

    if (text.includes("context") || text.includes("remember") || text.includes("lost the thread")) {
      return "context_continuity_failure";
    }

    if (text.includes("fix herself") || text.includes("patch herself")) {
      return "self_repair_not_connected";
    }

    return `${behavior}_needs_improvement`;
  },

  inferRequestedChange(behavior, text = "") {
    if (behavior === "natural_language_quality") return "improve_response_naturalness";
    if (behavior === "understanding_and_context") return "improve_context_understanding";
    if (behavior === "answer_discipline") return "improve_direct_answer_behavior";
    if (behavior === "self_repair_loop") return "improve_self_repair_workflow";
    if (behavior === "developer_behavior") return "improve_developer_workflow";

    return "improve_ari_behavior";
  },

  inferLikelyFiles(behavior, text = "") {
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
      files.add("ari/continuity/ari-conversation-meaning-history.js");
      files.add("ari/integration/ari-rebirth-pipeline.js");
    }

    if (behavior === "answer_discipline") {
      files.add("ari/language/ari-language-composer.js");
      files.add("ari/language/ari-communication-planner.js");
      files.add("ari/triage/ari-situation-contract-engine.js");
      files.add("ari/ari-rebirth-app-bridge.js");
    }

    if (behavior === "self_repair_loop" || behavior === "developer_behavior") {
      files.add("ari/developer/ari-rebirth-developer-understanding-engine.js");
      files.add("ari/developer/ari-rebirth-code-evidence-engine.js");
      files.add("ari/developer/ari-rebirth-code-understanding-engine.js");
      files.add("ari/developer/ari-rebirth-patch-decision-engine.js");
      files.add("ari/developer/ari-rebirth-self-improvement-engine.js");
      files.add("calbuddy-core.js");
      files.add("ari/ari-rebirth-app-bridge.js");
    }

    return Array.from(files).slice(0, 8);
  },

  buildSearchQueries({
    behavior,
    behaviorGoal = "",
    failureMode = "",
    requestedChange = "",
    originalText = ""
  } = {}) {
    const queries = new Set();

    queries.add(behavior);
    queries.add(failureMode);
    queries.add(requestedChange);

    if (behavior === "natural_language_quality") {
      [
        "finalResponse",
        "languageComposerOutput",
        "communicationPlan",
        "compose",
        "cleanReply",
        "extractReply",
        "mouth",
        "response plan"
      ].forEach(q => queries.add(q));
    }

    if (behavior === "understanding_and_context") {
      [
        "semanticFrame",
        "threadUnderstanding",
        "conversationMeaningHistory",
        "resolvedUserQuestion",
        "contextAssembler",
        "activeSemanticFrame",
        "currentTurn"
      ].forEach(q => queries.add(q));
    }

    if (behavior === "answer_discipline") {
      [
        "followUpNeeded",
        "recommendedQuestion",
        "Answer the primary lane directly",
        "clarifying",
        "primary lane",
        "situationContract",
        "communicationPlan"
      ].forEach(q => queries.add(q));
    }

    if (behavior === "self_repair_loop" || behavior === "developer_behavior") {
      [
        "developerUnderstanding",
        "codeEvidence",
        "codeUnderstanding",
        "patchDecision",
        "developerIntent",
        "developer_investigation",
        "githubEdit",
        "runDeveloperInvestigation",
        "CONFIRM GITHUB EDIT"
      ].forEach(q => queries.add(q));
    }

    this.extractMeaningfulTerms(originalText).forEach(term => queries.add(term));

    return Array.from(queries)
      .map(q => String(q || "").trim())
      .filter(Boolean)
      .slice(0, 12);
  },

  buildSteps(request = {}) {
    const steps = [];

    request.searchQueries.forEach(query => {
      steps.push({
        tool: "github_search",
        query,
        reason: "Find exact Ari behavior code before proposing changes."
      });
    });

    request.likelyFiles.forEach(filePath => {
      steps.push({
        tool: "github_read",
        filePath,
        reason: "Read likely Ari behavior file before editing."
      });
    });

    steps.push({
      tool: "code_understanding",
      reason:
        "Map exact code behavior, response bottlenecks, risks, and safe change zones."
    });

    steps.push({
      tool: "patch_decision",
      reason:
        "Only propose an edit after exact current code evidence exists.",
      requiresExactFindText: true,
      requiresOwnerConfirmation: true,
      confirmationText: "CONFIRM GITHUB EDIT"
    });

    return this.dedupeSteps(steps).slice(0, 16);
  },

  buildTitle(behavior) {
    const titles = {
      natural_language_quality: "Improve Ari natural speech",
      understanding_and_context: "Improve Ari understanding and context",
      answer_discipline: "Improve Ari answer discipline",
      self_repair_loop: "Improve Ari self-repair loop",
      developer_behavior: "Improve Ari developer workflow"
    };

    return titles[behavior] || "Improve Ari behavior";
  },

  buildSummary({ behavior, behaviorGoal, failureMode, text }) {
    return `Owner requested Ari self-improvement. Behavior: ${behavior}. Goal: ${behaviorGoal}. Failure mode: ${failureMode}. Ari must inspect exact Rebirth code before proposing a safe patch. Request: ${text}`;
  },

  inferPriority(text = "", failureMode = "") {
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

    if (
      [
        "fails_to_answer_directly",
        "intent_misread",
        "self_repair_not_connected"
      ].includes(failureMode)
    ) {
      return "high";
    }

    return "medium";
  },

  extractMeaningfulTerms(text = "") {
    return String(text || "")
      .replace(/[^\w\s.-]/g, " ")
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length >= 5)
      .filter(word => !this.stopWords().includes(word.toLowerCase()))
      .slice(0, 8);
  },

  stopWords() {
    return [
      "about",
      "after",
      "again",
      "because",
      "could",
      "should",
      "would",
      "there",
      "their",
      "thing",
      "things",
      "right",
      "really",
      "maybe",
      "please"
    ];
  },

  dedupeSteps(steps = []) {
    const seen = new Set();

    return steps.filter(step => {
      const key = `${step.tool}:${step.query || step.filePath || step.reason}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(term));
  }
};

console.log(
  "ARI REBIRTH SELF IMPROVEMENT ENGINE LOADED:",
  window.AriRebirthSelfImprovementEngine.version
);