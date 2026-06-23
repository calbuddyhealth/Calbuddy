// ari/developer/ari-rebirth-developer-understanding-engine.js
// Ari Rebirth Developer Understanding Engine
// Purpose: Build semantic understanding of owner developer requests.
// V1.1.0 — Planner Consolidated / Semantic First / Evidence Ready

window.Ari = window.Ari || {};

window.AriRebirthDeveloperUnderstandingEngine = {
  version: "1.1.0",

  understand(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};
    const rawText = this.getText(summary);

    if (!appContext.ownerMode) return null;

    const text = this.normalize(rawText);

    const semanticFrame = this.buildSemanticFrame({
      rawText,
      text,
      summary,
      appContext
    });

    if (!semanticFrame.isDeveloperWork) return null;

    return {
      developerUnderstandingRan: true,
      developerUnderstandingVersion: this.version,
      source: "ari-rebirth-developer-understanding-engine",

      rawText,
      normalizedText: text,

      isDeveloperWork: true,
      confidence: semanticFrame.confidence,

      userGoal: semanticFrame.userGoal,
      requestedChange: semanticFrame.requestedChange,
      intentFamily: semanticFrame.intentFamily,
      targetArea: semanticFrame.targetArea,
      targetObject: semanticFrame.targetObject,
      reason: semanticFrame.reason,
      constraints: semanticFrame.constraints,
      urgency: semanticFrame.urgency,
      riskLevel: semanticFrame.riskLevel,

      likelyFiles: semanticFrame.likelyFiles,
      searchConcepts: semanticFrame.searchConcepts,
      requiredEvidence: semanticFrame.requiredEvidence,
      safeNextStep: semanticFrame.safeNextStep,

      investigationPlan: semanticFrame.investigationPlan,
      steps: semanticFrame.steps,

      canEditNow: false,
      requiresReadBeforeEdit: true,

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

  normalize(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  },

  buildSemanticFrame({ rawText = "", text = "", summary = {}, appContext = {} }) {
    const developerSignals = this.detectDeveloperSignals(text);
    const targetObject = this.inferTargetObject(rawText, text);
    const targetArea = this.inferTargetArea(rawText, text, targetObject);
    const userGoal = this.inferUserGoal(rawText, text, targetArea);
    const requestedChange = this.inferRequestedChange(rawText, text);
    const intentFamily = this.inferIntentFamily(rawText, text, userGoal, targetArea, requestedChange);
    const reason = this.inferReason(rawText, text, targetArea, intentFamily);
    const constraints = this.inferConstraints(rawText, text, targetArea);
    const urgency = this.inferUrgency(text);
    const riskLevel = this.inferRiskLevel(intentFamily, targetArea, text);

    const isDeveloperWork =
      developerSignals.score >= 2 ||
      targetArea !== "unknown" ||
      intentFamily !== "general_developer_help" ||
      targetObject.kind === "file";

    const confidence = this.scoreConfidence({
      developerSignals,
      userGoal,
      requestedChange,
      targetArea,
      targetObject,
      intentFamily
    });

    const likelyFiles = this.inferLikelyFiles({
      rawText,
      text,
      intentFamily,
      targetArea,
      targetObject
    });

    const searchConcepts = this.buildSearchConcepts({
      rawText,
      text,
      userGoal,
      requestedChange,
      targetArea,
      targetObject,
      intentFamily
    });

    const requiredEvidence = this.inferRequiredEvidence({
      intentFamily,
      targetArea,
      targetObject,
      likelyFiles
    });

    const safeNextStep = this.inferSafeNextStep({
      intentFamily,
      targetArea,
      targetObject,
      likelyFiles,
      requiredEvidence
    });

    const investigationPlan = this.buildInvestigationPlan({
      intentFamily,
      targetArea,
      targetObject,
      searchConcepts,
      likelyFiles,
      safeNextStep
    });

    return {
      isDeveloperWork,
      confidence,
      developerSignals,
      userGoal,
      requestedChange,
      intentFamily,
      targetArea,
      targetObject,
      reason,
      constraints,
      urgency,
      riskLevel,
      likelyFiles,
      searchConcepts,
      requiredEvidence,
      safeNextStep,
      investigationPlan,
      steps: investigationPlan.steps
    };
  },

  detectDeveloperSignals(text = "") {
    const signals = [];

    const concepts = {
      app_change: [
        "change the app",
        "update the app",
        "make the app",
        "implement",
        "build",
        "create",
        "add",
        "remove",
        "move",
        "redesign",
        "make better",
        "improve"
      ],
      bug_fix: [
        "bug",
        "broken",
        "not working",
        "glitch",
        "error",
        "fix",
        "issue",
        "problem",
        "wrong",
        "bottleneck"
      ],
      code_work: [
        "code",
        "file",
        "github",
        "function",
        "repo",
        "branch",
        "commit",
        "patch",
        "engine",
        "endpoint",
        "api"
      ],
      ui_work: [
        "home screen",
        "homepage",
        "home page",
        "layout",
        "button",
        "tile",
        "meter",
        "screen",
        "design",
        "bubble",
        "conversation",
        "search bar"
      ],
      ari_behavior: [
        "ari",
        "rebirth",
        "speak",
        "respond",
        "answer",
        "more naturally",
        "less robotic",
        "smarter",
        "semantic",
        "keyword"
      ],
      tool_building: [
        "tool",
        "barcode",
        "scanner",
        "knowledge",
        "anatomy",
        "new feature",
        "capability"
      ]
    };

    Object.entries(concepts).forEach(([concept, phrases]) => {
      const hits = phrases.filter(phrase => text.includes(phrase));

      if (hits.length) {
        signals.push({
          concept,
          evidence: hits,
          weight: hits.length
        });
      }
    });

    return {
      signals,
      score: signals.reduce((sum, item) => sum + item.weight, 0)
    };
  },

  inferUserGoal(rawText = "", text = "", targetArea = "") {
    if (targetArea === "homepage_ui") {
      return "Modify or redesign the CalBuddy homepage experience while preserving Ari-first architecture.";
    }

    if (targetArea === "ari_response_behavior") {
      return "Improve Ari’s response quality, naturalness, intelligence, or developer behavior.";
    }

    if (targetArea === "tooling") {
      return "Add or improve a modular CalBuddy/Ari capability.";
    }

    if (targetArea === "repository_layer") {
      return "Improve Ari’s ability to search, read, patch, or commit repository code safely.";
    }

    if (targetArea === "data_layer") {
      return "Fix or improve Supabase/profile/app data behavior safely.";
    }

    if (targetArea === "specific_file") {
      return "Inspect or modify a specific repository file based on the owner request.";
    }

    if (this.hasMeaning(text, ["fix bugs", "bug", "not working", "broken", "glitch"])) {
      return "Investigate and fix a malfunction in CalBuddy.";
    }

    return rawText || "Understand the owner’s developer request.";
  },

  inferRequestedChange(rawText = "", text = "") {
    if (this.hasMeaning(text, ["remove", "delete", "hide"])) return "remove_existing_element";
    if (this.hasMeaning(text, ["move", "relocate", "place", "put"])) return "move_existing_element";
    if (this.hasMeaning(text, ["add", "create", "build", "new tool", "new feature", "capability"])) return "add_new_capability";
    if (this.hasMeaning(text, ["change", "update", "redesign", "make better", "improve", "upgrade"])) return "modify_or_improve_existing_system";
    if (this.hasMeaning(text, ["fix", "bug", "broken", "not working", "glitch", "error", "issue"])) return "diagnose_and_patch_bug";
    if (this.hasMeaning(text, ["read", "inspect", "look at", "open"])) return "read_before_deciding";
    if (this.hasMeaning(text, ["find", "search", "locate", "where is", "bottleneck"])) return "search_before_deciding";

    return "developer_analysis_needed";
  },

  inferIntentFamily(rawText = "", text = "", goal = "", targetArea = "", requestedChange = "") {
    if (requestedChange === "read_before_deciding") return "file_read";
    if (requestedChange === "search_before_deciding") return "code_search";
    if (requestedChange === "diagnose_and_patch_bug") return "bug_investigation";

    if (targetArea === "ari_response_behavior") return "improve_ari_behavior";
    if (targetArea === "homepage_ui") return "homepage_redesign_or_patch";
    if (targetArea === "tooling") return "tool_or_feature_build";
    if (targetArea === "repository_layer") return "repository_workflow";
    if (targetArea === "data_layer") return "data_layer_fix";
    if (targetArea === "specific_file") return "specific_file_work";
    if (targetArea === "calorie_meter") return "calorie_meter_patch";

    return "general_developer_help";
  },

  inferTargetArea(rawText = "", text = "", targetObject = {}) {
    if (targetObject?.filePath) return "specific_file";

    if (this.hasMeaning(text, ["home screen", "homepage", "home page", "main screen", "home layout"])) return "homepage_ui";
    if (this.hasMeaning(text, ["ari speak", "speak more naturally", "less robotic", "response", "answer better", "talk better", "semantic", "keyword based"])) return "ari_response_behavior";
    if (this.hasMeaning(text, ["barcode", "scanner", "photo", "anatomy", "knowledge", "tool", "new feature", "capability"])) return "tooling";
    if (this.hasMeaning(text, ["calorie meter", "calories left", "arch meter", "true meter"])) return "calorie_meter";
    if (this.hasMeaning(text, ["supabase", "database", "profile", "meals", "weight logs", "auth"])) return "data_layer";
    if (this.hasMeaning(text, ["github", "repo", "commit", "branch", "read file", "search repo", "patch"])) return "repository_layer";

    return "unknown";
  },

  inferTargetObject(rawText = "", text = "") {
    const filePath = this.extractFilePath(rawText);

    if (filePath) {
      return {
        kind: "file",
        name: filePath,
        filePath
      };
    }

    const knownTargets = [
      "My Goals",
      "Progress",
      "History",
      "Conversations",
      "Calories Left",
      "Ask Ari",
      "Sign Out",
      "ARI_DEFAULT_BUBBLE",
      "calorie meter",
      "homepage greeting",
      "barcode scanner",
      "Ari response style",
      "Ari developer understanding",
      "Ari code evidence",
      "Ari patch decision",
      "Ari self improvement",
      "Ari Rebirth"
    ];

    const matched = knownTargets.find(label =>
      text.includes(label.toLowerCase())
    );

    if (matched) {
      return {
        kind: "known_target",
        name: matched
      };
    }

    return {
      kind: "concept",
      name: this.extractConcept(rawText)
    };
  },

  inferReason(rawText = "", text = "", targetArea = "", intentFamily = "") {
    if (targetArea === "ari_response_behavior") {
      return "The request affects Ari’s intelligence, response quality, routing, or developer behavior.";
    }

    if (targetArea === "homepage_ui") {
      return "The request affects the homepage experience and must preserve Ari-first layout decisions.";
    }

    if (targetArea === "tooling") {
      return "The owner wants Ari or CalBuddy to gain a new modular capability.";
    }

    if (intentFamily === "bug_investigation") {
      return "The owner is reporting a functional problem that needs evidence-based debugging.";
    }

    return "The owner wants a safe developer workflow: understand, search, read, analyze, then patch only with evidence.";
  },

  inferConstraints(rawText = "", text = "", targetArea = "") {
    const constraints = [
      "Do not guess exact find/replace text.",
      "Read current repository content before editing.",
      "Require owner confirmation before committing.",
      "Prefer the smallest safe patch first.",
      "Do not break CalBuddy core behavior."
    ];

    if (targetArea === "homepage_ui") {
      constraints.push("Preserve Ari-first homepage architecture.");
      constraints.push("Do not hide Ari behind popup/chat launcher patterns.");
    }

    if (text.includes("semantic") || text.includes("keyword")) {
      constraints.push("Use semantic understanding before keyword matching.");
    }

    return constraints;
  },

  inferUrgency(text = "") {
    if (this.hasMeaning(text, ["urgent", "asap", "right now", "crash", "can't use"])) return "high";
    if (this.hasMeaning(text, ["broken", "bug", "not working", "error", "bottleneck"])) return "medium_high";
    return "medium";
  },

  inferRiskLevel(intentFamily = "", targetArea = "", text = "") {
    if (targetArea === "data_layer") return "high";
    if (targetArea === "repository_layer") return "medium_high";
    if (intentFamily === "tool_or_feature_build") return "medium_high";
    if (intentFamily === "homepage_redesign_or_patch") return "medium";
    if (intentFamily === "improve_ari_behavior") return "medium";
    return "medium";
  },

  inferLikelyFiles({ rawText = "", text = "", intentFamily = "", targetArea = "", targetObject = {} }) {
    const files = new Set();

    if (targetObject?.filePath) files.add(targetObject.filePath);

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

    if (targetArea === "calorie_meter") {
      files.add("index.html");
      files.add("style.css");
      files.add("calbuddy-core.js");
    }

    if (targetArea === "data_layer") {
      files.add("calbuddy-core.js");
      files.add("api/actions.js");
      files.add("supabase-config.js");
    }

    if (targetArea === "repository_layer") {
      files.add("api/ari-github-read.js");
      files.add("api/ari-github-search.js");
      files.add("api/ari-github-edit.js");
      files.add("calbuddy-core.js");
    }

    if (!files.size) {
      files.add("index.html");
      files.add("style.css");
      files.add("calbuddy-core.js");
      files.add("api/ask-calbuddy.js");
    }

    return Array.from(files).slice(0, 8);
  },

  buildSearchConcepts({
    rawText = "",
    text = "",
    userGoal = "",
    requestedChange = "",
    targetArea = "",
    targetObject = {},
    intentFamily = ""
  }) {
    const concepts = new Set();

    if (targetObject?.name && targetObject.name !== "unknown developer target") {
      concepts.add(targetObject.name);
    }

    if (targetObject?.filePath) concepts.add(targetObject.filePath);

    if (targetArea !== "unknown") concepts.add(targetArea);
    if (intentFamily !== "general_developer_help") concepts.add(intentFamily);
    if (requestedChange !== "developer_analysis_needed") concepts.add(requestedChange);

    if (targetArea === "homepage_ui") {
      [
        "ari-master-home",
        "ari-hero-section",
        "ari-search-section",
        "ari-action-grid",
        "ARI_DEFAULT_BUBBLE",
        "toggleConversationHistory"
      ].forEach(x => concepts.add(x));
    }

    if (targetArea === "ari_response_behavior") {
      [
        "finalResponse",
        "languageComposerOutput",
        "communicationPlan",
        "mouth",
        "compose",
        "response",
        "extractReply"
      ].forEach(x => concepts.add(x));
    }

    if (targetArea === "tooling") {
      [
        "api",
        "actions",
        "pendingAction",
        "tool",
        "barcode",
        "knowledge",
        "analyzeImage"
      ].forEach(x => concepts.add(x));
    }

    if (targetArea === "calorie_meter") {
      [
        "caloriesLeftText",
        "trueMeterFill",
        "updateLiveArchMeter",
        "updateMeterStatus"
      ].forEach(x => concepts.add(x));
    }

    return Array.from(concepts)
      .map(item => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 10);
  },

  inferRequiredEvidence({ intentFamily = "", targetArea = "", targetObject = {}, likelyFiles = [] }) {
    return {
      mustSearch: targetObject.kind !== "file",
      mustReadFiles: likelyFiles.slice(0, 4),
      mustConfirmExactTextBeforeEdit: true,
      mustReturnReasonedPatchPlan: true
    };
  },

  inferSafeNextStep({ intentFamily = "", targetArea = "", targetObject = {}, likelyFiles = [], requiredEvidence = {} }) {
    if (targetObject.kind === "file" && targetObject.filePath) {
      return {
        type: "read_file",
        filePath: targetObject.filePath,
        reason: "A specific file was named. Read it before proposing changes."
      };
    }

    return {
      type: "investigate",
      searchConceptsFirst: true,
      readLikelyFiles: likelyFiles.slice(0, 4),
      reason: "The request needs repository evidence before any patch."
    };
  },

  buildInvestigationPlan({ intentFamily, targetArea, targetObject, searchConcepts, likelyFiles, safeNextStep }) {
    const steps = [];

    if (targetObject.kind === "file" && targetObject.filePath) {
      steps.push({
        tool: "github_read",
        filePath: targetObject.filePath,
        reason: "Owner named the file. Read exact content first."
      });
    } else {
      searchConcepts.slice(0, 6).forEach(query => {
        steps.push({
          tool: "github_search",
          query,
          reason: "Search semantic concept before guessing file location."
        });
      });

      likelyFiles.slice(0, 4).forEach(filePath => {
        steps.push({
          tool: "github_read",
          filePath,
          reason: "Likely file for this developer request."
        });
      });
    }

    steps.push({
      tool: "rebirth_analyze",
      reason: "Analyze evidence against the owner goal."
    });

    steps.push({
      tool: "patch_decision",
      reason: "Decide if exact safe edit can be proposed.",
      requiresExactFindText: true,
      requiresOwnerConfirmation: true
    });

    return {
      type: safeNextStep.type,
      intentFamily,
      targetArea,
      steps: this.dedupeSteps(steps).slice(0, 12)
    };
  },

  scoreConfidence({ developerSignals, userGoal, requestedChange, targetArea, targetObject, intentFamily }) {
    let score = 0.35;

    if (developerSignals.score >= 2) score += 0.2;
    if (userGoal && userGoal !== "Understand the owner’s developer request.") score += 0.15;
    if (requestedChange && requestedChange !== "developer_analysis_needed") score += 0.1;
    if (targetArea && targetArea !== "unknown") score += 0.15;
    if (targetObject?.kind && targetObject.kind !== "concept") score += 0.1;
    if (intentFamily && intentFamily !== "general_developer_help") score += 0.1;

    return Math.min(Number(score.toFixed(2)), 0.98);
  },

  extractFilePath(text = "") {
    const match = String(text || "").match(
      /\b([a-zA-Z0-9_\-./]+?\.(?:html|css|js|json|md|ts|tsx|jsx))\b/i
    );

    return match ? match[1] : null;
  },

  extractConcept(text = "") {
    const clean = String(text || "")
      .replace(/[?!.]/g, "")
      .trim();

    if (!clean) return "unknown developer target";

    return clean.slice(0, 120);
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

  hasMeaning(text = "", concepts = []) {
    return concepts.some(concept => text.includes(concept));
  }
};

console.log(
  "ARI REBIRTH DEVELOPER UNDERSTANDING ENGINE LOADED:",
  window.AriRebirthDeveloperUnderstandingEngine.version
);