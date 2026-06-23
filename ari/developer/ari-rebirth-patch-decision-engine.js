// ari/developer/ari-rebirth-patch-decision-engine.js
// Ari Rebirth Patch Decision Engine
// Purpose: Decide if Ari has enough code evidence to safely propose an edit.
// V1.1.0 — Evidence-Gated / Code Understanding Aware / No Guess Patches / Owner Approval Required

window.Ari = window.Ari || {};

window.AriRebirthPatchDecisionEngine = {
  version: "1.1.0",

  decide(input = {}) {
    const summary = input.summary || input || {};

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    const codeUnderstanding =
      summary.codeUnderstanding ||
      summary.rebirthCodeUnderstanding ||
      null;

    const githubContext =
      summary.githubFileContext ||
      summary.appContext?.githubFileContext ||
      null;

    if (!understanding?.isDeveloperWork) return null;

    const fileContent = this.getFileContent(summary, githubContext);
    const filePath = this.getFilePath({
      summary,
      githubContext,
      understanding,
      codeUnderstanding
    });

    const decision = this.emptyDecision({ filePath });

    if (!summary.appContext?.ownerMode) {
      return this.block(decision, {
        reason: "Owner mode is not active, so Ari cannot prepare code edits.",
        missing: "owner_mode",
        shouldAskOwner: true
      });
    }

    if (!filePath) {
      return this.block(decision, {
        reason: "Ari does not know the exact file path yet.",
        missing: "exact_file_path",
        shouldSearchMore: true
      });
    }

    if (!fileContent) {
      return this.block(decision, {
        reason: "Ari needs exact current file content before proposing an edit.",
        missing: "current_file_content",
        shouldReadMore: true
      });
    }

    const patchCandidate = this.buildPatchCandidate({
      summary,
      understanding,
      codeUnderstanding,
      filePath,
      fileContent
    });

    if (!patchCandidate) {
      return this.block(decision, {
        reason: "Ari mapped the code, but no safe patch candidate exists yet.",
        missing: "safe_patch_candidate",
        shouldAskOwner: true
      });
    }

    if (patchCandidate.noChange === true) {
      decision.reason = "The requested change already appears to be present. No patch needed.";
      decision.patchType = "no_change";
      decision.noChange = true;
      return decision;
    }

    if (!patchCandidate.find || patchCandidate.replace === undefined) {
      return this.block(decision, {
        reason: "Ari does not have exact find/replace text yet.",
        missing: "exact_find_replace",
        shouldAskOwner: true
      });
    }

    if (!fileContent.includes(patchCandidate.find)) {
      return this.block(decision, {
        reason: "The proposed find text does not exist in the current file.",
        missing: "matching_find_text",
        shouldReadMore: true,
        extra: {
          findPreview: this.preview(patchCandidate.find)
        }
      });
    }

    if (patchCandidate.find === patchCandidate.replace) {
      decision.reason = "The proposed replacement is identical to the current text. No patch needed.";
      decision.patchType = "no_change";
      decision.noChange = true;
      return decision;
    }

    decision.canPatchNow = true;
    decision.patchType = "replace";
    decision.reason = patchCandidate.reason || "Ari has exact file content and exact matching find/replace text.";
    decision.patchCandidate = {
      source: patchCandidate.source || "unknown",
      confidence: patchCandidate.confidence || "medium",
      reason: patchCandidate.reason || null
    };

    decision.githubEdit = {
      mode: "commit",
      filePath,
      operation: "replace",
      find: patchCandidate.find,
      replace: patchCandidate.replace,
      requiresConfirmation: true,
      confirmationText: "CONFIRM GITHUB EDIT"
    };

    decision.developerIntent = {
      enabled: true,
      type: "github_edit_request",
      title: patchCandidate.title || `Patch ${filePath}`,
      summary: patchCandidate.reason || "Ari prepared a safe evidence-based GitHub edit.",
      priority: understanding.priority || understanding.urgency || "medium",
      recommended_files: [filePath],
      ownerCommand: true,
      githubEdit: decision.githubEdit
    };

    return decision;
  },

  emptyDecision({ filePath = null } = {}) {
    return {
      patchDecisionRan: true,
      patchDecisionVersion: this.version,
      source: "ari-rebirth-patch-decision-engine",

      canPatchNow: false,
      shouldSearchMore: false,
      shouldReadMore: false,
      shouldAskOwner: false,

      filePath,
      reason: "",
      missingEvidence: [],
      patchType: null,
      patchCandidate: null,
      githubEdit: null,
      developerIntent: null,
      noChange: false,

      safetyPolicy: {
        requireOwnerAccess: true,
        requireExactFilePath: true,
        requireExactCurrentCode: true,
        requireExactFindText: true,
        requireOwnerConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT",
        neverGuessPatch: true
      }
    };
  },

  block(decision, {
    reason = "Patch blocked.",
    missing = null,
    shouldSearchMore = false,
    shouldReadMore = false,
    shouldAskOwner = false,
    extra = {}
  } = {}) {
    decision.reason = reason;
    decision.shouldSearchMore = shouldSearchMore;
    decision.shouldReadMore = shouldReadMore;
    decision.shouldAskOwner = shouldAskOwner;

    if (missing) decision.missingEvidence.push(missing);

    return {
      ...decision,
      ...extra
    };
  },

  getFileContent(summary = {}, githubContext = null) {
    return (
      githubContext?.content ||
      summary.githubReadResult?.content ||
      summary.codeUnderstanding?.content ||
      summary.rebirthCodeUnderstanding?.content ||
      summary.developerInvestigation?.readResults?.find?.(
        item => item.result?.success && item.result?.content
      )?.result?.content ||
      null
    );
  },

  getFilePath({
    summary = {},
    githubContext = null,
    understanding = {},
    codeUnderstanding = {}
  } = {}) {
    return (
      githubContext?.filePath ||
      summary.githubReadResult?.filePath ||
      codeUnderstanding?.filePath ||
      understanding.targetObject?.filePath ||
      understanding.likelyFiles?.[0] ||
      null
    );
  },

  buildPatchCandidate({
    summary = {},
    understanding = {},
    codeUnderstanding = {},
    filePath = "",
    fileContent = ""
  }) {
    const ownerText = String(
      summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
    ).trim();

    const direct = this.detectDirectTextReplacement(ownerText);
    if (direct) return direct;

    const semantic = this.semanticPatchFromGoal({
      ownerText,
      understanding,
      codeUnderstanding,
      filePath,
      fileContent
    });

    if (semantic) return semantic;

    return null;
  },

  detectDirectTextReplacement(text = "") {
    const quoted = String(text || "").match(
      /["“](.+?)["”]\s*(?:to|with|into|replace with)\s*["“](.+?)["”]/i
    );

    if (!quoted) return null;

    return {
      find: quoted[1],
      replace: quoted[2],
      source: "direct_owner_replacement",
      confidence: "high",
      title: "Apply owner-provided text replacement",
      reason: "The owner provided exact current text and exact replacement text."
    };
  },

  semanticPatchFromGoal({
    ownerText = "",
    understanding = {},
    codeUnderstanding = {},
    filePath = "",
    fileContent = ""
  }) {
    const lower = String(ownerText || "").toLowerCase();
    const path = String(filePath || "").toLowerCase();

    if (
      path.endsWith("index.html") &&
      lower.includes("conversation") &&
      lower.includes("history") &&
      (lower.includes("hide") || lower.includes("less clutter") || lower.includes("cleaner"))
    ) {
      const find = `<p>Your conversation history will appear here.</p>`;
      const replace = `<p>Ask me anything. I’ll keep the important context without cluttering your home screen.</p>`;

      if (fileContent.includes(find)) {
        return {
          find,
          replace,
          source: "semantic_homepage_conversation_placeholder",
          confidence: "medium",
          title: "Clean up homepage conversation placeholder",
          reason: "The request is about reducing homepage conversation clutter, and the exact placeholder exists in index.html."
        };
      }
    }

    if (
      path.endsWith("index.html") &&
      lower.includes("welcome back") &&
      lower.includes("jose")
    ) {
      const find = `const ARI_DEFAULT_BUBBLE = "Welcome back, Jose.";`;

      if (fileContent.includes(find)) {
        return {
          noChange: true,
          source: "semantic_no_change_default_bubble",
          confidence: "high",
          reason: "The requested Welcome back Jose bubble already exists."
        };
      }
    }

    if (
      path.endsWith("calbuddy-core.js") &&
      lower.includes("version") &&
      lower.includes("3.3")
    ) {
      const find = `CalBuddy.version = "3.3.0";`;

      if (fileContent.includes(find)) {
        return {
          noChange: true,
          source: "semantic_no_change_core_version",
          confidence: "high",
          reason: "CalBuddy core is already on version 3.3.0."
        };
      }
    }

    return this.patchFromCodeUnderstanding({
      ownerText,
      understanding,
      codeUnderstanding,
      filePath,
      fileContent
    });
  },

  patchFromCodeUnderstanding({
    ownerText = "",
    codeUnderstanding = {},
    fileContent = ""
  }) {
    const candidates = Array.isArray(codeUnderstanding.safeEditCandidates)
      ? codeUnderstanding.safeEditCandidates
      : [];

    if (!candidates.length) return null;

    const directCandidate = candidates.find(candidate => {
      const current = candidate.currentTextPreview || "";
      return current && fileContent.includes(current);
    });

    if (!directCandidate) return null;

    return null;
  },

  preview(text = "") {
    const clean = String(text || "");
    return clean.length > 240 ? `${clean.slice(0, 240)}...` : clean;
  }
};

console.log(
  "ARI REBIRTH PATCH DECISION ENGINE LOADED:",
  window.AriRebirthPatchDecisionEngine.version
);