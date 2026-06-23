// ari/developer/ari-rebirth-developer-handoff-engine.js
// Purpose: Convert developer engine outputs into CalBuddy-safe developerIntent handoff.
// V1.0.0 — Handoff Only / No Understanding / No Patch Guessing

window.Ari = window.Ari || {};

window.AriRebirthDeveloperHandoffEngine = {
  version: "1.0.0",

  handoff(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};

    if (!appContext.ownerMode) return null;

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    const codeEvidence =
      summary.codeEvidence ||
      summary.rebirthCodeEvidence ||
      null;

    const codeUnderstanding =
      summary.codeUnderstanding ||
      summary.rebirthCodeUnderstanding ||
      null;

    const patchDecision =
      summary.patchDecision ||
      summary.rebirthPatchDecision ||
      null;

    const selfImprovement =
      summary.selfImprovement ||
      summary.rebirthSelfImprovement ||
      null;

    if (
      !understanding &&
      !codeEvidence &&
      !codeUnderstanding &&
      !patchDecision &&
      !selfImprovement
    ) {
      return null;
    }

    if (patchDecision?.canPatchNow && patchDecision.githubEdit) {
      return this.buildGithubEditIntent({
        summary,
        understanding,
        codeUnderstanding,
        patchDecision
      });
    }

    if (codeEvidence?.steps?.length) {
      return this.buildDeveloperInvestigationIntent({
        summary,
        understanding,
        codeEvidence,
        selfImprovement
      });
    }

    if (selfImprovement?.steps?.length) {
      return this.buildDeveloperInvestigationIntent({
        summary,
        understanding,
        codeEvidence: selfImprovement,
        selfImprovement
      });
    }

    return this.buildDeveloperTaskIntent({
      summary,
      understanding,
      codeUnderstanding,
      patchDecision,
      selfImprovement
    });
  },

  buildGithubEditIntent({
    summary = {},
    understanding = null,
    codeUnderstanding = null,
    patchDecision = {}
  }) {
    return {
      enabled: true,
      type: "github_edit_request",
      source: "ari-rebirth-developer-handoff-engine",
      handoffVersion: this.version,

      title: this.buildTitle(understanding, "Prepare GitHub edit"),
      summary:
        patchDecision.reason ||
        "Ari has enough exact code evidence to prepare a safe GitHub edit.",

      priority: this.inferPriority(understanding),
      ownerCommand: true,

      recommended_files: [patchDecision.filePath].filter(Boolean),

      githubEdit: {
        ...patchDecision.githubEdit,
        requiresConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT"
      },

      safety: {
        ownerRequired: true,
        directWriteAllowed: false,
        requiresConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT",
        evidenceBased: true
      },

      codeUnderstanding,
      patchDecision
    };
  },

  buildDeveloperInvestigationIntent({
    summary = {},
    understanding = null,
    codeEvidence = {},
    selfImprovement = null
  }) {
    return {
      enabled: true,
      type: "developer_investigation",
      source: "ari-rebirth-developer-handoff-engine",
      handoffVersion: this.version,

      title:
        codeEvidence.investigationPlan?.title ||
        selfImprovement?.title ||
        this.buildTitle(understanding, "Investigate CalBuddy code"),

      summary:
        codeEvidence.investigationPlan?.summary ||
        selfImprovement?.summary ||
        this.buildSummary(understanding),

      priority:
        codeEvidence.investigationPlan?.priority ||
        selfImprovement?.priority ||
        this.inferPriority(understanding),

      ownerCommand: true,

      intentFamily:
        understanding?.intentFamily ||
        selfImprovement?.intentFamily ||
        "developer_investigation",

      targetArea:
        understanding?.targetArea ||
        selfImprovement?.targetArea ||
        "unknown",

      targetObject:
        understanding?.targetObject ||
        selfImprovement?.targetObject ||
        null,

      likelyFiles:
        understanding?.likelyFiles ||
        selfImprovement?.likelyFiles ||
        [],

      searchConcepts:
        understanding?.searchConcepts ||
        selfImprovement?.searchConcepts ||
        [],

      steps: this.cleanSteps(codeEvidence.steps || selfImprovement?.steps || []),

      canEditNow: false,
      requiresReadBeforeEdit: true,

      safety: {
        ownerRequired: true,
        directWriteAllowed: false,
        readBeforeEdit: true,
        neverGuessFindText: true,
        requiresConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT"
      }
    };
  },

  buildDeveloperTaskIntent({
    summary = {},
    understanding = null,
    codeUnderstanding = null,
    patchDecision = null,
    selfImprovement = null
  }) {
    return {
      enabled: true,
      type: "developer_task",
      source: "ari-rebirth-developer-handoff-engine",
      handoffVersion: this.version,

      title: this.buildTitle(understanding, "Developer task"),
      summary:
        patchDecision?.reason ||
        selfImprovement?.summary ||
        this.buildSummary(understanding),

      priority: this.inferPriority(understanding),
      ownerCommand: true,

      recommended_files:
        understanding?.likelyFiles ||
        selfImprovement?.likelyFiles ||
        [],

      canEditNow: false,
      requiresReadBeforeEdit: true,

      missingEvidence:
        patchDecision?.missingEvidence ||
        ["more_code_evidence"],

      codeUnderstanding,
      patchDecision
    };
  },

  cleanSteps(steps = []) {
    return steps
      .filter(step => step && step.tool)
      .map(step => ({
        tool: step.tool,
        query: step.query || undefined,
        filePath: step.filePath || undefined,
        reason: step.reason || "Developer evidence step.",
        required: step.required === true,
        requiresExactFindText: step.requiresExactFindText === true,
        requiresOwnerConfirmation: step.requiresOwnerConfirmation === true,
        confirmationText:
          step.confirmationText ||
          (step.requiresOwnerConfirmation ? "CONFIRM GITHUB EDIT" : undefined)
      }))
      .slice(0, 20);
  },

  buildTitle(understanding = null, fallback = "Developer task") {
    if (!understanding) return fallback;

    const target =
      understanding.targetObject?.name ||
      understanding.targetObject?.filePath ||
      understanding.targetArea ||
      "CalBuddy code";

    const intent = understanding.intentFamily || "developer work";

    return `${fallback}: ${target} (${intent})`;
  },

  buildSummary(understanding = null) {
    if (!understanding) {
      return "Ari prepared a developer task, but more evidence is needed before editing.";
    }

    return `Owner goal: ${
      understanding.userGoal || "developer request"
    }. Ari must use search/read evidence before proposing any code patch.`;
  },

  inferPriority(understanding = null) {
    if (!understanding) return "medium";

    if (understanding.urgency === "high") return "high";
    if (understanding.riskLevel === "high") return "high";
    if (understanding.intentFamily === "bug_investigation") return "high";
    if (understanding.riskLevel === "medium_high") return "medium_high";

    return "medium";
  }
};

console.log(
  "ARI REBIRTH DEVELOPER HANDOFF ENGINE LOADED:",
  window.AriRebirthDeveloperHandoffEngine.version
);