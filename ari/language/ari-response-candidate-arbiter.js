// ari/language/ari-response-candidate-arbiter.js
// Ari Response Candidate Arbiter
//
// Purpose:
// Evaluate response candidates against the canonical Response Plan,
// determine whether AI repair is required, and select one candidate
// for final composition.
//
// V2.2.0 — Candidate Status Preservation / Interaction-Aware Arbitration
//
// Architectural flow:
//
// Canonical Response Plan
//      ↓
// Blueprint Writer candidate
//      ↓
// Arbiter precheck
//      ↓
// Optional AI Writer candidate
//      ↓
// Final arbitration
//      ↓
// Language Composer
//
// Responsibilities:
// - Read the canonical Response Plan as the candidate acceptance contract.
// - Collect available candidates without duplicating equivalent drafts.
// - Preserve candidate usability, completeness, validation, and repair status.
// - Preserve Blueprint Writer diagnostics without inventing success flags.
// - Preserve AI Writer diagnostics without resurrecting rejected drafts.
// - Reject incomplete, stale, internal, unsafe, or unauthorized candidates.
// - Distinguish user-directed questions from quoted or narrative questions.
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
  version: "2.2.0",
  schemaVersion: "1.2.0",

  /* =====================================================
     PUBLIC FINAL ARBITRATION
  ===================================================== */

  choose(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const packet =
      input.composerPacket ||
      summary.composerPacket ||
      {};

    const context =
      this.buildContext({
        summary,
        packet
      });

    const collectedCandidates =
      this.collectCandidates({
        summary,
        packet,
        suppliedCandidates:
          input.candidates
      });

    const evaluatedCandidates =
      collectedCandidates.map(
        candidate =>
          this.evaluateCandidate({
            candidate,
            context,
            packet,
            summary
          })
      );

    const usableCandidates =
      evaluatedCandidates
        .filter(
          candidate =>
            candidate.usable === true
        )
        .sort(
          (first, second) =>
            second.score -
            first.score
        );

    const rejectedCandidates =
      evaluatedCandidates
        .filter(
          candidate =>
            candidate.usable !== true
        )
        .sort(
          (first, second) =>
            second.score -
            first.score
        );

    const selectedCandidate =
      this.selectCandidate({
        candidates:
          usableCandidates,

        evaluatedCandidates,

        context,
        packet,
        summary
      });

    const selectedDraft =
      selectedCandidate?.text ||
      null;

    const selectedSource =
      selectedCandidate?.source ||
      null;

    const selectionReason =
      selectedCandidate
        ? this.buildSelectionReason(
            selectedCandidate
          )
        : "No usable response candidate was available.";

    const result = {
      schema:
        "ari_response_candidate_arbitration",

      schemaVersion:
        this.schemaVersion,

      responseCandidateArbiterRan:
        true,

      responseCandidateArbiterVersion:
        this.version,

      responseCandidateArbiterSource:
        "ari-response-candidate-arbiter",

      source:
        "ari-response-candidate-arbiter",

      context,

      selectedCandidate,

      selectedDraft,

      selectedDraftSource:
        selectedSource,

      selectedDraftReason:
        selectionReason,

      selectedSource,

      reason:
        selectionReason,

      candidateScores:
        usableCandidates,

      evaluatedCandidates,

      rejectedCandidates,

      candidateCount:
        evaluatedCandidates.length,

      usableCandidateCount:
        usableCandidates.length,

      rejectedCandidateCount:
        rejectedCandidates.length,

      finalResponseCandidate:
        selectedDraft,

      selectionReady:
        Boolean(selectedDraft),

      canonicalResponsePlanUsed:
        selectedCandidate
          ?.quality
          ?.canonicalResponsePlanUsed ===
        true,

      canonicalResponsePlanSatisfied:
        selectedCandidate
          ?.quality
          ?.canonicalResponsePlanSatisfied ===
        true,

      selectedCandidateComplete:
        selectedCandidate
          ?.quality
          ?.complete ===
        true,

      selectedCandidateWasAIRepair:
        selectedCandidate
          ?.quality
          ?.aiRepairCandidate ===
        true,

      authority: {
        canCollectCandidates:
          true,

        canEvaluateCandidates:
          true,

        canRejectUnsafeOrInvalidCandidates:
          true,

        canSelectPreferredDraft:
          true,

        canRequestAIRepair:
          true,

        canRewriteCandidate:
          false,

        canGenerateCandidate:
          false,

        canChooseResponsePlan:
          false,

        canInterpretMeaning:
          false,

        canComposeFinalResponse:
          false,

        canOverrideSafety:
          false,

        canPersistState:
          false,

        role:
          "canonical_response_candidate_quality_arbitration"
      }
    };

    window.Ari.responseCandidateArbitration =
      result;

    return result;
  },

  /* =====================================================
     PRECHECK
  ===================================================== */

  precheck(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const packet =
      input.composerPacket ||
      summary.composerPacket ||
      {};

    const context =
      this.buildContext({
        summary,
        packet
      });

    const evaluatedCandidates =
      this.collectCandidates({
        summary,
        packet,
        suppliedCandidates:
          input.candidates
      }).map(
        candidate =>
          this.evaluateCandidate({
            candidate,
            context,
            packet,
            summary
          })
      );

    const usableCandidates =
      evaluatedCandidates
        .filter(
          candidate =>
            candidate.usable === true
        )
        .sort(
          (first, second) =>
            second.score -
            first.score
        );

console.log(
  "=== ARBITER PRECHECK EVALUATION ===",
  {
    currentText:
      context.currentText,

    responsePlanAvailable:
      context.responsePlanAvailable,

    finalCandidateMustSatisfyPlan:
      context.finalCandidateMustSatisfyPlan,

    collectedCandidateCount:
      evaluatedCandidates.length,

    evaluatedCandidates:
      evaluatedCandidates.map(
        candidate => ({
          source:
            candidate.source,

          text:
            candidate.text,

          usable:
            candidate.usable,

          complete:
            candidate.complete,

          requiresAIRepair:
            candidate.requiresAIRepair,

          score:
            candidate.score,

          rejectionReasons:
            candidate.rejectionReasons,

          strengths:
            candidate
              .scoreBreakdown
              ?.strengths,

          penalties:
            candidate
              .scoreBreakdown
              ?.penalties,

          quality:
            candidate.quality,

          evidence:
            candidate.evidence
        })
      ),

    usableCandidates:
      usableCandidates.map(
        candidate => ({
          source:
            candidate.source,

          usable:
            candidate.usable,

          score:
            candidate.score
        })
      )
  }
);

    const bestCandidate =
      this.selectPrecheckCandidate({
        candidates:
          usableCandidates,

        context
      });

    const repairDecision =
      this.determineAIRepair({
        bestCandidate,
        evaluatedCandidates,
        context,
        packet,
        summary
      });

    return {
      schema:
        "ari_response_candidate_precheck",

      schemaVersion:
        this.schemaVersion,

      responseCandidateArbiterRan:
        true,

      responseCandidateArbiterVersion:
        this.version,

      responseCandidateArbiterSource:
        "ari-response-candidate-arbiter",

      arbiterPrecheckRan:
        true,

      source:
        "ari-response-candidate-arbiter",

      context,

      selectedCandidate:
        bestCandidate,

      selectedDraft:
        bestCandidate?.text ||
        null,

      selectedDraftSource:
        bestCandidate?.source ||
        null,

      selectedSource:
        bestCandidate?.source ||
        null,

      selectedDraftReason:
        bestCandidate
          ? this.buildSelectionReason(
              bestCandidate
            )
          : "No usable precheck candidate was available.",

      candidateScores:
        usableCandidates,

      evaluatedCandidates,

      needsAIWriter:
        repairDecision
          .needsAIWriter,

      aiRepairReason:
        repairDecision.reason,

      aiRepairDetails:
        repairDecision,

      finalResponseCandidate:
        bestCandidate?.text ||
        null,

      authority: {
        canEvaluatePreAIWriterCandidates:
          true,

        canRequestAIWriter:
          true,

        canSelectFinalDraft:
          false,

        canRewriteCandidate:
          false,

        canGenerateCandidate:
          false,

        canChooseResponsePlan:
          false,

        canComposeFinalResponse:
          false,

        role:
          "pre_ai_writer_candidate_quality_gate"
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

    const addCandidate =
      candidate => {
        const normalized =
          this.normalizeCandidate(
            candidate
          );

        if (!normalized.text) {
          return;
        }

        candidates.push(
          normalized
        );
      };

    this.toArray(
      suppliedCandidates
    ).forEach(
      addCandidate
    );

    this.toArray(
      summary.candidateDrafts
    ).forEach(
      addCandidate
    );

    const blueprintResult =
      this.readBlueprintResult({
        summary,
        packet
      });

    if (blueprintResult.draft) {
      addCandidate({
        source:
          "blueprint_writer",

        text:
          blueprintResult.draft,

        priority:
          blueprintResult
            .candidate
            ?.priority ??
          70,

        usable:
          blueprintResult.usable,

        complete:
          blueprintResult.complete,

        requiresAIRepair:
          blueprintResult
            .requiresAIRepair,

        requiresRepair:
          blueprintResult
            .requiresAIRepair,

        taskType:
          "canonical_response_plan",

        validation:
          blueprintResult.validation,

        evidence: {
          ...(
            blueprintResult
              .candidate
              ?.evidence ||
            {}
          ),

          canonicalResponsePlanUsed:
            blueprintResult
              .canonicalResponsePlanUsed,

          canonicalMemoryAuthorizationUsed:
            blueprintResult
              .canonicalMemoryAuthorizationUsed,

          blueprintWriterUsable:
            blueprintResult.usable,

          blueprintWriterComplete:
            blueprintResult.complete,

          blueprintWriterRequiresAIRepair:
            blueprintResult
              .requiresAIRepair,

          renderedResponseMoves:
            blueprintResult
              .renderedMoves,

          unsupportedResponseMoves:
            blueprintResult
              .unsupportedMoves,

          skippedResponseMoves:
            blueprintResult
              .skippedMoves,

          renderQuality:
            blueprintResult
              .renderQuality,

          renderWarnings:
            blueprintResult
              .renderWarnings,

          blueprintId:
            blueprintResult
              .blueprintId,

          blueprintReason:
            blueprintResult.reason
        },

        raw:
          blueprintResult.raw
      });
    }

    const aiWriterResult =
      this.readAIWriterResult({
        summary,
        packet
      });

    if (aiWriterResult.draft) {
      addCandidate({
        source:
          "ai_writer",

        text:
          aiWriterResult.draft,

        priority:
          aiWriterResult.usable
            ? 68
            : 20,

        usable:
          aiWriterResult.usable,

        complete:
          aiWriterResult.complete,

        requiresAIRepair:
          aiWriterResult
            .requiresAIRepair,

        requiresRepair:
          aiWriterResult
            .requiresAIRepair,

        taskType:
          "canonical_response_plan_ai_render",

        validation:
          aiWriterResult.validation,

        evidence: {
          usedAI:
            aiWriterResult.usedAI,

          fallbackReason:
            aiWriterResult
              .fallbackReason,

          writerReason:
            aiWriterResult.reason,

          writerSource:
            aiWriterResult.source,

          writerVersion:
            aiWriterResult.version,

          writerMarkedUsable:
            aiWriterResult.usable,

          writerMarkedComplete:
            aiWriterResult.complete,

          writerRequiresRepair:
            aiWriterResult
              .requiresAIRepair,

          repairRequested:
            aiWriterResult
              .repairRequested,

          repairReason:
            aiWriterResult
              .repairReason,

          validated:
            aiWriterResult.validated,

          canonicalResponsePlanUsed:
            aiWriterResult
              .canonicalResponsePlanUsed,

          responseMovesSatisfied:
            aiWriterResult
              .responseMovesSatisfied,

          groundedInCurrentFile:
            aiWriterResult
              .groundedInCurrentFile,

          candidatePreserved:
            aiWriterResult
              .candidatePreserved
        },

        raw:
          aiWriterResult.raw
      });
    }

    const developerResult =
      this.readDeveloperCandidate({
        summary,
        packet
      });

    if (developerResult.text) {
      addCandidate({
        source:
          "developer_handoff",

        text:
          developerResult.text,

        priority:
          developerResult.locked
            ? 120
            : 72,

        usable:
          developerResult.locked ||
          developerResult.relevant,

        complete:
          developerResult.complete,

        requiresAIRepair:
          false,

        requiresRepair:
          false,

        taskType:
          "developer",

        evidence: {
          responseLocked:
            developerResult.locked,

          developerRelevant:
            developerResult.relevant,

          groundedInCurrentFile:
            developerResult
              .groundedInCurrentFile,

          hasGithubFile:
            developerResult
              .hasGithubFile,

          filePath:
            developerResult.filePath
        },

        raw:
          developerResult.raw
      });
    }

    const characterResult =
      this.readCharacterCandidate({
        summary,
        packet
      });

    if (characterResult.text) {
      addCandidate({
        source:
          "character_reasoning",

        text:
          characterResult.text,

        priority:
          70,

        usable:
          characterResult.available,

        complete:
          characterResult.complete,

        requiresAIRepair:
          characterResult
            .requiresAIRepair,

        requiresRepair:
          characterResult
            .requiresAIRepair,

        taskType:
          "character",

        evidence: {
          characterAnswerAvailable:
            characterResult.available,

          characterRelevant:
            characterResult.relevant,

          characterNeedsAIWriter:
            characterResult
              .requiresAIRepair
        },

        raw:
          characterResult.raw
      });
    }

    return this.dedupeCandidates(
      candidates
    );
  },

  normalizeCandidate(
    candidate = {}
  ) {
    const text =
      this.cleanOriginal(
        candidate.text ||
        candidate.draft ||
        candidate.response ||
        candidate.reply ||
        ""
      );

    const requiresAIRepair =
      candidate
        .requiresAIRepair ===
        true ||
      candidate
        .requiresRepair ===
        true;

    return {
      id:
        candidate.id ||
        this.createStableId(
          "candidate",
          `${
            candidate.source ||
            "unknown"
          }|${text}`
        ),

      source:
        candidate.source ||
        "unknown",

      text,

      priority:
        this.numberOr(
          candidate.priority,
          50
        ),

      /*
       * Candidate status must be explicit.
       * Missing status is not interpreted as success.
       */
      usable:
        candidate.usable ===
        true,

      complete:
        candidate.complete ===
        true,

      requiresAIRepair,

      requiresRepair:
        requiresAIRepair,

      taskType:
        candidate.taskType ||
        null,

      validation:
        candidate.validation ||
        null,

      evidence:
        candidate.evidence &&
        typeof candidate.evidence ===
          "object"
          ? candidate.evidence
          : {},

      raw:
        candidate.raw ||
        candidate
    };
  },

  dedupeCandidates(
  candidates = []
) {
  const seen =
    new Map();

  this.toArray(
    candidates
  ).forEach(
    candidate => {
      const key = [
        candidate.source ||
          "unknown",

        this.normalizeForComparison(
          candidate.text
        )
      ].join("|");

      if (!seen.has(key)) {
        seen.set(
          key,
          candidate
        );

        return;
      }

      seen.set(
        key,
        this.preferDuplicateCandidate(
          seen.get(key),
          candidate
        )
      );
    }
  );

  return [
    ...seen.values()
  ];
},

  preferDuplicateCandidate(
  first = {},
  second = {}
) {
  const firstLocked =
    first.evidence?.responseLocked === true;

  const secondLocked =
    second.evidence?.responseLocked === true;

  if (secondLocked && !firstLocked) {
    return second;
  }

  if (firstLocked && !secondLocked) {
    return first;
  }

  /*
   * Equivalent text must preserve the strictest status.
   * A duplicate path cannot convert an explicitly rejected
   * candidate into an accepted candidate.
   */
  const mergedUsable =
    first.usable === true &&
    second.usable === true;

  const mergedComplete =
    first.complete === true &&
    second.complete === true;

  const mergedRequiresRepair =
    first.requiresAIRepair === true ||
    second.requiresAIRepair === true;

  const preferred =
    second.priority > first.priority
      ? second
      : first;

  const secondary =
    preferred === first
      ? second
      : first;

  return {
    ...secondary,
    ...preferred,

    usable:
      mergedUsable,

    complete:
      mergedComplete,

    requiresAIRepair:
      mergedRequiresRepair,

    requiresRepair:
      mergedRequiresRepair,

    validation:
      preferred.validation ||
      secondary.validation ||
      null,

    evidence: {
      ...(secondary.evidence || {}),
      ...(preferred.evidence || {}),

      duplicateSources:
        this.uniqueStrings([
          first.source,
          second.source,
          ...this.toArray(
            first.evidence?.duplicateSources
          ),
          ...this.toArray(
            second.evidence?.duplicateSources
          )
        ])
    }
  };
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

    const candidate =
      raw.candidate &&
      typeof raw.candidate ===
        "object"
        ? raw.candidate
        : {};

    const candidateEvidence =
      candidate.evidence ||
      {};

    const draft =
      this.cleanOriginal(
        summary.blueprintWriterDraft ||
        raw.blueprintWriterDraft ||
        raw.draft ||
        candidate.text ||
        packet.blueprintWriterDraft ||
        ""
      );

    const usable =
      Boolean(draft) &&
      (
        summary
          .blueprintWriterUsable ===
          true ||
        raw
          .blueprintWriterUsable ===
          true ||
        candidate.usable ===
          true
      );

    const complete =
      usable &&
      (
        summary
          .blueprintWriterComplete ===
          true ||
        raw
          .blueprintWriterComplete ===
          true ||
        candidate.complete ===
          true ||
        candidateEvidence.complete ===
          true ||
        raw.renderQuality
          ?.complete ===
          true
      );

    const requiresAIRepair =
      summary
        .blueprintWriterRequiresAIRepair ===
        true ||
      raw
        .blueprintWriterRequiresAIRepair ===
        true ||
      candidate
        .requiresAIRepair ===
        true ||
      candidate
        .requiresRepair ===
        true;

    const canonicalResponsePlanUsed =
      candidateEvidence
        .canonicalResponsePlanUsed ===
        true ||
      raw.blueprint
        ?.canonicalResponsePlanUsed ===
        true ||
      raw
        .canonicalResponsePlanUsed ===
        true;

    const canonicalMemoryAuthorizationUsed =
      candidateEvidence
        .canonicalMemoryAuthorizationUsed ===
        true ||
      raw
        .canonicalMemoryAuthorizationUsed ===
        true;

    return {
      draft,

      usable:
        usable &&
        !requiresAIRepair,

      complete:
        complete &&
        !requiresAIRepair,

      requiresAIRepair,

      canonicalResponsePlanUsed,

      canonicalMemoryAuthorizationUsed,

      renderedMoves:
        this.toArray(
          summary.renderedResponseMoves ||
          raw.renderedResponseMoves
        ),

      unsupportedMoves:
        this.toArray(
          summary.unsupportedResponseMoves ||
          raw.unsupportedResponseMoves
        ),

      skippedMoves:
        this.toArray(
          summary.skippedResponseMoves ||
          raw.skippedResponseMoves
        ),

      renderQuality:
        summary.renderQuality ||
        raw.renderQuality ||
        null,

      renderWarnings:
        this.toArray(
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
        raw.reason ||
        null,

      validation:
        summary.blueprintWriterValidation ||
        raw.validation ||
        candidate.validation ||
        null,

      candidate,

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

    const rawCandidate =
      raw.candidate &&
      typeof raw.candidate ===
        "object"
        ? raw.candidate
        : {};

    const draft =
      this.cleanOriginal(
        summary.aiWriterDraft ||
        raw.aiWriterDraft ||
        raw.draft ||
        rawCandidate.text ||
        packet.aiWriterDraft ||
        packet.evidence
          ?.aiWriter
          ?.draft ||
        ""
      );

    const repairReason =
      summary.aiRepairReason ||
      packet.aiRepairReason ||
      packet
        .responseCandidateArbiter
        ?.aiRepairReason ||
      packet
        .responseCandidateArbiter
        ?.reason ||
      raw.aiRepairReason ||
      raw.aiWriterReason ||
      null;

    const repairRequested =
      Boolean(
        repairReason ||
        packet
          .responseCandidateArbiter
          ?.needsAIWriter ===
          true ||
        summary
          .responseCandidateArbiter
          ?.needsAIWriter ===
          true ||
        summary.needsAIWriter ===
          true
      );

    const explicitUsable =
      this.firstDefined(
        summary.aiWriterUsable,
        raw.aiWriterUsable,
        rawCandidate.usable
      );

    const explicitComplete =
      this.firstDefined(
        summary.aiWriterComplete,
        raw.aiWriterComplete,
        rawCandidate.complete
      );

    const explicitRequiresRepair =
      this.firstDefined(
        summary
          .aiWriterRequiresRepair,

        raw.aiWriterRequiresRepair,

        rawCandidate
          .requiresRepair,

        rawCandidate
          .requiresAIRepair
      );

    const validation =
      summary.aiWriterValidation ||
      raw.validation ||
      rawCandidate.validation ||
      null;

    const usable =
  Boolean(draft) &&
  explicitUsable === true &&
  validation?.valid === true;

    const requiresAIRepair =
      explicitRequiresRepair ===
      true;

    const complete =
      usable &&
      explicitComplete ===
        true &&
      !requiresAIRepair;

    return {
      draft,

      usable,

      complete,

      requiresAIRepair,

      usedAI:
        summary.aiWriterUsedAI ===
          true ||
        raw.aiWriterUsedAI ===
          true ||
        rawCandidate.usedAI ===
          true ||
        packet.evidence
          ?.aiWriter
          ?.usedAI ===
          true,

      source:
        summary.aiWriterSource ||
        raw.aiWriterSource ||
        raw.source ||
        "ari-ai-writer",

      version:
        summary.aiWriterVersion ||
        raw.aiWriterVersion ||
        raw.version ||
        null,

      reason:
        summary.aiWriterReason ||
        raw.aiWriterReason ||
        rawCandidate.reason ||
        null,

      fallbackReason:
        summary
          .aiWriterFallbackReason ||
        raw
          .aiWriterFallbackReason ||
        raw.fallbackReason ||
        null,

      repairRequested,

      repairReason,

      validated:
        validation?.valid ===
        true,

      validation,

      candidatePreserved:
        validation
          ?.candidatePreserved ===
          true,

      canonicalResponsePlanUsed:
        raw
          .canonicalResponsePlanUsed ===
          true ||
        rawCandidate
          .evidence
          ?.canonicalResponsePlanUsed ===
          true,

      responseMovesSatisfied:
        raw
          .responseMovesSatisfied ===
          true ||
        rawCandidate
          .evidence
          ?.responseMovesSatisfied ===
          true ||
        validation
          ?.requiredMoveCoverage
          ?.complete ===
          true,

      groundedInCurrentFile:
        raw
          .groundedInCurrentFile ===
          true ||
        rawCandidate
          .evidence
          ?.groundedInCurrentFile ===
          true,

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
      packet.evidence
        ?.developerHandoff ||
      {};

    const locked =
      summary
        .developerResponseLocked ===
        true ||
      summary.responseLocked ===
        true ||
      packet
        .developerPacketLocked ===
        true ||
      packet.developer?.locked ===
        true;

    const relevant =
      packet.developerRelevant ===
        true ||
      packet.developer?.relevant ===
        true ||
      summary
        .shouldRunDeveloperLayer ===
        true;

    const text =
      this.cleanOriginal(
        handoff.reply ||
        handoff.finalResponse ||
        summary.developerReply ||
        summary.developerResponse ||
        packet
          .lockedDeveloperReply ||
        packet.developer
          ?.lockedReply ||
        packet.developerPacket
          ?.reply ||
        packet.developerPacket
          ?.finalResponse ||
        ""
      );

    return {
      text,

      locked,

      relevant,

      complete:
        Boolean(text) &&
        (
          locked ||
          handoff.complete ===
            true ||
          handoff.ready ===
            true
        ),

      groundedInCurrentFile:
        summary
          .githubEvidenceAvailable ===
          true ||
        Boolean(
          packet.evidence
            ?.github
            ?.content
        ),

      hasGithubFile:
        Boolean(
          summary.githubEvidence ||
          packet.evidence?.github
        ),

      filePath:
        summary.githubEvidence
          ?.filePath ||
        packet.evidence
          ?.github
          ?.filePath ||
        null,

      raw:
        handoff
    };
  },

  /* =====================================================
     CHARACTER CANDIDATE
  ===================================================== */

  readCharacterCandidate({
  summary = {},
  packet = {}
} = {}) {
  console.log(
    "=== CHARACTER HANDOFF TEST ===",
    {
      bridgePacketReady:
        packet?.ready,

      packetCharacterDraft:
        packet?.characterDraft,

      packetCharacterDeterministicDraft:
        packet?.characterDeterministicDraft,

      packetCharacterAnswerAvailable:
        packet?.characterAnswerAvailable,

      packetCharacterContextDraft:
        packet?.characterContext?.draft,

      packetCharacterContextDeterministicDraft:
        packet?.characterContext
          ?.deterministicDraft,

      packetCharacterContextAnswerAvailable:
        packet?.characterContext
          ?.answerAvailable,

      packetCharacterObjectDraft:
        packet?.character?.draft,

      packetCharacterObjectAnswerAvailable:
        packet?.character?.answerAvailable,

      packetComposerCharacterDraft:
        packet?.composerCharacter?.draft,

      packetComposerCharacterAnswerAvailable:
        packet?.composerCharacter
          ?.answerAvailable,

      summaryComposerCharacterDraft:
        summary?.composerCharacter?.draft,

      summaryComposerCharacterAnswerAvailable:
        summary?.composerCharacter
          ?.answerAvailable,

      summaryCharacterReasoningDraft:
        summary?.characterReasoning
          ?.userFacingDraft,

      summaryCharacterReasoningDeterministicDraft:
        summary?.characterReasoning
          ?.deterministicDraft,

      summaryCharacterReasoningAvailable:
        summary?.characterReasoning
          ?.characterAnswerAvailable,

      summaryCharacterNeedsAIWriter:
        summary?.characterNeedsAIWriter,

      packetCharacterNeedsAIWriter:
        packet?.characterNeedsAIWriter
    }
  );

  const characterReasoning =
    summary.characterReasoning ||
    packet.characterContext
      ?.reasoning ||
    {};

  /*
   * Diagnostic resolution path:
   * Read every supported focused-character handoff location.
   */
  const text =
    this.cleanOriginal(
      summary.characterDraftCandidate ||
      summary.composerCharacter
        ?.draft ||
      characterReasoning
        .userFacingDraft ||
      characterReasoning
        .deterministicDraft ||
      packet.characterDraft ||
      packet
        .characterDeterministicDraft ||
      packet.characterContext
        ?.draft ||
      packet.characterContext
        ?.deterministicDraft ||
      packet.composerCharacter
        ?.draft ||
      packet.composerCharacter
        ?.deterministicDraft ||
      packet.character?.draft ||
      packet.character
        ?.deterministicDraft ||
      ""
    );

  const available =
    summary.characterAnswerAvailable ===
      true ||
    summary.composerCharacter
      ?.answerAvailable ===
      true ||
    characterReasoning
      .characterAnswerAvailable ===
      true ||
    packet.characterAnswerAvailable ===
      true ||
    packet.characterContext
      ?.answerAvailable ===
      true ||
    packet.composerCharacter
      ?.answerAvailable ===
      true ||
    packet.character
      ?.answerAvailable ===
      true;

  const requiresAIRepair =
    summary.characterNeedsAIWriter ===
      true ||
    characterReasoning
      .needsAIWriter ===
      true ||
    packet.characterNeedsAIWriter ===
      true ||
    packet.characterContext
      ?.needsAIWriter ===
      true ||
    packet.characterRealization
      ?.needsAIWriter ===
      true ||
    packet.composerCharacter
      ?.realization
      ?.needsAIWriter ===
      true ||
    packet.character
      ?.realization
      ?.needsAIWriter ===
      true;

  const relevant =
    this.isCharacterQuestion(
      this.readCurrentText({
        summary,
        packet
      })
    );

  const complete =
    available &&
    Boolean(text) &&
    characterReasoning.complete !==
      false &&
    !requiresAIRepair;

  const result = {
    text,
    available,
    relevant,
    complete,
    requiresAIRepair,

    raw:
      characterReasoning
  };

  console.log(
    "=== ARBITER CHARACTER RESULT ===",
    result
  );

  return result;
},

  /* =====================================================
     CONTEXT
  ===================================================== */

  buildContext({
    summary = {},
    packet = {}
  } = {}) {
    const currentText =
      this.readCurrentText({
        summary,
        packet
      });

    const normalizedText =
      this.normalize(
        currentText
      );

    const responsePlan =
      packet
        .canonicalResponsePlan ||
      packet.responsePlan ||
      {};

    const responseControl =
      packet.responseControl ||
      {};

    const writerInstructions =
      packet.writerInstructions ||
      responseControl
        .writerInstructions ||
      responsePlan
        .writerInstructions ||
      {};

    const questionPolicy =
      responseControl
        .questionPolicy ||
      responsePlan
        .interactionPolicy ||
      {};

    const primary =
      this.normalizeIdentifier(
        summary
          .situationContractPrimary ||
        summary.primaryLane ||
        packet.primary ||
        responsePlan.primaryLane ||
        responsePlan.strategy
          ?.primaryLane ||
        ""
      );

    const primaryFunction =
      this.normalizeIdentifier(
        summary.primaryFunction ||
        summary
          .conversationFunction
          ?.primaryFunction ||
        ""
      );

    const responseGoal =
      this.normalizeIdentifier(
        packet.responseGoal ||
        responseControl
          .responseGoal ||
        responsePlan
          .responseGoal ||
        responsePlan.strategy
          ?.responseGoal ||
        summary.responseGoal ||
        ""
      );

    const responseShape =
      this.normalizeIdentifier(
        packet.responseShape ||
        responseControl
          .responseShape ||
        responsePlan
          .responseShape ||
        responsePlan.strategy
          ?.responseShape ||
        summary.responseShape ||
        ""
      );

    const responseMoves =
      this.normalizeMoveIds(
        packet.responseMoves ||
        responseControl
          .responseMoves ||
        responsePlan
          .responseMoves ||
        responsePlan.moves ||
        writerInstructions
          .responseMoves
      );

    const requiredMoveIds =
      responseMoves
        .filter(
          move =>
            move.required !==
            false
        )
        .map(
          move =>
            move.id
        );

    const developerLocked =
      summary
        .developerResponseLocked ===
        true ||
      summary.responseLocked ===
        true ||
      packet
        .developerPacketLocked ===
        true;

    const developerRelevant =
      packet.developerRelevant ===
        true ||
      this.isDeveloperQuestion(
        currentText
      ) ||
      [
        "builder",
        "developer",
        "developer_artifact",
        "coding",
        "project_help"
      ].includes(
        primary
      ) ||
      [
        "build_or_debug_request",
        "developer_artifact_request"
      ].includes(
        primaryFunction
      );

    const questionRequired =
      questionPolicy
        .shouldAskQuestion ===
        true ||
      questionPolicy
        .questionRequired ===
        true ||
      writerInstructions
        .questionRequired ===
        true ||
      responsePlan
        .shouldAskQuestion ===
        true;

    const explicitQuestionLimit =
      this.firstDefined(
        questionPolicy
          .maximumQuestions,

        questionPolicy
          .maxQuestions,

        writerInstructions
          .maxQuestions
      );

    const questionAllowed =
      questionRequired ||
      writerInstructions
        .finalQuestionAllowed ===
        true ||
      Number(
        explicitQuestionLimit ||
        0
      ) > 0;

    const maximumQuestions =
      this.numberOr(
        explicitQuestionLimit,
        questionAllowed
          ? 1
          : 0
      );

    const safetyStop =
      packet.safety
        ?.shouldStopNormalResponse ===
        true ||
      summary
        .safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      summary
        .safetyShouldStopNormalResponse ===
        true;

    const candidatePolicy =
      packet.candidatePolicy ||
      {};

    const responsePlanAvailable =
      packet
        .responsePlanAvailable ===
        true ||
      responsePlan.available ===
        true ||
      responsePlan.schema ===
        "ari_response_plan" ||
      Object.keys(
        responsePlan
      ).length > 0;

    return {
      currentText,

      normalizedText,

      primary,

      primaryFunction,

      responseGoal,

      responseShape,

      responsePlanAvailable,

      responsePlanReady:
        responsePlan.ready !==
        false,

      responseMoves,

      requiredMoveIds,

      developerLocked,

      developerRelevant,

      characterQuestion:
        this.isCharacterQuestion(
          currentText
        ),

      directContentRequest:
        this.isDirectContentRequest(
          normalizedText
        ),

      directInformationRequest:
        this.isDirectInformationRequest(
          normalizedText
        ),

      questionAllowed,

      questionRequired,

      maximumQuestions:
        Math.max(
          0,
          maximumQuestions
        ),

      safetyStop,

      aiWriterAllowed:
        candidatePolicy
          .aiWriterAllowed !==
        false,

      aiRepairAllowed:
        candidatePolicy
          .aiRepairAllowed !==
        false,

      blueprintMustFollowResponseMoves:
        candidatePolicy
          .blueprintMustFollowResponseMoves !==
        false,

      finalCandidateMustSatisfyPlan:
        candidatePolicy
          .finalCandidateMustSatisfyPlan !==
        false,

      finalCandidateMustPreserveCurrentTurn:
        candidatePolicy
          .finalCandidateMustPreserveCurrentTurn !==
        false,

      finalCandidateMustRespectSafety:
        candidatePolicy
          .finalCandidateMustRespectSafety !==
        false,

      minimumUsableScore:
        this.numberOr(
          candidatePolicy
            .minimumUsableScore,
          45
        ),

      preferredDeterministicMinimumScore:
        this.numberOr(
          candidatePolicy
            .preferredDeterministicMinimumScore,
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
      packet.request
        ?.currentText ||
      packet.request
        ?.originalText ||
      packet.currentTurnText ||
      packet.userQuestion ||
      summary.originalUserMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );
  },

  normalizeMoveIds(
    moves = []
  ) {
    return this.toArray(
      moves
    )
      .map(
        (
          move,
          index
        ) => {
          if (
            typeof move ===
            "string"
          ) {
            return {
              id:
                this.normalizeIdentifier(
                  move
                ),

              order:
                index,

              required:
                true
            };
          }

          if (
            !move ||
            typeof move !==
              "object"
          ) {
            return null;
          }

          const id =
            this.normalizeIdentifier(
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
              Number.isFinite(
                Number(
                  move.order
                )
              )
                ? Number(
                    move.order
                  )
                : index,

            required:
              move.required !==
              false
          };
        }
      )
      .filter(Boolean)
      .sort(
        (
          first,
          second
        ) =>
          first.order -
          second.order
      );
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
    const text =
      this.cleanOriginal(
        candidate.text
      );

    let score =
      this.numberOr(
        candidate.priority,
        50
      );

    let usable =
      candidate.usable ===
        true &&
      Boolean(text);

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    if (!text) {
      usable = false;
      score -= 100;

      rejectionReasons.push(
        "empty_candidate"
      );
    }

    if (
      text &&
      text.length < 12
    ) {
      score -= 25;

      penalties.push(
        "candidate_too_short"
      );

      if (
        text.length < 3
      ) {
        usable = false;

        rejectionReasons.push(
          "candidate_has_no_meaningful_content"
        );
      }
    }

    if (
      candidate.usable !==
      true
    ) {
      score -= 40;

      penalties.push(
        "candidate_not_marked_usable"
      );

      rejectionReasons.push(
        "candidate_not_marked_usable"
      );
    }

    if (
      this.containsInternalPlannerLanguage(
        text
      )
    ) {
      score -= 120;
      usable = false;

      penalties.push(
        "internal_planner_language"
      );

      rejectionReasons.push(
        "internal_planner_language_exposed"
      );
    }

    if (
      this.containsStaleDeveloperLanguage({
        text,
        context
      })
    ) {
      score -= 120;
      usable = false;

      penalties.push(
        "stale_developer_content"
      );

      rejectionReasons.push(
        "stale_developer_content_for_normal_conversation"
      );
    }

    if (
      this.containsWriterFailureMessage(
        text
      )
    ) {
      score -= 100;
      usable = false;

      penalties.push(
        "writer_failure_message"
      );

      rejectionReasons.push(
        "internal_writer_failure_exposed"
      );
    }

    if (
      candidate
        .requiresAIRepair ===
        true
    ) {
      score -= 45;

      penalties.push(
        "candidate_requires_ai_repair"
      );

      /*
       * A candidate that still requires repair cannot
       * become the final answer, regardless of source.
       */
      usable = false;

      rejectionReasons.push(
        "candidate_still_requires_repair"
      );
    }

    if (
      candidate.complete !==
      true
    ) {
      score -= 15;

      penalties.push(
        "candidate_incomplete"
      );

      if (
        context
          .finalCandidateMustSatisfyPlan
      ) {
        usable = false;

        rejectionReasons.push(
          "candidate_incomplete"
        );
      }
    } else {
      score += 5;

      strengths.push(
        "candidate_complete"
      );
    }

    const sourceEvaluation =
      this.evaluateBySource({
        candidate,
        context,
        packet
      });

    score +=
      sourceEvaluation
        .scoreAdjustment;

    strengths.push(
      ...sourceEvaluation
        .strengths
    );

    penalties.push(
      ...sourceEvaluation
        .penalties
    );

    rejectionReasons.push(
      ...sourceEvaluation
        .rejectionReasons
    );

    if (
      sourceEvaluation.usable ===
      false
    ) {
      usable = false;
    }

    const questionEvaluation =
      this.evaluateQuestionPolicy({
        text,
        context
      });

    score +=
      questionEvaluation
        .scoreAdjustment;

    strengths.push(
      ...questionEvaluation
        .strengths
    );

    penalties.push(
      ...questionEvaluation
        .penalties
    );

    rejectionReasons.push(
      ...questionEvaluation
        .rejectionReasons
    );

    if (
      questionEvaluation.usable ===
      false
    ) {
      usable = false;
    }

    const directnessEvaluation =
      this.evaluateDirectness({
        text,
        context
      });

    score +=
      directnessEvaluation
        .scoreAdjustment;

    strengths.push(
      ...directnessEvaluation
        .strengths
    );

    penalties.push(
      ...directnessEvaluation
        .penalties
    );

    const planEvaluation =
      this.evaluatePlanCompliance({
        candidate,
        context
      });

    score +=
      planEvaluation
        .scoreAdjustment;

    strengths.push(
      ...planEvaluation
        .strengths
    );

    penalties.push(
      ...planEvaluation
        .penalties
    );

    rejectionReasons.push(
      ...planEvaluation
        .rejectionReasons
    );

    if (
      planEvaluation.usable ===
      false
    ) {
      usable = false;
    }

    if (
      usable &&
      score <
        context
          .minimumUsableScore
    ) {
      usable = false;

      rejectionReasons.push(
        "candidate_score_below_minimum"
      );
    }

    const interactionQuestionCount =
      this.countUserDirectedQuestions(
        text
      );

    const totalQuestionMarkCount =
      this.countQuestions(
        text
      );

    return {
      ...candidate,

      text,

      usable,

      score:
        Math.round(
          score
        ),

      scoreBreakdown: {
        basePriority:
          this.numberOr(
            candidate.priority,
            50
          ),

        strengths:
          this.uniqueStrings(
            strengths
          ),

        penalties:
          this.uniqueStrings(
            penalties
          )
      },

      rejectionReasons:
        this.uniqueStrings(
          rejectionReasons
        ),

      quality: {
        complete:
          candidate.complete ===
          true,

        requiresAIRepair:
          candidate
            .requiresAIRepair ===
          true,

        canonicalResponsePlanUsed:
          planEvaluation
            .canonicalResponsePlanUsed,

        canonicalResponsePlanSatisfied:
          planEvaluation
            .canonicalResponsePlanSatisfied,

        aiRepairCandidate:
          candidate.source ===
            "ai_writer" &&
          candidate.evidence
            ?.repairRequested ===
            true,

        containsInternalPlannerLanguage:
          this.containsInternalPlannerLanguage(
            text
          ),

        containsStaleDeveloperLanguage:
          this.containsStaleDeveloperLanguage({
            text,
            context
          }),

        questionCount:
          interactionQuestionCount,

        interactionQuestionCount,

        totalQuestionMarkCount,

        directAnswerLike:
          this.looksLikeDirectAnswer(
            text
          )
      }
    };
  },

  evaluateBySource({
    candidate = {},
    context = {},
    packet = {}
  } = {}) {
    switch (
      candidate.source
    ) {
      case "blueprint_writer":
        return this.evaluateBlueprintCandidate({
          candidate,
          context,
          packet
        });

      case "ai_writer":
        return this.evaluateAIWriterCandidate({
          candidate,
          context,
          packet
        });

      case "developer_handoff":
        return this.evaluateDeveloperCandidate({
          candidate,
          context
        });

      case "character_reasoning":
        return this.evaluateCharacterCandidate({
          candidate,
          context
        });

      default:
        return this.emptyEvaluation();
    }
  },

  emptyEvaluation() {
    return {
      usable:
        true,

      scoreAdjustment:
        0,

      strengths:
        [],

      penalties:
        [],

      rejectionReasons:
        []
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
      candidate.evidence
        ?.canonicalResponsePlanUsed ===
      true;

    let canonicalResponsePlanSatisfied =
      false;

    if (
      !context
        .responsePlanAvailable
    ) {
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

    if (
      candidate.source ===
      "blueprint_writer"
    ) {
      if (
        canonicalResponsePlanUsed
      ) {
        scoreAdjustment += 18;

        strengths.push(
          "canonical_response_plan_used"
        );
      } else if (
        candidate.evidence
          ?.canonicalMemoryAuthorizationUsed ===
        true
      ) {
        scoreAdjustment += 12;

        strengths.push(
          "canonical_memory_authorization_used"
        );
      } else {
        scoreAdjustment -= 25;

        penalties.push(
          "canonical_response_plan_not_confirmed"
        );
      }

      canonicalResponsePlanSatisfied =
        candidate.evidence
          ?.blueprintWriterComplete ===
          true &&
        candidate.evidence
          ?.blueprintWriterUsable ===
          true &&
        candidate.evidence
          ?.blueprintWriterRequiresAIRepair !==
          true &&
        this.requiredUnsupportedMoves(
          candidate
        ).length === 0;
    }

    if (
      candidate.source ===
      "ai_writer"
    ) {
      const explicitSatisfaction =
        candidate.evidence
          ?.responseMovesSatisfied ===
          true ||
        candidate.evidence
          ?.canonicalResponsePlanUsed ===
          true;

      const repairRequested =
        candidate.evidence
          ?.repairRequested ===
        true;

      const validated =
        candidate.evidence
          ?.validated ===
        true;

      if (
        explicitSatisfaction
      ) {
        scoreAdjustment += 15;

        strengths.push(
          "ai_candidate_confirms_plan_use"
        );
      }

      if (
        repairRequested
      ) {
        scoreAdjustment += 10;

        strengths.push(
          "ai_candidate_generated_for_repair"
        );
      }

      if (
        validated
      ) {
        scoreAdjustment += 8;

        strengths.push(
          "ai_candidate_validated"
        );
      }

      canonicalResponsePlanSatisfied =
        explicitSatisfaction &&
        candidate.complete ===
          true &&
        candidate.usable ===
          true &&
        candidate.requiresAIRepair !==
          true;

      if (
        context
          .finalCandidateMustSatisfyPlan &&
        repairRequested &&
        !canonicalResponsePlanSatisfied
      ) {
        scoreAdjustment -= 20;

        penalties.push(
          "ai_repair_plan_satisfaction_not_confirmed"
        );

        usable = false;

        rejectionReasons.push(
          "ai_repair_plan_satisfaction_not_confirmed"
        );
      }
    }

    if (
      candidate.source ===
        "developer_handoff" &&
      candidate.evidence
        ?.responseLocked ===
        true
    ) {
      canonicalResponsePlanSatisfied =
        true;
    }

    if (
      context
        .finalCandidateMustSatisfyPlan &&
      candidate.source ===
        "blueprint_writer" &&
      !canonicalResponsePlanSatisfied
    ) {
      usable = false;

      rejectionReasons.push(
        "canonical_response_plan_not_satisfied"
      );
    }

    if (
      canonicalResponsePlanSatisfied
    ) {
      scoreAdjustment += 12;

      strengths.push(
        "canonical_response_plan_satisfied"
      );
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

  requiredUnsupportedMoves(
    candidate = {}
  ) {
    return this.toArray(
      candidate.evidence
        ?.unsupportedResponseMoves
    ).filter(
      move =>
        move?.required !==
        false
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

    const evidence =
      candidate.evidence ||
      {};

    const blueprintUsable =
      evidence
        .blueprintWriterUsable ===
        true &&
      candidate.usable ===
        true;

    const blueprintComplete =
      evidence
        .blueprintWriterComplete ===
        true &&
      candidate.complete ===
        true;

    const requiresRepair =
      evidence
        .blueprintWriterRequiresAIRepair ===
        true ||
      candidate
        .requiresAIRepair ===
        true;

    const renderedMoves =
      this.toArray(
        evidence
          .renderedResponseMoves
      );

    const unsupportedRequiredMoves =
      this.requiredUnsupportedMoves(
        candidate
      );

    const renderQuality =
      evidence.renderQuality ||
      {};

    if (
      blueprintUsable
    ) {
      scoreAdjustment += 12;

      strengths.push(
        "blueprint_writer_marked_usable"
      );
    } else {
      scoreAdjustment -= 45;
      usable = false;

      penalties.push(
        "blueprint_writer_marked_unusable"
      );

      rejectionReasons.push(
        "blueprint_writer_marked_unusable"
      );
    }

    if (
      blueprintComplete
    ) {
      scoreAdjustment += 12;

      strengths.push(
        "blueprint_render_complete"
      );
    } else {
      scoreAdjustment -= 25;

      penalties.push(
        "blueprint_render_incomplete"
      );
    }

    if (
      requiresRepair
    ) {
      scoreAdjustment -= 60;
      usable = false;

      penalties.push(
        "blueprint_requires_ai_repair"
      );

      rejectionReasons.push(
        "blueprint_requires_ai_repair"
      );
    }

    if (
      renderedMoves.length >
      0
    ) {
      scoreAdjustment +=
        Math.min(
          16,
          renderedMoves.length *
            4
        );

      strengths.push(
        "canonical_response_moves_rendered"
      );
    } else if (
      evidence
        .canonicalMemoryAuthorizationUsed !==
      true
    ) {
      scoreAdjustment -= 25;
      usable = false;

      penalties.push(
        "no_canonical_response_moves_rendered"
      );

      rejectionReasons.push(
        "no_canonical_response_moves_rendered"
      );
    }

    if (
      unsupportedRequiredMoves
        .length > 0
    ) {
      scoreAdjustment -=
        Math.min(
          60,
          unsupportedRequiredMoves
            .length *
            20
        );

      penalties.push(
        "required_response_moves_unsupported"
      );

      if (
        context.aiRepairAllowed
      ) {
        usable = false;

        rejectionReasons.push(
          "required_response_moves_need_ai_repair"
        );
      }
    }

    if (
      renderQuality
        .containsInternalInstruction ===
        true ||
      renderQuality
        .containsInternalPlannerLanguage ===
        true
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

    if (
      renderQuality
        .missingRequiredQuestion ===
        true
    ) {
      scoreAdjustment -= 30;

      penalties.push(
        "required_question_missing"
      );

      if (
        context.questionRequired
      ) {
        usable = false;

        rejectionReasons.push(
          "required_question_missing"
        );
      }
    }

    if (
      renderQuality.usable ===
      false
    ) {
      scoreAdjustment -= 35;
      usable = false;

      penalties.push(
        "render_quality_marked_unusable"
      );

      rejectionReasons.push(
        "render_quality_marked_unusable"
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
      candidate.evidence
        ?.usedAI ===
      true;

    const repairRequested =
      candidate.evidence
        ?.repairRequested ===
      true;

    const writerMarkedUsable =
      candidate.evidence
        ?.writerMarkedUsable ===
      true;

    const writerMarkedComplete =
      candidate.evidence
        ?.writerMarkedComplete ===
      true;

    const writerRequiresRepair =
      candidate.evidence
        ?.writerRequiresRepair ===
      true;

    const validated =
      candidate.evidence
        ?.validated ===
      true;

    if (
      usedAI
    ) {
      scoreAdjustment += 6;

      strengths.push(
        "ai_writer_completed_generation"
      );
    } else {
      scoreAdjustment -= 4;

      penalties.push(
        "ai_writer_used_local_fallback"
      );
    }

    if (
      repairRequested
    ) {
      scoreAdjustment += 18;

      strengths.push(
        "ai_writer_answered_repair_request"
      );
    }

    if (
      writerMarkedUsable
    ) {
      scoreAdjustment += 10;

      strengths.push(
        "ai_writer_marked_candidate_usable"
      );
    } else {
      scoreAdjustment -= 50;
      usable = false;

      penalties.push(
        "ai_writer_marked_candidate_unusable"
      );

      rejectionReasons.push(
        "ai_writer_marked_candidate_unusable"
      );
    }

    if (
      writerMarkedComplete
    ) {
      scoreAdjustment += 8;

      strengths.push(
        "ai_writer_marked_candidate_complete"
      );
    } else {
      scoreAdjustment -= 15;

      penalties.push(
        "ai_writer_marked_candidate_incomplete"
      );
    }

    if (
      writerRequiresRepair
    ) {
      scoreAdjustment -= 50;
      usable = false;

      penalties.push(
        "ai_writer_candidate_still_requires_repair"
      );

      rejectionReasons.push(
        "ai_writer_candidate_still_requires_repair"
      );
    }

    if (
      validated
    ) {
      scoreAdjustment += 8;

      strengths.push(
        "ai_writer_validation_passed"
      );
    } else {
      scoreAdjustment -= 20;

      penalties.push(
        "ai_writer_validation_not_confirmed"
      );

      if (
        candidate.validation
          ?.valid ===
        false
      ) {
        usable = false;

        rejectionReasons.push(
          "ai_writer_validation_failed"
        );
      }
    }

    if (
      candidate.evidence
        ?.fallbackReason ===
      "ai_unavailable"
    ) {
      scoreAdjustment -= 30;

      penalties.push(
        "ai_writer_unavailable_fallback"
      );
    }

    if (
      candidate.evidence
        ?.fallbackReason ===
      "local_response_plan_draft"
    ) {
      scoreAdjustment -= 3;

      penalties.push(
        "ai_writer_returned_local_plan_fallback"
      );
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
        ?.groundedInCurrentFile !==
        true
    ) {
      scoreAdjustment -= 35;

      penalties.push(
        "ai_code_answer_not_confirmed_grounded"
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
      candidate.evidence
        ?.responseLocked ===
      true;

    const relevant =
      candidate.evidence
        ?.developerRelevant ===
        true ||
      context.developerRelevant;

    const grounded =
      candidate.evidence
        ?.groundedInCurrentFile ===
      true;

    if (
      locked
    ) {
      scoreAdjustment += 100;

      strengths.push(
        "developer_response_locked"
      );

      return {
        usable:
          true,

        scoreAdjustment,

        strengths,

        penalties,

        rejectionReasons
      };
    }

    if (
      !relevant
    ) {
      scoreAdjustment -= 120;
      usable = false;

      penalties.push(
        "developer_candidate_not_relevant"
      );

      rejectionReasons.push(
        "developer_candidate_not_relevant"
      );

      return {
        usable,
        scoreAdjustment,
        strengths,
        penalties,
        rejectionReasons
      };
    }

    if (
      grounded
    ) {
      scoreAdjustment += 35;

      strengths.push(
        "developer_candidate_grounded_in_current_file"
      );
    } else {
      scoreAdjustment -= 40;

      penalties.push(
        "developer_candidate_not_grounded_in_current_file"
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

    if (
      context.characterQuestion
    ) {
      scoreAdjustment += 35;

      strengths.push(
        "character_candidate_matches_character_question"
      );
    } else {
      scoreAdjustment -= 20;

      penalties.push(
        "character_candidate_not_primary_match"
      );
    }

    if (
      candidate.evidence
        ?.characterAnswerAvailable ===
      true
    ) {
      scoreAdjustment += 12;

      strengths.push(
        "character_answer_available"
      );
    }

    if (
      candidate.evidence
        ?.characterNeedsAIWriter ===
      true
    ) {
      scoreAdjustment -= 45;
      usable = false;

      penalties.push(
        "character_candidate_requires_ai_realization"
      );

      rejectionReasons.push(
        "character_candidate_requires_ai_realization"
      );
    }

    if (
      !context.characterQuestion &&
      candidate.taskType ===
        "character" &&
      candidate.text.length <
        20
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
      this.countUserDirectedQuestions(
        text
      );

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

      penalties.push(
        "required_question_missing"
      );

      if (
        context
          .finalCandidateMustSatisfyPlan
      ) {
        usable = false;

        rejectionReasons.push(
          "required_question_missing"
        );
      }
    }

    if (
      !context.questionAllowed &&
      questionCount > 0
    ) {
      scoreAdjustment -= 25;

      penalties.push(
        "question_not_allowed"
      );

      if (
        context
          .finalCandidateMustSatisfyPlan
      ) {
        usable = false;

        rejectionReasons.push(
          "question_not_allowed"
        );
      }
    }

    if (
      questionCount >
      context.maximumQuestions
    ) {
      scoreAdjustment -=
        (
          questionCount -
          context.maximumQuestions
        ) *
        12;

      penalties.push(
        "too_many_questions"
      );

      if (
        context
          .finalCandidateMustSatisfyPlan
      ) {
        usable = false;

        rejectionReasons.push(
          "question_limit_exceeded"
        );
      }
    }

    if (
      context
        .directContentRequest &&
      this.opensWithClarifyingQuestion(
        text
      )
    ) {
      scoreAdjustment -= 40;

      penalties.push(
        "clarifying_question_before_direct_content"
      );
    }

    if (
      context.questionRequired &&
      questionCount > 0
    ) {
      scoreAdjustment += 8;

      strengths.push(
        "required_question_present"
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
      context
        .directInformationRequest ||
      context
        .directContentRequest
    ) {
      if (
        this.looksLikeDirectAnswer(
          text
        )
      ) {
        scoreAdjustment += 12;

        strengths.push(
          "answers_direct_request"
        );
      } else {
        scoreAdjustment -= 18;

        penalties.push(
          "does_not_answer_direct_request_early"
        );
      }
    }

    if (
      context.responseGoal ===
        "help_user_feel_understood" ||
      context.primary ===
        "emotion"
    ) {
      if (
        this.containsEmotionalAttunement(
          text
        )
      ) {
        scoreAdjustment += 10;

        strengths.push(
          "emotionally_attuned"
        );
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
    if (
      context.developerLocked
    ) {
      return {
        needsAIWriter:
          false,

        reason:
          null,

        source:
          "developer_response_locked",

        bestCandidateSource:
          bestCandidate?.source ||
          null
      };
    }

    if (
      context.safetyStop &&
      packet.candidatePolicy
        ?.aiWriterAllowed ===
        false
    ) {
      return {
        needsAIWriter:
          false,

        reason:
          null,

        source:
          "safety_contract_disallows_ai_writer",

        bestCandidateSource:
          bestCandidate?.source ||
          null
      };
    }

    if (
      context.aiWriterAllowed !==
      true
    ) {
      return {
        needsAIWriter:
          false,

        reason:
          null,

        source:
          "ai_writer_not_allowed",

        bestCandidateSource:
          bestCandidate?.source ||
          null
      };
    }

    if (
      !bestCandidate
    ) {
      return {
        needsAIWriter:
          true,

        reason:
          this.resolveNoCandidateRepairReason(
            evaluatedCandidates
          ),

        source:
          "no_usable_candidate",

        bestCandidateSource:
          null
      };
    }

    if (
      bestCandidate.source ===
      "blueprint_writer"
    ) {
      if (
        bestCandidate
          .requiresAIRepair ===
          true ||
        bestCandidate.evidence
          ?.blueprintWriterRequiresAIRepair ===
          true
      ) {
        return {
          needsAIWriter:
            true,

          reason:
            this.resolveBlueprintRepairReason(
              bestCandidate
            ),

          source:
            "blueprint_requested_ai_repair",

          bestCandidateSource:
            bestCandidate.source
        };
      }

      if (
        bestCandidate.evidence
          ?.blueprintWriterUsable !==
        true
      ) {
        return {
          needsAIWriter:
            true,

          reason:
            "blueprint_writer_marked_unusable",

          source:
            "blueprint_unusable",

          bestCandidateSource:
            bestCandidate.source
        };
      }

      if (
        bestCandidate.evidence
          ?.blueprintWriterComplete !==
        true
      ) {
        return {
          needsAIWriter:
            true,

          reason:
            "blueprint_render_incomplete",

          source:
            "blueprint_incomplete",

          bestCandidateSource:
            bestCandidate.source
        };
      }

      if (
        bestCandidate.quality
          ?.canonicalResponsePlanSatisfied !==
        true
      ) {
        return {
          needsAIWriter:
            true,

          reason:
            "blueprint_did_not_satisfy_canonical_plan",

          source:
            "canonical_plan_not_satisfied",

          bestCandidateSource:
            bestCandidate.source
        };
      }

      if (
        bestCandidate.score <
        context
          .preferredDeterministicMinimumScore
      ) {
        return {
          needsAIWriter:
            true,

          reason:
            "blueprint_candidate_score_below_preferred_threshold",

          source:
            "blueprint_quality_threshold",

          bestCandidateSource:
            bestCandidate.source
        };
      }

      return {
        needsAIWriter:
          false,

        reason:
          null,

        source:
          "usable_complete_blueprint_candidate",

        bestCandidateSource:
          bestCandidate.source
      };
    }

    if (
      bestCandidate.source ===
        "character_reasoning" &&
      context.characterQuestion
    ) {
      return {
        needsAIWriter:
          false,

        reason:
          null,

        source:
          "complete_character_candidate",

        bestCandidateSource:
          bestCandidate.source
      };
    }

    if (
      bestCandidate.source ===
        "developer_handoff" &&
      bestCandidate.evidence
        ?.responseLocked ===
        true
    ) {
      return {
        needsAIWriter:
          false,

        reason:
          null,

        source:
          "locked_developer_candidate",

        bestCandidateSource:
          bestCandidate.source
      };
    }

    return {
      needsAIWriter:
        false,

      reason:
        null,

      source:
        bestCandidate.source ===
          "ai_writer"
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
      ).find(
        candidate =>
          candidate.source ===
          "blueprint_writer"
      );

    if (
      blueprint
    ) {
      return this.resolveBlueprintRepairReason(
        blueprint
      );
    }

    const rejectedAI =
      this.toArray(
        evaluatedCandidates
      ).find(
        candidate =>
          candidate.source ===
            "ai_writer" &&
          candidate.usable !==
            true
      );

if (rejectedAI) {
  return (
    rejectedAI.rejectionReasons?.[0] ||
    rejectedAI.validation?.reason ||
    rejectedAI.evidence?.writerReason ||
    "ai_candidate_rejected"
  );
}

    return "no_usable_response_candidate";
  },

  resolveBlueprintRepairReason(
    candidate = {}
  ) {
    const quality =
      candidate.evidence
        ?.renderQuality ||
      {};

    const unsupported =
      this.toArray(
        candidate.evidence
          ?.unsupportedResponseMoves
      );

    if (
      candidate.evidence
        ?.blueprintWriterRequiresAIRepair ===
      true
    ) {
      if (
        quality.reason
      ) {
        return quality.reason;
      }

      if (
        unsupported.some(
          move =>
            move?.required !==
            false
        )
      ) {
        return "required_response_moves_unsupported";
      }

      return "blueprint_requested_ai_repair";
    }

    if (
      candidate.evidence
        ?.blueprintWriterUsable !==
      true
    ) {
      return "blueprint_writer_marked_unusable";
    }

    if (
      candidate.evidence
        ?.blueprintWriterComplete !==
      true
    ) {
      return "blueprint_render_incomplete";
    }

    if (
      quality
        .containsInternalInstruction ===
      true
    ) {
      return "blueprint_rendered_internal_instruction";
    }

    if (
      quality
        .missingRequiredQuestion ===
      true
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
      this.toArray(
        candidates
      );

    if (
      !available.length
    ) {
      return null;
    }

    if (
      context.developerLocked
    ) {
      const locked =
        available.find(
          candidate =>
            candidate.source ===
              "developer_handoff" &&
            candidate.evidence
              ?.responseLocked ===
              true
        );

      if (
        locked
      ) {
        return locked;
      }
    }

    const blueprint =
      available.find(
        candidate =>
          candidate.source ===
          "blueprint_writer"
      );

    if (
      blueprint &&
      blueprint.quality
        ?.canonicalResponsePlanSatisfied ===
        true &&
      blueprint.complete ===
        true &&
      blueprint
        .requiresAIRepair !==
        true
    ) {
      return blueprint;
    }

    return (
      available[0] ||
      null
    );
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
      this.toArray(
        candidates
      );

    if (
      !available.length
    ) {
      return null;
    }

    if (
      context.developerLocked
    ) {
      const lockedDeveloper =
        available.find(
          candidate =>
            candidate.source ===
              "developer_handoff" &&
            candidate.evidence
              ?.responseLocked ===
              true
        );

      if (
        lockedDeveloper
      ) {
        return lockedDeveloper;
      }
    }

    const blueprint =
      available.find(
        candidate =>
          candidate.source ===
          "blueprint_writer"
      );

    const aiCandidate =
      available.find(
        candidate =>
          candidate.source ===
          "ai_writer"
      );

    /*
     * A complete deterministic candidate wins unless AI
     * was required to repair it and produced a stronger,
     * valid, complete, plan-satisfying candidate.
     */
    if (
      blueprint &&
      blueprint.complete ===
        true &&
      blueprint
        .requiresAIRepair !==
        true &&
      blueprint.quality
        ?.canonicalResponsePlanSatisfied ===
        true
    ) {
      const aiWasRequiredRepair =
        aiCandidate?.evidence
          ?.repairRequested ===
        true;

      const aiSatisfiedPlan =
        aiCandidate?.quality
          ?.canonicalResponsePlanSatisfied ===
        true;

      const aiPassedWriterStatus =
        aiCandidate?.usable ===
          true &&
        aiCandidate?.complete ===
          true &&
        aiCandidate
          ?.requiresAIRepair !==
          true;

      if (
        aiCandidate &&
        aiWasRequiredRepair &&
        aiSatisfiedPlan &&
        aiPassedWriterStatus &&
        aiCandidate.score >
          blueprint.score +
            8
      ) {
        return aiCandidate;
      }

      return blueprint;
    }

    /*
     * A valid AI repair may win only when a Blueprint
     * candidate existed and was rejected or incomplete.
     */
    if (
      aiCandidate &&
      aiCandidate.evidence
        ?.repairRequested ===
        true &&
      aiCandidate.complete ===
        true &&
      aiCandidate.usable ===
        true &&
      aiCandidate
        .requiresAIRepair !==
        true &&
      aiCandidate.quality
        ?.canonicalResponsePlanSatisfied ===
        true
    ) {
      const rejectedBlueprint =
        this.toArray(
          evaluatedCandidates
        ).find(
          candidate =>
            candidate.source ===
              "blueprint_writer" &&
            candidate.usable !==
              true
        );

      if (
        rejectedBlueprint
      ) {
        return aiCandidate;
      }
    }

    if (
      context.characterQuestion
    ) {
      const characterCandidate =
        available.find(
          candidate =>
            candidate.source ===
              "character_reasoning" &&
            candidate.score >=
              context
                .minimumUsableScore
        );

      if (
        characterCandidate &&
        characterCandidate.score >=
          available[0].score -
            10
      ) {
        return characterCandidate;
      }
    }

    return (
      available[0] ||
      null
    );
  },

  buildSelectionReason(
    candidate = {}
  ) {
    const strengths =
      candidate
        .scoreBreakdown
        ?.strengths ||
      [];

    const strengthText =
      strengths.length
        ? ` Strengths: ${strengths.join(
            ", "
          )}.`
        : "";

    return (
      `Selected ${candidate.source} with score ${candidate.score}.` +
      strengthText
    );
  },

  /* =====================================================
     PATTERN CHECKS
  ===================================================== */

  containsInternalPlannerLanguage(
    text = ""
  ) {
    const normalized =
      this.normalize(
        text
      );

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
      "use response rules",
      "according to the composer packet",
      "according to the response plan"
    ];

    return phrases.some(
      phrase =>
        normalized.includes(
          phrase
        )
    );
  },

  containsWriterFailureMessage(
    text = ""
  ) {
    const normalized =
      this.normalize(
        text
      );

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
      "i won t use stale developer evidence",
      "i know what youre asking but i dont have a reliable answer ready",
      "i know what you re asking but i don t have a reliable answer ready"
    ];

    return phrases.some(
      phrase =>
        normalized.includes(
          phrase
        )
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

    const normalized =
      this.normalize(
        text
      );

    return (
      /\b(?:github|repository|repo|codebase|loaded file|file evidence)\b/i
        .test(
          normalized
        ) ||
      /\bi read\b.*\b(?:index html|style css|javascript|file|repo)\b/i
        .test(
          normalized
        )
    );
  },

  looksLikeCodeAnswer(
    text = ""
  ) {
    return (
      /```/.test(
        text
      ) ||
      /\bfunction\s+\w+/i.test(
        text
      ) ||
      /\bconst\s+\w+/i.test(
        text
      ) ||
      /\blet\s+\w+/i.test(
        text
      ) ||
      /=>/.test(
        text
      )
    );
  },

  looksLikeDirectAnswer(
    text = ""
  ) {
    const normalized =
      this.normalize(
        text
      );

    if (
      !normalized
    ) {
      return false;
    }

    if (
      this.opensWithClarifyingQuestion(
        text
      )
    ) {
      return false;
    }

    /*
     * A direct content request such as "Tell me a story"
     * is answered directly when usable content begins,
     * even if it does not use an explicit yes/no opener.
     */
    return true;
  },

  opensWithClarifyingQuestion(
    text = ""
  ) {
    const firstSentence =
      this.splitSentences(
        text
      )[0] ||
      "";

    if (
      !this.isUserDirectedQuestion(
        firstSentence
      )
    ) {
      return false;
    }

    return /^(?:do you want|would you like|are you asking|did you mean|can you clarify|what do you mean|are you saying)\b/i
      .test(
        firstSentence
      );
  },

  containsEmotionalAttunement(
    text = ""
  ) {
    return /\b(?:that makes sense|i can see why|i can hear|that sounds|yeah|im with you|i m with you|that can feel|it makes sense)\b/i
      .test(
        text
      );
  },

  isDeveloperQuestion(
    text = ""
  ) {
    const value =
      String(
        text ||
        ""
      );

    const explicitFile =
      /\b[\w/-]+\.(?:js|mjs|cjs|html|css|json|md|ts|tsx|jsx|sql|py|yml|yaml)\b/i
        .test(
          value
        );

    const repoContext =
      /\b(?:github|repo|repository|branch|commit|deploy|vercel|supabase|codebase|pipeline|engine|composer|schema)\b/i
        .test(
          value
        );

    const developerAction =
      /\b(?:read|open|show|search|find|update|change|replace|remove|fix|patch|debug|edit|inspect|diagnose|build|implement|rewrite|wire|refactor|validate|test)\b/i
        .test(
          value
        );

    const developerConcept =
      /\b(?:code|file|function|engine|pipeline|composer|handoff|api|bug|error|script|schema|javascript|html|css)\b/i
        .test(
          value
        );

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

  isCharacterQuestion(
    text = ""
  ) {
    return /\b(?:who are you|what are you|your purpose|your personality|your favorite|what do you believe|what do you stand for|what matters to you|what do you value|what do you like|your opinion|your preference)\b/i
      .test(
        String(
          text ||
          ""
        )
      );
  },

  isDirectContentRequest(
    text = ""
  ) {
    return /\b(?:give me|tell me|send me|write me|make me|show me|create|generate|build|rewrite|replace|fix this|update this)\b/i
      .test(
        text
      );
  },

  isDirectInformationRequest(
    text = ""
  ) {
    return (
      /\?$/.test(
        String(
          text
        ).trim()
      ) ||
      /^(?:what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will|has|have)\b/i
        .test(
          text
        )
    );
  },

  /* =====================================================
     INTERACTION-QUESTION DETECTION
  ===================================================== */

  isQuotedOrNarrativeQuestion(
    sentence = ""
  ) {
    const value =
      this.cleanOriginal(
        sentence
      );

    if (
      !value ||
      !value.includes("?")
    ) {
      return false;
    }

    const hasQuotedQuestion =
      /["“'][^"”']*\?[^"”']*["”']/u
        .test(
          value
        );

    const hasSpeechAttribution =
      /\?\s*["”']?\s*(?:he|she|they|i|we|the\s+\w+|[A-Z][a-z]+)\s+(?:asked|said|whispered|shouted|replied|wondered|called|murmured)\b/u
        .test(
          value
        );

    return (
      hasQuotedQuestion ||
      hasSpeechAttribution
    );
  },

  isUserDirectedQuestion(
    sentence = ""
  ) {
    const value =
      this.cleanOriginal(
        sentence
      );

    if (
      !value ||
      !value.includes("?")
    ) {
      return false;
    }

    if (
      this.isQuotedOrNarrativeQuestion(
        value
      )
    ) {
      return false;
    }

    const normalized =
      this.normalize(
        value
      );

    return (
      /^(?:so\s+)?(?:do|did|are|were|have|has|can|could|would|will|should|what|why|how|where|when|who|which)\b/
        .test(
          normalized
        ) ||
      /\b(?:do you|did you|are you|were you|have you|can you|could you|would you|will you|what do you|what did you|how do you|how are you|why do you|where do you|when do you|would you like|do you want)\b/
        .test(
          normalized
        )
    );
  },

  countUserDirectedQuestions(
    value = ""
  ) {
    return this
      .splitSentences(
        value
      )
      .filter(
        sentence =>
          this.isUserDirectedQuestion(
            sentence
          )
      )
      .length;
  },

  countQuestions(
    text = ""
  ) {
    return (
      String(
        text ||
        ""
      ).match(
        /\?/g
      ) ||
      []
    ).length;
  },

  /* =====================================================
     COMPATIBILITY METHODS
  ===================================================== */

  scoreCandidate(
  candidate = {},
  context = {}
) {
  const compatibilityCandidate = {
    ...candidate,

    usable:
      candidate.usable === undefined
        ? true
        : candidate.usable,

    complete:
      candidate.complete === undefined
        ? true
        : candidate.complete,

    requiresAIRepair:
      candidate.requiresAIRepair === true ||
      candidate.requiresRepair === true
  };

  return this.evaluateCandidate({
    candidate:
      this.normalizeCandidate(
        compatibilityCandidate
      ),

    context: {
      minimumUsableScore:
        45,

      preferredDeterministicMinimumScore:
        70,

      maximumQuestions:
        1,

      questionAllowed:
        true,

      questionRequired:
        false,

      directContentRequest:
        false,

      directInformationRequest:
        false,

      developerRelevant:
        false,

      developerLocked:
        false,

      characterQuestion:
        false,

      aiRepairAllowed:
        true,

      aiWriterAllowed:
        true,

      responsePlanAvailable:
        false,

      finalCandidateMustSatisfyPlan:
        false,

      ...context
    },

    packet:
      {},

    summary:
      {}
  });
},

  needsAIRepair(
    candidate = {},
    context = {},
    packet = {}
  ) {
    const evaluated =
      this.scoreCandidate(
        candidate,
        context
      );

    return this.determineAIRepair({
      bestCandidate:
        evaluated.usable
          ? evaluated
          : null,

      evaluatedCandidates: [
        evaluated
      ],

      context: {
        aiWriterAllowed:
          true,

        aiRepairAllowed:
          true,

        preferredDeterministicMinimumScore:
          70,

        developerLocked:
          false,

        safetyStop:
          false,

        characterQuestion:
          false,

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
    const evaluated =
      this.scoreCandidate(
        candidate,
        context
      );

    return this.determineAIRepair({
      bestCandidate:
        evaluated.usable
          ? evaluated
          : null,

      evaluatedCandidates: [
        evaluated
      ],

      context: {
        aiWriterAllowed:
          true,

        aiRepairAllowed:
          true,

        preferredDeterministicMinimumScore:
          70,

        developerLocked:
          false,

        safetyStop:
          false,

        characterQuestion:
          false,

        ...context
      },

      packet
    }).reason;
  },

  isBadBlueprintMeta(
    text = ""
  ) {
    return this.containsInternalPlannerLanguage(
      text
    );
  },

  getContext(
    summary = {},
    packet = {}
  ) {
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
      String(
        value ||
        ""
      )
    )}`;
  },

  hashString(
    value = ""
  ) {
    let hash =
      2166136261;

    const text =
      String(
        value ||
        ""
      );

    for (
      let index = 0;
      index < text.length;
      index += 1
    ) {
      hash ^=
        text.charCodeAt(
          index
        );

      hash +=
        (hash << 1) +
        (hash << 4) +
        (hash << 7) +
        (hash << 8) +
        (hash << 24);
    }

    return (
      hash >>>
      0
    ).toString(
      36
    );
  },

  splitSentences(
    text = ""
  ) {
    const value =
      this.cleanOriginal(
        text
      );

    if (
      !value
    ) {
      return [];
    }

    return value
      .split(
        /(?<=[.!?])\s+/
      )
      .map(
        sentence =>
          sentence.trim()
      )
      .filter(Boolean);
  },

  uniqueStrings(
    values = []
  ) {
    return [
      ...new Set(
        this.toArray(
          values
        )
          .map(
            value =>
              String(
                value ||
                ""
              ).trim()
          )
          .filter(Boolean)
      )
    ];
  },

  firstDefined(
    ...values
  ) {
    for (
      const value of values
    ) {
      if (
        value !== undefined &&
        value !== null
      ) {
        return value;
      }
    }

    return undefined;
  },

  numberOr(
    value,
    fallback = 0
  ) {
    const number =
      Number(
        value
      );

    return Number.isFinite(
      number
    )
      ? number
      : fallback;
  },

  toArray(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value.filter(
        item =>
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

    return [
      value
    ];
  },

  cleanOriginal(
    value = ""
  ) {
    return String(
      value ??
      ""
    )
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        "\""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  },

  normalize(
    value = ""
  ) {
    return this
      .cleanOriginal(
        value
      )
      .toLowerCase()
      .replace(
        /[_-]/g,
        " "
      )
      .replace(
        /[^\w\s']/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  },

  normalizeIdentifier(
    value = ""
  ) {
    return String(
      value ||
      ""
    )
      .toLowerCase()
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        "\""
      )
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );
  },

  normalizeForComparison(
    value = ""
  ) {
    return this
      .normalize(
        value
      )
      .replace(
        /[^\w\s]/g,
        ""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }
};

window.Ari.responseCandidateArbiter =
  window.AriResponseCandidateArbiter;

console.log(
  "ARI RESPONSE CANDIDATE ARBITER LOADED:",
  window.AriResponseCandidateArbiter?.version
);