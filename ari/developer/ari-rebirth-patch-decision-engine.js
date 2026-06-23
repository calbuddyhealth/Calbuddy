// ari/developer/ari-rebirth-patch-decision-engine.js
// Ari Rebirth Patch Decision Engine
// Purpose: Decide if Ari has enough code evidence to safely propose an edit.
// V1.0.0 — Evidence-Gated / No Guess Patches / Owner Approval Required

window.Ari = window.Ari || {};

window.AriRebirthPatchDecisionEngine = {
  version: "1.0.0",

  decide(input = {}) {
    const summary = input.summary || input || {};

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    const evidence =
      summary.codeEvidence ||
      summary.rebirthCodeEvidence ||
      null;

    const githubContext =
      summary.githubFileContext ||
      summary.appContext?.githubFileContext ||
      null;

    if (!understanding?.isDeveloperWork) return null;

    const fileContent = this.getFileContent(summary, githubContext);
    const filePath = this.getFilePath(summary, githubContext, understanding);

    const decision = {
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
      githubEdit: null,

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

    if (!summary.appContext?.ownerMode) {
      decision.reason = "Owner mode is not active, so Ari cannot prepare code edits.";
      decision.shouldAskOwner = true;
      decision.missingEvidence.push("owner_mode");
      return decision;
    }

    if (!filePath) {
      decision.reason = "Ari does not know the exact file path yet.";
      decision.shouldSearchMore = true;
      decision.missingEvidence.push("exact_file_path");
      return decision;
    }

    if (!fileContent) {
      decision.reason = "Ari needs to read the current file before proposing an edit.";
      decision.shouldReadMore = true;
      decision.missingEvidence.push("current_file_content");
      return decision;
    }

    const patchCandidate = this.buildPatchCandidate({
      summary,
      understanding,
      filePath,
      fileContent
    });

    if (!patchCandidate?.find || patchCandidate.replace === undefined) {
      decision.reason = "Ari understands the request, but does not have exact find/replace text yet.";
      decision.shouldAskOwner = true;
      decision.missingEvidence.push("exact_find_replace");
      return decision;
    }

    if (!fileContent.includes(patchCandidate.find)) {
      decision.reason = "The proposed find text does not exist in the current file.";
      decision.shouldReadMore = true;
      decision.missingEvidence.push("matching_find_text");
      decision.findPreview = this.preview(patchCandidate.find);
      return decision;
    }

    decision.canPatchNow = true;
    decision.patchType = "replace";
    decision.reason = "Ari has exact file content and exact matching find/replace text.";
    decision.githubEdit = {
      mode: "commit",
      filePath,
      operation: "replace",
      find: patchCandidate.find,
      replace: patchCandidate.replace,
      requiresConfirmation: true,
      confirmationText: "CONFIRM GITHUB EDIT"
    };

    return decision;
  },

  getFileContent(summary = {}, githubContext = null) {
    return (
      githubContext?.content ||
      summary.githubReadResult?.content ||
      summary.developerInvestigation?.readResults?.find?.(
        item => item.result?.success && item.result?.content
      )?.result?.content ||
      null
    );
  },

  getFilePath(summary = {}, githubContext = null, understanding = {}) {
    return (
      githubContext?.filePath ||
      summary.githubReadResult?.filePath ||
      understanding.targetObject?.filePath ||
      understanding.likelyFiles?.[0] ||
      null
    );
  },

  buildPatchCandidate({ summary = {}, understanding = {}, filePath = "", fileContent = "" }) {
    const ownerText = String(
      summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
    ).trim();

    const direct = this.detectDirectTextReplacement(ownerText);

    if (direct) return direct;

    return this.semanticPatchFromGoal({
      ownerText,
      understanding,
      filePath,
      fileContent
    });
  },

  detectDirectTextReplacement(text = "") {
    const quoted = text.match(/["“](.+?)["”]\s*(?:to|with|into)\s*["“](.+?)["”]/i);

    if (quoted) {
      return {
        find: quoted[1],
        replace: quoted[2],
        source: "direct_owner_replacement"
      };
    }

    return null;
  },

  semanticPatchFromGoal({ ownerText = "", understanding = {}, filePath = "", fileContent = "" }) {
    const lower = ownerText.toLowerCase();

    if (
      filePath.endsWith("index.html") &&
      lower.includes("conversation") &&
      lower.includes("history") &&
      lower.includes("hide")
    ) {
      const find = `<p>Your conversation history will appear here.</p>`;

      if (fileContent.includes(find)) {
        return {
          find,
          replace: `<p>Ask me anything. I’ll keep the important context without cluttering your home screen.</p>`,
          source: "semantic_homepage_conversation_placeholder"
        };
      }
    }

    if (
      filePath.endsWith("calbuddy-core.js") &&
      lower.includes("welcome back") &&
      lower.includes("jose")
    ) {
      const find = `const ARI_DEFAULT_BUBBLE = "Welcome back, Jose.";`;

      if (fileContent.includes(find)) {
        return {
          find,
          replace: `const ARI_DEFAULT_BUBBLE = "Welcome back, Jose.";`,
          source: "no_change_detected"
        };
      }
    }

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