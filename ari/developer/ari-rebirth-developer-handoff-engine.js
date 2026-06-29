// ari/developer/ari-rebirth-developer-handoff-engine.js
// Purpose: Convert developer engine outputs into CalBuddy-safe developerIntent + developerResponse handoff.
// V1.2.8 — No Template Dump / Evidence-Aware / Composer-Safe Developer Handoff

window.Ari = window.Ari || {};

window.AriRebirthDeveloperHandoffEngine = {
  version: "1.2.8",

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
        }),
        { lock: true }
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
            reason: "Patch validation failed.",
            missingEvidence:
              patchValidation.requiredFixes || ["patch_validation_failed"]
          },
          selfImprovement
        }),
        { lock: false }
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
        }),
        { lock: false }
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
          }),
          { lock: true }
        );
      }
    }

    if (this.canExplainWithoutPatch(summary, understanding, codeUnderstanding, patchDecision)) {
      return this.lockHandoff(
        this.buildDeveloperExplanationIntent({
          summary,
          understanding,
          codeUnderstanding,
          patchDecision,
          selfImprovement
        }),
        { lock: false }
      );
    }

    if (codeEvidence?.steps?.length) {
      return this.lockHandoff(
        this.buildDeveloperInvestigationIntent({
          summary,
          understanding,
          codeEvidence,
          selfImprovement
        }),
        { lock: false }
      );
    }

    if (selfImprovement?.steps?.length) {
      return this.lockHandoff(
        this.buildDeveloperInvestigationIntent({
          summary,
          understanding,
          codeEvidence: selfImprovement,
          selfImprovement
        }),
        { lock: false }
      );
    }

    return this.lockHandoff(
      this.buildDeveloperTaskIntent({
        summary,
        understanding,
        codeUnderstanding,
        patchDecision,
        selfImprovement
      }),
      { lock: false }
    );
  },

  lockHandoff(intent = null, options = {}) {
    if (!intent) return null;

    const shouldLock = options.lock === true;

    const developerResponse =
      intent.developerResponse ||
      this.buildDeveloperResponse({
        kind: intent.type || "developer_response",
        explanation: intent.summary || "Developer handoff prepared.",
        nextAction: "Continue with the safest developer next step."
      });

    const reply = shouldLock
      ? this.composeLockedDeveloperReply(developerResponse)
      : this.composeUnlockedDeveloperReply(developerResponse);

    const lockedIntent = {
      ...intent,
      developerResponse,
      reply
    };

    return {
      ...lockedIntent,

      developerIntent: lockedIntent,
      developerResponse,
      developerReply: reply,

      composerDeveloperPacket: {
        enabled: true,
        mode: "developer",
        locked: shouldLock,
        kind: developerResponse.kind || lockedIntent.type || "developer_response",
        reply,
        response: developerResponse,
        intent: lockedIntent,
        source: "ari-rebirth-developer-handoff-engine"
      },

      finalResponse: shouldLock ? reply : null,
      responseLocked: shouldLock,
      developerResponseLocked: shouldLock
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
      findings: this.extractCodeFindings({ codeUnderstanding, patchDecision }),
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
    const evidenceState = codeEvidence.repositoryEvidence || null;

    const findings = this.extractEvidenceFindings({
      codeEvidence,
      evidenceState
    });

    const nextAction = this.buildNextSpecificAction({
      understanding,
      codeEvidence,
      steps,
      evidenceState
    });

    const developerResponse = this.buildDeveloperResponse({
      kind: "investigation_plan",
      summary,
      understanding,
      explanation: findings.length
        ? "I found repository evidence, but Ari should not patch until the exact safe edit is proven."
        : "I need exact code evidence before proposing a safe patch.",
      evidence: codeEvidence.evidence || evidenceState || null,
      artifact: {
        type: "investigation_steps",
        language: "json",
        steps
      },
      findings,
      recommendedActions: this.buildRecommendedActionsFromSteps(steps),
      nextAction,
      confidence: evidenceState?.hasCompleteEvidence ? "medium_high" : "medium"
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

      canEditNow: codeEvidence.canEditNow === true,
      requiresReadBeforeEdit: codeEvidence.requiresReadBeforeEdit !== false,

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
    const findings = this.extractCodeFindings({ codeUnderstanding, patchDecision });

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
      findings,
      nextAction: this.buildNextSpecificAction({
        understanding,
        codeEvidence: null,
        steps: [],
        evidenceState: null
      }),
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
    confidence = "medium",
    findings = [],
    recommendedActions = [],
    metadata = null
  } = {}) {
    return {
      enabled: true,
      kind,
      source: "ari-rebirth-developer-handoff-engine",
      handoffVersion: this.version,

      summaryText: String(explanation || "").trim(),
      findings: Array.isArray(findings) ? findings.filter(Boolean) : [],
      recommendedActions: Array.isArray(recommendedActions)
        ? recommendedActions.filter(Boolean)
        : [],
      metadata,

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
        doNotRenderInvestigationJsonAsFinal: true,
        maxSections: 3,
        preferredShape:
          artifact?.replacement || artifact?.code
            ? "explain_then_code"
            : "direct_developer_answer"
      },

      confidence
    };
  },

  composeUnlockedDeveloperReply(developerResponse = {}) {
    if (!developerResponse?.enabled) {
      return "Developer handoff prepared.";
    }

    const findings = developerResponse.findings || [];
    const recommendedActions = developerResponse.recommendedActions || [];
    const nextAction = developerResponse.nextAction || "";
    const explanation = developerResponse.explanation || "Developer handoff prepared.";

    const parts = [explanation];

    if (findings.length) {
      parts.push(
        "",
        "What Ari found:",
        ...findings.slice(0, 4).map(item => `- ${item}`)
      );
    }

    if (recommendedActions.length) {
      parts.push(
        "",
        "Next move:",
        ...recommendedActions.slice(0, 3).map(item => `- ${item}`)
      );
    } else if (nextAction) {
      parts.push("", `Next move: ${nextAction}`);
    }

    return parts.filter(Boolean).join("\n");
  },

  composeLockedDeveloperReply(developerResponse = {}) {
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

      if (nextAction) parts.push("", nextAction);

      return parts.join("\n");
    }

    if (artifact?.type === "file_reference") {
      return [
        explanation,
        "",
        `File to read: ${artifact.filePath || "unknown"}`,
        "",
        nextAction
      ].filter(Boolean).join("\n");
    }

    return this.composeUnlockedDeveloperReply(developerResponse);
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

  extractEvidenceFindings({ codeEvidence = {}, evidenceState = null } = {}) {
    const findings = [];

    const repositoryEvidence =
      evidenceState ||
      codeEvidence.repositoryEvidence ||
      null;

    if (repositoryEvidence?.hasCompleteEvidence) {
      findings.push(
        `Ari has complete file evidence for ${repositoryEvidence.filePath || "the current target file"}.`
      );
    } else if (repositoryEvidence?.hasAnyEvidence || repositoryEvidence?.available) {
      findings.push(
        `Ari has some repository evidence, but it is not proven complete full-file evidence yet.`
      );
    }

    if (repositoryEvidence?.filePath) {
      findings.push(`Current evidence target: ${repositoryEvidence.filePath}.`);
    }

    if (repositoryEvidence?.contentLength) {
      findings.push(
        `Loaded content length: ${repositoryEvidence.contentLength} characters. This is metadata, not proof of completeness.`
      );
    }

    if (!findings.length && Array.isArray(codeEvidence.steps) && codeEvidence.steps.length) {
      const firstStep = codeEvidence.steps[0];
      if (firstStep.filePath) {
        findings.push(`Ari should read ${firstStep.filePath} next.`);
      } else if (firstStep.query) {
        findings.push(`Ari should search the repo for "${firstStep.query}" next.`);
      }
    }

    return findings;
  },

  extractCodeFindings({ codeUnderstanding = null, patchDecision = null } = {}) {
    const findings = [];

    if (codeUnderstanding?.filePath) {
      findings.push(`Ari analyzed ${codeUnderstanding.filePath}.`);
    }

    if (codeUnderstanding?.purpose) {
      findings.push(codeUnderstanding.purpose);
    }

    if (patchDecision?.reason) {
      findings.push(patchDecision.reason);
    }

    if (Array.isArray(patchDecision?.missingEvidence)) {
      findings.push(`Missing evidence: ${patchDecision.missingEvidence.join(", ")}.`);
    }

    return findings;
  },

  buildRecommendedActionsFromSteps(steps = []) {
    if (!Array.isArray(steps) || !steps.length) return [];

    const firstRead = steps.find(step => step.tool === "github_read" && step.filePath);
    const firstSearch = steps.find(step => step.tool === "github_search" && step.query);

    if (firstRead) {
      return [`Read ${firstRead.filePath} as full-file evidence.`];
    }

    if (firstSearch) {
      return [`Search the repository for "${firstSearch.query}", then read the best matching file.`];
    }

    return ["Run the next evidence step before proposing a patch."];
  },

  buildNextSpecificAction({
    understanding = null,
    codeEvidence = null,
    steps = [],
    evidenceState = null
  } = {}) {
    const nextRequired =
      codeEvidence?.nextRequiredAction ||
      null;

    if (nextRequired?.filePath) {
      return `Read ${nextRequired.filePath} as exact full-file evidence.`;
    }

    if (nextRequired?.firstQuery) {
      return `Search the repository for "${nextRequired.firstQuery}", then read the strongest matching file.`;
    }

    const firstRead = steps.find(step => step.tool === "github_read" && step.filePath);
    if (firstRead) return `Read ${firstRead.filePath} as exact full-file evidence.`;

    const firstSearch = steps.find(step => step.tool === "github_search" && step.query);
    if (firstSearch) return `Search the repository for "${firstSearch.query}", then read the strongest matching file.`;

    const likelyFile =
      understanding?.targetObject?.filePath ||
      understanding?.likelyFiles?.[0] ||
      null;

    if (likelyFile) return `Read ${likelyFile} before proposing code.`;

    return "Search the repository semantically, then read the most relevant file before proposing code.";
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

  extractTimingFindings(summary = {}) {
    const timing = summary.pipelineTiming || summary.timing || [];

    if (!Array.isArray(timing) || !timing.length) return [];

    const findings = [];

    const total = timing[timing.length - 1]?.ms ?? null;

    if (total !== null) {
      findings.push(`Total measured pipeline time was about ${total}ms.`);
    }

    for (let i = 1; i < timing.length; i++) {
      const previous = timing[i - 1];
      const current = timing[i];

      const delta = Number(current.ms || 0) - Number(previous.ms || 0);

      if (delta >= 10) {
        findings.push(
          `${previous.label} → ${current.label} took about ${delta}ms.`
        );
      }
    }

    if (!findings.length) {
      findings.push(
        "No single measured pipeline step showed a large delay in the captured timing data."
      );
    }

    return findings;
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
    const timingFindings = this.extractTimingFindings(summary);

    const developerResponse = this.buildDeveloperResponse({
      kind: "developer_diagnostic",
      summary,
      understanding,
      explanation:
        "I inspected this as a developer diagnostic request, not an edit request.",
      findings: timingFindings.length
        ? timingFindings
        : [
            "Ari correctly classified this as a diagnostic request.",
            "No patch should be proposed until exact code evidence or timing evidence identifies the bottleneck."
          ],
      evidence:
        codeUnderstanding?.evidence ||
        codeEvidence?.evidence ||
        summary.pipelineTiming ||
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
      recommendedActions: [
        "Use pipelineTiming to identify the slowest stage.",
        "Read the highest-risk files before proposing a patch.",
        "Only propose an edit after exact bottleneck evidence exists."
      ],
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

  canExplainWithoutPatch(summary = {}, understanding = null, codeUnderstanding = null, patchDecision = null) {
    const text = String(
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    ).toLowerCase();

    const asksForExplanation =
      /\b(why|explain|what options|suggest|recommend|possible solutions|what do you suggest|hypothesis|diagnose|what is happening)\b/i.test(text);

    const hasDeveloperContext =
      understanding?.isDeveloperWork === true ||
      summary.developerArtifactRequest === true ||
      summary.primaryFunction === "developer_artifact_request" ||
      summary.situationContractPrimary === "builder";

    const patchBlockedButInformative =
      patchDecision &&
      patchDecision.canPatchNow !== true &&
      patchDecision.reason;

    return Boolean(
      hasDeveloperContext &&
      asksForExplanation &&
      patchBlockedButInformative
    );
  },

  buildDeveloperExplanationIntent({
    summary = {},
    understanding = null,
    codeUnderstanding = null,
    patchDecision = null,
    selfImprovement = null
  } = {}) {
    const developerResponse = this.buildDeveloperResponse({
      kind: "developer_explanation",
      summary,
      understanding,
      explanation: this.buildExplanationText({
        summary,
        understanding,
        codeUnderstanding,
        patchDecision,
        selfImprovement
      }),
      evidence: codeUnderstanding?.evidence || null,
      artifact: null,
      nextAction:
        "Explain the likely cause and options. Do not force a read/edit step unless the owner asks to patch.",
      confidence: "medium_high"
    });

    return {
      enabled: true,
      type: "developer_explanation",
      source: "ari-rebirth-developer-handoff-engine",
      handoffVersion: this.version,

      title: this.buildTitle(understanding, "Developer explanation"),
      summary:
        "Ari can explain the developer issue without preparing an edit yet.",

      priority: this.inferPriority(understanding),
      ownerCommand: true,

      canEditNow: false,
      requiresReadBeforeEdit: false,

      developerResponse,

      codeUnderstanding,
      patchDecision,
      selfImprovement,

      safety: {
        ownerRequired: true,
        directWriteAllowed: false,
        explanationOnly: true,
        requiresConfirmation: false
      }
    };
  },

  buildExplanationText({
    summary = {},
    understanding = null,
    codeUnderstanding = null,
    patchDecision = null,
    selfImprovement = null
  } = {}) {
    const blocker =
      patchDecision?.reason ||
      selfImprovement?.summary ||
      "Ari could not build a safe patch from the available evidence.";

    const filePath =
      patchDecision?.filePath ||
      codeUnderstanding?.filePath ||
      understanding?.targetObject?.filePath ||
      understanding?.likelyFiles?.[0] ||
      "the relevant file";

    return [
      `Likely cause: Ari is entering the developer handoff path, but the patch engine cannot build an exact safe edit for ${filePath}.`,
      "",
      `The current blocker is: ${blocker}`,
      "",
      "That means Ari should explain the cause and options instead of forcing read/edit steps.",
      "",
      "Best fix: keep the safety gate for real code edits, but use an explanation-only path when the owner asks why, what options exist, or what is happening."
    ].join("\n");
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