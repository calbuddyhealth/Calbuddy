// ari/developer/ari-rebirth-developer-handoff-engine.js
// Purpose: Convert developer engine outputs into CalBuddy-safe developerIntent + developerResponse handoff.
// V1.1.0 — Universal Developer Response Handoff / Evidence + Artifact Ready / No Patch Guessing

window.Ari = window.Ari || {};

window.AriRebirthDeveloperHandoffEngine = {
  version: "1.1.0",

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

    if (this.wantsDirectFileRead(summary, understanding)) {
      const readStep = this.findReadStep(understanding, codeEvidence, selfImprovement);

      if (readStep) {
        return this.buildGithubReadIntent({
          summary,
          understanding,
          readStep,
          codeEvidence,
          codeUnderstanding
        });
      }
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
    const githubEdit = patchDecision.githubEdit || {};
    const artifact = this.buildArtifactFromPatchDecision(patchDecision);

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

      recommended_files: [patchDecision.filePath || githubEdit.filePath].filter(Boolean),

      githubEdit: {
        ...githubEdit,
        requiresConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT"
      },

      developerResponse: this.buildDeveloperResponse({
        kind: "code_patch",
        summary,
        understanding,
        explanation:
          patchDecision.explanation ||
          patchDecision.reason ||
          "Prepared an evidence-based code patch.",
        evidence: patchDecision.evidence || codeUnderstanding?.evidence || null,
        artifact,
        nextAction: "Ask owner to confirm before committing.",
        confidence: patchDecision.confidence || "medium_high"
      }),

      safety: {
        ownerRequired: true,
        directWriteAllowed: false,
        requiresConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT",
        evidenceBased: true,
        neverGuessFindText: true
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
    const steps = this.cleanSteps(codeEvidence.steps || selfImprovement?.steps || []);

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

      steps,

      canEditNow: false,
      requiresReadBeforeEdit: true,

      developerResponse: this.buildDeveloperResponse({
        kind: "investigation_plan",
        summary,
        understanding,
        explanation:
          "I need to gather exact code evidence before proposing a safe patch.",
        evidence: codeEvidence.evidence || null,
        artifact: {
          type: "investigation_steps",
          language: "json",
          steps
        },
        nextAction: "Run the listed search/read steps before editing.",
        confidence: "medium"
      }),

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

      developerResponse: this.buildDeveloperResponse({
        kind: "developer_task",
        summary,
        understanding,
        explanation:
          patchDecision?.reason ||
          selfImprovement?.summary ||
          this.buildSummary(understanding),
        evidence: codeUnderstanding?.evidence || null,
        artifact: null,
        nextAction: "Read/search the relevant files before proposing code.",
        confidence: "medium"
      }),

      codeUnderstanding,
      patchDecision
    };
  },

  buildGithubReadIntent({
    summary = {},
    understanding = null,
    readStep = {},
    codeEvidence = null,
    codeUnderstanding = null
  }) {
    return {
      enabled: true,
      type: "github_read_request",
      source: "ari-rebirth-developer-handoff-engine",
      handoffVersion: this.version,

      title: this.buildTitle(understanding, "Read GitHub file"),
      summary:
        readStep.reason ||
        "Ari should read the requested GitHub file before answering.",

      priority: this.inferPriority(understanding),
      ownerCommand: true,

      filePath: readStep.filePath,

      githubRead: {
        filePath: readStep.filePath
      },

      canEditNow: false,
      requiresReadBeforeEdit: false,

      developerResponse: this.buildDeveloperResponse({
        kind: "file_read",
        summary,
        understanding,
        explanation: `Read ${readStep.filePath} before answering with exact file evidence.`,
        evidence: codeEvidence?.evidence || codeUnderstanding?.evidence || null,
        artifact: {
          type: "file_reference",
          filePath: readStep.filePath
        },
        nextAction: "Use the exact file content to answer the owner.",
        confidence: "high"
      }),

      safety: {
        ownerRequired: true,
        directWriteAllowed: false,
        readOnly: true,
        evidenceBased: true
      }
    };
  },

  buildDeveloperResponse({
    kind = "developer_response",
    summary = {},
    understanding = null,
    explanation = "",
    evidence = null,
    artifact = null,
    nextAction = "",
    confidence = "medium"
  } = {}) {
    return {
      enabled: true,
      kind,
      source: "ari-rebirth-developer-handoff-engine",
      handoffVersion: this.version,

      ownerRequest:
        summary.userMessage ||
        summary.message ||
        summary.input ||
        "",

      intentFamily:
        understanding?.intentFamily ||
        kind,

      targetArea:
        understanding?.targetArea ||
        "unknown",

      targetObject:
        understanding?.targetObject ||
        null,

      explanation:
        String(explanation || "").trim() ||
        "Developer handoff prepared.",

      evidence: this.normalizeEvidence(evidence),

      artifact,

      nextAction:
        String(nextAction || "").trim() ||
        "Continue with the safest developer next step.",

      composerInstructions: {
        mustUseThisHandoff: true,
        doNotInventCode: true,
        useArtifactIfPresent: Boolean(artifact),
        useEvidenceIfPresent: Boolean(evidence),
        answerOwnerDirectly: true,
        maxSections: 3,
        preferredShape:
          artifact?.replacement || artifact?.code
            ? "explain_then_code"
            : "direct_developer_answer"
      },

      confidence
    };
  },

  buildArtifactFromPatchDecision(patchDecision = {}) {
    const githubEdit = patchDecision.githubEdit || {};

    const replacement =
      githubEdit.replace ||
      githubEdit.newContent ||
      patchDecision.replacement ||
      patchDecision.proposedCode ||
      patchDecision.proposedHtml ||
      patchDecision.code ||
      null;

    const find =
      githubEdit.find ||
      patchDecision.find ||
      null;

    if (!replacement && !find) return null;

    return {
      type: "code_patch",
      language:
        patchDecision.language ||
        this.inferLanguageFromFilePath(patchDecision.filePath || githubEdit.filePath),
      filePath:
        patchDecision.filePath ||
        githubEdit.filePath ||
        null,
      operation:
        githubEdit.operation ||
        patchDecision.operation ||
        "replace",
      find,
      replacement,
      code:
        replacement ||
        githubEdit.newContent ||
        null
    };
  },

  normalizeEvidence(evidence = null) {
    if (!evidence) return null;

    if (typeof evidence === "string") {
      return {
        summary: evidence
      };
    }

    if (Array.isArray(evidence)) {
      return {
        items: evidence
      };
    }

    return evidence;
  },

  wantsDirectFileRead(summary = {}, understanding = null) {
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).toLowerCase();

    const directReadPhrases = [
      "read ",
      "open ",
      "show me",
      "show full file",
      "show all code",
      "full code",
      "entire file",
      "first ",
      "last ",
      "lines ",
      "what are the first",
      "what are the last",
      "what file are you reading",
      "currently reading"
    ];

    const namedFile =
      understanding?.targetObject?.filePath ||
      /\b[a-zA-Z0-9_\-./]+?\.(html|css|js|json|md|ts|tsx|jsx)\b/i.test(text);

    return Boolean(
      namedFile &&
      directReadPhrases.some(phrase => text.includes(phrase))
    );
  },

  findReadStep(understanding = null, codeEvidence = null, selfImprovement = null) {
    const steps = [
      ...(codeEvidence?.steps || []),
      ...(selfImprovement?.steps || [])
    ];

    const namedReadStep = steps.find(
      step => step?.tool === "github_read" && step.filePath
    );

    if (namedReadStep) return namedReadStep;

    const filePath =
      understanding?.targetObject?.filePath ||
      understanding?.likelyFiles?.[0] ||
      null;

    if (!filePath) return null;

    return {
      tool: "github_read",
      filePath,
      reason: "Owner asked for direct file visibility."
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
  },

  inferLanguageFromFilePath(filePath = "") {
    const path = String(filePath || "").toLowerCase();

    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".js")) return "javascript";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".md")) return "markdown";
    if (path.endsWith(".ts")) return "typescript";
    if (path.endsWith(".tsx")) return "tsx";
    if (path.endsWith(".jsx")) return "jsx";

    return "text";
  }
};

console.log(
  "ARI REBIRTH DEVELOPER HANDOFF ENGINE LOADED:",
  window.AriRebirthDeveloperHandoffEngine.version
);