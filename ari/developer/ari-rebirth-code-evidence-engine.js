// ari/developer/ari-rebirth-code-evidence-engine.js
// Ari Rebirth Code Evidence Engine
// Purpose: Convert developer understanding into executable evidence-gathering steps.
// V1.2.3 — Full-File Evidence Aware / Semantic Discovery / No Static File Trap

window.Ari = window.Ari || {};

window.AriRebirthCodeEvidenceEngine = {
  version: "1.2.3",

  build(input = {}) {
    const summary = input.summary || input || {};

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    if (!understanding?.isDeveloperWork) return null;

    const evidenceState = this.getRepositoryEvidenceState(summary);

    const searchSteps = evidenceState.hasCompleteEvidence
      ? []
      : this.buildSearchSteps(understanding);

    const readSteps = evidenceState.hasCompleteEvidence
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

      evidenceStatus: evidenceState.hasCompleteEvidence ? "complete" : "needed",
      canEditNow: evidenceState.hasCompleteEvidence,
      requiresReadBeforeEdit: !evidenceState.hasCompleteEvidence,
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
        canEditNow: evidenceState.hasCompleteEvidence,
        requiresReadBeforeEdit: !evidenceState.hasCompleteEvidence,
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
        requireFullFileEvidenceForPatch: true,
        textLengthDoesNotProveCompleteness: true,
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

    const directComplete =
      Boolean(directContent) &&
      (
        githubFileContext?.fullContent === true ||
        githubFileContext?.contentComplete === true ||
        githubFileContext?.isFullFile === true
      );

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

    const completeReads = successfulReads.filter(item => {
      const result = item.result || item;

      return (
        result.fullContent === true ||
        result.contentComplete === true ||
        result.isFullFile === true
      );
    });

    const hasAnyEvidence = Boolean(directContent || successfulReads.length);
    const hasCompleteEvidence = Boolean(directComplete || completeReads.length);

    const firstCompleteRead = completeReads[0] || null;
    const firstSuccessfulRead = successfulReads[0] || null;

    const selectedRead = firstCompleteRead || firstSuccessfulRead;
    const selectedResult = selectedRead?.result || selectedRead || null;

    return {
      available: hasAnyEvidence,
      hasAnyEvidence,
      hasCompleteEvidence,
      source: directComplete
        ? "github_file_context_full_file"
        : directContent
          ? "github_file_context_partial_or_unverified"
          : completeReads.length
            ? "developer_investigation_full_file_read_results"
            : successfulReads.length
              ? "developer_investigation_partial_or_unverified_read_results"
              : "none",

      filePath:
        githubFileContext?.filePath ||
        selectedRead?.filePath ||
        selectedResult?.filePath ||
        null,

      contentLength:
        directContent.length ||
        String(selectedResult?.content || "").length ||
        0,

      lineCount:
        githubFileContext?.lineCount ||
        selectedResult?.lineCount ||
        String(directContent || selectedResult?.content || "").split("\n").length ||
        0,

      readCount: successfulReads.length,
      completeReadCount: completeReads.length,

      hasExactCurrentCode: hasCompleteEvidence,
      canProceedToPatchDecision: hasCompleteEvidence,

      fullContent:
        githubFileContext?.fullContent === true ||
        selectedResult?.fullContent === true,

      contentComplete:
        githubFileContext?.contentComplete === true ||
        selectedResult?.contentComplete === true,

      isFullFile:
        githubFileContext?.isFullFile === true ||
        selectedResult?.isFullFile === true,

      warning: hasAnyEvidence && !hasCompleteEvidence
        ? "Repository content exists, but Ari cannot treat it as complete full-file evidence yet."
        : null
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
          semanticPurpose: this.semanticPurposeForQuery(query, understanding),
          required: false,
          discoverMoreFiles: true
        };
      })
      .filter(Boolean)
      .slice(0, 12);
  },

  buildReadSteps(understanding = {}) {
    const target = understanding.targetObject || {};

    if (target.kind === "file" && target.filePath) {
      return [{
        tool: "github_read",
        filePath: target.filePath,
        reason: "Owner named this file. Read exact full current content before analysis.",
        required: true,
        requireFullFile: true
      }];
    }

    return this.expandLikelyFiles(understanding)
      .map(filePath => ({
        tool: "github_read",
        filePath,
        reason: this.reasonForRead(filePath, understanding),
        required: false,
        requireFullFile: true,
        seedFile: true
      }))
      .slice(0, 10);
  },

  buildAnalysisSteps() {
    return [
      {
        tool: "code_understanding",
        reason: "Map code structure, functions, DOM IDs, risks, and likely change zones."
      },
      {
        tool: "patch_decision",
        reason: "Decide if complete full-file evidence exists for a safe patch.",
        requiresExactFindText: true,
        requiresFullFileEvidence: true,
        requiresOwnerConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT"
      }
    ];
  },

  expandSearchConcepts(understanding = {}) {
    const concepts = new Set([
      ...(understanding.searchConcepts || []),
      understanding.userGoal,
      understanding.requestedChange,
      understanding.targetObject?.name,
      understanding.targetObject?.filePath,
      understanding.targetArea,
      understanding.intentFamily
    ]);

    const targetArea = understanding.targetArea || "";
    const intentFamily = understanding.intentFamily || "";

    const add = arr => arr.forEach(item => concepts.add(item));

    if (targetArea === "homepage_ui" || intentFamily === "homepage_redesign_or_patch") {
      add([
        "homepage Ari mascot",
        "data-ari-mascot",
        "ari mascot",
        "ari avatar",
        "ari-hero",
        "ari-hero-section",
        "ari-master-home",
        "ari-search-section",
        "ariConversationPanel",
        "ari-action-grid",
        "ARI_DEFAULT_BUBBLE",
        "sendAriMessage",
        "toggleConversationHistory"
      ]);
    }

    if (targetArea === "ari_response_behavior" || intentFamily === "improve_ari_behavior") {
      add([
        "finalResponse",
        "languageComposerOutput",
        "developerResponseLocked",
        "composerDeveloperPacket",
        "communicationPlan",
        "compose",
        "cleanReply",
        "extractReply",
        "reply",
        "response"
      ]);
    }

    if (targetArea === "repository_layer") {
      add([
        "ari-github-read",
        "ari-github-search",
        "ari-github-edit",
        "fullContent",
        "contentComplete",
        "isFullFile",
        "developerIntent",
        "githubEdit",
        "CONFIRM GITHUB EDIT"
      ]);
    }

    if (targetArea === "tooling" || intentFamily === "tool_or_feature_build") {
      add([
        "lookupBarcode",
        "analyzeImage",
        "searchKnowledge",
        "pendingAction",
        "CalBuddy.api",
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
      .slice(0, 24);
  },

  expandLikelyFiles(understanding = {}) {
    const files = new Set();

    const target = understanding.targetObject || {};
    const likelyFiles = Array.isArray(understanding.likelyFiles)
      ? understanding.likelyFiles
      : [];

    likelyFiles.forEach(filePath => files.add(filePath));

    if (target.filePath) files.add(target.filePath);

    const targetArea = understanding.targetArea || "";
    const intentFamily = understanding.intentFamily || "";

    const addSeeds = arr => arr.forEach(filePath => files.add(filePath));

    if (targetArea === "homepage_ui" || intentFamily === "homepage_redesign_or_patch") {
      addSeeds([
        "index.html",
        "style.css"
      ]);
    }

    if (targetArea === "ari_response_behavior" || intentFamily === "improve_ari_behavior") {
      addSeeds([
        "ari/ari-rebirth-app-bridge.js",
        "ari/language/ari-composer-bridge.js",
        "ari/language/ari-ai-writer.js",
        "ari/language/ari-language-composer-v9.js",
        "ari/language/ari-language-composer.js",
        "api/ask-calbuddy.js"
      ]);
    }

    if (targetArea === "repository_layer") {
      addSeeds([
        "api/ari-github-read.js",
        "api/ari-github-search.js",
        "api/ari-github-edit.js",
        "calbuddy-core.js"
      ]);
    }

    if (targetArea === "tooling" || intentFamily === "tool_or_feature_build") {
      addSeeds([
        "calbuddy-core.js",
        "api/actions.js",
        "api/ask-calbuddy.js",
        "ari/ari-rebirth-app-bridge.js"
      ]);
    }

    if (targetArea === "data_layer") {
      addSeeds([
        "calbuddy-core.js",
        "api/actions.js",
        "supabase-config.js"
      ]);
    }

    if (!files.size) {
      addSeeds([
        "index.html",
        "style.css",
        "calbuddy-core.js",
        "api/ask-calbuddy.js",
        "ari/ari-rebirth-app-bridge.js"
      ]);
    }

    return Array.from(files)
      .map(filePath => String(filePath || "").trim())
      .filter(Boolean)
      .slice(0, 12);
  },

  reasonForSearch(query = "", understanding = {}) {
    return `Semantic discovery search for "${query}" related to ${
      understanding.intentFamily || "developer work"
    } in ${understanding.targetArea || "unknown area"}.`;
  },

  semanticPurposeForQuery(query = "") {
    const q = String(query).toLowerCase();

    if (q.includes("mascot") || q.includes("avatar") || q.includes("ari") || q.includes("bubble")) {
      return "Discover Ari UI, mascot, avatar, bubble, or conversation files.";
    }

    if (q.includes("meter") || q.includes("calorie")) {
      return "Discover calorie meter rendering and update logic.";
    }

    if (q.includes("github") || q.includes("fullcontent") || q.includes("contentcomplete")) {
      return "Discover repository read/search/edit evidence flow.";
    }

    if (q.includes("composer") || q.includes("response") || q.includes("reply")) {
      return "Discover final response generation and locked-template behavior.";
    }

    if (q.includes("barcode") || q.includes("tool") || q.includes("api")) {
      return "Discover tool/action/API capability code.";
    }

    return "Discover relevant repository files before reading or editing.";
  },

  reasonForRead(filePath = "", understanding = {}) {
    const reasons = {
      "index.html": "Seed read: homepage structure and visible Ari UI may live here.",
      "style.css": "Seed read: mascot visibility, layout, and homepage styling may live here.",
      "calbuddy-core.js": "Seed read: CalBuddy app brain, Ari handoff, GitHub handling, and context flow may live here.",
      "api/ask-calbuddy.js": "Seed read: server Ari prompt, response contract, developerIntent behavior, and fallback logic may live here.",
      "api/actions.js": "Seed read: app action endpoint before changing write-capable tools.",
      "api/ari-github-read.js": "Seed read: GitHub read endpoint and full-file evidence flags.",
      "api/ari-github-search.js": "Seed read: GitHub search endpoint and semantic repository discovery.",
      "api/ari-github-edit.js": "Seed read: GitHub edit endpoint before patch, commit, preview, or undo changes.",
      "ari/ari-rebirth-app-bridge.js": "Seed read: Rebirth bridge, developerIntent handoff, and file evidence handling.",
      "ari/language/ari-composer-bridge.js": "Seed read: composer packet routing and locked developer packet behavior.",
      "ari/language/ari-ai-writer.js": "Seed read: AI writer behavior for natural responses.",
      "ari/language/ari-language-composer-v9.js": "Seed read: modern final response composer behavior.",
      "ari/language/ari-language-composer.js": "Seed read: fallback or legacy final response composer behavior."
    };

    if (reasons[filePath]) return reasons[filePath];

    return `Seed read for likely ${understanding.targetArea || "developer"} file. Search may discover more exact files.`;
  },

  inferNextRequiredAction({
    understanding = {},
    searchSteps = [],
    readSteps = [],
    evidenceState = {}
  }) {
    const target = understanding.targetObject || {};

    if (evidenceState.hasCompleteEvidence) {
      return {
        type: "patch_decision",
        tool: "patch_decision",
        filePath: evidenceState.filePath || target.filePath || null,
        reason: "Complete full-file repository evidence is available. Proceed to patch decision."
      };
    }

    if (evidenceState.hasAnyEvidence && !evidenceState.hasCompleteEvidence) {
      return {
        type: "read_full_file",
        tool: "github_read",
        filePath: evidenceState.filePath || target.filePath || null,
        reason: "Partial or unverified code evidence exists, but patching requires full-file evidence."
      };
    }

    if (target.kind === "file" && target.filePath) {
      return {
        type: "read_full_file",
        tool: "github_read",
        filePath: target.filePath,
        reason: "Specific file is known. Read exact full current content next."
      };
    }

    if (searchSteps.length) {
      return {
        type: "semantic_search_then_read",
        firstTool: "github_search",
        firstQuery: searchSteps[0].query,
        seedReadFiles: readSteps.map(step => step.filePath),
        reason: "Use semantic search to discover relevant files, then read full files before patching."
      };
    }

    if (readSteps.length) {
      return {
        type: "read_seed_file",
        tool: "github_read",
        filePath: readSteps[0].filePath,
        reason: "Read seed file, but do not treat seed files as the complete universe."
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
    if (evidenceState.hasCompleteEvidence) {
      return `Ari Rebirth has complete full-file repository evidence for: ${
        understanding.userGoal || "developer request"
      }. Proceed to code understanding and patch decision.`;
    }

    if (evidenceState.hasAnyEvidence) {
      return `Ari Rebirth has partial or unverified repository evidence for: ${
        understanding.userGoal || "developer request"
      }. Read full-file evidence before patching.`;
    }

    return `Ari Rebirth will use semantic discovery and seed reads for: ${
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
      .replace(/^ari_response_behavior$/i, "Ari response behavior")
      .replace(/^tool_or_feature_build$/i, "tool feature")
      .trim();

    if (!cleaned || cleaned.length < 2) return null;
    return cleaned.slice(0, 180);
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