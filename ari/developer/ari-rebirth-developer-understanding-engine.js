// ari/developer/ari-rebirth-developer-understanding-engine.js
// Ari Rebirth Developer Understanding Engine
// Purpose: Build semantic understanding of owner developer requests.
// V1.0.0 — Semantic First / Keyword Assisted Only / Planner Support

window.Ari = window.Ari || {};

window.AriRebirthDeveloperUnderstandingEngine = {
  version: "1.0.0",

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

      isDeveloperWork: semanticFrame.isDeveloperWork,
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
      .replace(/\s+/g, " ")
      .trim();
  },

  buildSemanticFrame({ rawText = "", text = "", summary = {}, appContext = {} }) {
    const developerSignals = this.detectDeveloperSignals(text);
    const goal = this.inferUserGoal(rawText, text);
    const requestedChange = this.inferRequestedChange(rawText, text);
    const targetArea = this.inferTargetArea(rawText, text);
    const targetObject = this.inferTargetObject(rawText, text);
    const intentFamily = this.inferIntentFamily(rawText, text, goal, targetArea);
    const reason = this.inferReason(rawText, text);
    const constraints = this.inferConstraints(rawText, text);
    const urgency = this.inferUrgency(text);
    const riskLevel = this.inferRiskLevel(intentFamily, targetArea, text);

    const isDeveloperWork =
      developerSignals.score >= 2 ||
      intentFamily !== "general_developer_help" ||
      targetArea !== "unknown";

    const confidence = this.scoreConfidence({
      developerSignals,
      goal,
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
      goal,
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

    return {
      isDeveloperWork,
      confidence,
      developerSignals,
      userGoal: goal,
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
      safeNextStep
    };
  },

  detectDeveloperSignals(text = "") {
    const signals = [];

    const concepts = {
      app_change: ["change the app", "update the app", "make the app", "implement", "build"],
      bug_fix: ["bug", "broken", "not working", "glitch", "error", "fix"],
      code_work: ["code", "file", "github", "function", "repo", "branch", "commit"],
      ui_work: ["home screen", "homepage", "layout", "button", "tile", "meter", "screen", "design"],
      ari_behavior: ["ari", "speak", "respond", "answer", "more naturally", "less robotic"],
      tool_building: ["tool", "barcode", "scanner", "knowledge", "anatomy", "new feature"]
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

  inferUserGoal(rawText = "", text = "") {
    if (this.hasMeaning(text, ["completely change my home screen", "redesign home screen", "redesign homepage"])) {
      return "Redesign the CalBuddy homepage experience.";
    }

    if (this.hasMeaning(text, ["speak more naturally", "less robotic", "sound human", "talk better"])) {
      return "Improve Ari’s final communication style and response naturalness.";
    }

    if (this.hasMeaning(text, ["fix bugs", "bug", "not working", "broken", "glitch"])) {
      return "Investigate and fix a malfunction in CalBuddy.";
    }

    if (this.hasMeaning(text, ["barcode", "scanner", "scan food"])) {
      return "Add or improve barcode scanning capability.";
    }

    if (this.hasMeaning(text, ["anatomy", "knowledge", "education", "medical knowledge"])) {
      return "Add or improve a knowledge/tool capability.";
    }

    if (this.hasMeaning(text, ["find", "search", "locate", "where is"])) {
      return "Locate relevant code before making changes.";
    }

    if (this.hasMeaning(text, ["read", "inspect", "look at", "open"])) {
      return "Read a specific repository file before deciding changes.";
    }

    return rawText || "Understand the owner’s developer request.";
  },

  inferRequestedChange(rawText = "", text = "") {
    if (this.hasMeaning(text, ["remove", "delete", "hide"])) return "remove_existing_element";
    if (this.hasMeaning(text, ["move", "relocate", "place", "put"])) return "move_existing_element";
    if (this.hasMeaning(text, ["add", "create", "build", "new tool", "new feature"])) return "add_new_capability";
    if (this.hasMeaning(text, ["change", "update", "redesign", "make better", "improve"])) return "modify_or_improve_existing_system";
    if (this.hasMeaning(text, ["fix", "bug", "broken", "not working", "glitch"])) return "diagnose_and_patch_bug";
    if (this.hasMeaning(text, ["read", "inspect", "look at", "open"])) return "read_before_deciding";
    if (this.hasMeaning(text, ["find", "search", "locate", "where is"])) return "search_before_deciding";

    return "developer_analysis_needed";
  },

  inferIntentFamily(rawText = "", text = "", goal = "", targetArea = "") {
    if (targetArea === "ari_response_behavior") return "improve_ari_behavior";
    if (targetArea === "homepage_ui") return "homepage_redesign_or_patch";
    if (targetArea === "tooling") return "tool_or_feature_build";
    if (this.hasMeaning(text, ["bug", "broken", "not working", "error", "glitch", "fix"])) return "bug_investigation";
    if (this.hasMeaning(text, ["read", "inspect", "look at", "open"])) return "file_read";
    if (this.hasMeaning(text, ["find", "search", "locate", "where is"])) return "code_search";

    return "general_developer_help";
  },

  inferTargetArea(rawText = "", text = "") {
    if (this.hasMeaning(text, ["home screen", "homepage", "home page", "main screen"])) return "homepage_ui";
    if (this.hasMeaning(text, ["ari speak", "speak more naturally", "less robotic", "response", "answer better", "talk better"])) return "ari_response_behavior";
    if (this.hasMeaning(text, ["barcode", "scanner", "photo", "anatomy", "knowledge", "tool"])) return "tooling";
    if (this.hasMeaning(text, ["calorie meter", "calories left", "arch meter"])) return "calorie_meter";
    if (this.hasMeaning(text, ["supabase", "database", "profile", "meals", "weight logs"])) return "data_layer";
    if (this.hasMeaning(text, ["github", "repo", "commit", "branch"])) return "repository_layer";

    const filePath = this.extractFilePath(rawText);
    if (filePath) return "specific_file";

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
      "Ari developer planner",
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

  inferReason(rawText = "", text = "") {
    if (this.hasMeaning(text, ["too robotic", "not natural", "sounds fake"])) {
      return "Ari’s communication quality is not matching the desired companion/product-partner experience.";
    }

    if (this.hasMeaning(text, ["clutter", "too much", "messy", "takes too much space"])) {
      return "The current UI likely needs better hierarchy, spacing, or compression.";
    }

    if (this.hasMeaning(text, ["not working", "broken", "error", "glitch"])) {
      return "The owner is reporting a functional problem that needs evidence-based debugging.";
    }

    if (this.hasMeaning(text, ["new tool", "barcode", "anatomy", "knowledge"])) {
      return "The owner wants CalBuddy/Ari to gain a new capability through modular tooling.";
    }

    return "The owner wants a safer developer workflow that searches, reads, analyzes, then edits.";
  },

  inferConstraints(rawText = "", text = "") {
    const constraints = [
      "Do not guess exact find/replace text.",
      "Read current repository content before editing.",
      "Require owner confirmation before committing.",
      "Prefer the smallest safe patch first.",
      "Do not break CalBuddy core behavior."
    ];

    if (this.hasMeaning(text, ["keep ari visible", "not popup", "homepage"])) {
      constraints.push("Preserve Ari-first homepage architecture.");
    }

    if (this.hasMeaning(text, ["semantic", "not keyword"])) {
      constraints.push("Use semantic understanding before keyword matching.");
    }

    return constraints;
  },

  inferUrgency(text = "") {
    if (this.hasMeaning(text, ["urgent", "asap", "right now", "crash", "can't use"])) return "high";
    if (this.hasMeaning(text, ["broken", "bug", "not working", "error"])) return "medium_high";
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
      files.add("api/ask-calbuddy.js");
      files.add("api/actions.js");
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
    goal = "",
    requestedChange = "",
    targetArea = "",
    targetObject = {},
    intentFamily = ""
  }) {
    const concepts = new Set();

    if (targetObject?.name) concepts.add(targetObject.name);
    if (targetObject?.filePath) concepts.add(targetObject.filePath);

    concepts.add(targetArea);
    concepts.add(intentFamily);
    concepts.add(requestedChange);

    if (targetArea === "homepage_ui") {
      ["ari-master-home", "ari-hero-section", "ari-search-section", "ari-action-grid", "ARI_DEFAULT_BUBBLE"].forEach(x => concepts.add(x));
    }

    if (targetArea === "ari_response_behavior") {
      ["finalResponse", "languageComposerOutput", "communicationPlan", "mouth", "compose", "response"].forEach(x => concepts.add(x));
    }

    if (targetArea === "tooling") {
      ["api", "actions", "pendingAction", "tool", "barcode", "knowledge"].forEach(x => concepts.add(x));
    }

    if (targetArea === "calorie_meter") {
      ["caloriesLeftText", "trueMeterFill", "updateLiveArchMeter", "updateMeterStatus"].forEach(x => concepts.add(x));
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

  scoreConfidence({ developerSignals, goal, requestedChange, targetArea, targetObject, intentFamily }) {
    let score = 0.35;

    if (developerSignals.score >= 2) score += 0.2;
    if (goal && goal !== "Understand the owner’s developer request.") score += 0.15;
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

  hasMeaning(text = "", concepts = []) {
    return concepts.some(concept => text.includes(concept));
  }
};

console.log(
  "ARI REBIRTH DEVELOPER UNDERSTANDING ENGINE LOADED:",
  window.AriRebirthDeveloperUnderstandingEngine.version
);