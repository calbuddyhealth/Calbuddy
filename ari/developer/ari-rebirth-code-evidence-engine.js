// ari/developer/ari-rebirth-code-evidence-engine.js
// Ari Rebirth Code Evidence Engine
// Purpose: Convert developer understanding into evidence-gathering steps.
// V1.0.0 — Semantic Evidence Plan / Search + Read Discipline

window.Ari = window.Ari || {};

window.AriRebirthCodeEvidenceEngine = {
  version: "1.0.0",

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

    return {
      codeEvidenceRan: true,
      codeEvidenceVersion: this.version,
      source: "ari-rebirth-code-evidence-engine",

      intentFamily: understanding.intentFamily,
      targetArea: understanding.targetArea,
      targetObject: understanding.targetObject,
      userGoal: understanding.userGoal,

      evidenceStatus: "needed",
      canEditNow: false,
      requiresReadBeforeEdit: true,

      searchSteps,
      readSteps,
      analysisSteps,

      steps: this.dedupeSteps([
        ...searchSteps,
        ...readSteps,
        ...analysisSteps
      ]),

      evidencePolicy: {
        semanticFirst: true,
        keywordOnlySearchForbidden: true,
        searchBeforeGuessing: true,
        readBeforeEditing: true,
        requireExactCurrentCode: true,
        requirePatchReason: true
      }
    };
  },

  buildSearchSteps(understanding = {}) {
    const steps = [];
    const concepts = Array.isArray(understanding.searchConcepts)
      ? understanding.searchConcepts
      : [];

    const target = understanding.targetObject || {};

    if (target.kind === "file" && target.filePath) {
      return [];
    }

    concepts.forEach(concept => {
      const query = this.cleanSearchQuery(concept);

      if (!query) return;

      steps.push({
        tool: "github_search",
        query,
        reason: this.reasonForSearch(query, understanding)
      });
    });

    return steps.slice(0, 8);
  },

  buildReadSteps(understanding = {}) {
    const steps = [];
    const target = understanding.targetObject || {};
    const likelyFiles = Array.isArray(understanding.likelyFiles)
      ? understanding.likelyFiles
      : [];

    if (target.kind === "file" && target.filePath) {
      steps.push({
        tool: "github_read",
        filePath: target.filePath,
        reason: "Owner named this file. Read exact current content before analysis."
      });

      return steps;
    }

    likelyFiles.forEach(filePath => {
      if (!filePath) return;

      steps.push({
        tool: "github_read",
        filePath,
        reason: this.reasonForRead(filePath, understanding)
      });
    });

    return steps.slice(0, 6);
  },

  buildAnalysisSteps(understanding = {}) {
    return [
      {
        tool: "rebirth_analyze",
        reason:
          "Analyze gathered repository evidence against the owner goal before proposing edits."
      },
      {
        tool: "patch_decision",
        reason:
          "Decide whether enough exact code evidence exists for a safe find/replace or full file patch.",
        requiresExactFindText: true,
        requiresOwnerConfirmation: true
      }
    ];
  },

  reasonForSearch(query = "", understanding = {}) {
    const targetArea = understanding.targetArea || "unknown";
    const intentFamily = understanding.intentFamily || "developer request";

    return `Semantic search for "${query}" related to ${intentFamily} in ${targetArea}.`;
  },

  reasonForRead(filePath = "", understanding = {}) {
    const targetArea = understanding.targetArea || "unknown";

    if (filePath === "index.html") {
      return "Read homepage structure and script loading order.";
    }

    if (filePath === "style.css") {
      return "Read visual styling before layout or UI changes.";
    }

    if (filePath === "calbuddy-core.js") {
      return "Read CalBuddy app brain, Ari handoff, dashboard, and action handling.";
    }

    if (filePath === "api/ask-calbuddy.js") {
      return "Read server Ari prompt and developer intent behavior.";
    }

    if (filePath.includes("ari-rebirth-app-bridge")) {
      return "Read Rebirth bridge to verify action/developer handoff.";
    }

    if (filePath.includes("ari-language-composer")) {
      return "Read final response writer for naturalness issues.";
    }

    return `Read likely ${targetArea} file before proposing code changes.`;
  },

  cleanSearchQuery(query = "") {
    const cleaned = String(query || "")
      .replace(/^unknown$/i, "")
      .replace(/^general_developer_help$/i, "")
      .replace(/^developer_analysis_needed$/i, "")
      .trim();

    if (!cleaned) return null;
    if (cleaned.length < 2) return null;

    return cleaned.slice(0, 120);
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