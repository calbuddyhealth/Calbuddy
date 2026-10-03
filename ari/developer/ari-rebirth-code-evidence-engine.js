// ari/developer/ari-rebirth-code-evidence-engine.js
// Ari compatibility Code Evidence Engine
// Purpose: Convert developer understanding into executable evidence-gathering steps.
// V1.3.0 — vNext-aware semantic discovery / full-file evidence required.

window.Ari = window.Ari || {};

window.AriRebirthCodeEvidenceEngine = {
  version: "1.3.0",

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
      compatibilityEngine: true,
      canonicalRuntime: "ari-vnext",
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
        currentMainFirst: true,
        canonicalVNextFirst: true,
        keywordOnlySearchForbidden: true,
        searchBeforeGuessing: true,
        readBeforeEditing: true,
        requireExactCurrentCode: true,
        requireFullFileEvidenceForPatch: true,
        textLengthDoesNotProveCompleteness: true,
        classifyFailingTestsByCausalRelevance: true,
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
    const directComplete = Boolean(directContent) && (
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
      return result.fullContent === true ||
        result.contentComplete === true ||
        result.isFullFile === true;
    });
    const hasAnyEvidence = Boolean(directContent || successfulReads.length);
    const hasCompleteEvidence = Boolean(directComplete || completeReads.length);
    const selectedRead = completeReads[0] || successfulReads[0] || null;
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
      fullContent: githubFileContext?.fullContent === true || selectedResult?.fullContent === true,
      contentComplete: githubFileContext?.contentComplete === true || selectedResult?.contentComplete === true,
      isFullFile: githubFileContext?.isFullFile === true || selectedResult?.isFullFile === true,
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
      canonicalRuntime: "ari-vnext",
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
        reason: "Map the current causal path, contracts, state ownership, risks, and likely change zones."
      },
      {
        tool: "patch_decision",
        reason: "Classify contradictory evidence and failing tests, then decide repair versus rebuild before editing.",
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
      add(["home.html", "sendAriMessage", "ari-v1-home", "ariConversationShell", "home-thread-ux", "visualViewport"]);
    }
    if (targetArea === "ari_response_behavior" || intentFamily === "improve_ari_behavior") {
      add(["runAriVNext", "deriveDeliberationHarness", "deriveAriExecutivePolicy", "AriVNextBridge", "ari-runtime-controller", "orchestrator"]);
    }
    if (targetArea === "repository_layer") {
      add(["ari-github-read", "ari-github-search", "ari-github-edit", "fullContent", "contentComplete", "isFullFile", "developerIntent"]);
    }
    if (targetArea === "tooling" || intentFamily === "tool_or_feature_build") {
      add(["getAriTools", "validateToolCall", "toolToApplicationAction", "pendingAction", "tools-core", "operation registry"]);
    }
    if (targetArea === "calorie_meter") {
      add(["nutrition", "daily_calorie_goal", "caloriesConsumed", "caloriesBurned", "authoritative-context"]);
    }
    if (targetArea === "data_layer") {
      add(["authoritative-context", "context-router", "calbuddySupabase", "profiles", "meals", "weight_logs", "activity_logs"]);
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
      addSeeds(["home.html", "js/home.js", "js/home-resilience.js", "assets/css/home.css", "assets/css/home-thread-ux.css"]);
    }
    if (targetArea === "ari_response_behavior" || intentFamily === "improve_ari_behavior") {
      addSeeds([
        "api/ari-vnext.js",
        "api/_lib/ari-vnext/orchestrator.js",
        "api/_lib/ari-vnext/ari-executive.js",
        "api/_lib/ari-vnext/deliberation-harness.js",
        "ari/runtime/ari-runtime-controller.js",
        "ari/vnext/ari-vnext-bridge.js"
      ]);
    }
    if (targetArea === "repository_layer") {
      addSeeds(["api/ari-github-read.js", "api/ari-github-search.js", "api/ari-github-edit.js", "api/_lib/ari-vnext/orchestrator.js"]);
    }
    if (targetArea === "tooling" || intentFamily === "tool_or_feature_build") {
      addSeeds(["api/_lib/ari-vnext/tools.js", "api/_lib/ari-vnext/tools-core.js", "api/_lib/ari-vnext/orchestrator.js"]);
    }
    if (targetArea === "data_layer") {
      addSeeds(["api/_lib/ari-vnext/authoritative-context.js", "api/_lib/ari-vnext/context-router.js", "js/auth.js", "supabase-config.js"]);
    }
    if (!files.size) {
      addSeeds(["api/_lib/ari-vnext/orchestrator.js", "ari/runtime/ari-runtime-controller.js", "home.html", "calbuddy-core.js"]);
    }

    return Array.from(files)
      .map(filePath => String(filePath || "").trim())
      .filter(Boolean)
      .slice(0, 12);
  },

  reasonForSearch(query = "", understanding = {}) {
    return `Semantic discovery search for "${query}" related to ${understanding.intentFamily || "developer work"} in ${understanding.targetArea || "unknown area"}.`;
  },

  semanticPurposeForQuery(query = "") {
    const q = String(query).toLowerCase();
    if (q.includes("home") || q.includes("mascot") || q.includes("viewport")) return "Discover the live Home UI, event, and layout path.";
    if (q.includes("meter") || q.includes("calorie") || q.includes("nutrition")) return "Discover authoritative nutrition state and rendering logic.";
    if (q.includes("github") || q.includes("fullcontent") || q.includes("contentcomplete")) return "Discover repository evidence and edit flow.";
    if (q.includes("orchestrator") || q.includes("response") || q.includes("reply") || q.includes("deliberation")) return "Discover canonical vNext reasoning and response generation.";
    if (q.includes("tool") || q.includes("api") || q.includes("operation")) return "Discover vNext tool, action, endpoint, and RPC capability code.";
    return "Discover relevant current repository files before reading or editing.";
  },

  reasonForRead(filePath = "", understanding = {}) {
    const reasons = {
      "home.html": "Seed read: canonical Home structure and live script/style wiring.",
      "js/home.js": "Seed read: canonical Home interaction flow.",
      "ari/runtime/ari-runtime-controller.js": "Seed read: browser runtime authority, context handoff, confirmations, and initiative entry points.",
      "ari/vnext/ari-vnext-bridge.js": "Seed read: browser-to-server vNext transport and pending-action state.",
      "api/ari-vnext.js": "Seed read: authenticated canonical Ari endpoint.",
      "api/_lib/ari-vnext/orchestrator.js": "Seed read: primary vNext semantic/tool orchestration.",
      "api/_lib/ari-vnext/ari-executive.js": "Seed read: canonical cognition rule authority and resolved turn policy.",
      "api/_lib/ari-vnext/deliberation-harness.js": "Seed read: difficult-task reasoning, verification, and repeated-failure reset.",
      "api/_lib/ari-vnext/tools.js": "Seed read: canonical tool registry composition, validation, and application mapping.",
      "api/_lib/ari-vnext/tools-core.js": "Seed read: core vNext tool definitions.",
      "api/_lib/ari-vnext/authoritative-context.js": "Seed read: live profile/account authority over cached state.",
      "api/ari-github-read.js": "Seed read: GitHub read endpoint and full-file evidence flags.",
      "api/ari-github-search.js": "Seed read: GitHub repository discovery endpoint.",
      "api/ari-github-edit.js": "Seed read: GitHub edit endpoint before patch, commit, preview, or undo changes.",
      "calbuddy-core.js": "Compatibility read only when a live call path actually crosses the CalBuddy boundary."
    };
    return reasons[filePath] || `Seed read for likely ${understanding.targetArea || "developer"} file. Search may discover a more exact current owner.`;
  },

  inferNextRequiredAction({ understanding = {}, searchSteps = [], readSteps = [], evidenceState = {} }) {
    const target = understanding.targetObject || {};
    if (evidenceState.hasCompleteEvidence) {
      return { type: "patch_decision", tool: "patch_decision", filePath: evidenceState.filePath || target.filePath || null, reason: "Complete full-file repository evidence is available. Proceed to causal patch decision." };
    }
    if (evidenceState.hasAnyEvidence && !evidenceState.hasCompleteEvidence) {
      return { type: "read_full_file", tool: "github_read", filePath: evidenceState.filePath || target.filePath || null, reason: "Partial or unverified code evidence exists, but patching requires full-file evidence." };
    }
    if (target.kind === "file" && target.filePath) {
      return { type: "read_full_file", tool: "github_read", filePath: target.filePath, reason: "Specific file is known. Read exact full current content next." };
    }
    if (searchSteps.length) {
      return { type: "semantic_search_then_read", firstTool: "github_search", firstQuery: searchSteps[0].query, seedReadFiles: readSteps.map(step => step.filePath), reason: "Use semantic search against current main, then read full files before patching." };
    }
    if (readSteps.length) {
      return { type: "read_seed_file", tool: "github_read", filePath: readSteps[0].filePath, reason: "Read a vNext-aware seed file, but do not treat seed files as the complete universe." };
    }
    return { type: "ask_owner", reason: "Not enough target evidence to search or read safely." };
  },

  buildTitle(understanding = {}) {
    const target = understanding.targetObject?.name || understanding.targetObject?.filePath || understanding.targetArea || "ARI XP code";
    return `Gather current code evidence for ${target}`;
  },

  buildSummary(understanding = {}, evidenceState = {}) {
    const goal = understanding.userGoal || "developer request";
    if (evidenceState.hasCompleteEvidence) return `Complete full-file repository evidence is available for: ${goal}. Proceed to code understanding and causal patch decision.`;
    if (evidenceState.hasAnyEvidence) return `Partial or unverified repository evidence exists for: ${goal}. Read full-file evidence before patching.`;
    return `Use semantic discovery and vNext-aware seed reads against current main for: ${goal}. Search and read must happen before patching.`;
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
      .replace(/^homepage_ui$/i, "home")
      .replace(/^ari_response_behavior$/i, "Ari vNext response behavior")
      .replace(/^tool_or_feature_build$/i, "vNext tool feature")
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
  "ARI COMPATIBILITY CODE EVIDENCE ENGINE LOADED:",
  window.AriRebirthCodeEvidenceEngine.version
);