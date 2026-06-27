// ari/developer/ari-rebirth-patch-decision-engine.js
// Ari Rebirth Patch Decision Engine
// Purpose: Convert evidence + edit operations into safe exact GitHub patches.
// V1.3.0 — Universal Operation Patch Builders / Evidence-Gated / Owner Approval Required

window.Ari = window.Ari || {};

window.AriRebirthPatchDecisionEngine = {
  version: "1.3.0",

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
      summary.githubEvidence ||
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

    if (!this.isOwnerMode(summary)) {
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
        reason:
          "Ari mapped the code, but no universal safe patch candidate could be built yet.",
        missing: "safe_patch_candidate",
        shouldAskOwner: true
      });
    }

    if (patchCandidate.noChange === true) {
      decision.reason =
        patchCandidate.reason ||
        "The requested change already appears to be present. No patch needed.";
      decision.patchType = "no_change";
      decision.noChange = true;
      decision.patchCandidate = patchCandidate;
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
      decision.reason =
        "The proposed replacement is identical to the current text. No patch needed.";
      decision.patchType = "no_change";
      decision.noChange = true;
      decision.patchCandidate = patchCandidate;
      return decision;
    }

    decision.canPatchNow = true;
    decision.patchType = patchCandidate.patchType || "replace";
    decision.reason =
      patchCandidate.reason ||
      "Ari has exact file content and exact matching find/replace text.";

    decision.patchCandidate = {
      source: patchCandidate.source || "universal_patch_builder",
      confidence: patchCandidate.confidence || "medium",
      operation: patchCandidate.operation || null,
      reason: patchCandidate.reason || null,
      explanation: patchCandidate.explanation || null
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
      source: "ari-rebirth-patch-decision-engine",
      title: patchCandidate.title || `Patch ${filePath}`,
      summary:
        patchCandidate.reason ||
        "Ari prepared a safe evidence-based GitHub edit.",
      priority: understanding.priority || understanding.urgency || "medium",
      recommended_files: [filePath],
      ownerCommand: true,
      githubEdit: decision.githubEdit,
      patchCandidate: decision.patchCandidate,
      safety: {
        ownerRequired: true,
        directWriteAllowed: false,
        requiresConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT",
        evidenceBased: true
      }
    };

    return decision;
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

    const context = {
      summary,
      understanding,
      codeUnderstanding,
      filePath,
      fileContent,
      ownerText,
      lower: ownerText.toLowerCase(),
      operations: this.getEditOperations(understanding)
    };

    const builders = [
      this.buildDirectTextReplacementPatch,
      this.buildRenameTextPatch,
      this.buildRemoveElementPatch,
      this.buildInsertElementPatch,
      this.buildMoveElementPatch,
      this.buildReplaceBlockPatch,
      this.buildUpdateStylePatch,
      this.buildUpdateFunctionPatch,
      this.buildPatchFromCodeUnderstanding
    ];

    for (const builder of builders) {
      const patch = builder.call(this, context);
      if (patch) return this.normalizePatch(patch);
    }

    return null;
  },

  getEditOperations(understanding = {}) {
    const operations = Array.isArray(understanding.editOperations)
      ? understanding.editOperations
      : [];

    if (operations.length) return operations;

    if (understanding.primaryEditOperation) {
      return [understanding.primaryEditOperation];
    }

    return [];
  },

  buildDirectTextReplacementPatch({ ownerText = "" }) {
    const quoted = String(ownerText || "").match(
      /["“](.+?)["”]\s*(?:to|with|into|replace with)\s*["“](.+?)["”]/i
    );

    if (!quoted) return null;

    return {
      find: quoted[1],
      replace: quoted[2],
      operation: "replace_text",
      source: "direct_owner_replacement",
      confidence: "high",
      title: "Apply owner-provided text replacement",
      reason:
        "The owner provided exact current text and exact replacement text."
    };
  },

  buildRenameTextPatch({ operations = [], fileContent = "" }) {
    const op = operations.find(item =>
      ["rename_text", "replace_text"].includes(item?.type)
    );

    if (!op?.targetText || op.replacementText === null) return null;

    if (!fileContent.includes(op.targetText)) return null;

    return {
      find: op.targetText,
      replace: op.replacementText,
      operation: op.type,
      source: "universal_rename_text_builder",
      confidence: op.confidence || "high",
      title: "Rename visible text",
      reason: `Ari found exact text "${op.targetText}" and can safely replace it.`
    };
  },

  buildRemoveElementPatch({ operations = [], fileContent = "", codeUnderstanding = {}, ownerText = "" }) {
    const wantsRemove = operations.some(item => item?.type === "remove_element");
    if (!wantsRemove) return null;

    const exactTarget = this.extractQuotedTarget(ownerText);
    if (exactTarget && fileContent.includes(exactTarget)) {
      return {
        find: exactTarget,
        replace: "",
        operation: "remove_element",
        source: "universal_exact_remove_builder",
        confidence: "high",
        title: "Remove exact owner-provided code/text",
        reason: "The owner provided exact removable text and it exists in the file."
      };
    }

    const zones = this.getBestCandidateBlocks(codeUnderstanding);

    for (const zone of zones) {
      const block = zone.nearbyBlockPreview || zone.currentTextPreview || "";
      const target = this.findRemovableHtmlElement(block, ownerText);

      if (target && fileContent.includes(target)) {
        return {
          find: target,
          replace: "",
          operation: "remove_element",
          source: "universal_remove_element_builder",
          confidence: zone.confidence || "medium_high",
          title: "Remove matching UI element",
          reason:
            "Ari found an exact matching UI element near the strongest code-understanding zone."
        };
      }
    }

    return null;
  },

  buildInsertElementPatch({ operations = [], fileContent = "", codeUnderstanding = {} }) {
    const op = operations.find(item => item?.type === "insert_element");
    if (!op) return null;

    if (!op.replacementText && !op.targetText) return null;

    const insertText = op.replacementText || op.targetText;
    const anchor = op.anchorText || this.bestAnchorFromCodeUnderstanding(codeUnderstanding);

    if (!insertText || !anchor || !fileContent.includes(anchor)) return null;

    const replace =
      op.position === "before"
        ? `${insertText}\n${anchor}`
        : `${anchor}\n${insertText}`;

    return {
      find: anchor,
      replace,
      operation: "insert_element",
      source: "universal_insert_element_builder",
      confidence: op.confidence || "medium",
      title: "Insert new code near exact anchor",
      reason:
        "Ari found an exact anchor and can insert the requested code without touching unrelated code."
    };
  },

  buildMoveElementPatch({ operations = [], fileContent = "" }) {
    const op = operations.find(item => item?.type === "move_element");
    if (!op?.targetText || !op?.anchorText) return null;

    if (!fileContent.includes(op.targetText)) return null;
    if (!fileContent.includes(op.anchorText)) return null;

    const withoutTarget = fileContent.replace(op.targetText, "");

    if (!withoutTarget.includes(op.anchorText)) return null;

    const moved =
      op.position === "before"
        ? `${op.targetText}\n${op.anchorText}`
        : `${op.anchorText}\n${op.targetText}`;

    return {
      find: fileContent,
      replace: withoutTarget.replace(op.anchorText, moved),
      operation: "move_element",
      source: "universal_move_element_builder",
      confidence: op.confidence || "medium",
      title: "Move exact code block",
      reason:
        "Ari found both the exact block to move and the exact destination anchor."
    };
  },

  buildReplaceBlockPatch({ operations = [], fileContent = "" }) {
    const op = operations.find(item => item?.type === "replace_block");
    if (!op?.targetText || op.replacementText === null) return null;

    if (!fileContent.includes(op.targetText)) return null;

    return {
      find: op.targetText,
      replace: op.replacementText,
      operation: "replace_block",
      source: "universal_replace_block_builder",
      confidence: op.confidence || "high",
      title: "Replace exact code block",
      reason:
        "Ari has exact current block text and exact replacement block text."
    };
  },

  buildUpdateStylePatch({ operations = [], filePath = "", fileContent = "" }) {
    const op = operations.find(item => item?.type === "update_style");
    if (!op?.targetText || op.replacementText === null) return null;

    const path = String(filePath || "").toLowerCase();
    const looksLikeStyleFile = path.endsWith(".css") || fileContent.includes("<style");

    if (!looksLikeStyleFile) return null;
    if (!fileContent.includes(op.targetText)) return null;

    return {
      find: op.targetText,
      replace: op.replacementText,
      operation: "update_style",
      source: "universal_style_patch_builder",
      confidence: op.confidence || "medium_high",
      title: "Update exact style block",
      reason:
        "Ari found the exact style text and can replace it safely."
    };
  },

  buildUpdateFunctionPatch({ operations = [], fileContent = "", codeUnderstanding = {} }) {
    const op = operations.find(item => item?.type === "update_function");
    if (!op?.targetText || op.replacementText === null) return null;

    if (!fileContent.includes(op.targetText)) return null;

    return {
      find: op.targetText,
      replace: op.replacementText,
      operation: "update_function",
      source: "universal_function_patch_builder",
      confidence: op.confidence || "medium_high",
      title: "Update exact function block",
      reason:
        "Ari found exact current function text and exact replacement text."
    };
  },

  buildPatchFromCodeUnderstanding({ codeUnderstanding = {}, fileContent = "", ownerText = "" }) {
    const candidates = Array.isArray(codeUnderstanding.safeEditCandidates)
      ? codeUnderstanding.safeEditCandidates
      : [];

    for (const candidate of candidates) {
      const current = candidate.currentTextPreview || "";
      if (!current || !fileContent.includes(current)) continue;

      const replacement = this.inferSimpleReplacementFromOwnerText({
        current,
        ownerText
      });

      if (replacement === null || replacement === current) continue;

      return {
        find: current,
        replace: replacement,
        operation: "semantic_candidate_replace",
        source: "code_understanding_candidate_builder",
        confidence: candidate.confidence || "medium",
        title: "Patch strongest semantic code candidate",
        reason:
          "Ari used code understanding to find an exact line and built a small safe replacement."
      };
    }

    return null;
  },

  inferSimpleReplacementFromOwnerText({ current = "", ownerText = "" }) {
    const rename = String(ownerText || "").match(
      /rename\s+(.+?)\s+(?:to|as)\s+(.+?)(?:\.|,|$)/i
    );

    if (rename) {
      const from = rename[1].trim();
      const to = rename[2].trim();

      if (current.includes(from)) {
        return current.replace(from, to);
      }
    }

    return null;
  },

  findRemovableHtmlElement(block = "", ownerText = "") {
    const lowerOwner = String(ownerText || "").toLowerCase();
    const lines = String(block || "").split("\n");

    const importantWords = lowerOwner
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter(word => word.length >= 4)
      .filter(word => !["remove", "delete", "hide", "from", "homepage"].includes(word));

    for (const line of lines) {
      const clean = line.trim();
      const lower = clean.toLowerCase();

      const isHtmlElement =
        clean.startsWith("<") &&
        (clean.includes("</") || clean.endsWith(">"));

      if (!isHtmlElement) continue;

      const matches = importantWords.some(word => lower.includes(word));
      if (matches) return clean;
    }

    return null;
  },

  bestAnchorFromCodeUnderstanding(codeUnderstanding = {}) {
    const candidates = Array.isArray(codeUnderstanding.safeEditCandidates)
      ? codeUnderstanding.safeEditCandidates
      : [];

    return (
      candidates[0]?.nearbyBlockPreview ||
      candidates[0]?.currentTextPreview ||
      null
    );
  },

  getBestCandidateBlocks(codeUnderstanding = {}) {
    const candidates = Array.isArray(codeUnderstanding.safeEditCandidates)
      ? codeUnderstanding.safeEditCandidates
      : [];

    return candidates.slice(0, 8);
  },

  extractQuotedTarget(text = "") {
    const match = String(text || "").match(/["“](.+?)["”]/);
    return match?.[1] || null;
  },

  normalizePatch(patch = {}) {
    return {
      patchType: "replace",
      confidence: "medium",
      source: "universal_patch_builder",
      ...patch
    };
  },

  isOwnerMode(summary = {}) {
    return (
      summary.ownerMode === true ||
      summary.appContext?.ownerMode === true ||
      summary.userContext?.ownerMode === true
    );
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

  preview(text = "") {
    const clean = String(text || "");
    return clean.length > 240 ? `${clean.slice(0, 240)}...` : clean;
  }
};

console.log(
  "ARI REBIRTH PATCH DECISION ENGINE LOADED:",
  window.AriRebirthPatchDecisionEngine.version
);