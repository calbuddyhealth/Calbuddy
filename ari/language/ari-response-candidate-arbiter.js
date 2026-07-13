// ari/language/ari-response-candidate-arbiter.js
// Ari Response Candidate Arbiter
//
// Purpose:
// Evaluate available response candidates, decide whether AI repair is
// required, and select the strongest candidate for final composition.
//
// V2.0.0 — Structured Candidate Quality Arbitration / Blueprint Render Contract
//
// Architectural flow:
//
// Blueprint Writer
//      ↓ structured candidate + render diagnostics
// Arbiter Precheck
//      ↓ AI writer required or not required
// AI Writer
//      ↓ optional repaired candidate
// Final Arbitration
//      ↓ selected draft
// Language Composer
//
// Responsibilities:
// - Collect response candidates without duplicating identical drafts.
// - Read Blueprint Writer usability, completeness, and repair signals.
// - Reject internal planner language and stale developer output.
// - Preserve locked developer responses.
// - Prefer grounded candidates appropriate to the current request.
// - Decide whether AI Writer repair is required.
// - Select one preferred response candidate.
// - Return stable diagnostics for the expression pipeline.
//
// Non-responsibilities:
// - Does not interpret the user’s meaning.
// - Does not choose the response plan.
// - Does not create response moves.
// - Does not rewrite candidate drafts.
// - Does not generate user-facing language.
// - Does not override safety.
// - Does not persist state.
// - Does not compose the final response.

window.Ari = window.Ari || {};

window.AriResponseCandidateArbiter = {
  version: "2.0.0",
  schemaVersion: "1.0.0",

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
        .filter(candidate =>
          candidate.usable ===
          true
        )
        .sort(
          (
            first,
            second
          ) =>
            second.score -
            first.score
        );

    const rejectedCandidates =
      evaluatedCandidates
        .filter(candidate =>
          candidate.usable !==
          true
        )
        .sort(
          (
            first,
            second
          ) =>
            second.score -
            first.score
        );

    const selectedCandidate =
      this.selectCandidate({
        candidates:
          usableCandidates,

        context,
        packet,
        summary
      });

    const selectedDraft =
      selectedCandidate
        ?.text ||
      null;

    const selectedSource =
      selectedCandidate
        ?.source ||
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
        Boolean(
          selectedDraft
        ),

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
          "response_candidate_quality_arbitration"
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

    const candidates =
      this.collectCandidates({
        summary,
        packet,
        suppliedCandidates:
          input.candidates
      });

    const evaluatedCandidates =
      candidates.map(
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
        .filter(candidate =>
          candidate.usable ===
          true
        )
        .sort(
          (
            first,
            second
          ) =>
            second.score -
            first.score
        );

    const bestCandidate =
      usableCandidates[0] ||
      null;

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

    if (
      blueprintResult.draft
    ) {
      addCandidate({
        source:
          "blueprint_writer",

        text:
          blueprintResult.draft,

        priority:
          blueprintResult
            .candidate
            ?.priority ??
          65,

        usable:
          blueprintResult.usable,

        taskType:
          "canonical_response_plan",

        requiresAIRepair:
          blueprintResult
            .requiresAIRepair,

        complete:
          blueprintResult.complete,

        evidence: {
          ...(
            blueprintResult
              .candidate
              ?.evidence ||
            {}
          ),

          canonicalResponsePlanUsed:
            true,

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
            blueprintResult
              .reason
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

    if (
      aiWriterResult.draft
    ) {
      addCandidate({
        source:
          "ai_writer",

        text:
          aiWriterResult.draft,

        priority:
          85,

        usable:
          true,

        taskType:
          "natural_answer",

        complete:
          true,

        requiresAIRepair:
          false,

        evidence: {
          usedAI:
            aiWriterResult
              .usedAI,

          fallbackReason:
            aiWriterResult
              .fallbackReason,

          writerSource:
            aiWriterResult
              .source,

          writerVersion:
            aiWriterResult
              .version
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

    if (
      developerResult.text
    ) {
      addCandidate({
        source:
          "developer_handoff",

        text:
          developerResult.text,

        priority:
          developerResult.locked
            ? 120
            : 90,

        usable:
          developerResult.locked ||
          developerResult.relevant,

        taskType:
          "coding",

        complete:
          developerResult.complete,

        requiresAIRepair:
          false,

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

    if (
      characterResult.text
    ) {
      addCandidate({
        source:
          "character_reasoning",

        text:
          characterResult.text,

        priority:
          90,

        usable:
          characterResult.available,

        taskType:
          "character",

        complete:
          characterResult.complete,

        requiresAIRepair:
          false,

        evidence: {
          characterAnswerAvailable:
            characterResult.available,

          characterRelevant:
            characterResult.relevant
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

    return {
      id:
        candidate.id ||
        this.createStableId(
          "candidate",
          [
            candidate.source,
            text
          ].join("|")
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

      usable:
        candidate.usable !==
        false,

      complete:
        candidate.complete !==
        false,

      requiresAIRepair:
        candidate
          .requiresAIRepair ===
        true,

      taskType:
        candidate.taskType ||
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
    ).forEach(candidate => {
      const key =
        this.normalizeForComparison(
          candidate.text
        );

      if (!key) {
        return;
      }

      if (!seen.has(key)) {
        seen.set(
          key,
          candidate
        );

        return;
      }

      const existing =
        seen.get(key);

      const preferred =
        this.preferDuplicateCandidate(
          existing,
          candidate
        );

      seen.set(
        key,
        preferred
      );
    });

    return [
      ...seen.values()
    ];
  },

  preferDuplicateCandidate(
    first = {},
    second = {}
  ) {
    if (
      second.priority >
      first.priority
    ) {
      return second;
    }

    if (
      second.evidence
        ?.usedAI ===
        true &&
      first.evidence
        ?.usedAI !==
        true
    ) {
      return second;
    }

    if (
      second.evidence
        ?.responseLocked ===
        true &&
      first.evidence
        ?.responseLocked !==
        true
    ) {
      return second;
    }

    if (
      second.complete ===
        true &&
      first.complete !==
        true
    ) {
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

    const draft =
      this.cleanOriginal(
        summary.blueprintWriterDraft ||
        raw.blueprintWriterDraft ||
        raw.draft ||
        packet.blueprintWriterDraft ||
        ""
      );

    const usable =
      summary
        .blueprintWriterUsable ===
        true ||
      raw.blueprintWriterUsable ===
        true ||
      raw.candidate?.usable ===
        true;

    const complete =
      summary
        .blueprintWriterComplete ===
        true ||
      raw.blueprintWriterComplete ===
        true ||
      raw.candidate
        ?.evidence
        ?.complete ===
        true ||
      raw.renderQuality
        ?.complete ===
        true;

    const requiresAIRepair =
      summary
        .blueprintWriterRequiresAIRepair ===
        true ||
      raw
        .blueprintWriterRequiresAIRepair ===
        true ||
      raw.candidate
        ?.requiresAIRepair ===
        true;

    return {
      draft,

      usable:
        draft
          ? usable
          : false,

      complete,

      requiresAIRepair,

      renderedMoves:
        this.toArray(
          summary
            .renderedResponseMoves ||
          raw.renderedResponseMoves
        ),

      unsupportedMoves:
        this.toArray(
          summary
            .unsupportedResponseMoves ||
          raw.unsupportedResponseMoves
        ),

      skippedMoves:
        this.toArray(
          summary
            .skippedResponseMoves ||
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
        null,

      candidate:
        raw.candidate ||
        null,

      raw
    };
  },

  readAIWriterResult({
    summary = {},
    packet = {}
  } = {}) {
    const raw =
      summary.aiWriter ||
      packet.evidence?.aiWriter ||
      {};

    return {
      draft:
        this.cleanOriginal(
          summary.aiWriterDraft ||
          raw.aiWriterDraft ||
          raw.draft ||
          packet.aiWriterDraft ||
          packet.evidence
            ?.aiWriter
            ?.draft ||
          ""
        ),

      usedAI:
        summary.aiWriterUsedAI ===
          true ||
        raw.aiWriterUsedAI ===
          true ||
        packet.evidence
          ?.aiWriter
          ?.usedAI ===
          true,

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
        null,

      raw
    };
  },

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
      packet.developer
        ?.locked ===
        true;

    const relevant =
      packet.developerRelevant ===
        true ||
      packet.developer
        ?.relevant ===
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
        locked ||
        handoff.complete ===
          true ||
        handoff.ready ===
          true,

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
          packet.evidence
            ?.github
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

  readCharacterCandidate({
    summary = {},
    packet = {}
  } = {}) {
    const characterReasoning =
      summary.characterReasoning ||
      {};

    const text =
      this.cleanOriginal(
        summary
          .characterDraftCandidate ||
        characterReasoning
          .userFacingDraft ||
        summary.composerCharacter
          ?.draft ||
        packet.character?.draft ||
        ""
      );

    const available =
      summary
        .characterAnswerAvailable ===
        true ||
      characterReasoning
        .characterAnswerAvailable ===
        true ||
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
        characterReasoning
          .complete !==
        false,

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
    const currentText =
      this.readCurrentText({
        summary,
        packet
      });

    const normalizedText =
      this.normalize(
        currentText
      );

    const primary =
      this.normalizeIdentifier(
        summary
          .situationContractPrimary ||
        summary.primaryLane ||
        packet.primary ||
        packet.responsePlan
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
        packet.responsePlan
          ?.responseGoal ||
        summary.responseGoal ||
        ""
      );

    const responseShape =
      this.normalizeIdentifier(
        packet.responseShape ||
        packet.responsePlan
          ?.responseShape ||
        summary.responseShape ||
        ""
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
      ].includes(primary) ||
      [
        "build_or_debug_request",
        "developer_artifact_request"
      ].includes(
        primaryFunction
      );

    const characterQuestion =
      this.isCharacterQuestion(
        currentText
      );

    const directContentRequest =
      this.isDirectContentRequest(
        normalizedText
      );

    const directInformationRequest =
      this.isDirectInformationRequest(
        normalizedText
      );

    const questionAllowed =
      packet.questionPolicy
        ?.maximumQuestions >
        0 ||
      packet.writerInstructions
        ?.finalQuestionAllowed ===
        true ||
      packet.responsePlan
        ?.shouldAskQuestion ===
        true;

    const questionRequired =
      packet.questionPolicy
        ?.shouldAskQuestion ===
        true ||
      packet.writerInstructions
        ?.questionRequired ===
        true ||
      packet.responsePlan
        ?.shouldAskQuestion ===
        true;

    const maximumQuestions =
      this.numberOr(
        packet.questionPolicy
          ?.maximumQuestions,
        questionAllowed
          ? 1
          : 0
      );

    const safetyStop =
      packet.safety
        ?.shouldStopNormalResponse ===
        true ||
      summary.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      summary
        .safetyShouldStopNormalResponse ===
        true;

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

      developerLocked,

      developerRelevant,

      characterQuestion,

      directContentRequest,

      directInformationRequest,

      questionAllowed,

      questionRequired,

      maximumQuestions,

      safetyStop,

      aiWriterAllowed:
        candidatePolicy
          .aiWriterAllowed !==
        false,

      aiRepairAllowed:
        candidatePolicy
          .aiRepairAllowed !==
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
        "candidate_arbitration_context_only"
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
      packet.userQuestion ||
      summary.resolvedUserQuestion ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
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

    const lower =
      text.toLowerCase();

    let score =
      this.numberOr(
        candidate.priority,
        50
      );

    let usable =
      candidate.usable !==
        false &&
      Boolean(text);

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    if (!text) {
      usable =
        false;

      score -=
        100;

      rejectionReasons.push(
        "empty_candidate"
      );
    }

    if (
      text.length <
      12
    ) {
      score -=
        25;

      penalties.push(
        "candidate_too_short"
      );

      if (
        text.length <
        3
      ) {
        usable =
          false;

        rejectionReasons.push(
          "candidate_has_no_meaningful_content"
        );
      }
    }

    if (
      this.containsInternalPlannerLanguage(
        lower
      )
    ) {
      score -=
        120;

      usable =
        false;

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
      score -=
        120;

      usable =
        false;

      penalties.push(
        "stale_developer_content"
      );

      rejectionReasons.push(
        "stale_developer_content_for_normal_conversation"
      );
    }

    if (
      this.containsWriterFailureMessage(
        lower
      )
    ) {
      score -=
        100;

      usable =
        false;

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
      score -=
        45;

      penalties.push(
        "candidate_requires_ai_repair"
      );

      if (
        candidate.source ===
        "blueprint_writer"
      ) {
        usable =
          false;

        rejectionReasons.push(
          "blueprint_marked_for_ai_repair"
        );
      }
    }

    if (
      candidate.complete !==
        true
    ) {
      score -=
        15;

      penalties.push(
        "candidate_incomplete"
      );
    } else {
      score +=
        5;

      strengths.push(
        "candidate_complete"
      );
    }

    if (
      candidate.source ===
      "blueprint_writer"
    ) {
      const blueprintEvaluation =
        this.evaluateBlueprintCandidate({
          candidate,
          context,
          packet
        });

      score +=
        blueprintEvaluation
          .scoreAdjustment;

      strengths.push(
        ...blueprintEvaluation
          .strengths
      );

      penalties.push(
        ...blueprintEvaluation
          .penalties
      );

      rejectionReasons.push(
        ...blueprintEvaluation
          .rejectionReasons
      );

      if (
        blueprintEvaluation
          .usable ===
        false
      ) {
        usable =
          false;
      }
    }

    if (
      candidate.source ===
      "ai_writer"
    ) {
      const aiEvaluation =
        this.evaluateAIWriterCandidate({
          candidate,
          context,
          packet
        });

      score +=
        aiEvaluation
          .scoreAdjustment;

      strengths.push(
        ...aiEvaluation
          .strengths
      );

      penalties.push(
        ...aiEvaluation
          .penalties
      );

      rejectionReasons.push(
        ...aiEvaluation
          .rejectionReasons
      );

      if (
        aiEvaluation.usable ===
        false
      ) {
        usable =
          false;
      }
    }

    if (
      candidate.source ===
      "developer_handoff"
    ) {
      const developerEvaluation =
        this.evaluateDeveloperCandidate({
          candidate,
          context
        });

      score +=
        developerEvaluation
          .scoreAdjustment;

      strengths.push(
        ...developerEvaluation
          .strengths
      );

      penalties.push(
        ...developerEvaluation
          .penalties
      );

      rejectionReasons.push(
        ...developerEvaluation
          .rejectionReasons
      );

      if (
        developerEvaluation
          .usable ===
        false
      ) {
        usable =
          false;
      }
    }

    if (
      candidate.source ===
      "character_reasoning"
    ) {
      const characterEvaluation =
        this.evaluateCharacterCandidate({
          candidate,
          context
        });

      score +=
        characterEvaluation
          .scoreAdjustment;

      strengths.push(
        ...characterEvaluation
          .strengths
      );

      penalties.push(
        ...characterEvaluation
          .penalties
      );

      rejectionReasons.push(
        ...characterEvaluation
          .rejectionReasons
      );

      if (
        characterEvaluation
          .usable ===
        false
      ) {
        usable =
          false;
      }
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
      questionEvaluation
        .usable ===
      false
    ) {
      usable =
        false;
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

    if (
      usable &&
      score <
      context.minimumUsableScore
    ) {
      usable =
        false;

      rejectionReasons.push(
        "candidate_score_below_minimum"
      );
    }

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

        containsInternalPlannerLanguage:
          this.containsInternalPlannerLanguage(
            lower
          ),

        containsStaleDeveloperLanguage:
          this.containsStaleDeveloperLanguage({
            text,
            context
          }),

        questionCount:
          this.countQuestions(
            text
          ),

        directAnswerLike:
          this.looksLikeDirectAnswer(
            text
          )
      }
    };
  },

  /* =====================================================
     BLUEPRINT EVALUATION
  ===================================================== */

  evaluateBlueprintCandidate({
    candidate = {},
    context = {}
  } = {}) {
    let scoreAdjustment =
      0;

    let usable =
      true;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    const evidence =
      candidate.evidence ||
      {};

    const blueprintUsable =
      evidence.blueprintWriterUsable ===
        true ||
      candidate.usable ===
        true;

    const blueprintComplete =
      evidence.blueprintWriterComplete ===
        true ||
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
        evidence.renderedResponseMoves
      );

    const unsupportedMoves =
      this.toArray(
        evidence
          .unsupportedResponseMoves
      );

    const unsupportedRequiredMoves =
      unsupportedMoves.filter(
        move =>
          move?.required !==
          false
      );

    const renderQuality =
      evidence.renderQuality ||
      {};

    if (blueprintUsable) {
      scoreAdjustment +=
        12;

      strengths.push(
        "blueprint_writer_marked_usable"
      );
    } else {
      scoreAdjustment -=
        45;

      penalties.push(
        "blueprint_writer_marked_unusable"
      );

      rejectionReasons.push(
        "blueprint_writer_marked_unusable"
      );

      usable =
        false;
    }

    if (blueprintComplete) {
      scoreAdjustment +=
        10;

      strengths.push(
        "blueprint_render_complete"
      );
    } else {
      scoreAdjustment -=
        20;

      penalties.push(
        "blueprint_render_incomplete"
      );
    }

    if (
      requiresRepair
    ) {
      scoreAdjustment -=
        60;

      penalties.push(
        "blueprint_requires_ai_repair"
      );

      rejectionReasons.push(
        "blueprint_requires_ai_repair"
      );

      usable =
        false;
    }

    if (
      renderedMoves.length >
      0
    ) {
      scoreAdjustment +=
        Math.min(
          15,
          renderedMoves.length *
          4
        );

      strengths.push(
        "canonical_response_moves_rendered"
      );
    } else {
      scoreAdjustment -=
        25;

      penalties.push(
        "no_canonical_response_moves_rendered"
      );

      rejectionReasons.push(
        "no_canonical_response_moves_rendered"
      );

      usable =
        false;
    }

    if (
      unsupportedRequiredMoves
        .length >
      0
    ) {
      scoreAdjustment -=
        Math.min(
          50,
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
        usable =
          false;

        rejectionReasons.push(
          "required_response_moves_need_ai_repair"
        );
      }
    }

    if (
      renderQuality
        .containsInternalInstruction ===
        true
    ) {
      scoreAdjustment -=
        100;

      usable =
        false;

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
      scoreAdjustment -=
        30;

      penalties.push(
        "required_question_missing"
      );

      if (
        context.questionRequired
      ) {
        usable =
          false;

        rejectionReasons.push(
          "required_question_missing"
        );
      }
    }

    if (
      renderQuality.usable ===
        false
    ) {
      scoreAdjustment -=
        35;

      penalties.push(
        "render_quality_marked_unusable"
      );

      usable =
        false;

      rejectionReasons.push(
        "render_quality_marked_unusable"
      );
    }

    if (
      context.developerRelevant &&
      evidence.groundedInCurrentFile !==
        true
    ) {
      scoreAdjustment -=
        55;

      penalties.push(
        "blueprint_not_grounded_for_developer_request"
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
    let scoreAdjustment =
      0;

    let usable =
      true;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    if (
      candidate.evidence
        ?.usedAI ===
        true
    ) {
      scoreAdjustment +=
        10;

      strengths.push(
        "ai_writer_completed_generation"
      );
    } else {
      scoreAdjustment -=
        5;

      penalties.push(
        "ai_writer_used_local_fallback"
      );
    }

    if (
      candidate.evidence
        ?.fallbackReason ===
        "ai_unavailable"
    ) {
      scoreAdjustment -=
        25;

      penalties.push(
        "ai_writer_unavailable_fallback"
      );
    }

    if (
      this.containsWriterFailureMessage(
        candidate.text
      )
    ) {
      scoreAdjustment -=
        100;

      usable =
        false;

      rejectionReasons.push(
        "ai_writer_failure_message_exposed"
      );
    }

    if (
      context.developerRelevant &&
      candidate.evidence
        ?.groundedInCurrentFile !==
        true &&
      this.looksLikeCodeAnswer(
        candidate.text
      )
    ) {
      scoreAdjustment -=
        35;

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
    let scoreAdjustment =
      0;

    let usable =
      true;

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

    if (locked) {
      scoreAdjustment +=
        100;

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

    if (!relevant) {
      scoreAdjustment -=
        120;

      usable =
        false;

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

    if (grounded) {
      scoreAdjustment +=
        40;

      strengths.push(
        "developer_candidate_grounded_in_current_file"
      );
    } else {
      scoreAdjustment -=
        40;

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
    let scoreAdjustment =
      0;

    let usable =
      true;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    if (
      context.characterQuestion
    ) {
      scoreAdjustment +=
        40;

      strengths.push(
        "character_candidate_matches_character_question"
      );
    } else {
      scoreAdjustment -=
        15;

      penalties.push(
        "character_candidate_not_primary_match"
      );
    }

    if (
      candidate.evidence
        ?.characterAnswerAvailable ===
        true
    ) {
      scoreAdjustment +=
        15;

      strengths.push(
        "character_answer_available"
      );
    }

    if (
      !context.characterQuestion &&
      candidate.taskType ===
        "character" &&
      candidate.text.length <
        20
    ) {
      usable =
        false;

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
      this.countQuestions(
        text
      );

    let scoreAdjustment =
      0;

    let usable =
      true;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    if (
      context.questionRequired &&
      questionCount ===
        0
    ) {
      scoreAdjustment -=
        20;

      penalties.push(
        "required_question_missing"
      );
    }

    if (
      !context.questionAllowed &&
      questionCount >
        0
    ) {
      scoreAdjustment -=
        25;

      penalties.push(
        "question_not_allowed"
      );
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
    }

    if (
      context.directContentRequest &&
      this.opensWithClarifyingQuestion(
        text
      )
    ) {
      scoreAdjustment -=
        40;

      penalties.push(
        "clarifying_question_before_direct_content"
      );
    }

    if (
      context.questionRequired &&
      questionCount >
        0
    ) {
      scoreAdjustment +=
        8;

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
    let scoreAdjustment =
      0;

    const strengths = [];
    const penalties = [];

    if (
      context.directInformationRequest ||
      context.directContentRequest
    ) {
      if (
        this.looksLikeDirectAnswer(
          text
        )
      ) {
        scoreAdjustment +=
          12;

        strengths.push(
          "answers_direct_request"
        );
      } else {
        scoreAdjustment -=
          18;

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
        scoreAdjustment +=
          10;

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

    if (!bestCandidate) {
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

    if (
      bestCandidate.source ===
        "ai_writer"
    ) {
      return {
        needsAIWriter:
          false,

        reason:
          null,

        source:
          "ai_writer_candidate_already_available",

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
        "usable_non_blueprint_candidate",

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

    if (blueprint) {
      return this.resolveBlueprintRepairReason(
        blueprint
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
     FINAL SELECTION
  ===================================================== */

  selectCandidate({
    candidates = [],
    context = {}
  } = {}) {
    const available =
      this.toArray(
        candidates
      );

    if (!available.length) {
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

      if (lockedDeveloper) {
        return lockedDeveloper;
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

    return available[0];
  },

  buildSelectionReason(
    candidate = {}
  ) {
    const strengths =
      candidate.scoreBreakdown
        ?.strengths ||
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
      "the simplest way to think about it is",
      "use response rules",
      "according to the composer packet"
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
      "i won t use stale developer evidence"
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
      /\b(?:github|repository|repo|codebase|loaded file|file evidence)\b/i.test(
        normalized
      ) ||
      /\bi read\b.*\b(?:index html|style css|javascript|file|repo)\b/i.test(
        normalized
      )
    );
  },

  looksLikeCodeAnswer(
    text = ""
  ) {
    return (
      /```/.test(text) ||
      /\bfunction\s+\w+/i.test(
        text
      ) ||
      /\bconst\s+\w+/i.test(
        text
      ) ||
      /\blet\s+\w+/i.test(
        text
      ) ||
      /=>/.test(text)
    );
  },

  looksLikeDirectAnswer(
    text = ""
  ) {
    const normalized =
      this.normalize(
        text
      );

    if (!normalized) {
      return false;
    }

    const firstSentence =
      this.splitSentences(
        normalized
      )[0] ||
      normalized;

    return (
      /^(?:yes|no|yeah|it means|this means|the reason|the main issue|you should|start by|the next step|that reaction|what is happening|whats happening|what s happening|the problem|the answer)\b/.test(
        firstSentence
      ) ||
      !this.opensWithClarifyingQuestion(
        text
      )
    );
  },

  opensWithClarifyingQuestion(
    text = ""
  ) {
    const firstSentence =
      this.splitSentences(
        text
      )[0] ||
      "";

    return (
      firstSentence.includes("?") &&
      /^(?:do you want|would you like|are you asking|did you mean|can you clarify|what do you mean|are you saying)\b/i.test(
        firstSentence
      )
    );
  },

  containsEmotionalAttunement(
    text = ""
  ) {
    return /\b(?:that makes sense|i can see why|i can hear|that sounds|yeah|im with you|i m with you|that can feel|it makes sense)\b/i.test(
      text
    );
  },

  isDeveloperQuestion(
    text = ""
  ) {
    const normalized =
      String(
        text ||
        ""
      );

    const explicitFile =
      /\b[\w/-]+\.(?:js|html|css|json|md|ts|tsx|jsx)\b/i.test(
        normalized
      );

    const repoContext =
      /\b(?:github|repo|repository|branch|commit|deploy|vercel|supabase|codebase)\b/i.test(
        normalized
      );

    const developerAction =
      /\b(?:read|open|show|search|find|update|change|replace|remove|fix|patch|debug|edit|inspect|diagnose|build|implement|rewrite)\b/i.test(
        normalized
      );

    const developerConcept =
      /\b(?:code|file|function|engine|pipeline|composer|handoff|api|bug|error|script|schema|javascript|html|css)\b/i.test(
        normalized
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
    return /\b(?:who are you|what are you|your purpose|your personality|your favorite|what do you believe|what do you stand for|what matters to you|what do you value|what do you like|your opinion|your preference)\b/i.test(
      String(
        text ||
        ""
      )
    );
  },

  isDirectContentRequest(
    text = ""
  ) {
    return /\b(?:give me|tell me|send me|write me|make me|show me|create|generate|build|rewrite|replace|fix this|update this)\b/i.test(
      text
    );
  },

  isDirectInformationRequest(
    text = ""
  ) {
    return (
      /\?$/.test(
        String(text).trim()
      ) ||
      /^(?:what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will|has|have)\b/i.test(
        text
      )
    );
  },

  countQuestions(
    text = ""
  ) {
    return (
      String(
        text ||
        ""
      ).match(/\?/g) ||
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
    return this.evaluateCandidate({
      candidate:
        this.normalizeCandidate(
          candidate
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
          this.normalizeCandidate(
            candidate
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

          aiWriterAllowed:
            true,

          aiRepairAllowed:
            true,

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
    const normalizedCandidate =
      this.evaluateCandidate({
        candidate:
          this.normalizeCandidate(
            candidate
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

          aiWriterAllowed:
            true,

          aiRepairAllowed:
            true,

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
    return [
      prefix,
      this.hashString(
        String(
          value ||
          ""
        )
      )
    ].join("_");
  },

  hashString(value = "") {
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
        (
          hash << 1
        ) +
        (
          hash << 4
        ) +
        (
          hash << 7
        ) +
        (
          hash << 8
        ) +
        (
          hash << 24
        );
    }

    return (
      hash >>> 0
    ).toString(36);
  },

  splitSentences(
    text = ""
  ) {
    const value =
      this.cleanOriginal(
        text
      );

    if (!value) {
      return [];
    }

    return value
      .split(
        /(?<=[.!?])\s+/
      )
      .map(sentence =>
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
          .map(value =>
            String(
              value ||
              ""
            ).trim()
          )
          .filter(Boolean)
      )
    ];
  },

  numberOr(
    value,
    fallback = 0
  ) {
    const number =
      Number(value);

    return Number.isFinite(
      number
    )
      ? number
      : fallback;
  },

  toArray(value) {
    if (
      Array.isArray(value)
    ) {
      return value.filter(
        item =>
          item !==
            null &&
          item !==
            undefined &&
          item !==
            ""
      );
    }

    if (
      value ===
        undefined ||
      value ===
        null ||
      value ===
        ""
    ) {
      return [];
    }

    return [value];
  },

  cleanOriginal(value = "") {
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

  normalize(value = "") {
    return this.cleanOriginal(
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
    return this.normalize(
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