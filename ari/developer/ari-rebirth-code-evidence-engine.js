// ari/developer/ari-rebirth-code-evidence-engine.js
// Ari Rebirth Code Evidence Engine
// Purpose: Convert developer understanding into evidence-gathering steps.
// V1.1.0 — Semantic Evidence Plan / Planner Consolidated / Search + Read Discipline

window.Ari = window.Ari || {};

window.AriRebirthCodeEvidenceEngine = {
  version: "1.1.0",

  build(input = {}) {
    const summary = input.summary || input || {};

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    if (!understanding?.isDeveloperWork) return null;

    const searchSteps = this.buildSearchSteps(understanding);
    const readSteps = this.buildReadSteps(understanding);
    const analysisSteps = this.buildAnalysisSteps(understanding);
    const steps = this.dedupeSteps([
      ...searchSteps,
      ...readSteps,
      ...analysisSteps
    ]);

    return {
      codeEvidenceRan: true,
      codeEvidenceVersion: this.version,
      source: "ari-rebirth-code-evidence-engine",

      evidenceStatus: "needed",
      canEditNow: false,
      requiresReadBeforeEdit: true,

      intentFamily: understanding.intentFamily,
      targetArea: understanding.targetArea,
      targetObject: understanding.targetObject,
      userGoal: understanding.userGoal,
      requestedChange: understanding.requestedChange,
      riskLevel: understanding.riskLevel,
      urgency: understanding.urgency,

      investigationPlan: {
        title: this.buildTitle(understanding),
        summary: this.buildSummary(understanding),
        priority: this.inferPriority(understanding),
        ownerCommand: true,
        semanticFirst: true
      },

      searchSteps,
      readSteps,
      analysisSteps,
      steps,

      nextRequiredAction: this.inferNextRequiredAction({
        understanding,
        searchSteps,
        readSteps
      }),

      evidencePolicy: {
        semanticFirst: true,
        keywordOnlySearchForbidden: true,
        searchBeforeGuessing: true,
        readBeforeEditing: true,
        requireExactCurrentCode: true,
        requirePatchReason: true,
        requireOwnerConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT"
      }
    };
  },

  buildSearchSteps(understanding = {}) {
    const steps = [];
    const target = understanding.targetObject || {};

    if (target.kind === "file" && target.filePath) {
      return [];
    }

    const concepts = this.expandSearchConcepts(understanding);

    concepts.forEach(concept => {
      const query = this.cleanSearchQuery(concept);
      if (!query) return;

      steps.push({
        tool: "github_search",
        query,
        reason: this.reasonForSearch(query, understanding),
        semanticPurpose: this.semanticPurposeForQuery(query, understanding)
      });
    });

    return this.dedupeSteps(steps).slice(0, 10);
  },

  buildReadSteps(understanding = {}) {
    const steps = [];
    const target = understanding.targetObject || {};
    const likelyFiles = this.expandLikelyFiles(understanding);

    if (target.kind === "file" && target.filePath) {
      steps.push({
        tool: "github_read",
        filePath: target.filePath,
        reason: "Owner named this file. Read exact current content before analysis.",
        required: true
      });

      return steps;
    }

    likelyFiles.forEach(filePath => {
      if (!filePath) return;

      steps.push({
        tool: "github_read",
        filePath,
        reason: this.reasonForRead(filePath, understanding),
        required: true
      });
    });

    return this.dedupeSteps(steps).slice(0, 8);
  },

  buildAnalysisSteps(understanding = {}) {
    return [
      {
        tool: "code_understanding",
        reason:
          "Map exact code structure, functions, DOM IDs, classes, risks, and likely change zones."
      },
      {
        tool: "patch_decision",
        reason:
          "Decide whether enough exact code evidence exists for a safe find/replace or full file patch.",
        requiresExactFindText: true,
        requiresOwnerConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT"
      }
    ];
  },

  expandSearchConcepts(understanding = {}) {
    const concepts = new Set();

    const rawConcepts = Array.isArray(understanding.searchConcepts)
      ? understanding.searchConcepts
      : [];

    rawConcepts.forEach(item => concepts.add(item));

    const targetArea = understanding.targetArea || "";
    const intentFamily = understanding.intentFamily || "";
    const targetName = understanding.targetObject?.name || "";
    const requestedChange = understanding.requestedChange || "";

    if (targetName) concepts.add(targetName);
    if (targetArea) concepts.add(targetArea);
    if (intentFamily) concepts.add(intentFamily);
    if (requestedChange) concepts.add(requestedChange);

    if (targetArea === "homepage_ui" || intentFamily === "homepage_redesign_or_patch") {
      [
        "ari-master-home",
        "ari-hero-section",
        "ari-search-section",
        "ariConversationPanel",
        "ari-action-grid",
        "calorie-card",
        "ARI_DEFAULT_BUBBLE",
        "toggleConversationHistory",
        "sendAriMessage"
      ].forEach(x => concepts.add(x));
    }

    if (targetArea === "ari_response_behavior" || intentFamily === "improve_ari_behavior") {
      [
        "finalResponse",
        "languageComposerOutput",
        "communicationPlan",
        "compose",
        "cleanReply",
        "extractReply",
        "response",
        "reply"
      ].forEach(x => concepts.add(x));
    }

    if (targetArea === "tooling" || intentFamily === "tool_or_feature_build") {
      [
        "lookupBarcode",
        "analyzeImage",
        "searchKnowledge",
        "pendingAction",
        "CalBuddy.api",
        "api",
        "actions",
        "memory"
      ].forEach(x => concepts.add(x));
    }

    if (targetArea === "calorie_meter") {
      [
        "caloriesLeftText",
        "trueMeterFill",
        "updateLiveArchMeter",
        "updateMeterStatus",
        "calorie-card",
        "meter-fill"
      ].forEach(x => concepts.add(x));
    }

    if (targetArea === "repository_layer") {
      [
        "ari-github-read",
        "ari-github-search",
        "ari-github-edit",
        "developerIntent",
        "githubEdit",
        "CONFIRM GITHUB EDIT"
      ].forEach(x => concepts.add(x));
    }

    if (targetArea === "data_layer") {
      [
        "calbuddySupabase",
        "profiles",
        "meals",
        "weight_logs",
        "activity_logs",
        "updateProfile",
        "logMeal"
      ].forEach(x => concepts.add(x));
    }

    return Array.from(concepts)
      .map(item => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 18);
  },

  expandLikelyFiles(understanding = {}) {
    const files = new Set();

    const target = understanding.targetObject || {};
    const targetArea = understanding.targetArea || "";
    const intentFamily = understanding.intentFamily || "";

    if (target.kind === "file" && target.filePath) {
      files.add(target.filePath);
    }

    const likelyFiles = Array.isArray(understanding.likelyFiles)
      ? understanding.likelyFiles
      : [];

    likelyFiles.forEach(filePath => files.add(filePath));

    if (targetArea === "homepage_ui" || intentFamily === "homepage_redesign_or_patch") {
      files.add("index.html");
      files.add("style.css");
      files.add("calbuddy-core.js");
    }

    if (targetArea === "ari_response_behavior" || intentFamily === "improve_ari_behavior") {
      files.add("ari/language/ari-communication-planner.js");
      files.add("ari/language/ari-language-composer.js");
      files.add("ari/ari-rebirth-app-bridge.js");
      files.add("api/ask-calbuddy.js");
    }

    if (targetArea === "tooling" || intentFamily === "tool_or_feature_build") {
      files.add("calbuddy-core.js");
      files.add("api/actions.js");
      files.add("api/ask-calbuddy.js");
      files.add("ari/ari-rebirth-app-bridge.js");
    }

    if (targetArea === "repository_layer") {
      files.add("api/ari-github-read.js");
      files.add("api/ari-github-search.js");
      files.add("api/ari-github-edit.js");
      files.add("calbuddy-core.js");
    }

    if (targetArea === "data_layer") {
      files.add("calbuddy-core.js");
      files.add("api/actions.js");
      files.add("supabase-config.js");
    }

    if (!files.size) {
      files.add("index.html");
      files.add("style.css");
      files.add("calbuddy-core.js");
      files.add("api/ask-calbuddy.js");
    }

    return Array.from(files).filter(Boolean).slice(0, 10);
  },

  reasonForSearch(query = "", understanding = {}) {
    const targetArea = understanding.targetArea || "unknown";
    const intentFamily = understanding.intentFamily || "developer request";

    return `Semantic search for "${query}" related to ${intentFamily} in ${targetArea}.`;
  },

  semanticPurposeForQuery(query = "", understanding = {}) {
    const q = String(query || "").toLowerCase();

    if (q.includes("ari") || q.includes("bubble") || q.includes("conversation")) {
      return "Locate Ari UI, conversation, or response behavior code.";
    }

    if (q.includes("meter") || q.includes("calorie")) {
      return "Locate calorie meter rendering and update logic.";
    }

    if (q.includes("github") || q.includes("developerintent")) {
      return "Locate developer workflow and GitHub action handoff code.";
    }

    if (q.includes("barcode") || q.includes("tool") || q.includes("api")) {
      return "Locate tool/action/API capability code.";
    }

    return "Locate exact repository references before reading or editing.";
  },

  reasonForRead(filePath = "", understanding = {}) {
    const targetArea = understanding.targetArea || "unknown";

    if (filePath === "index.html") {
      return "Read homepage structure, Ari UI, visible buttons, inline scripts, and script loading order.";
    }

    if (filePath === "style.css") {
      return "Read visual styling before layout, mobile spacing, meter, or Ari presentation changes.";
    }

    if (filePath === "calbuddy-core.js") {
      return "Read CalBuddy app brain, Ari handoff, dashboard, actions, GitHub handling, and context flow.";
    }

    if (filePath === "api/ask-calbuddy.js") {
      return "Read server Ari prompt, JSON contract, developerIntent behavior, and fallback response logic.";
    }

    if (filePath === "api/actions.js") {
      return "Read app action endpoint before adding or changing write-capable tools.";
    }

    if (filePath === "api/ari-github-read.js") {
      return "Read GitHub read endpoint before changing repository evidence flow.";
    }

    if (filePath === "api/ari-github-search.js") {
      return "Read GitHub search endpoint before changing semantic repository search behavior.";
    }

    if (filePath === "api/ari-github-edit.js") {
      return "Read GitHub edit endpoint before changing patch, commit, preview, or undo behavior.";
    }

    if (filePath.includes("ari-rebirth-app-bridge")) {
      return "Read Rebirth bridge to verify action, developerIntent, and app handoff behavior.";
    }

    if (filePath.includes("ari-language-composer")) {
      return "Read final response writer for naturalness and style issues.";
    }

    if (filePath.includes("ari-communication-planner")) {
      return "Read communication planner for tone, directness, and speaking strategy.";
    }

    if (filePath.includes("self-improvement")) {
      return "Read self-improvement logic before letting Ari suggest changes to herself.";
    }

    return `Read likely ${targetArea} file before proposing code changes.`;
  },

  inferNextRequiredAction({ understanding = {}, searchSteps = [], readSteps = [] }) {
    const target = understanding.targetObject || {};

    if (target.kind === "file" && target.filePath) {
      return {
        type: "read",
        tool: "github_read",
        filePath: target.filePath,
        reason: "Specific file is known. Read exact current content next."
      };
    }

    if (searchSteps.length > 0) {
      return {
        type: "search_then_read",
        firstTool: "github_search",
        firstQuery: searchSteps[0].query,
        readFilesAfterSearch: readSteps.map(step => step.filePath),
        reason: "Search concepts first, then read likely files before patching."
      };
    }

    if (readSteps.length > 0) {
      return {
        type: "read",
        tool: "github_read",
        filePath: readSteps[0].filePath,
        reason: "Likely file is known. Read exact current content next."
      };
    }

    return {
      type: "ask_owner",
      reason: "Not enough target evidence to search or read safely."
    };
  },

  buildTitle(understanding = {}) {
    const target =
      understanding.targetObject?.name ||
      understanding.targetObject?.filePath ||
      understanding.targetArea ||
      "CalBuddy code";

    const intent = understanding.intentFamily || "developer request";

    return `Gather code evidence for ${target} (${intent})`;
  },

  buildSummary(understanding = {}) {
    return `Ari Rebirth will gather repository evidence for: ${
      understanding.userGoal || "developer request"
    }. It must search/read before patching.`;
  },

  inferPriority(understanding = {}) {
    if (understanding.urgency === "high") return "high";
    if (understanding.riskLevel === "high") return "high";

    if (
      understanding.intentFamily === "bug_investigation" ||
      understanding.requestedChange === "diagnose_and_patch_bug"
    ) {
      return "high";
    }

    if (understanding.riskLevel === "medium_high") return "medium_high";

    return "medium";
  },

  cleanSearchQuery(query = "") {
    const cleaned = String(query || "")
      .replace(/^unknown$/i, "")
      .replace(/^general_developer_help$/i, "")
      .replace(/^developer_analysis_needed$/i, "")
      .replace(/^specific_file$/i, "")
      .replace(/^homepage_ui$/i, "homepage")
      .replace(/^ari_response_behavior$/i, "Ari response")
      .replace(/^tool_or_feature_build$/i, "tool feature")
      .trim();

    if (!cleaned) return null;
    if (cleaned.length < 2) return null;

    return cleaned.slice(0, 140);
  },

  dedupeSteps(steps = []) {
    const seen = new Set();

    return steps.filter(step => {
      const key = `${step.tool}:${step.query || step.filePath || step.reason}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

console.log(
  "ARI REBIRTH CODE EVIDENCE ENGINE LOADED:",
  window.AriRebirthCodeEvidenceEngine.version
);