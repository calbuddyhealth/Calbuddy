// ari/language/ari-response-candidate-arbiter.js
// Purpose: Choose the best final response candidate before Composer.
// V1.0.1 — Candidate Arbitration / Code-Aware / Blueprint Guarded / Stable Output Fields

window.Ari = window.Ari || {};

window.AriResponseCandidateArbiter = {
  version: "1.0.1",

  choose(input = {}) {
    const summary = input.summary || input || {};
    const packet = input.composerPacket || summary.composerPacket || {};
    const candidates = this.collectCandidates(summary, packet);
    const context = this.getContext(summary, packet);

    const scored = candidates
      .map(candidate => this.scoreCandidate(candidate, context))
      .filter(candidate => candidate.usable === true)
      .sort((a, b) => b.score - a.score);

    const winner = scored[0] || null;

    const selectedDraftReason = winner
      ? `Selected ${winner.source} with score ${winner.score}.`
      : "No usable response candidate found.";

    return {
      responseCandidateArbiterRan: true,
      responseCandidateArbiterVersion: this.version,
      responseCandidateArbiterSource: "ari-response-candidate-arbiter",

      selectedCandidate: winner,
      selectedDraft: winner?.text || null,
      selectedDraftSource: winner?.source || null,
      selectedDraftReason,

      // Backward compatibility
      selectedSource: winner?.source || null,
      reason: selectedDraftReason,

      candidateScores: scored,
      finalResponseCandidate: winner?.text || null
    };
  },

  collectCandidates(summary = {}, packet = {}) {
    const candidates = [];

    const add = candidate => {
      const text = String(candidate?.text || "").trim();
      if (!text) return;

      candidates.push({
        source: candidate.source || "unknown",
        text,
        priority: Number(candidate.priority || 50),
        usable: candidate.usable !== false,
        taskType: candidate.taskType || null,
        evidence: candidate.evidence || {},
        raw: candidate.raw || null
      });
    };

    for (const candidate of summary.candidateDrafts || []) {
      add(candidate);
    }

    add({
      source: "developer_handoff",
      text:
        summary.developerHandoff?.reply ||
        summary.developerHandoff?.finalResponse ||
        summary.developerResponse,
      priority: 100,
      taskType: "coding",
      evidence: {
        groundedInCurrentFile: summary.githubEvidenceAvailable === true,
        hasGithubFile: summary.githubEvidenceAvailable === true,
        filePath: summary.githubEvidence?.filePath || null
      }
    });

    add({
      source: "ai_writer",
      text:
        summary.aiWriterDraft ||
        packet.aiWriterDraft ||
        packet.evidence?.aiWriter?.draft,
      priority: 85,
      taskType: "natural_answer",
      evidence: {
        usedAI:
          summary.aiWriterUsedAI === true ||
          packet.evidence?.aiWriter?.usedAI === true
      }
    });

    add({
      source: "blueprint_writer",
      text:
        summary.blueprintWriterDraft ||
        packet.blueprintWriterDraft ||
        packet.blueprintWriter?.draft,
      priority: 60,
      taskType: "blueprint",
      evidence: {}
    });

    add({
      source: "character_reasoning",
      text:
        summary.characterReasoning?.userFacingDraft ||
        summary.composerCharacter?.draft ||
        packet.character?.draft,
      priority: 90,
      taskType: "character",
      evidence: {
        characterAnswerAvailable:
          summary.characterReasoning?.characterAnswerAvailable === true
      }
    });

    return candidates;
  },

  getContext(summary = {}, packet = {}) {
    const text = String(
      summary.userMessage ||
        summary.message ||
        summary.input ||
        packet.userQuestion ||
        ""
    ).toLowerCase();

    const primary = String(
      summary.situationContractPrimary ||
        summary.primaryLane ||
        packet.primary ||
        ""
    ).toLowerCase();

    const primaryFunction = String(
      summary.primaryFunction ||
        summary.conversationFunction?.primaryFunction ||
        ""
    ).toLowerCase();

    const isCodingQuestion =
      summary.developerLayerRan === true ||
      summary.githubEvidenceAvailable === true ||
      primary === "builder" ||
      primary === "developer_artifact" ||
      primaryFunction === "build_or_debug_request" ||
      primaryFunction === "developer_artifact_request" ||
      /\b(code|file|github|repo|patch|bug|fix|debug|function|javascript|html|css|api|pipeline|composer|supabase)\b/i.test(text);

    const isCharacterQuestion =
      /\b(who are you|your purpose|your personality|your favorite|what do you believe|what do you stand for)\b/i.test(text);

    return {
      text,
      primary,
      primaryFunction,
      isCodingQuestion,
      isCharacterQuestion
    };
  },

  scoreCandidate(candidate = {}, context = {}) {
    let score = Number(candidate.priority || 50);
    const text = String(candidate.text || "").trim();
    const lower = text.toLowerCase();

    let usable = Boolean(text);

    if (text.length < 3) usable = false;

    if (this.isBadBlueprintMeta(lower)) {
      score -= 100;
      usable = false;
    }

    const isCodeCandidate =
      candidate.taskType === "coding" ||
      String(candidate.source || "").includes("developer") ||
      candidate.evidence?.includesCodeBlock === true ||
      /```|function\s+\w+|const\s+\w+|let\s+\w+|return\s+|=>/.test(text);

    if (context.isCodingQuestion) {
      if (isCodeCandidate) score += 30;
      if (candidate.evidence?.groundedInCurrentFile === true) score += 35;

      if (
        candidate.source === "blueprint_writer" &&
        candidate.evidence?.groundedInCurrentFile !== true
      ) {
        score -= 60;
      }

      if (
        String(candidate.source || "").includes("developer") &&
        candidate.evidence?.groundedInCurrentFile !== true
      ) {
        score -= 35;
      }
    }

    if (context.isCharacterQuestion) {
      if (candidate.taskType === "character") score += 35;
      if (candidate.source === "ai_writer") score -= 10;
    }

    if (candidate.source === "ai_writer" && candidate.evidence?.usedAI === true) {
      score += 10;
    }

    return {
      ...candidate,
      usable,
      score
    };
  },

  isBadBlueprintMeta(text = "") {
    const bad = [
      "answer the direct question",
      "explain only enough",
      "don’t turn every answer",
      "don't turn every answer",
      "the user is asking",
      "blueprint writer",
      "the simplest way to think about it is"
    ];

    return bad.some(phrase => text.includes(phrase));
  }
};

window.Ari.responseCandidateArbiter = window.AriResponseCandidateArbiter;

console.log(
  "ARI RESPONSE CANDIDATE ARBITER LOADED:",
  window.AriResponseCandidateArbiter.version
);