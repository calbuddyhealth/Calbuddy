// ari/developer/ari-rebirth-patch-validation-engine.js
// Purpose: Final safety validation before Ari hands a GitHub edit to CalBuddy.
// V1.0.0 — Validate Only / No Search / No Read / No Commit

window.Ari = window.Ari || {};

window.AriRebirthPatchValidationEngine = {
  version: "1.0.0",

  validate(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};

    if (!appContext.ownerMode) return null;

    const patchDecision =
      summary.patchDecision ||
      summary.rebirthPatchDecision ||
      null;

    const dependencyMap =
      summary.dependencyMap ||
      summary.rebirthDependencyMap ||
      null;

    const githubEdit =
      patchDecision?.githubEdit ||
      summary.githubEdit ||
      summary.developerIntent?.githubEdit ||
      null;

    if (!githubEdit) return null;

    const fileContent = this.getFileContent(summary);
    const validation = this.validateGithubEdit({
      githubEdit,
      fileContent,
      patchDecision,
      dependencyMap
    });

    return {
      patchValidationRan: true,
      patchValidationVersion: this.version,
      source: "ari-rebirth-patch-validation-engine",

      valid: validation.valid,
      canHandOffToGithub: validation.valid,
      githubEdit: validation.valid ? githubEdit : null,

      filePath: githubEdit.filePath || null,
      operation: githubEdit.operation || null,

      failures: validation.failures,
      warnings: validation.warnings,
      safetyScore: validation.safetyScore,
      requiredFixes: validation.requiredFixes,

      validationPolicy: {
        validateOnly: true,
        noSearch: true,
        noRead: true,
        noCommit: true,
        requireOwnerMode: true,
        requireExactFilePath: true,
        requireSafeFilePath: true,
        requireExactFindText: true,
        requireCurrentContentMatch: true,
        requireConfirmationText: "CONFIRM GITHUB EDIT"
      }
    };
  },

  getFileContent(summary = {}) {
    const githubContext =
      summary.githubFileContext ||
      summary.appContext?.githubFileContext ||
      null;

    return (
      githubContext?.content ||
      summary.githubReadResult?.content ||
      summary.developerInvestigation?.readResults?.find?.(
        item => item.result?.success && item.result?.content
      )?.result?.content ||
      null
    );
  },

  validateGithubEdit({
    githubEdit = {},
    fileContent = "",
    patchDecision = null,
    dependencyMap = null
  } = {}) {
    const failures = [];
    const warnings = [];
    const requiredFixes = [];

    const filePath = githubEdit.filePath;
    const operation = githubEdit.operation || "replace";
    const mode = githubEdit.mode || "commit";

    if (!filePath || typeof filePath !== "string") {
      failures.push("Missing filePath.");
      requiredFixes.push("Provide an exact repository filePath.");
    }

    if (filePath && this.isUnsafeFilePath(filePath)) {
      failures.push("Unsafe filePath.");
      requiredFixes.push("Use a relative repository path without '..', leading '/', backslashes, or null characters.");
    }

    if (!["replace", "full_replace"].includes(operation)) {
      failures.push(`Unsupported operation: ${operation}`);
      requiredFixes.push("Use operation 'replace' or 'full_replace'.");
    }

    if (!["preview", "commit"].includes(mode)) {
      failures.push(`Unsupported mode: ${mode}`);
      requiredFixes.push("Use mode 'preview' or 'commit'.");
    }

    if (githubEdit.confirmationText !== "CONFIRM GITHUB EDIT") {
      failures.push("Missing exact confirmation text.");
      requiredFixes.push('Set confirmationText to "CONFIRM GITHUB EDIT".');
    }

    if (!fileContent || typeof fileContent !== "string") {
      failures.push("Missing current file content.");
      requiredFixes.push("Read the current file before validating the patch.");
    }

    if (operation === "replace") {
      this.validateReplaceOperation({
        githubEdit,
        fileContent,
        failures,
        warnings,
        requiredFixes
      });
    }

    if (operation === "full_replace") {
      this.validateFullReplaceOperation({
        githubEdit,
        fileContent,
        failures,
        warnings,
        requiredFixes
      });
    }

    this.validateDependencyRisk({
      githubEdit,
      dependencyMap,
      warnings,
      failures,
      requiredFixes
    });

    const safetyScore = this.scoreSafety({
      failures,
      warnings,
      githubEdit,
      dependencyMap
    });

    return {
      valid: failures.length === 0,
      failures,
      warnings,
      requiredFixes,
      safetyScore
    };
  },

  validateReplaceOperation({
    githubEdit = {},
    fileContent = "",
    failures = [],
    warnings = [],
    requiredFixes = []
  }) {
    if (!githubEdit.find || typeof githubEdit.find !== "string") {
      failures.push("Replace operation is missing exact find text.");
      requiredFixes.push("Provide exact find text from the current file.");
      return;
    }

    if (githubEdit.replace === undefined || githubEdit.replace === null) {
      failures.push("Replace operation is missing replacement text.");
      requiredFixes.push("Provide replacement text.");
      return;
    }

    if (!fileContent.includes(githubEdit.find)) {
      failures.push("Find text does not exist in current file content.");
      requiredFixes.push("Re-read the file and rebuild the patch using exact current text.");
      return;
    }

    const occurrences = this.countOccurrences(fileContent, githubEdit.find);

    if (occurrences > 1 && githubEdit.replaceAll !== true) {
      warnings.push(`Find text appears ${occurrences} times. Patch will replace only the first occurrence.`);
    }

    if (String(githubEdit.find) === String(githubEdit.replace)) {
      failures.push("Replacement text is identical to find text.");
      requiredFixes.push("Change replacement text or cancel this patch.");
    }

    if (String(githubEdit.find).length < 12) {
      warnings.push("Find text is very short. Short find text can patch the wrong place.");
    }

    if (this.looksLikePartialSyntax(githubEdit.find)) {
      warnings.push("Find text may be a partial syntax fragment. Prefer replacing a complete line or block.");
    }
  },

  validateFullReplaceOperation({
    githubEdit = {},
    fileContent = "",
    failures = [],
    warnings = [],
    requiredFixes = []
  }) {
    if (!githubEdit.newContent || typeof githubEdit.newContent !== "string") {
      failures.push("full_replace is missing newContent.");
      requiredFixes.push("Provide full new file content.");
      return;
    }

    if (githubEdit.newContent === fileContent) {
      failures.push("newContent is identical to current file content.");
      requiredFixes.push("Do not commit a no-op patch.");
    }

    const currentLength = fileContent.length;
    const newLength = githubEdit.newContent.length;

    if (currentLength > 0) {
      const ratio = newLength / currentLength;

      if (ratio < 0.5 || ratio > 1.8) {
        warnings.push("full_replace changes file size dramatically. Verify this is intentional.");
      }
    }

    warnings.push("full_replace has higher blast radius than replace. Prefer exact replace unless full file rewrite is necessary.");
  },

  validateDependencyRisk({
    githubEdit = {},
    dependencyMap = null,
    warnings = [],
    failures = [],
    requiredFixes = []
  }) {
    const blast = dependencyMap?.blastRadius || null;
    const filePath = githubEdit.filePath || "";

    if (blast?.level === "critical") {
      warnings.push("Dependency map reports critical blast radius.");
    }

    if (blast?.level === "high") {
      warnings.push("Dependency map reports high blast radius.");
    }

    if (
      filePath.includes("ari-github-edit") &&
      githubEdit.operation === "full_replace"
    ) {
      failures.push("Full replacement of GitHub edit endpoint is too risky without manual review.");
      requiredFixes.push("Use exact replace or preview-only mode for GitHub edit endpoint changes.");
    }

    if (
      filePath.includes("ari-rebirth-pipeline") &&
      githubEdit.operation === "full_replace"
    ) {
      failures.push("Full replacement of Rebirth pipeline is too risky without manual review.");
      requiredFixes.push("Use exact replace on the smallest pipeline block.");
    }

    if (
      filePath === "calbuddy-core.js" &&
      githubEdit.operation === "full_replace"
    ) {
      warnings.push("Full replacement of calbuddy-core.js can break app auth, logging, dashboard, and Ari handoff.");
    }
  },

  scoreSafety({ failures = [], warnings = [], githubEdit = {}, dependencyMap = null }) {
    let score = 100;

    score -= failures.length * 25;
    score -= warnings.length * 7;

    if (githubEdit.operation === "full_replace") score -= 15;

    const blastLevel = dependencyMap?.blastRadius?.level || "unknown";

    if (blastLevel === "critical") score -= 20;
    else if (blastLevel === "high") score -= 15;
    else if (blastLevel === "medium_high") score -= 10;

    return Math.max(0, Math.min(100, score));
  },

  countOccurrences(content = "", find = "") {
    if (!find) return 0;

    return String(content).split(find).length - 1;
  },

  isUnsafeFilePath(filePath = "") {
    const path = String(filePath || "");

    if (!path.trim()) return true;
    if (path.includes("..")) return true;
    if (path.startsWith("/")) return true;
    if (path.includes("\\")) return true;
    if (path.includes("\0")) return true;

    return false;
  },

  looksLikePartialSyntax(text = "") {
    const clean = String(text || "").trim();

    if (!clean) return true;

    const opens = (clean.match(/[({[]/g) || []).length;
    const closes = (clean.match(/[)}\]]/g) || []).length;

    if (opens !== closes) return true;

    if (
      clean.endsWith(",") ||
      clean.endsWith("&&") ||
      clean.endsWith("||") ||
      clean.endsWith("+") ||
      clean.endsWith("=")
    ) {
      return true;
    }

    return false;
  }
};

console.log(
  "ARI REBIRTH PATCH VALIDATION ENGINE LOADED:",
  window.AriRebirthPatchValidationEngine.version
);