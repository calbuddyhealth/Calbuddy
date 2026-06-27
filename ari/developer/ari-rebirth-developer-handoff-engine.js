// ari/developer/ari-rebirth-developer-handoff-engine.js
// Purpose: Convert developer engine outputs into CalBuddy-safe developerIntent + developerResponse handoff.
// V1.2.2 — Developer Diagnostic Handoff / Locked Reply / Composer-Safe

window.Ari = window.Ari || {};

window.AriRebirthDeveloperHandoffEngine = {
  version: "1.2.2",

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

const patchValidation =
  summary.patchValidation ||
  summary.rebirthPatchValidation ||
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
  !patchValidation &&
  !selfImprovement
) {
  return null;
}

    if (
  patchDecision?.canPatchNow &&
  patchDecision.githubEdit &&
  patchValidation?.valid === true
) {
      return this.lockHandoff(
        this.buildGithubEditIntent({
          summary,
          understanding,
          codeUnderstanding,
          patchDecision
        })
      );
    }

if (
  patchDecision?.canPatchNow &&
  patchDecision.githubEdit &&
  patchValidation?.valid === false
) {
  return this.lockHandoff(
    this.buildDeveloperTaskIntent({
      summary,
      understanding,
      codeUnderstanding,
      patchDecision: {
        ...patchDecision,
        reason:
          "Patch validation failed.",
        missingEvidence:
          patchValidation.requiredFixes || ["patch_validation_failed"]
      },
      selfImprovement
    })
  );
}

if (this.wantsDeveloperDiagnosis(summary, understanding)) {
  return this.lockHandoff(
    this.buildDeveloperDiagnosticIntent({
      summary,
      understanding,
      codeEvidence,
      codeUnderstanding,
      patchDecision,
      selfImprovement
    })
  );
}

    if (this.wantsDirectFileRead(summary, understanding)) {
      const readStep = this.findReadStep(understanding, codeEvidence, selfImprovement);

      if (readStep) {
        return this.lockHandoff(
          this.buildGithubReadIntent({
            summary,
            understanding,
            readStep,
            codeEvidence,
            codeUnderstanding
          })
        );
      }
    }

    if (codeEvidence?.steps?.length) {
      return this.lockHandoff(
        this.buildDeveloperInvestigationIntent({
          summary,
          understanding,
          codeEvidence,
          selfImprovement
        })
      );
    }

    if (selfImprovement?.steps?.length) {
      return this.lockHandoff(
        this.buildDeveloperInvestigationIntent({
          summary,
          understanding,
          codeEvidence: selfImprovement,
          selfImprovement
        })
      );
    }

    return this.lockHandoff(
      this.buildDeveloperTaskIntent({
        summary,
        understanding,
        codeUnderstanding,
        patchDecision,
        selfImprovement
      })
    );
  },

  lockHandoff(intent = null) {
    if (!intent) return null;

    const developerResponse =
      intent.developerResponse ||
      this.buildDeveloperResponse({
        kind: intent.type || "developer_response",
        explanation: intent.summary || "Developer handoff prepared.",
        nextAction: "Continue with the safest developer next step."
      });

    const reply =
      intent.reply ||
      this.composeDeveloperReply(developerResponse);

    const lockedIntent = {
      ...intent,
      developerResponse,
      reply
    };

    return {
      ...lockedIntent,
      developerIntent: lockedIntent,
      finalResponse: reply,
      responseLocked: true,
      developerResponseLocked: true
    };
  },

  buildGithubEditIntent({
    summary = {},
    understanding = null,
    codeUnderstanding = null,
    patchDecision = {}
  }) {
    const githubEdit = patchDecision.githubEdit || {};
    const artifact = this.buildArtifactFromPatchDecision(patchDecision);

    const developerResponse = this.buildDeveloperResponse({
      kind: "code_patch",
      summary,
      understanding,
      explanation:
        patchDecision.explanation ||
        patchDecision.reason ||
        "Prepared an evidence-based code patch.",
      evidence: patchDecision.evidence || codeUnderstanding?.evidence || null,
      artifact,
      nextAction: "Owner confirmation is required before committing.",
      confidence: patchDecision.confidence || "medium_high"
    });

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

      developerResponse,

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

    const developerResponse = this.buildDeveloperResponse({
      kind: "investigation_plan",
      summary,
      understanding,
      explanation:
        "I need exact code evidence before proposing a safe patch.",
      evidence: codeEvidence.evidence || null,
      artifact: {
        type: "investigation_steps",
        language: "json",
        steps
      },
      nextAction: "Run the listed search/read steps before editing.",
      confidence: "medium"
    });

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

      developerResponse,

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
    const developerResponse = this.buildDeveloperResponse({
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
    });

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

      developerResponse,

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
    const developerResponse = this.buildDeveloperResponse({
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
    });

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

      developerResponse,

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

  composeDeveloperReply(developerResponse = {}) {
    if (!developerResponse?.enabled) {
      return "Developer handoff prepared.";
    }

    const artifact = developerResponse.artifact || null;
    const explanation = developerResponse.explanation || "Developer handoff prepared.";
    const nextAction = developerResponse.nextAction || "";

    if (artifact?.type === "code_patch") {
      const language = artifact.language || "text";
      const filePath = artifact.filePath || "unknown file";
      const operation = artifact.operation || "replace";

      const parts = [
        explanation,
        "",
        `File: ${filePath}`,
        `Operation: ${operation}`
      ];

      if (artifact.find) {
        parts.push(
          "",
          "Exact find text:",
          "```" + language,
          artifact.find,
          "```"
        );
      }

      if (artifact.replacement || artifact.code) {
        parts.push(
          "",
          "Replacement code:",
          "```" + language,
          artifact.replacement || artifact.code,
          "```"
        );
      }

      if (nextAction) {
        parts.push("", nextAction);
      }

      return parts.join("\n");
    }

    if (artifact?.type === "investigation_steps") {
      return [
        explanation,
        "",
        "Next evidence steps:",
        "```json",
        JSON.stringify(artifact.steps || [], null, 2),
        "```",
        "",
        nextAction
      ].join("\n");
    }

if (artifact?.type === "diagnostic_summary") {
  return [
    explanation,
    "",
    "Diagnostic target:",
    artifact.targetArea || "unknown",
    "",
    "Likely files:",
    "```json",
    JSON.stringify(artifact.likelyFiles || [], null, 2),
    "```",
    "",
    "Diagnostic steps:",
    "```json",
    JSON.stringify(artifact.steps || [], null, 2),
    "```",
    "",
    nextAction
  ].join("\n");
}

    if (artifact?.type === "file_reference") {
      return [
        explanation,
        "",
        `File to read: ${artifact.filePath || "unknown"}`,
        "",
        nextAction
      ].join("\n");
    }

    return [
      explanation,
      "",
      nextAction
    ].filter(Boolean).join("\n");
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
      return { summary: evidence };
    }

    if (Array.isArray(evidence)) {
      return { items: evidence };
    }

    return evidence;
  },

wantsDeveloperDiagnosis(summary = {}, understanding = null) {
  const text = String(
    summary.userMessage ||
    summary.message ||
    summary.input ||
    ""
  ).toLowerCase();

  const intentFamily =
    understanding?.intentFamily ||
    summary.intentFamily ||
    null;

  const developerIntent =
    intentFamily === "bug_investigation" ||
    intentFamily === "performance_investigation" ||
    intentFamily === "developer_diagnosis" ||
    summary.developerArtifactRequest === true ||
    summary.artifactInvestigationRequest === true;

  const diagnosticLanguage =
    /\b(inspect|diagnose|latency|slow|bottleneck|performance|debug|trace|why.*slow|where.*coming from)\b/i.test(text);

  const developerSubject =
    /\b(ari|pipeline|engine|composer|handoff|github|code|file|repo|calbuddy|developer layer)\b/i.test(text);

  return Boolean(developerIntent && diagnosticLanguage && developerSubject);
},

buildDeveloperDiagnosticIntent({
  summary = {},
  understanding = null,
  codeEvidence = null,
  codeUnderstanding = null,
  patchDecision = null,
  selfImprovement = null
} = {}) {
  const developerResponse = this.buildDeveloperResponse({
    kind: "developer_diagnostic",
    summary,
    understanding,
    explanation:
      "This looks like a developer diagnostic request, not an edit request.",
    evidence:
      codeUnderstanding?.evidence ||
      codeEvidence?.evidence ||
      null,
    artifact: {
      type: "diagnostic_summary",
      targetArea: understanding?.targetArea || "unknown",
      likelyFiles: understanding?.likelyFiles || [],
      steps: this.cleanSteps(
        codeEvidence?.steps ||
        selfImprovement?.steps ||
        []
      )
    },
    nextAction:
      "Inspect the relevant pipeline/debug evidence and explain the likely bottleneck before proposing a patch.",
    confidence: "medium_high"
  });

  return {
    enabled: true,
    type: "developer_diagnostic",
    source: "ari-rebirth-developer-handoff-engine",
    handoffVersion: this.version,

    title: this.buildTitle(understanding, "Developer diagnostic"),
    summary:
      "Ari should diagnose the code behavior first and avoid jumping straight to an edit.",

    priority: this.inferPriority(understanding),
    ownerCommand: true,

    canEditNow: false,
    requiresReadBeforeEdit: true,

    developerResponse,
    codeEvidence,
    codeUnderstanding,
    patchDecision,
    selfImprovement,

    safety: {
      ownerRequired: true,
      directWriteAllowed: false,
      diagnosticOnly: true,
      readBeforeEdit: true,
      neverGuessFindText: true
    }
  };
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