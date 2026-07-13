// ari/language/ari-response-candidate-arbiter.js
// Ari Response Candidate Arbiter
//
// Purpose:
// Evaluate response candidates against the canonical Response Plan,
// determine whether AI repair is required, and select one candidate
// for final composition.
//
// V2.1.0 — Canonical Plan Compliance / Deterministic Preference / AI Repair Arbitration
//
// Architectural flow:
//
// Canonical Response Plan
//      ↓
// Blueprint Writer candidate
//      ↓
// Arbiter precheck
//      ↓
// Optional AI repair candidate
//      ↓
// Final arbitration
//      ↓
// Language Composer
//
// Responsibilities:
// - Read the canonical Response Plan as the candidate acceptance contract.
// - Collect available candidates without duplicating equivalent drafts.
// - Preserve Blueprint Writer diagnostics without inventing success flags.
// - Reject incomplete, stale, internal, unsafe, or unauthorized candidates.
// - Request AI repair when required response moves were not rendered.
// - Prefer a complete deterministic candidate when AI adds no necessary repair.
// - Prefer an AI candidate when it successfully repairs an incomplete candidate.
// - Preserve locked developer responses.
// - Return one selected candidate with structured diagnostics.
//
// Non-responsibilities:
// - Does not reinterpret the user’s meaning.
// - Does not choose or modify the Response Plan.
// - Does not create response moves.
// - Does not rewrite candidate drafts.
// - Does not generate user-facing language.
// - Does not override safety.
// - Does not compose the final response.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriResponseCandidateArbiter = {
  version: "2.1.0",
  schemaVersion: "1.1.0",

  /* =====================================================
     PUBLIC FINAL ARBITRATION
  ===================================================== */

  choose(input = {}) {
    const summary = input.summary || input || {};
    const packet = input.composerPacket || summary.composerPacket || {};
    const context = this.buildContext({ summary, packet });

    const evaluatedCandidates = this.collectCandidates({
      summary,
      packet,
      suppliedCandidates: input.candidates
    }).map(candidate => this.evaluateCandidate({
      candidate,
      context,
      packet,
      summary
    }));

    const usableCandidates = evaluatedCandidates
      .filter(candidate => candidate.usable === true)
      .sort((first, second) => second.score - first.score);

    const rejectedCandidates = evaluatedCandidates
      .filter(candidate => candidate.usable !== true)
      .sort((first, second) => second.score - first.score);

    const selectedCandidate = this.selectCandidate({
      candidates: usableCandidates,
      evaluatedCandidates,
      context,
      packet,
      summary
    });

    const selectedDraft = selectedCandidate?.text || null;
    const selectedSource = selectedCandidate?.source || null;
    const selectionReason = selectedCandidate
      ? this.buildSelectionReason(selectedCandidate)
      : "No usable response candidate was available.";

    const result = {
      schema: "ari_response_candidate_arbitration",
      schemaVersion: this.schemaVersion,

      responseCandidateArbiterRan: true,
      responseCandidateArbiterVersion: this.version,
      responseCandidateArbiterSource: "ari-response-candidate-arbiter",
      source: "ari-response-candidate-arbiter",

      context,

      selectedCandidate,
      selectedDraft,
      selectedDraftSource: selectedSource,
      selectedDraftReason: selectionReason,
      selectedSource,
      reason: selectionReason,

      candidateScores: usableCandidates,
      evaluatedCandidates,
      rejectedCandidates,

      candidateCount: evaluatedCandidates.length,
      usableCandidateCount: usableCandidates.length,
      rejectedCandidateCount: rejectedCandidates.length,

      finalResponseCandidate: selectedDraft,
      selectionReady: Boolean(selectedDraft),

      canonicalResponsePlanUsed:
        selectedCandidate?.quality?.canonicalResponsePlanUsed === true,

      canonicalResponsePlanSatisfied:
        selectedCandidate?.quality?.canonicalResponsePlanSatisfied === true,

      selectedCandidateComplete:
        selectedCandidate?.quality?.complete === true,

      selectedCandidateWasAIRepair:
        selectedCandidate?.quality?.aiRepairCandidate === true,

      authority: {
        canCollectCandidates: true,
        canEvaluateCandidates: true,
        canRejectUnsafeOrInvalidCandidates: true,
        canSelectPreferredDraft: true,
        canRequestAIRepair: true,

        canRewriteCandidate: false,
        canGenerateCandidate: false,
        canChooseResponsePlan: false,
        canInterpretMeaning: false,
        canComposeFinalResponse: false,
        canOverrideSafety: false,
        canPersistState: false,

        role: "canonical_response_candidate_quality_arbitration"
      }
    };

    window.Ari.responseCandidateArbitration = result;

    return result;
  },

  /* =====================================================
     PRECHECK
  ===================================================== */

  precheck(input = {}) {
    const summary = input.summary || input || {};
    const packet = input.composerPacket || summary.composerPacket || {};
    const context = this.buildContext({ summary, packet });

    const evaluatedCandidates = this.collectCandidates({
      summary,
      packet,
      suppliedCandidates: input.candidates
    }).map(candidate => this.evaluateCandidate({
      candidate,
      context,
      packet,
      summary
    }));

    const usableCandidates = evaluatedCandidates
      .filter(candidate => candidate.usable === true)
      .sort((first, second) => second.score - first.score);

    const bestCandidate = this.selectPrecheckCandidate({
      candidates: usableCandidates,
      context
    });

    const repairDecision = this.determineAIRepair({
      bestCandidate,
      evaluatedCandidates,
      context,
      packet,
      summary
    });

    return {
      schema: "ari_response_candidate_precheck",
      schemaVersion: this.schemaVersion,

      responseCandidateArbiterRan: true,
      responseCandidateArbiterVersion: this.version,
      responseCandidateArbiterSource: "ari-response-candidate-arbiter",

      arbiterPrecheckRan: true,
      source: "ari-response-candidate-arbiter",
      context,

      selectedCandidate: bestCandidate,
      selectedDraft: bestCandidate?.text || null,
      selectedDraftSource: bestCandidate?.source || null,
      selectedSource: bestCandidate?.source || null,

      selectedDraftReason: bestCandidate
        ? this.buildSelectionReason(bestCandidate)
        : "No usable precheck candidate was available.",

      candidateScores: usableCandidates,
      evaluatedCandidates,

      needsAIWriter: repairDecision.needsAIWriter,
      aiRepairReason: repairDecision.reason,
      aiRepairDetails: repairDecision,

      finalResponseCandidate: bestCandidate?.text || null,

      authority: {
        canEvaluatePreAIWriterCandidates: true,
        canRequestAIWriter: true,

        canSelectFinalDraft: false,
        canRewriteCandidate: false,
        canGenerateCandidate: false,
        canChooseResponsePlan: false,
        canComposeFinalResponse: false,

        role: "pre_ai_writer_candidate_quality_gate"
      }
    };
  },

  /* =====================================================
     CANDIDATE COLLECTION
  ===================================================== */

  collectCandidates({
    summary = {},
    packet = {},
    suppliedCandidates = []
  } = {}) {
    const candidates = [];

    const addCandidate = candidate => {
      const normalized = this.normalizeCandidate(candidate);

      if (normalized.text) {
        candidates.push(normalized);
      }
    };

    this.toArray(suppliedCandidates).forEach(addCandidate);
    this.toArray(summary.candidateDrafts).forEach(addCandidate);

    const blueprintResult = this.readBlueprintResult({ summary, packet });

    if (blueprintResult.draft) {
      addCandidate({
        source: "blueprint_writer",
        text: blueprintResult.draft,
        priority: blueprintResult.candidate?.priority ?? 70,
        usable: blueprintResult.usable,
        complete: blueprintResult.complete,
        requiresAIRepair: blueprintResult.requiresAIRepair,
        taskType: "canonical_response_plan",

        evidence: {
          ...(blueprintResult.candidate?.evidence || {}),

          canonicalResponsePlanUsed:
            blueprintResult.canonicalResponsePlanUsed,

          canonicalMemoryAuthorizationUsed:
            blueprintResult.canonicalMemoryAuthorizationUsed,

          blueprintWriterUsable:
            blueprintResult.usable,

          blueprintWriterComplete:
            blueprintResult.complete,

          blueprintWriterRequiresAIRepair:
            blueprintResult.requiresAIRepair,

          renderedResponseMoves:
            blueprintResult.renderedMoves,

          unsupportedResponseMoves:
            blueprintResult.unsupportedMoves,

          skippedResponseMoves:
            blueprintResult.skippedMoves,

          renderQuality:
            blueprintResult.renderQuality,

          renderWarnings:
            blueprintResult.renderWarnings,

          blueprintId:
            blueprintResult.blueprintId,

          blueprintReason:
            blueprintResult.reason
        },

        raw: blueprintResult.raw
      });
    }

    const aiWriterResult = this.readAIWriterResult({ summary, packet });

    if (aiWriterResult.draft) {
      addCandidate({
        source: "ai_writer",
        text: aiWriterResult.draft,

        /*
         * AI does not receive an automatic winning score.
         * It earns preference only when it repairs an incomplete
         * canonical candidate or provides stronger plan compliance.
         */
        priority: 68,

        usable: aiWriterResult.usable,
        complete: aiWriterResult.complete,
        requiresAIRepair: false,
        taskType: "canonical_response_plan_ai_render",

        evidence: {
          usedAI: aiWriterResult.usedAI,
          fallbackReason: aiWriterResult.fallbackReason,
          writerSource: aiWriterResult.source,
          writerVersion: aiWriterResult.version,

          repairRequested:
            aiWriterResult.repairRequested,

          repairReason:
            aiWriterResult.repairReason,

          validated:
            aiWriterResult.validated,

          canonicalResponsePlanUsed:
            aiWriterResult.canonicalResponsePlanUsed,

          responseMovesSatisfied:
            aiWriterResult.responseMovesSatisfied,

          groundedInCurrentFile:
            aiWriterResult.groundedInCurrentFile
        },

        raw: aiWriterResult.raw
      });
    }

    const developerResult = this.readDeveloperCandidate({ summary, packet });

    if (developerResult.text) {
      addCandidate({
        source: "developer_handoff",
        text: developerResult.text,
        priority: developerResult.locked ? 120 : 72,
        usable: developerResult.locked || developerResult.relevant,
        complete: developerResult.complete,
        requiresAIRepair: false,
        taskType: "developer",

        evidence: {
          responseLocked: developerResult.locked,
          developerRelevant: developerResult.relevant,
          groundedInCurrentFile: developerResult.groundedInCurrentFile,
          hasGithubFile: developerResult.hasGithubFile,
          filePath: developerResult.filePath
        },

        raw: developerResult.raw
      });
    }

    const characterResult = this.readCharacterCandidate({ summary, packet });

    if (characterResult.text) {
      addCandidate({
        source: "character_reasoning",
        text: characterResult.text,
        priority: 70,
        usable: characterResult.available,
        complete: characterResult.complete,
        requiresAIRepair: false,
        taskType: "character",

        evidence: {
          characterAnswerAvailable: characterResult.available,
          characterRelevant: characterResult.relevant
        },

        raw: characterResult.raw
      });
    }

    return this.dedupeCandidates(candidates);
  },

  normalizeCandidate(candidate = {}) {
    const text = this.cleanOriginal(
      candidate.text ||
      candidate.draft ||
      candidate.response ||
      candidate.reply ||
      ""
    );

    return {
      id: candidate.id || this.createStableId(
        "candidate",
        `${candidate.source || "unknown"}|${text}`
      ),

      source: candidate.source || "unknown",
      text,

      priority: this.numberOr(candidate.priority, 50),
      usable: candidate.usable !== false,
      complete: candidate.complete !== false,

      requiresAIRepair:
        candidate.requiresAIRepair === true,

      taskType: candidate.taskType || null,

      evidence:
        candidate.evidence &&
        typeof candidate.evidence === "object"
          ? candidate.evidence
          : {},

      raw: candidate.raw || candidate
    };
  },

  dedupeCandidates(candidates = []) {
    const seen = new Map();

    this.toArray(candidates).forEach(candidate => {
      const key = this.normalizeForComparison(candidate.text);

      if (!key) {
        return;
      }

      if (!seen.has(key)) {
        seen.set(key, candidate);
        return;
      }

      const existing = seen.get(key);

      seen.set(
        key,
        this.preferDuplicateCandidate(existing, candidate)
      );
    });

    return [...seen.values()];
  },

  preferDuplicateCandidate(first = {}, second = {}) {
    if (
      second.evidence?.responseLocked === true &&
      first.evidence?.responseLocked !== true
    ) {
      return second;
    }

    if (
      second.evidence?.canonicalResponsePlanUsed === true &&
      first.evidence?.canonicalResponsePlanUsed !== true
    ) {
      return second;
    }

    if (
      second.complete === true &&
      first.complete !== true
    ) {
      return second;
    }

    if (
      second.evidence?.validated === true &&
      first.evidence?.validated !== true
    ) {
      return second;
    }

    if (second.priority > first.priority) {
      return second;
    }

    return first;
  },

  /* =====================================================
     BLUEPRINT RESULT READING
  ===================================================== */

  readBlueprintResult({
    summary = {},
    packet = {}
  } = {}) {
    const raw =
      summary.blueprintWriter ||
      summary.blueprintWriterResult ||
      packet.blueprintWriter ||
      {};

    const draft = this.cleanOriginal(
      summary.blueprintWriterDraft ||
      raw.blueprintWriterDraft ||
      raw.draft ||
      packet.blueprintWriterDraft ||
      ""
    );

    const candidateEvidence =
      raw.candidate?.evidence ||
      {};

    const usable =
      summary.blueprintWriterUsable === true ||
      raw.blueprintWriterUsable === true ||
      raw.candidate?.usable === true;

    const complete =
      summary.blueprintWriterComplete === true ||
      raw.blueprintWriterComplete === true ||
      candidateEvidence.complete === true ||
      raw.renderQuality?.complete === true;

    const requiresAIRepair =
      summary.blueprintWriterRequiresAIRepair === true ||
      raw.blueprintWriterRequiresAIRepair === true ||
      raw.candidate?.requiresAIRepair === true;

    const canonicalResponsePlanUsed =
      candidateEvidence.canonicalResponsePlanUsed === true ||
      raw.blueprint?.canonicalResponsePlanUsed === true ||
      raw.canonicalResponsePlanUsed === true;

    const canonicalMemoryAuthorizationUsed =
      candidateEvidence.canonicalMemoryAuthorizationUsed === true ||
      raw.canonicalMemoryAuthorizationUsed === true;

    return {
      draft,
      usable: draft ? usable : false,
      complete,
      requiresAIRepair,
      canonicalResponsePlanUsed,
      canonicalMemoryAuthorizationUsed,

      renderedMoves: this.toArray(
        summary.renderedResponseMoves ||
        raw.renderedResponseMoves
      ),

      unsupportedMoves: this.toArray(
        summary.unsupportedResponseMoves ||
        raw.unsupportedResponseMoves
      ),

      skippedMoves: this.toArray(
        summary.skippedResponseMoves ||
        raw.skippedResponseMoves
      ),

      renderQuality:
        summary.renderQuality ||
        raw.renderQuality ||
        null,

      renderWarnings: this.toArray(
        summary.renderWarnings ||
        raw.renderWarnings
      ),

      blueprintId:
        summary.blueprintId ||
        raw.blueprintId ||
        raw.blueprint?.id ||
        null,

      reason:
        summary.blueprintWriterReason ||
        raw.blueprintWriterReason ||
        null,

      candidate:
        raw.candidate ||
        null,

      raw
    };
  },

  /* =====================================================
     AI WRITER RESULT READING
  ===================================================== */

  readAIWriterResult({
    summary = {},
    packet = {}
  } = {}) {
    const raw =
      summary.aiWriter ||
      summary.aiWriterResult ||
      packet.evidence?.aiWriter ||
      {};

    const draft = this.cleanOriginal(
      summary.aiWriterDraft ||
      raw.aiWriterDraft ||
      raw.draft ||
      packet.aiWriterDraft ||
      packet.evidence?.aiWriter?.draft ||
      ""
    );

    const repairReason =
      summary.aiRepairReason ||
      packet.aiRepairReason ||
      packet.responseCandidateArbiter?.aiRepairReason ||
      packet.responseCandidateArbiter?.reason ||
      raw.aiRepairReason ||
      null;

    const repairRequested =
      Boolean(
        repairReason ||
        packet.responseCandidateArbiter?.needsAIWriter === true ||
        summary.responseCandidateArbiter?.needsAIWriter === true
      );

    return {
      draft,

      usable:
        draft.length > 0 &&
        raw.usable !== false,

      complete:
        raw.complete !== false,

      usedAI:
        summary.aiWriterUsedAI === true ||
        raw.aiWriterUsedAI === true ||
        packet.evidence?.aiWriter?.usedAI === true,

      source:
        summary.aiWriterSource ||
        raw.aiWriterSource ||
        raw.source ||
        null,

      version:
        summary.aiWriterVersion ||
        raw.aiWriterVersion ||
        raw.version ||
        null,

      fallbackReason:
        summary.aiWriterFallbackReason ||
        raw.aiWriterFallbackReason ||
        raw.fallbackReason ||
        null,

      repairRequested,
      repairReason,

      validated:
        raw.validated === true ||
        raw.aiWriterValidated === true ||
        raw.validation?.valid === true,

      canonicalResponsePlanUsed:
        raw.canonicalResponsePlanUsed === true ||
        raw.candidate?.evidence?.canonicalResponsePlanUsed === true,

      responseMovesSatisfied:
        raw.responseMovesSatisfied === true ||
        raw.candidate?.evidence?.responseMovesSatisfied === true,

      groundedInCurrentFile:
        raw.groundedInCurrentFile === true ||
        raw.candidate?.evidence?.groundedInCurrentFile === true,

      raw
    };
  },

  /* =====================================================
     DEVELOPER CANDIDATE
  ===================================================== */

  readDeveloperCandidate({
    summary = {},
    packet = {}
  } = {}) {
    const handoff =
      summary.developerHandoff ||
      packet.evidence?.developerHandoff ||
      {};

    const locked =
      summary.developerResponseLocked === true ||
      summary.responseLocked === true ||
      packet.developerPacketLocked === true ||
      packet.developer?.locked === true;

    const relevant =
      packet.developerRelevant === true ||
      packet.developer?.relevant === true ||
      summary.shouldRunDeveloperLayer === true;

    const text = this.cleanOriginal(
      handoff.reply ||
      handoff.finalResponse ||
      summary.developerReply ||
      summary.developerResponse ||
      packet.lockedDeveloperReply ||
      packet.developer?.lockedReply ||
      packet.developerPacket?.reply ||
      packet.developerPacket?.finalResponse ||
      ""
    );

    return {
      text,
      locked,
      relevant,

      complete:
        locked ||
        handoff.complete === true ||
        handoff.ready === true,

      groundedInCurrentFile:
        summary.githubEvidenceAvailable === true ||
        Boolean(packet.evidence?.github?.content),

      hasGithubFile:
        Boolean(
          summary.githubEvidence ||
          packet.evidence?.github
        ),

      filePath:
        summary.githubEvidence?.filePath ||
        packet.evidence?.github?.filePath ||
        null,

      raw: handoff
    };
  },

  /* =====================================================
     CHARACTER CANDIDATE
  ===================================================== */

  readCharacterCandidate({
    summary = {},
    packet = {}
  } = {}) {
    const characterReasoning =
      summary.characterReasoning ||
      {};

    const text = this.cleanOriginal(
      summary.characterDraftCandidate ||
      characterReasoning.userFacingDraft ||
      summary.composerCharacter?.draft ||
      packet.character?.draft ||
      ""
    );

    const available =
      summary.characterAnswerAvailable === true ||
      characterReasoning.characterAnswerAvailable === true ||
      Boolean(text);

    return {
      text,
      available,

      relevant:
        this.isCharacterQuestion(
          this.readCurrentText({
            summary,
            packet
          })
        ),

      complete:
        characterReasoning.complete !== false,

      raw:
        characterReasoning
    };
  },

  /* =====================================================
     CONTEXT
  ===================================================== */

  buildContext({
    summary = {},
    packet = {}
  } = {}) {
    const currentText = this.readCurrentText({ summary, packet });
    const normalizedText = this.normalize(currentText);

    const responsePlan =
      packet.canonicalResponsePlan ||
      packet.responsePlan ||
      {};

    const responseControl =
      packet.responseControl ||
      {};

    const writerInstructions =
      packet.writerInstructions ||
      responseControl.writerInstructions ||
      responsePlan.writerInstructions ||
      {};

    const questionPolicy =
      responseControl.questionPolicy ||
      responsePlan.interactionPolicy ||
      {};

    const primary = this.normalizeIdentifier(
      summary.situationContractPrimary ||
      summary.primaryLane ||
      packet.primary ||
      responsePlan.primaryLane ||
      responsePlan.strategy?.primaryLane ||
      ""
    );

    const primaryFunction = this.normalizeIdentifier(
      summary.primaryFunction ||
      summary.conversationFunction?.primaryFunction ||
      ""
    );

    const responseGoal = this.normalizeIdentifier(
      packet.responseGoal ||
      responseControl.responseGoal ||
      responsePlan.responseGoal ||
      responsePlan.strategy?.responseGoal ||
      summary.responseGoal ||
      ""
    );

    const responseShape = this.normalizeIdentifier(
      packet.responseShape ||
      responseControl.responseShape ||
      responsePlan.responseShape ||
      responsePlan.strategy?.responseShape ||
      summary.responseShape ||
      ""
    );

    const responseMoves = this.normalizeMoveIds(
      packet.responseMoves ||
      responseControl.responseMoves ||
      responsePlan.responseMoves ||
      responsePlan.moves ||
      writerInstructions.responseMoves
    );

    const requiredMoveIds = responseMoves
      .filter(move => move.required !== false)
      .map(move => move.id);

    const developerLocked =
      summary.developerResponseLocked === true ||
      summary.responseLocked === true ||
      packet.developerPacketLocked === true;

    const developerRelevant =
      packet.developerRelevant === true ||
      this.isDeveloperQuestion(currentText) ||
      [
        "builder",
        "developer",
        "developer_artifact",
        "coding",
        "project_help"
      ].includes(primary) ||
      [
        "build_or_debug_request",
        "developer_artifact_request"
      ].includes(primaryFunction);

    const questionAllowed =
      questionPolicy.maximumQuestions > 0 ||
      questionPolicy.maxQuestions > 0 ||
      writerInstructions.finalQuestionAllowed === true ||
      responsePlan.shouldAskQuestion === true;

    const questionRequired =
      questionPolicy.shouldAskQuestion === true ||
      questionPolicy.questionRequired === true ||
      writerInstructions.questionRequired === true ||
      responsePlan.shouldAskQuestion === true;

    const maximumQuestions = this.numberOr(
      questionPolicy.maximumQuestions ??
      questionPolicy.maxQuestions ??
      writerInstructions.maxQuestions,
      questionAllowed ? 1 : 0
    );

    const safetyStop =
      packet.safety?.shouldStopNormalResponse === true ||
      summary.safetyDisposition?.shouldStopNormalResponse === true ||
      summary.safetyShouldStopNormalResponse === true;

    const candidatePolicy =
      packet.candidatePolicy ||
      {};

    return {
      currentText,
      normalizedText,

      primary,
      primaryFunction,
      responseGoal,
      responseShape,

      responsePlanAvailable:
        packet.responsePlanAvailable === true ||
        responsePlan.available === true ||
        responsePlan.schema === "ari_response_plan",

      responsePlanReady:
        responsePlan.ready !== false,

      responseMoves,
      requiredMoveIds,

      developerLocked,
      developerRelevant,

      characterQuestion:
        this.isCharacterQuestion(currentText),

      directContentRequest:
        this.isDirectContentRequest(normalizedText),

      directInformationRequest:
        this.isDirectInformationRequest(normalizedText),

      questionAllowed,
      questionRequired,
      maximumQuestions,

      safetyStop,

      aiWriterAllowed:
        candidatePolicy.aiWriterAllowed !== false,

      aiRepairAllowed:
        candidatePolicy.aiRepairAllowed !== false,

      blueprintMustFollowResponseMoves:
        candidatePolicy.blueprintMustFollowResponseMoves !== false,

      finalCandidateMustSatisfyPlan:
        candidatePolicy.finalCandidateMustSatisfyPlan !== false,

      finalCandidateMustPreserveCurrentTurn:
        candidatePolicy.finalCandidateMustPreserveCurrentTurn !== false,

      finalCandidateMustRespectSafety:
        candidatePolicy.finalCandidateMustRespectSafety !== false,

      minimumUsableScore:
        this.numberOr(
          candidatePolicy.minimumUsableScore,
          45
        ),

      preferredDeterministicMinimumScore:
        this.numberOr(
          candidatePolicy.preferredDeterministicMinimumScore,
          70
        ),

      authority:
        "canonical_candidate_arbitration_context_only"
    };
  },

  readCurrentText({
    summary = {},
    packet = {}
  } = {}) {
    return this.cleanOriginal(
      packet.request?.currentText ||
      packet.request?.originalText ||
      packet.currentTurnText ||
      packet.userQuestion ||
      summary.originalUserMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );
  },

  normalizeMoveIds(moves = []) {
    return this.toArray(moves)
      .map((move, index) => {
        if (typeof move === "string") {
          return {
            id: this.normalizeIdentifier(move),
            order: index,
            required: true
          };
        }

        if (!move || typeof move !== "object") {
          return null;
        }

        const id = this.normalizeIdentifier(
          move.id ||
          move.move ||
          move.name ||
          move.type ||
          ""
        );

        if (!id) {
          return null;
        }

        return {
          id,
          order:
            Number.isFinite(Number(move.order))
              ? Number(move.order)
              : index,

          required:
            move.required !== false
        };
      })
      .filter(Boolean)
      .sort((first, second) => first.order - second.order);
  },

  /* =====================================================
     CANDIDATE EVALUATION
  ===================================================== */

  evaluateCandidate({
    candidate = {},
    context = {},
    packet = {},
    summary = {}
  } = {}) {
    const text = this.cleanOriginal(candidate.text);
    const lower = text.toLowerCase();

    let score = this.numberOr(candidate.priority, 50);
    let usable = candidate.usable !== false && Boolean(text);

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    if (!text) {
      usable = false;
      score -= 100;
      rejectionReasons.push("empty_candidate");
    }

    if (text.length < 12) {
      score -= 25;
      penalties.push("candidate_too_short");

      if (text.length < 3) {
        usable = false;
        rejectionReasons.push("candidate_has_no_meaningful_content");
      }
    }

    if (this.containsInternalPlannerLanguage(lower)) {
      score -= 120;
      usable = false;

      penalties.push("internal_planner_language");
      rejectionReasons.push("internal_planner_language_exposed");
    }

    if (this.containsStaleDeveloperLanguage({ text, context })) {
      score -= 120;
      usable = false;

      penalties.push("stale_developer_content");
      rejectionReasons.push(
        "stale_developer_content_for_normal_conversation"
      );
    }

    if (this.containsWriterFailureMessage(lower)) {
      score -= 100;
      usable = false;

      penalties.push("writer_failure_message");
      rejectionReasons.push("internal_writer_failure_exposed");
    }

    if (candidate.requiresAIRepair === true) {
      score -= 45;
      penalties.push("candidate_requires_ai_repair");

      if (candidate.source === "blueprint_writer") {
        usable = false;
        rejectionReasons.push("blueprint_marked_for_ai_repair");
      }
    }

    if (candidate.complete !== true) {
      score -= 15;
      penalties.push("candidate_incomplete");
    } else {
      score += 5;
      strengths.push("candidate_complete");
    }

    const sourceEvaluation =
      candidate.source === "blueprint_writer"
        ? this.evaluateBlueprintCandidate({
            candidate,
            context,
            packet
          })
        : candidate.source === "ai_writer"
          ? this.evaluateAIWriterCandidate({
              candidate,
              context,
              packet
            })
          : candidate.source === "developer_handoff"
            ? this.evaluateDeveloperCandidate({
                candidate,
                context
              })
            : candidate.source === "character_reasoning"
              ? this.evaluateCharacterCandidate({
                  candidate,
                  context
                })
              : this.emptyEvaluation();

    score += sourceEvaluation.scoreAdjustment;
    strengths.push(...sourceEvaluation.strengths);
    penalties.push(...sourceEvaluation.penalties);
    rejectionReasons.push(...sourceEvaluation.rejectionReasons);

    if (sourceEvaluation.usable === false) {
      usable = false;
    }

    const questionEvaluation = this.evaluateQuestionPolicy({
      text,
      context
    });

    score += questionEvaluation.scoreAdjustment;
    strengths.push(...questionEvaluation.strengths);
    penalties.push(...questionEvaluation.penalties);
    rejectionReasons.push(...questionEvaluation.rejectionReasons);

    if (questionEvaluation.usable === false) {
      usable = false;
    }

    const directnessEvaluation = this.evaluateDirectness({
      text,
      context
    });

    score += directnessEvaluation.scoreAdjustment;
    strengths.push(...directnessEvaluation.strengths);
    penalties.push(...directnessEvaluation.penalties);

    const planEvaluation = this.evaluatePlanCompliance({
      candidate,
      context
    });

    score += planEvaluation.scoreAdjustment;
    strengths.push(...planEvaluation.strengths);
    penalties.push(...planEvaluation.penalties);
    rejectionReasons.push(...planEvaluation.rejectionReasons);

    if (planEvaluation.usable === false) {
      usable = false;
    }

    if (
      usable &&
      score < context.minimumUsableScore
    ) {
      usable = false;
      rejectionReasons.push("candidate_score_below_minimum");
    }

    return {
      ...candidate,
      text,
      usable,
      score: Math.round(score),

      scoreBreakdown: {
        basePriority: this.numberOr(candidate.priority, 50),
        strengths: this.uniqueStrings(strengths),
        penalties: this.uniqueStrings(penalties)
      },

      rejectionReasons:
        this.uniqueStrings(rejectionReasons),

      quality: {
        complete:
          candidate.complete === true,

        requiresAIRepair:
          candidate.requiresAIRepair === true,

        canonicalResponsePlanUsed:
          planEvaluation.canonicalResponsePlanUsed,

        canonicalResponsePlanSatisfied:
          planEvaluation.canonicalResponsePlanSatisfied,

        aiRepairCandidate:
          candidate.source === "ai_writer" &&
          candidate.evidence?.repairRequested === true,

        containsInternalPlannerLanguage:
          this.containsInternalPlannerLanguage(lower),

        containsStaleDeveloperLanguage:
          this.containsStaleDeveloperLanguage({
            text,
            context
          }),

        questionCount:
          this.countQuestions(text),

        directAnswerLike:
          this.looksLikeDirectAnswer(text)
      }
    };
  },

  emptyEvaluation() {
    return {
      usable: true,
      scoreAdjustment: 0,
      strengths: [],
      penalties: [],
      rejectionReasons: []
    };
  },

  /* =====================================================
     CANONICAL PLAN COMPLIANCE
  ===================================================== */

  evaluatePlanCompliance({
    candidate = {},
    context = {}
  } = {}) {
    let scoreAdjustment = 0;
    let usable = true;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    const canonicalResponsePlanUsed =
      candidate.evidence?.canonicalResponsePlanUsed === true;

    let canonicalResponsePlanSatisfied = false;

    if (!context.responsePlanAvailable) {
      return {
        usable,
        scoreAdjustment,
        strengths,
        penalties,
        rejectionReasons,
        canonicalResponsePlanUsed,
        canonicalResponsePlanSatisfied
      };
    }

    if (candidate.source === "blueprint_writer") {
      if (canonicalResponsePlanUsed) {
        scoreAdjustment += 18;
        strengths.push("canonical_response_plan_used");
      } else if (
        candidate.evidence
          ?.canonicalMemoryAuthorizationUsed === true
      ) {
        scoreAdjustment += 12;
        strengths.push("canonical_memory_authorization_used");
      } else {
        scoreAdjustment -= 25;
        penalties.push("canonical_response_plan_not_confirmed");
      }

      canonicalResponsePlanSatisfied =
        candidate.evidence?.blueprintWriterComplete === true &&
        candidate.evidence?.blueprintWriterUsable === true &&
        candidate.evidence?.blueprintWriterRequiresAIRepair !== true &&
        this.requiredUnsupportedMoves(candidate).length === 0;
    }

    if (candidate.source === "ai_writer") {
      const explicitSatisfaction =
        candidate.evidence?.responseMovesSatisfied === true ||
        candidate.evidence?.canonicalResponsePlanUsed === true;

      const repairRequested =
        candidate.evidence?.repairRequested === true;

      const validated =
        candidate.evidence?.validated === true;

      if (explicitSatisfaction) {
        scoreAdjustment += 15;
        strengths.push("ai_candidate_confirms_plan_use");
      }

      if (repairRequested) {
        scoreAdjustment += 10;
        strengths.push("ai_candidate_generated_for_repair");
      }

      if (validated) {
        scoreAdjustment += 8;
        strengths.push("ai_candidate_validated");
      }

      canonicalResponsePlanSatisfied =
        explicitSatisfaction ||
        (
          repairRequested &&
          candidate.complete === true &&
          !this.containsInternalPlannerLanguage(candidate.text)
        );

      if (
        context.finalCandidateMustSatisfyPlan &&
        !canonicalResponsePlanSatisfied &&
        repairRequested
      ) {
        scoreAdjustment -= 12;
        penalties.push("ai_repair_plan_satisfaction_not_confirmed");
      }
    }

    if (
      candidate.source === "developer_handoff" &&
      candidate.evidence?.responseLocked === true
    ) {
      canonicalResponsePlanSatisfied = true;
    }

    if (
      context.finalCandidateMustSatisfyPlan &&
      candidate.source === "blueprint_writer" &&
      !canonicalResponsePlanSatisfied
    ) {
      usable = false;
      rejectionReasons.push(
        "canonical_response_plan_not_satisfied"
      );
    }

    if (canonicalResponsePlanSatisfied) {
      scoreAdjustment += 12;
      strengths.push("canonical_response_plan_satisfied");
    }

    return {
      usable,
      scoreAdjustment,
      strengths,
      penalties,
      rejectionReasons,
      canonicalResponsePlanUsed,
      canonicalResponsePlanSatisfied
    };
  },

  requiredUnsupportedMoves(candidate = {}) {
    return this.toArray(
      candidate.evidence?.unsupportedResponseMoves
    ).filter(move =>
      move?.required !== false
    );
  },

  /* =====================================================
     BLUEPRINT EVALUATION
  ===================================================== */

  evaluateBlueprintCandidate({
    candidate = {},
    context = {}
  } = {}) {
    let scoreAdjustment = 0;
    let usable = true;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    const evidence = candidate.evidence || {};

    const blueprintUsable =
      evidence.blueprintWriterUsable === true ||
      candidate.usable === true;

    const blueprintComplete =
      evidence.blueprintWriterComplete === true ||
      candidate.complete === true;

    const requiresRepair =
      evidence.blueprintWriterRequiresAIRepair === true ||
      candidate.requiresAIRepair === true;

    const renderedMoves =
      this.toArray(
        evidence.renderedResponseMoves
      );

    const unsupportedRequiredMoves =
      this.requiredUnsupportedMoves(
        candidate
      );

    const renderQuality =
      evidence.renderQuality ||
      {};

    if (blueprintUsable) {
      scoreAdjustment += 12;
      strengths.push("blueprint_writer_marked_usable");
    } else {
      scoreAdjustment -= 45;
      usable = false;

      penalties.push("blueprint_writer_marked_unusable");
      rejectionReasons.push("blueprint_writer_marked_unusable");
    }

    if (blueprintComplete) {
      scoreAdjustment += 12;
      strengths.push("blueprint_render_complete");
    } else {
      scoreAdjustment -= 25;
      penalties.push("blueprint_render_incomplete");
    }

    if (requiresRepair) {
      scoreAdjustment -= 60;
      usable = false;

      penalties.push("blueprint_requires_ai_repair");
      rejectionReasons.push("blueprint_requires_ai_repair");
    }

    if (renderedMoves.length > 0) {
      scoreAdjustment += Math.min(
        16,
        renderedMoves.length * 4
      );

      strengths.push("canonical_response_moves_rendered");
    } else if (
      evidence.canonicalMemoryAuthorizationUsed !== true
    ) {
      scoreAdjustment -= 25;
      usable = false;

      penalties.push("no_canonical_response_moves_rendered");
      rejectionReasons.push("no_canonical_response_moves_rendered");
    }

    if (unsupportedRequiredMoves.length > 0) {
      scoreAdjustment -= Math.min(
        60,
        unsupportedRequiredMoves.length * 20
      );

      penalties.push("required_response_moves_unsupported");

      if (context.aiRepairAllowed) {
        usable = false;

        rejectionReasons.push(
          "required_response_moves_need_ai_repair"
        );
      }
    }

    if (
      renderQuality.containsInternalInstruction === true ||
      renderQuality.containsInternalPlannerLanguage === true
    ) {
      scoreAdjustment -= 100;
      usable = false;

      penalties.push(
        "render_quality_detected_internal_instruction"
      );

      rejectionReasons.push(
        "rendered_internal_instruction"
      );
    }

    if (renderQuality.missingRequiredQuestion === true) {
      scoreAdjustment -= 30;
      penalties.push("required_question_missing");

      if (context.questionRequired) {
        usable = false;
        rejectionReasons.push("required_question_missing");
      }
    }

    if (renderQuality.usable === false) {
      scoreAdjustment -= 35;
      usable = false;

      penalties.push("render_quality_marked_unusable");
      rejectionReasons.push("render_quality_marked_unusable");
    }

    return {
      usable,
      scoreAdjustment,
      strengths,
      penalties,
      rejectionReasons
    };
  },

  /* =====================================================
     AI WRITER EVALUATION
  ===================================================== */

  evaluateAIWriterCandidate({
    candidate = {},
    context = {}
  } = {}) {
    let scoreAdjustment = 0;
    let usable = true;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    const usedAI =
      candidate.evidence?.usedAI === true;

    const repairRequested =
      candidate.evidence?.repairRequested === true;

    if (usedAI) {
      scoreAdjustment += 6;
      strengths.push("ai_writer_completed_generation");
    } else {
      scoreAdjustment -= 4;
      penalties.push("ai_writer_used_local_fallback");
    }

    if (repairRequested) {
      scoreAdjustment += 18;
      strengths.push("ai_writer_answered_repair_request");
    }

    if (
      candidate.evidence?.fallbackReason ===
      "ai_unavailable"
    ) {
      scoreAdjustment -= 30;
      penalties.push("ai_writer_unavailable_fallback");
    }

    if (
      candidate.evidence?.fallbackReason ===
      "local_response_plan_draft"
    ) {
      scoreAdjustment -= 3;
      penalties.push("ai_writer_returned_local_plan_fallback");
    }

    if (
      this.containsWriterFailureMessage(
        candidate.text
      )
    ) {
      scoreAdjustment -= 100;
      usable = false;

      rejectionReasons.push(
        "ai_writer_failure_message_exposed"
      );
    }

    if (
      context.developerRelevant &&
      this.looksLikeCodeAnswer(
        candidate.text
      ) &&
      candidate.evidence
        ?.groundedInCurrentFile !== true
    ) {
      scoreAdjustment -= 35;
      penalties.push("ai_code_answer_not_confirmed_grounded");
    }

    return {
      usable,
      scoreAdjustment,
      strengths,
      penalties,
      rejectionReasons
    };
  },

  /* =====================================================
     DEVELOPER EVALUATION
  ===================================================== */

  evaluateDeveloperCandidate({
    candidate = {},
    context = {}
  } = {}) {
    let scoreAdjustment = 0;
    let usable = true;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    const locked =
      candidate.evidence?.responseLocked === true;

    const relevant =
      candidate.evidence?.developerRelevant === true ||
      context.developerRelevant;

    const grounded =
      candidate.evidence?.groundedInCurrentFile === true;

    if (locked) {
      scoreAdjustment += 100;
      strengths.push("developer_response_locked");

      return {
        usable: true,
        scoreAdjustment,
        strengths,
        penalties,
        rejectionReasons
      };
    }

    if (!relevant) {
      scoreAdjustment -= 120;
      usable = false;

      penalties.push("developer_candidate_not_relevant");
      rejectionReasons.push("developer_candidate_not_relevant");

      return {
        usable,
        scoreAdjustment,
        strengths,
        penalties,
        rejectionReasons
      };
    }

    if (grounded) {
      scoreAdjustment += 35;
      strengths.push("developer_candidate_grounded_in_current_file");
    } else {
      scoreAdjustment -= 40;
      penalties.push("developer_candidate_not_grounded_in_current_file");
    }

    return {
      usable,
      scoreAdjustment,
      strengths,
      penalties,
      rejectionReasons
    };
  },

  /* =====================================================
     CHARACTER EVALUATION
  ===================================================== */

  evaluateCharacterCandidate({
    candidate = {},
    context = {}
  } = {}) {
    let scoreAdjustment = 0;
    let usable = true;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    if (context.characterQuestion) {
      scoreAdjustment += 35;
      strengths.push("character_candidate_matches_character_question");
    } else {
      scoreAdjustment -= 20;
      penalties.push("character_candidate_not_primary_match");
    }

    if (
      candidate.evidence?.characterAnswerAvailable === true
    ) {
      scoreAdjustment += 12;
      strengths.push("character_answer_available");
    }

    if (
      !context.characterQuestion &&
      candidate.taskType === "character" &&
      candidate.text.length < 20
    ) {
      usable = false;

      rejectionReasons.push(
        "character_candidate_too_thin_for_non_character_request"
      );
    }

    return {
      usable,
      scoreAdjustment,
      strengths,
      penalties,
      rejectionReasons
    };
  },

  /* =====================================================
     QUESTION POLICY
  ===================================================== */

  evaluateQuestionPolicy({
    text = "",
    context = {}
  } = {}) {
    const questionCount =
      this.countQuestions(text);

    let scoreAdjustment = 0;
    let usable = true;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    if (
      context.questionRequired &&
      questionCount === 0
    ) {
      scoreAdjustment -= 25;
      penalties.push("required_question_missing");

      if (
        context.finalCandidateMustSatisfyPlan
      ) {
        usable = false;
        rejectionReasons.push("required_question_missing");
      }
    }

    if (
      !context.questionAllowed &&
      questionCount > 0
    ) {
      scoreAdjustment -= 25;
      penalties.push("question_not_allowed");
    }

    if (
      questionCount >
      context.maximumQuestions
    ) {
      scoreAdjustment -=
        (
          questionCount -
          context.maximumQuestions
        ) * 12;

      penalties.push("too_many_questions");
    }

    if (
      context.directContentRequest &&
      this.opensWithClarifyingQuestion(text)
    ) {
      scoreAdjustment -= 40;
      penalties.push("clarifying_question_before_direct_content");
    }

    if (
      context.questionRequired &&
      questionCount > 0
    ) {
      scoreAdjustment += 8;
      strengths.push("required_question_present");
    }

    return {
      usable,
      scoreAdjustment,
      strengths,
      penalties,
      rejectionReasons
    };
  },

  /* =====================================================
     DIRECTNESS
  ===================================================== */

  evaluateDirectness({
    text = "",
    context = {}
  } = {}) {
    let scoreAdjustment = 0;

    const strengths = [];
    const penalties = [];

    if (
      context.directInformationRequest ||
      context.directContentRequest
    ) {
      if (this.looksLikeDirectAnswer(text)) {
        scoreAdjustment += 12;
        strengths.push("answers_direct_request");
      } else {
        scoreAdjustment -= 18;
        penalties.push("does_not_answer_direct_request_early");
      }
    }

    if (
      context.responseGoal === "help_user_feel_understood" ||
      context.primary === "emotion"
    ) {
      if (
        this.containsEmotionalAttunement(text)
      ) {
        scoreAdjustment += 10;
        strengths.push("emotionally_attuned");
      }
    }

    return {
      scoreAdjustment,
      strengths,
      penalties
    };
  },

  /* =====================================================
     AI REPAIR DECISION
  ===================================================== */

  determineAIRepair({
    bestCandidate = null,
    evaluatedCandidates = [],
    context = {},
    packet = {}
  } = {}) {
    if (context.developerLocked) {
      return {
        needsAIWriter: false,
        reason: null,
        source: "developer_response_locked",
        bestCandidateSource: bestCandidate?.source || null
      };
    }

    if (
      context.safetyStop &&
      packet.candidatePolicy?.aiWriterAllowed === false
    ) {
      return {
        needsAIWriter: false,
        reason: null,
        source: "safety_contract_disallows_ai_writer",
        bestCandidateSource: bestCandidate?.source || null
      };
    }

    if (context.aiWriterAllowed !== true) {
      return {
        needsAIWriter: false,
        reason: null,
        source: "ai_writer_not_allowed",
        bestCandidateSource: bestCandidate?.source || null
      };
    }

    if (!bestCandidate) {
      return {
        needsAIWriter: true,
        reason:
          this.resolveNoCandidateRepairReason(
            evaluatedCandidates
          ),

        source: "no_usable_candidate",
        bestCandidateSource: null
      };
    }

    if (bestCandidate.source === "blueprint_writer") {
      if (
        bestCandidate.requiresAIRepair === true ||
        bestCandidate.evidence
          ?.blueprintWriterRequiresAIRepair === true
      ) {
        return {
          needsAIWriter: true,
          reason:
            this.resolveBlueprintRepairReason(
              bestCandidate
            ),

          source: "blueprint_requested_ai_repair",
          bestCandidateSource: bestCandidate.source
        };
      }

      if (
        bestCandidate.evidence
          ?.blueprintWriterUsable !== true
      ) {
        return {
          needsAIWriter: true,
          reason: "blueprint_writer_marked_unusable",
          source: "blueprint_unusable",
          bestCandidateSource: bestCandidate.source
        };
      }

      if (
        bestCandidate.evidence
          ?.blueprintWriterComplete !== true
      ) {
        return {
          needsAIWriter: true,
          reason: "blueprint_render_incomplete",
          source: "blueprint_incomplete",
          bestCandidateSource: bestCandidate.source
        };
      }

      if (
        bestCandidate.quality
          ?.canonicalResponsePlanSatisfied !== true
      ) {
        return {
          needsAIWriter: true,
          reason: "blueprint_did_not_satisfy_canonical_plan",
          source: "canonical_plan_not_satisfied",
          bestCandidateSource: bestCandidate.source
        };
      }

      if (
        bestCandidate.score <
        context.preferredDeterministicMinimumScore
      ) {
        return {
          needsAIWriter: true,
          reason:
            "blueprint_candidate_score_below_preferred_threshold",

          source: "blueprint_quality_threshold",
          bestCandidateSource: bestCandidate.source
        };
      }

      return {
        needsAIWriter: false,
        reason: null,
        source: "usable_complete_blueprint_candidate",
        bestCandidateSource: bestCandidate.source
      };
    }

    if (
      bestCandidate.source === "character_reasoning" &&
      context.characterQuestion
    ) {
      return {
        needsAIWriter: false,
        reason: null,
        source: "complete_character_candidate",
        bestCandidateSource: bestCandidate.source
      };
    }

    if (
      bestCandidate.source === "developer_handoff" &&
      bestCandidate.evidence?.responseLocked === true
    ) {
      return {
        needsAIWriter: false,
        reason: null,
        source: "locked_developer_candidate",
        bestCandidateSource: bestCandidate.source
      };
    }

    return {
      needsAIWriter: false,
      reason: null,
      source:
        bestCandidate.source === "ai_writer"
          ? "ai_writer_candidate_already_available"
          : "usable_non_blueprint_candidate",

      bestCandidateSource:
        bestCandidate.source
    };
  },

  resolveNoCandidateRepairReason(
    evaluatedCandidates = []
  ) {
    const blueprint =
      this.toArray(
        evaluatedCandidates
      ).find(candidate =>
        candidate.source === "blueprint_writer"
      );

    return blueprint
      ? this.resolveBlueprintRepairReason(
          blueprint
        )
      : "no_usable_response_candidate";
  },

  resolveBlueprintRepairReason(
    candidate = {}
  ) {
    const quality =
      candidate.evidence?.renderQuality ||
      {};

    const unsupported =
      this.toArray(
        candidate.evidence
          ?.unsupportedResponseMoves
      );

    if (
      candidate.evidence
        ?.blueprintWriterRequiresAIRepair === true
    ) {
      if (quality.reason) {
        return quality.reason;
      }

      if (
        unsupported.some(move =>
          move?.required !== false
        )
      ) {
        return "required_response_moves_unsupported";
      }

      return "blueprint_requested_ai_repair";
    }

    if (
      candidate.evidence
        ?.blueprintWriterUsable !== true
    ) {
      return "blueprint_writer_marked_unusable";
    }

    if (
      candidate.evidence
        ?.blueprintWriterComplete !== true
    ) {
      return "blueprint_render_incomplete";
    }

    if (
      quality.containsInternalInstruction === true
    ) {
      return "blueprint_rendered_internal_instruction";
    }

    if (
      quality.missingRequiredQuestion === true
    ) {
      return "blueprint_required_question_missing";
    }

    return "blueprint_quality_too_low";
  },

  /* =====================================================
     PRECHECK SELECTION
  ===================================================== */

  selectPrecheckCandidate({
    candidates = [],
    context = {}
  } = {}) {
    const available =
      this.toArray(candidates);

    if (!available.length) {
      return null;
    }

    if (context.developerLocked) {
      const locked =
        available.find(candidate =>
          candidate.source === "developer_handoff" &&
          candidate.evidence?.responseLocked === true
        );

      if (locked) {
        return locked;
      }
    }

    const blueprint =
      available.find(candidate =>
        candidate.source === "blueprint_writer"
      );

    if (
      blueprint &&
      blueprint.quality
        ?.canonicalResponsePlanSatisfied === true &&
      blueprint.complete === true &&
      blueprint.requiresAIRepair !== true
    ) {
      return blueprint;
    }

    return available[0];
  },

  /* =====================================================
     FINAL SELECTION
  ===================================================== */

  selectCandidate({
    candidates = [],
    evaluatedCandidates = [],
    context = {}
  } = {}) {
    const available =
      this.toArray(candidates);

    if (!available.length) {
      return null;
    }

    if (context.developerLocked) {
      const lockedDeveloper =
        available.find(candidate =>
          candidate.source === "developer_handoff" &&
          candidate.evidence?.responseLocked === true
        );

      if (lockedDeveloper) {
        return lockedDeveloper;
      }
    }

    const blueprint =
      available.find(candidate =>
        candidate.source === "blueprint_writer"
      );

    const aiCandidate =
      available.find(candidate =>
        candidate.source === "ai_writer"
      );

    /*
     * A complete deterministic candidate wins unless AI was
     * specifically required to repair the canonical plan and
     * produced a stronger valid candidate.
     */
    if (
      blueprint &&
      blueprint.complete === true &&
      blueprint.requiresAIRepair !== true &&
      blueprint.quality
        ?.canonicalResponsePlanSatisfied === true
    ) {
      const aiWasRequiredRepair =
        aiCandidate?.evidence
          ?.repairRequested === true;

      const aiSatisfiedPlan =
        aiCandidate?.quality
          ?.canonicalResponsePlanSatisfied === true;

      if (
        aiCandidate &&
        aiWasRequiredRepair &&
        aiSatisfiedPlan &&
        aiCandidate.score >
          blueprint.score + 8
      ) {
        return aiCandidate;
      }

      return blueprint;
    }

    /*
     * When the Blueprint candidate was rejected for an incomplete
     * canonical render, a successful AI repair may become final.
     */
    if (
      aiCandidate &&
      aiCandidate.evidence
        ?.repairRequested === true &&
      aiCandidate.complete === true &&
      aiCandidate.usable === true
    ) {
      const rejectedBlueprint =
        this.toArray(
          evaluatedCandidates
        ).find(candidate =>
          candidate.source === "blueprint_writer" &&
          candidate.usable !== true
        );

      if (rejectedBlueprint) {
        return aiCandidate;
      }
    }

    if (context.characterQuestion) {
      const characterCandidate =
        available.find(candidate =>
          candidate.source === "character_reasoning" &&
          candidate.score >=
            context.minimumUsableScore
        );

      if (
        characterCandidate &&
        characterCandidate.score >=
          available[0].score - 10
      ) {
        return characterCandidate;
      }
    }

    return available[0];
  },

  buildSelectionReason(candidate = {}) {
    const strengths =
      candidate.scoreBreakdown?.strengths ||
      [];

    const strengthText =
      strengths.length
        ? ` Strengths: ${strengths.join(", ")}.`
        : "";

    return (
      `Selected ${candidate.source} with score ${candidate.score}.` +
      strengthText
    );
  },

  /* =====================================================
     PATTERN CHECKS
  ===================================================== */

  containsInternalPlannerLanguage(text = "") {
    const normalized = this.normalize(text);

    const phrases = [
      "answer the direct question",
      "answer the actual question first",
      "explain only enough",
      "follow the response plan",
      "the user is asking",
      "the writer should",
      "the composer should",
      "blueprint writer",
      "ai writer",
      "candidate arbiter",
      "response move",
      "response strategy",
      "response shape",
      "internal planner",
      "do not turn every answer",
      "dont turn every answer",
      "the simplest way to think about it is",
      "use response rules",
      "according to the composer packet"
    ];

    return phrases.some(phrase =>
      normalized.includes(phrase)
    );
  },

  containsWriterFailureMessage(text = "") {
    const normalized = this.normalize(text);

    const phrases = [
      "the ai draft was unavailable",
      "ai draft unavailable",
      "try once more and ill answer",
      "try once more and i ll answer",
      "the writer was unavailable",
      "no usable response candidate",
      "composer packet missing",
      "ai writer not loaded",
      "blueprint writer not loaded",
      "i wont use stale developer evidence",
      "i won t use stale developer evidence"
    ];

    return phrases.some(phrase =>
      normalized.includes(phrase)
    );
  },

  containsStaleDeveloperLanguage({
    text = "",
    context = {}
  } = {}) {
    if (
      context.developerRelevant ||
      context.developerLocked
    ) {
      return false;
    }

    const normalized = this.normalize(text);

    return (
      /\b(?:github|repository|repo|codebase|loaded file|file evidence)\b/i
        .test(normalized) ||
      /\bi read\b.*\b(?:index html|style css|javascript|file|repo)\b/i
        .test(normalized)
    );
  },

  looksLikeCodeAnswer(text = "") {
    return (
      /```/.test(text) ||
      /\bfunction\s+\w+/i.test(text) ||
      /\bconst\s+\w+/i.test(text) ||
      /\blet\s+\w+/i.test(text) ||
      /=>/.test(text)
    );
  },

  looksLikeDirectAnswer(text = "") {
    const normalized = this.normalize(text);

    if (!normalized) {
      return false;
    }

    const firstSentence =
      this.splitSentences(normalized)[0] ||
      normalized;

    return (
      /^(?:yes|no|yeah|it means|this means|the reason|the main issue|you should|start by|the next step|that reaction|what is happening|whats happening|what s happening|the problem|the answer)\b/
        .test(firstSentence) ||
      !this.opensWithClarifyingQuestion(text)
    );
  },

  opensWithClarifyingQuestion(text = "") {
    const firstSentence =
      this.splitSentences(text)[0] ||
      "";

    return (
      firstSentence.includes("?") &&
      /^(?:do you want|would you like|are you asking|did you mean|can you clarify|what do you mean|are you saying)\b/i
        .test(firstSentence)
    );
  },

  containsEmotionalAttunement(text = "") {
    return /\b(?:that makes sense|i can see why|i can hear|that sounds|yeah|im with you|i m with you|that can feel|it makes sense)\b/i
      .test(text);
  },

  isDeveloperQuestion(text = "") {
    const normalized = String(text || "");

    const explicitFile =
      /\b[\w/-]+\.(?:js|mjs|cjs|html|css|json|md|ts|tsx|jsx|sql|py|yml|yaml)\b/i
        .test(normalized);

    const repoContext =
      /\b(?:github|repo|repository|branch|commit|deploy|vercel|supabase|codebase|pipeline|engine|composer|schema)\b/i
        .test(normalized);

    const developerAction =
      /\b(?:read|open|show|search|find|update|change|replace|remove|fix|patch|debug|edit|inspect|diagnose|build|implement|rewrite|wire|refactor|validate|test)\b/i
        .test(normalized);

    const developerConcept =
      /\b(?:code|file|function|engine|pipeline|composer|handoff|api|bug|error|script|schema|javascript|html|css)\b/i
        .test(normalized);

    return Boolean(
      explicitFile ||
      (
        repoContext &&
        developerAction
      ) ||
      (
        developerConcept &&
        developerAction
      )
    );
  },

  isCharacterQuestion(text = "") {
    return /\b(?:who are you|what are you|your purpose|your personality|your favorite|what do you believe|what do you stand for|what matters to you|what do you value|what do you like|your opinion|your preference)\b/i
      .test(String(text || ""));
  },

  isDirectContentRequest(text = "") {
    return /\b(?:give me|tell me|send me|write me|make me|show me|create|generate|build|rewrite|replace|fix this|update this)\b/i
      .test(text);
  },

  isDirectInformationRequest(text = "") {
    return (
      /\?$/.test(String(text).trim()) ||
      /^(?:what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will|has|have)\b/i
        .test(text)
    );
  },

  countQuestions(text = "") {
    return (
      String(text || "").match(/\?/g) ||
      []
    ).length;
  },

  /* =====================================================
     COMPATIBILITY METHODS
  ===================================================== */

  scoreCandidate(candidate = {}, context = {}) {
    return this.evaluateCandidate({
      candidate:
        this.normalizeCandidate(candidate),

      context: {
        minimumUsableScore: 45,
        preferredDeterministicMinimumScore: 70,
        maximumQuestions: 1,

        questionAllowed: true,
        questionRequired: false,

        directContentRequest: false,
        directInformationRequest: false,

        developerRelevant: false,
        developerLocked: false,
        characterQuestion: false,

        aiRepairAllowed: true,
        aiWriterAllowed: true,

        responsePlanAvailable: false,
        finalCandidateMustSatisfyPlan: false,

        ...context
      },

      packet: {},
      summary: {}
    });
  },

  needsAIRepair(
    candidate = {},
    context = {},
    packet = {}
  ) {
    const normalizedCandidate =
      this.evaluateCandidate({
        candidate:
          this.normalizeCandidate(candidate),

        context: {
          minimumUsableScore: 45,
          preferredDeterministicMinimumScore: 70,
          maximumQuestions: 1,

          questionAllowed: true,
          questionRequired: false,

          directContentRequest: false,
          directInformationRequest: false,

          developerRelevant: false,
          developerLocked: false,
          characterQuestion: false,

          aiWriterAllowed: true,
          aiRepairAllowed: true,

          responsePlanAvailable: false,
          finalCandidateMustSatisfyPlan: false,

          ...context
        },

        packet,
        summary: {}
      });

    return this.determineAIRepair({
      bestCandidate:
        normalizedCandidate.usable
          ? normalizedCandidate
          : null,

      evaluatedCandidates: [
        normalizedCandidate
      ],

      context: {
        aiWriterAllowed: true,
        aiRepairAllowed: true,
        preferredDeterministicMinimumScore: 70,

        developerLocked: false,
        safetyStop: false,
        characterQuestion: false,

        ...context
      },

      packet
    }).needsAIWriter;
  },

  getAIRepairReason(
    candidate = {},
    context = {},
    packet = {}
  ) {
    const normalizedCandidate =
      this.evaluateCandidate({
        candidate:
          this.normalizeCandidate(candidate),

        context: {
          minimumUsableScore: 45,
          preferredDeterministicMinimumScore: 70,
          maximumQuestions: 1,

          questionAllowed: true,
          questionRequired: false,

          directContentRequest: false,
          directInformationRequest: false,

          developerRelevant: false,
          developerLocked: false,
          characterQuestion: false,

          aiWriterAllowed: true,
          aiRepairAllowed: true,

          responsePlanAvailable: false,
          finalCandidateMustSatisfyPlan: false,

          ...context
        },

        packet,
        summary: {}
      });

    return this.determineAIRepair({
      bestCandidate:
        normalizedCandidate.usable
          ? normalizedCandidate
          : null,

      evaluatedCandidates: [
        normalizedCandidate
      ],

      context: {
        aiWriterAllowed: true,
        aiRepairAllowed: true,
        preferredDeterministicMinimumScore: 70,

        developerLocked: false,
        safetyStop: false,
        characterQuestion: false,

        ...context
      },

      packet
    }).reason;
  },

  isBadBlueprintMeta(text = "") {
    return this.containsInternalPlannerLanguage(text);
  },

  getContext(summary = {}, packet = {}) {
    return this.buildContext({
      summary,
      packet
    });
  },

  /* =====================================================
     GENERAL UTILITIES
  ===================================================== */

  createStableId(
    prefix = "id",
    value = ""
  ) {
    return `${prefix}_${this.hashString(
      String(value || "")
    )}`;
  },

  hashString(value = "") {
    let hash = 2166136261;
    const text = String(value || "");

    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^= text.charCodeAt(index);

      hash +=
        (hash << 1) +
        (hash << 4) +
        (hash << 7) +
        (hash << 8) +
        (hash << 24);
    }

    return (hash >>> 0).toString(36);
  },

  splitSentences(text = "") {
    const value = this.cleanOriginal(text);

    if (!value) {
      return [];
    }

    return value
      .split(/(?<=[.!?])\s+/)
      .map(sentence =>
        sentence.trim()
      )
      .filter(Boolean);
  },

  uniqueStrings(values = []) {
    return [
      ...new Set(
        this.toArray(values)
          .map(value =>
            String(value || "").trim()
          )
          .filter(Boolean)
      )
    ];
  },

  numberOr(
    value,
    fallback = 0
  ) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  },

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(item =>
        item !== null &&
        item !== undefined &&
        item !== ""
      );
    }

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return [];
    }

    return [value];
  },

  cleanOriginal(value = "") {
    return String(value ?? "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalize(value = "") {
    return this.cleanOriginal(value)
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },

  normalizeIdentifier(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

  normalizeForComparison(value = "") {
    return this.normalize(value)
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
};

window.Ari.responseCandidateArbiter =
  window.AriResponseCandidateArbiter;

console.log(
  "ARI RESPONSE CANDIDATE ARBITER LOADED:",
  window.AriResponseCandidateArbiter?.version
);