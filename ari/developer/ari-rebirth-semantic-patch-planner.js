// ari/developer/ari-rebirth-semantic-patch-planner.js
// Ari Rebirth Semantic Patch Planner
// Purpose: Convert developer understanding + code evidence into safe patch proposals.
// V1.0.0 — Evidence First / Exact Text Required / No Guess Commits

window.Ari = window.Ari || {};

window.AriRebirthSemanticPatchPlanner = {
  version: "1.0.0",

  plan(input = {}) {
    const summary = input.summary || input || {};
    const developerUnderstanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    const codeUnderstanding =
      summary.codeUnderstanding ||
      summary.rebirthCodeUnderstanding ||
      null;

    const githubFileContext =
      summary.githubFileContext ||
      summary.appContext?.githubFileContext ||
      null;

    if (!developerUnderstanding?.isDeveloperWork) return null;

    return {
      patchPlannerRan: true,
      patchPlannerVersion: this.version,
      source: "ari-rebirth-semantic-patch-planner",

      canPatchNow: this.canPatchNow({
        developerUnderstanding,
        codeUnderstanding,
        githubFileContext
      }),

      patchIntent: this.inferPatchIntent(developerUnderstanding),
      targetFiles: this.inferTargetFiles(developerUnderstanding, codeUnderstanding),
      evidenceStatus: this.buildEvidenceStatus({
        developerUnderstanding,
        codeUnderstanding,
        githubFileContext
      }),

      recommendedPatchPlan: this.buildPatchPlan({
        developerUnderstanding,
        codeUnderstanding,
        githubFileContext
      }),

      githubEdit: null,

      safetyPolicy: {
        requireOwnerConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT",
        neverGuessFindText: true,
        requireExactCurrentFileContent: true,
        preferSmallestSafePatch: true,
        allowDirectCommit: false
      }
    };
  },

  canPatchNow({ developerUnderstanding, codeUnderstanding, githubFileContext }) {
    if (!githubFileContext?.content) return false;
    if (!githubFileContext?.filePath) return false;
    if (!codeUnderstanding) return false;
    return true;
  },

  inferPatchIntent(dev = {}) {
    return {
      intentFamily: dev.intentFamily || "developer_help",
      requestedChange: dev.requestedChange || "developer_analysis_needed",
      targetArea: dev.targetArea || "unknown",
      targetObject: dev.targetObject || null,
      userGoal: dev.userGoal || ""
    };
  },

  inferTargetFiles(dev = {}, code = {}) {
    const files = new Set();

    (dev.likelyFiles || []).forEach(file => files.add(file));
    (code.filesInvolved || []).forEach(file => files.add(file));
    if (code.filePath) files.add(code.filePath);

    return Array.from(files).filter(Boolean).slice(0, 8);
  },

  buildEvidenceStatus({ developerUnderstanding, codeUnderstanding, githubFileContext }) {
    return {
      hasDeveloperUnderstanding: Boolean(developerUnderstanding),
      hasCodeUnderstanding: Boolean(codeUnderstanding),
      hasFileContent: Boolean(githubFileContext?.content),
      filePath: githubFileContext?.filePath || codeUnderstanding?.filePath || null,
      canEditSafely:
        Boolean(githubFileContext?.content) &&
        Boolean(githubFileContext?.filePath) &&
        Boolean(codeUnderstanding)
    };
  },

  buildPatchPlan({ developerUnderstanding, codeUnderstanding, githubFileContext }) {
    if (!githubFileContext?.content) {
      return {
        status: "needs_file_content",
        nextStep: developerUnderstanding?.safeNextStep || {
          type: "investigate",
          reason: "Ari needs repository file content before proposing a safe edit."
        },
        message:
          "Read the relevant file first. Do not create a GitHub edit yet."
      };
    }

    if (!codeUnderstanding) {
      return {
        status: "needs_code_understanding",
        nextStep: {
          type: "analyze_file",
          filePath: githubFileContext.filePath
        },
        message:
          "Analyze the file structure before choosing exact find/replace text."
      };
    }

    return {
      status: "ready_for_patch_reasoning",
      filePath: githubFileContext.filePath,
      targetArea: developerUnderstanding.targetArea,
      intentFamily: developerUnderstanding.intentFamily,
      editableZones: codeUnderstanding.editableZones || [],
      riskNotes: codeUnderstanding.riskNotes || [],
      instruction:
        "Use exact current file text only. Prefer one small patch. Return githubEdit only when exact find text is confirmed."
    };
  }
};

console.log(
  "ARI REBIRTH SEMANTIC PATCH PLANNER LOADED:",
  window.AriRebirthSemanticPatchPlanner.version
);