// ari/developer/ari-rebirth-code-evidence-engine.js
// Ari Rebirth Code Evidence Engine
// Purpose: Convert developer understanding into executable evidence-gathering steps.
// V1.2.2 — Repository Evidence Aware / Read-State Detection / Patch Gate Ready

window.Ari = window.Ari || {};

window.AriRebirthCodeEvidenceEngine = {
  version: "1.2.2",

  build(input = {}) {
    const summary = input.summary || input || {};

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    if (!understanding?.isDeveloperWork) return null;

    const evidenceState = this.getRepositoryEvidenceState(summary);

    const searchSteps = evidenceState.available
  ? []
  : this.buildSearchSteps(understanding);

const readSteps = evidenceState.available
  ? []
  : this.buildReadSteps(understanding);

const analysisSteps = this.buildAnalysisSteps();

const steps = this.dedupeSteps([
  ...searchSteps,
  ...readSteps,
  ...analysisSteps
]);

    const investigationPlan = this.buildInvestigationPlan({
  understanding,
  evidenceState,
  steps
});

    return {
      codeEvidenceRan: true,
      codeEvidenceVersion: this.version,
      source: "ari-rebirth-code-evidence-engine",

      evidenceStatus: evidenceState.available ? "available" : "needed",
      canEditNow: evidenceState.available,
      requiresReadBeforeEdit: !evidenceState.available,
      repositoryEvidence: evidenceState,

      intentFamily: understanding.intentFamily,
      targetArea: understanding.targetArea,
      targetObject: understanding.targetObject,
      userGoal: understanding.userGoal,
      requestedChange: understanding.requestedChange,
      riskLevel: understanding.riskLevel,
      urgency: understanding.urgency,

      investigationPlan,

      developerIntent: {
        enabled: true,
        type: "developer_investigation",
        title: investigationPlan.title,
        summary: investigationPlan.summary,
        priority: investigationPlan.priority,
        ownerCommand: true,
        intentFamily: understanding.intentFamily,
        targetArea: understanding.targetArea,
        targetObject: understanding.targetObject,
        steps,
        canEditNow: evidenceState.available,
        requiresReadBeforeEdit: !evidenceState.available,
        repositoryEvidence: evidenceState
      },

      searchSteps,
      readSteps,
      analysisSteps,
      steps,

      nextRequiredAction: this.inferNextRequiredAction({
        understanding,
        searchSteps,
        readSteps,
        evidenceState
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

  getRepositoryEvidenceState(summary = {}) {
    const githubFileContext =
      summary.githubFileContext ||
      summary.githubEvidence ||
      summary.appContext?.githubFileContext ||
      null;

    const directContent = String(githubFileContext?.content || "").trim();

    const investigation =
      summary.developerInvestigation ||
      summary.appContext?.developerInvestigation ||
      null;

    const readResults = Array.isArray(investigation?.readResults)
      ? investigation.readResults
      : [];

    const successfulReads = readResults.filter(item => {
      const result = item.result || item;
      return result?.success && String(result.content || "").trim();
    });

    const available = Boolean(directContent || successfulReads.length);

    return {
      available,
      source: directContent
        ? "github_file_context"
        : successfulReads.length
          ? "developer_investigation_read_results"
          : "none",
      filePath:
        githubFileContext?.filePath ||
        successfulReads[0]?.filePath ||
        successfulReads[0]?.result?.filePath ||
        null,
      contentLength:
        directContent.length ||
        String(successfulReads[0]?.result?.content || successfulReads[0]?.content || "").length ||
        0,
      readCount: successfulReads.length,
      hasExactCurrentCode: available,
      canProceedToPatchDecision: available
    };
  },

  buildInvestigationPlan({ understanding = {}, evidenceState = {}, steps = [] }) {
    return {
      title: this.buildTitle(understanding),
      summary: this.buildSummary(understanding, evidenceState),
      priority: this.inferPriority(understanding),
      ownerCommand: true,
      semanticFirst: true,
      stepCount: steps.length,
      firstStep: steps[0] || null
    };
  },

  buildSearchSteps(understanding = {}) {
    const target = understanding.targetObject || {};

    if (target.kind === "file" && target.filePath) return [];

    return this.expandSearchConcepts(understanding)
      .map(concept => {
        const query = this.cleanSearchQuery(concept);
        if (!query) return null;

        return {
          tool: "github_search",
          query,
          reason: this.reasonForSearch(query, understanding),
          semanticPurpose: this.semanticPurposeForQuery(query, understanding)
        };
      })
      .filter(Boolean)
      .slice(0, 10);
  },

  buildReadSteps(understanding = {}) {
    const target = understanding.targetObject || {};

    if (target.kind === "file" && target.filePath) {
      return [{
        tool: "github_read",
        filePath: target.filePath,
        reason: "Owner named this file. Read exact current content before analysis.",
        required: true
      }];
    }

    return this.expandLikelyFiles(understanding)
      .map(filePath => ({
        tool: "github_read",
        filePath,
        reason: this.reasonForRead(filePath, understanding),
        required: true
      }))
      .slice(0, 8);
  },

  buildAnalysisSteps() {
    return [
      {
        tool: "code_understanding",
        reason: "Map code structure, functions, DOM IDs, risks, and likely change zones."
      },
      {
        tool: "patch_decision",
        reason: "Decide if exact evidence exists for a safe patch.",
        requiresExactFindText: true,
        requiresOwnerConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT"
      }
    ];
  },

  expandSearchConcepts(understanding = {}) {
    const concepts = new Set([
      ...(understanding.searchConcepts || []),
      understanding.targetObject?.name,
      understanding.targetObject?.filePath,
      understanding.targetArea,
      understanding.intentFamily,
      understanding.requestedChange
    ]);

    const targetArea = understanding.targetArea || "";
    const intentFamily = understanding.intentFamily || "";

    const add = arr => arr.forEach(x => concepts.add(x));

    if (targetArea === "homepage_ui" || intentFamily === "homepage_redesign_or_patch") {
      add([
        "ari-master-home",
        "ari-hero-section",
        "ari-search-section",
        "ariConversationPanel",
        "ari-action-grid",
        "calorie-card",
        "ARI_DEFAULT_BUBBLE",
        "toggleConversationHistory",
        "sendAriMessage"
      ]);
    }

    if (targetArea === "ari_response_behavior" || intentFamily === "improve_ari_behavior") {
      add([
        "finalResponse",
        "languageComposerOutput",
        "communicationPlan",
        "compose",
        "cleanReply",
        "extractReply",
        "reply",
        "response"
      ]);
    }

    if (targetArea === "tooling" || intentFamily === "tool_or_feature_build") {
      add([
        "lookupBarcode",
        "analyzeImage",
        "searchKnowledge",
        "pendingAction",
        "CalBuddy.api",
        "api",
        "actions",
        "memory"
      ]);
    }

    if (targetArea === "calorie_meter") {
      add([
        "caloriesLeftText",
        "trueMeterFill",
        "updateLiveArchMeter",
        "updateMeterStatus",
        "calorie-card",
        "meter-fill"
      ]);
    }

    if (targetArea === "repository_layer") {
      add([
        "ari-github-read",
        "ari-github-search",
        "ari-github-edit",
        "developerIntent",
        "githubEdit",
        "CONFIRM GITHUB EDIT"
      ]);
    }

    if (targetArea === "data_layer") {
      add([
        "calbuddySupabase",
        "profiles",
        "meals",
        "weight_logs",
        "activity_logs",
        "updateProfile",
        "logMeal"
      ]);
    }

    return Array.from(concepts)
      .map(item => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 18);
  },

  expandLikelyFiles(understanding = {}) {
    const files = new Set(understanding.likelyFiles || []);
    const target = understanding.targetObject || {};
    const targetArea = understanding.targetArea || "";
    const intentFamily = understanding.intentFamily || "";

    if (target.filePath) files.add(target.filePath);

    const add = arr => arr.forEach(x => files.add(x));

    if (targetArea === "homepage_ui" || intentFamily === "homepage_redesign_or_patch") {
      add(["index.html", "style.css", "calbuddy-core.js"]);
    }

    if (targetArea === "ari_response_behavior" || intentFamily === "improve_ari_behavior") {
      add([
        "ari/language/ari-communication-planner.js",
        "ari/language/ari-language-composer.js",
        "ari/ari-rebirth-app-bridge.js",
        "api/ask-calbuddy.js"
      ]);
    }

    if (targetArea === "tooling" || intentFamily === "tool_or_feature_build") {
      add([
        "calbuddy-core.js",
        "api/actions.js",
        "api/ask-calbuddy.js",
        "ari/ari-rebirth-app-bridge.js"
      ]);
    }

    if (targetArea === "repository_layer") {
      add([
        "api/ari-github-read.js",
        "api/ari-github-search.js",
        "api/ari-github-edit.js",
        "calbuddy-core.js"
      ]);
    }

    if (targetArea === "data_layer") {
      add(["calbuddy-core.js", "api/actions.js", "supabase-config.js"]);
    }

    if (!files.size) {
      add(["index.html", "style.css", "calbuddy-core.js", "api/ask-calbuddy.js"]);
    }

    return Array.from(files).filter(Boolean).slice(0, 10);
  },

  reasonForSearch(query = "", understanding = {}) {
    return `Semantic search for "${query}" related to ${understanding.intentFamily || "developer work"} in ${understanding.targetArea || "unknown area"}.`;
  },

  semanticPurposeForQuery(query = "") {
    const q = String(query).toLowerCase();

    if (q.includes("ari") || q.includes("bubble") || q.includes("conversation")) {
      return "Locate Ari UI, conversation, or response behavior code.";
    }

    if (q.includes("meter") || q.includes("calorie")) {
      return "Locate calorie meter rendering and update logic.";
    }

    if (q.includes("github") || q.includes("developerintent")) {
      return "Locate developer workflow and GitHub handoff code.";
    }

    if (q.includes("barcode") || q.includes("tool") || q.includes("api")) {
      return "Locate tool/action/API capability code.";
    }

    return "Locate exact repository references before reading or editing.";
  },

  reasonForRead(filePath = "", understanding = {}) {
    const reasons = {
      "index.html": "Read homepage structure, Ari UI, visible buttons, inline scripts, and script loading order.",
      "style.css": "Read visual styling before layout, mobile spacing, meter, or Ari presentation changes.",
      "calbuddy-core.js": "Read CalBuddy app brain, Ari handoff, dashboard, actions, GitHub handling, and context flow.",
      "api/ask-calbuddy.js": "Read server Ari prompt, JSON contract, developerIntent behavior, and fallback response logic.",
      "api/actions.js": "Read app action endpoint before adding or changing write-capable tools.",
      "api/ari-github-read.js": "Read GitHub read endpoint before changing repository evidence flow.",
      "api/ari-github-search.js": "Read GitHub search endpoint before changing semantic repository search behavior.",
      "api/ari-github-edit.js": "Read GitHub edit endpoint before changing patch, commit, preview, or undo behavior."
    };

    if (reasons[filePath]) return reasons[filePath];

    if (filePath.includes("ari-rebirth-app-bridge")) {
      return "Read Rebirth bridge to verify action, developerIntent, and app handoff behavior.";
    }

    if (filePath.includes("ari-language-composer")) {
      return "Read final response writer for naturalness and style issues.";
    }

    if (filePath.includes("ari-communication-planner")) {
      return "Read communication planner for tone, directness, and speaking strategy.";
    }

    return `Read likely ${understanding.targetArea || "developer"} file before proposing code changes.`;
  },

  inferNextRequiredAction({
    understanding = {},
    searchSteps = [],
    readSteps = [],
    evidenceState = {}
  }) {
    const target = understanding.targetObject || {};

    if (evidenceState.available) {
      return {
        type: "patch_decision",
        tool: "patch_decision",
        filePath: evidenceState.filePath || target.filePath || null,
        reason: "Repository evidence is already available. Proceed to patch decision, not another read."
      };
    }

    if (target.kind === "file" && target.filePath) {
      return {
        type: "read",
        tool: "github_read",
        filePath: target.filePath,
        reason: "Specific file is known. Read exact current content next."
      };
    }

    if (searchSteps.length) {
      return {
        type: "search_then_read",
        firstTool: "github_search",
        firstQuery: searchSteps[0].query,
        readFilesAfterSearch: readSteps.map(step => step.filePath),
        reason: "Search concepts first, then read likely files before patching."
      };
    }

    if (readSteps.length) {
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

    return `Gather code evidence for ${target}`;
  },

  buildSummary(understanding = {}, evidenceState = {}) {
  if (evidenceState.available) {
    return `Ari Rebirth already has repository evidence for: ${
      understanding.userGoal || "developer request"
    }. Proceed to code understanding and patch decision.`;
  }

  return `Ari Rebirth will gather repository evidence for: ${
    understanding.userGoal || "developer request"
  }. Search/read must happen before patching.`;
},

  inferPriority(understanding = {}) {
    if (understanding.urgency === "high") return "high";
    if (understanding.riskLevel === "high") return "high";
    if (understanding.intentFamily === "bug_investigation") return "high";
    if (understanding.requestedChange === "diagnose_and_patch_bug") return "high";
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

    if (!cleaned || cleaned.length < 2) return null;
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