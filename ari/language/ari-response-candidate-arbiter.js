// ari/language/ari-response-candidate-arbiter.js
// Ari Response Candidate Arbiter
//
// Purpose:
// Evaluate explicitly registered response candidates against the canonical
// response contract, determine whether AI realization or repair is required,
// and authorize one candidate for final composition.
//
// V3.0.0 — Canonical Candidate Authority / Single Collection Path / No Draft Synthesis
//
// Architectural flow:
//
// Draft Generation Stage
//      ↓
// Arbiter Precheck
//      ↓
// Optional AI Writer
//      ↓
// Final Arbitration
//      ↓
// Language Composer V9
//
// Responsibilities:
// - Read the canonical Composer Packet and Response Plan.
// - Collect explicitly registered candidates exactly once.
// - Read the canonical AI Writer candidate when AI Writer ran.
// - Normalize candidate contracts without inventing successful status.
// - Reject empty, incomplete, unsafe, stale, internal, or unauthorized drafts.
// - Determine whether AI realization or repair is required.
// - Select one authorized final candidate.
// - Return structured arbitration diagnostics.
//
// Non-responsibilities:
// - Does not synthesize Character candidates from scattered state.
// - Does not synthesize Blueprint candidates from scattered state.
// - Does not synthesize developer candidates from scattered state.
// - Does not independently create candidate text.
// - Does not rewrite candidate text.
// - Does not reinterpret the current turn.
// - Does not choose or modify the Response Plan.
// - Does not create response moves.
// - Does not compose the final response.
// - Does not override safety.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriResponseCandidateArbiter = {
  version: "3.0.0",
  source: "ari-response-candidate-arbiter",
  schemaVersion: "3.0.0",

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
      collectedCandidates
        .map(candidate =>
          this.evaluateCandidate({
            candidate,
            context
          })
        )
        .sort(
          (
            first,
            second
          ) =>
            second.score -
            first.score
        );

    const usableCandidates =
      evaluatedCandidates.filter(
        candidate =>
          candidate.usable ===
          true
      );

    const rejectedCandidates =
      evaluatedCandidates.filter(
        candidate =>
          candidate.usable !==
          true
      );

    const selectedCandidate =
      this.selectFinalCandidate({
        usableCandidates,
        evaluatedCandidates,
        context
      });

    const selectedDraft =
      selectedCandidate?.text ||
      null;

    const selectedSource =
      selectedCandidate?.source ||
      null;

    const selectionReady =
      Boolean(
        selectedCandidate &&
        selectedDraft
      );

    const selectionReason =
      selectionReady
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
        this.source,

      source:
        this.source,

      context,

      selectionReady,

      selectedCandidate,

      selectedDraft,

      selectedSource,

      selectedDraftSource:
        selectedSource,

      selectedDraftReason:
        selectionReason,

      reason:
        selectionReason,

      finalResponseCandidate:
        selectedDraft,

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
          ?.complete ===
        true,

      selectedCandidateWasAIRepair:
        selectedCandidate
          ?.quality
          ?.aiRepairCandidate ===
        true,

      authority:
        this.getFinalAuthorityBoundaries()
    };

    window.Ari
      .responseCandidateArbitration =
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

    const collectedCandidates =
      this.collectCandidates({
        summary,
        packet,
        suppliedCandidates:
          input.candidates,

        includeAIWriterCandidate:
          false
      });

    const evaluatedCandidates =
      collectedCandidates
        .map(candidate =>
          this.evaluateCandidate({
            candidate,
            context
          })
        )
        .sort(
          (
            first,
            second
          ) =>
            second.score -
            first.score
        );

    const usableCandidates =
      evaluatedCandidates.filter(
        candidate =>
          candidate.usable ===
          true
      );

    const bestCandidate =
      this.selectPrecheckCandidate({
        usableCandidates,
        context
      });

    const repairDecision =
      this.determineAIRequirement({
        bestCandidate,
        evaluatedCandidates,
        context
      });

    const result = {
      schema:
        "ari_response_candidate_precheck",

      schemaVersion:
        this.schemaVersion,

      responseCandidateArbiterRan:
        true,

      responseCandidateArbiterVersion:
        this.version,

      responseCandidateArbiterSource:
        this.source,

      arbiterPrecheckRan:
        true,

      source:
        this.source,

      context,

      selectedCandidate:
        bestCandidate,

      selectedDraft:
        bestCandidate?.text ||
        null,

      selectedSource:
        bestCandidate?.source ||
        null,

      selectedDraftSource:
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

      candidateCount:
        evaluatedCandidates.length,

      usableCandidateCount:
        usableCandidates.length,

      needsAIWriter:
        repairDecision.required,

      aiRepairReason:
        repairDecision.reason,

      aiRepairDetails:
        repairDecision,

      finalResponseCandidate:
        bestCandidate?.text ||
        null,

      authority:
        this.getPrecheckAuthorityBoundaries()
    };

    if (
      summary.debugTiming ===
        true ||
      summary.appContext
        ?.debugTiming ===
        true
    ) {
      console.log(
        "=== ARBITER PRECHECK ===",
        {
          currentText:
            context.currentText,

          candidates:
            evaluatedCandidates.map(
              candidate => ({
                source:
                  candidate.source,

                usable:
                  candidate.usable,

                complete:
                  candidate.complete,

                requiresAIRepair:
                  candidate
                    .requiresAIRepair,

                score:
                  candidate.score,

                rejectionReasons:
                  candidate
                    .rejectionReasons
              })
            ),

          selectedSource:
            bestCandidate?.source ||
            null,

          needsAIWriter:
            repairDecision.required,

          reason:
            repairDecision.reason
        }
      );
    }

    return result;
  },

  /* =====================================================
     CANDIDATE COLLECTION
  ===================================================== */

  collectCandidates({
    summary = {},
    packet = {},
    suppliedCandidates = undefined,
    includeAIWriterCandidate = true
  } = {}) {
    const candidates = [];

    const explicitCandidates =
      suppliedCandidates !==
        undefined
        ? this.toArray(
            suppliedCandidates
          )
        : this.toArray(
            summary.candidateDrafts ||
            packet.candidateDrafts
          );

    explicitCandidates.forEach(
      candidate => {
        const normalized =
          this.normalizeCandidate(
            candidate
          );

        if (normalized.text) {
          candidates.push(
            normalized
          );
        }
      }
    );

    /*
     * AI Writer runs after Draft Generation, so its result
     * is not expected to exist in candidateDrafts unless a
     * future stage explicitly registers it.
     *
     * Read exactly one canonical AI Writer candidate here.
     */
    if (
      includeAIWriterCandidate ===
      true
    ) {
      const aiCandidate =
        this.readCanonicalAIWriterCandidate({
          summary,
          packet
        });

      if (aiCandidate) {
        candidates.push(
          aiCandidate
        );
      }
    }

    return this.dedupeCandidates(
      candidates
    );
  },

  readCanonicalAIWriterCandidate({
    summary = {},
    packet = {}
  } = {}) {
    const writer =
      summary.aiWriter ||
      summary.aiWriterResult ||
      packet.aiWriter ||
      packet.evidence
        ?.aiWriter ||
      null;

    if (
      !writer ||
      typeof writer !==
        "object"
    ) {
      return null;
    }

    const candidate =
      writer.candidate &&
      typeof writer.candidate ===
        "object"
        ? writer.candidate
        : null;

    const draft =
      this.cleanOriginal(
        candidate?.text ||
        writer.aiWriterDraft ||
        writer.draft ||
        summary.aiWriterDraft ||
        ""
      );

    if (!draft) {
      return null;
    }

    const validation =
      candidate?.validation ||
      writer.validation ||
      summary
        .aiWriterValidation ||
      null;

    const usable =
      candidate?.usable ===
        true ||
      writer.aiWriterUsable ===
        true;

    const complete =
      candidate?.complete ===
        true ||
      writer.aiWriterComplete ===
        true;

    const requiresAIRepair =
      candidate
        ?.requiresAIRepair ===
        true ||
      candidate
        ?.requiresRepair ===
        true ||
      writer
        .aiWriterRequiresRepair ===
        true;

    const repairRequested =
      summary.needsAIWriter ===
        true ||
      summary.shouldRunAIWriter ===
        true ||
      summary.aiRepairReason !=
        null ||
      packet
        .responseCandidateArbiter
        ?.needsAIWriter ===
        true;

    return this.normalizeCandidate({
      ...(candidate || {}),

      source:
        "ai_writer",

      text:
        draft,

      priority:
        this.numberOr(
          candidate?.priority,
          usable
            ? 80
            : 20
        ),

      usable,

      complete,

      requiresAIRepair,

      validation,

      taskType:
        "canonical_response_plan_ai_render",

      evidence: {
        ...(
          candidate?.evidence ||
          {}
        ),

        usedAI:
          writer.aiWriterUsedAI ===
            true ||
          candidate?.usedAI ===
            true,

        writerMarkedUsable:
          usable,

        writerMarkedComplete:
          complete,

        writerRequiresRepair:
          requiresAIRepair,

        validated:
          validation?.valid ===
          true,

        repairRequested,

        repairReason:
          summary.aiRepairReason ||
          writer.aiRepairReason ||
          writer.aiWriterReason ||
          null,

        writerReason:
          writer.aiWriterReason ||
          writer.reason ||
          null,

        writerSource:
          writer.aiWriterSource ||
          writer.source ||
          "ari-ai-writer",

        writerVersion:
          writer.aiWriterVersion ||
          writer.version ||
          null,

        fallbackReason:
          writer
            .aiWriterFallbackReason ||
          null,

        canonicalResponsePlanUsed:
          writer
            .canonicalResponsePlanUsed ===
            true ||
          candidate?.evidence
            ?.canonicalResponsePlanUsed ===
            true,

        responseMovesSatisfied:
          writer
            .responseMovesSatisfied ===
            true ||
          candidate?.evidence
            ?.responseMovesSatisfied ===
            true ||
          validation
            ?.requiredMoveCoverage
            ?.complete ===
            true,

        groundedInCurrentFile:
          writer
            .groundedInCurrentFile ===
            true ||
          candidate?.evidence
            ?.groundedInCurrentFile ===
            true,

        candidatePreserved:
          validation
            ?.candidatePreserved ===
            true
      },

      raw:
        writer
    });
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
          [
            candidate.source ||
              "unknown",
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

      /*
       * Candidate status must be explicit.
       * Missing status is never interpreted as success.
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

      preferred:
        candidate.preferred ===
        true,

      grounded:
        candidate.grounded ===
        true,

      candidateType:
        candidate.candidateType ||
        null,

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

      seen.set(
        key,
        this.mergeEquivalentCandidates(
          seen.get(key),
          candidate
        )
      );
    });

    return [
      ...seen.values()
    ];
  },

  mergeEquivalentCandidates(
    first = {},
    second = {}
  ) {
    const firstLocked =
      first.evidence
        ?.responseLocked ===
      true;

    const secondLocked =
      second.evidence
        ?.responseLocked ===
      true;

    if (
      firstLocked &&
      !secondLocked
    ) {
      return first;
    }

    if (
      secondLocked &&
      !firstLocked
    ) {
      return second;
    }

    const preferred =
      second.priority >
      first.priority
        ? second
        : first;

    const secondary =
      preferred === first
        ? second
        : first;

    const mergedRequiresRepair =
      first.requiresAIRepair ===
        true ||
      second.requiresAIRepair ===
        true;

    /*
     * Equivalent text keeps the strictest status.
     * A duplicate path may not turn a rejected draft into
     * an accepted draft.
     */
    return {
      ...secondary,
      ...preferred,

      usable:
        first.usable ===
          true &&
        second.usable ===
          true,

      complete:
        first.complete ===
          true &&
        second.complete ===
          true,

      requiresAIRepair:
        mergedRequiresRepair,

      requiresRepair:
        mergedRequiresRepair,

      validation:
        preferred.validation ||
        secondary.validation ||
        null,

      evidence: {
        ...(
          secondary.evidence ||
          {}
        ),

        ...(
          preferred.evidence ||
          {}
        ),

        equivalentCandidateSources:
          this.uniqueStrings([
            first.source,
            second.source,
            ...this.toArray(
              first.evidence
                ?.equivalentCandidateSources
            ),
            ...this.toArray(
              second.evidence
                ?.equivalentCandidateSources
            )
          ])
      }
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

    const candidatePolicy =
      packet.candidatePolicy ||
      {};

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
              false &&
            move.userFacing !==
              false
        )
        .map(
          move =>
            move.id
        );

    const primary =
      this.normalizeIdentifier(
        summary
          .situationContractPrimary ||
        summary.primaryLane ||
        packet.primary ||
        responsePlan
          .primaryLane ||
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

    const developerLocked =
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

    const developerRelevant =
      packet.developerRelevant ===
        true ||
      packet.developer
        ?.relevant ===
        true ||
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

    const safetyStop =
      packet.safety
        ?.shouldStopNormalResponse ===
        true ||
      packet.safety
        ?.disposition
        ?.shouldStopNormalResponse ===
        true ||
      summary
        .safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      summary
        .safetyShouldStopNormalResponse ===
        true;

    return {
      currentText,

      normalizedText:
        this.normalize(
          currentText
        ),

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
          currentText
        ),

      directInformationRequest:
        this.isDirectInformationRequest(
          currentText
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
        ?.resolvedText ||
      packet.request
        ?.currentText ||
      packet.currentTurnText ||
      packet
        .resolvedUserQuestion ||
      packet.userQuestion ||
      summary
        .resolvedUserQuestion ||
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
            const id =
              this.normalizeIdentifier(
                move
              );

            return id
              ? {
                  id,
                  order:
                    index,
                  required:
                    true,
                  userFacing:
                    true
                }
              : null;
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
              false,

            userFacing:
              move.userFacing !==
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
    context = {}
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
      Boolean(
        text
      );

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
      text.length < 3
    ) {
      usable = false;
      score -= 100;

      rejectionReasons.push(
        "candidate_has_no_meaningful_content"
      );
    } else if (
      text.length < 12
    ) {
      score -= 12;

      penalties.push(
        "candidate_very_short"
      );
    }

    if (
      candidate.usable !==
      true
    ) {
      usable = false;
      score -= 40;

      penalties.push(
        "candidate_not_marked_usable"
      );

      rejectionReasons.push(
        "candidate_not_marked_usable"
      );
    }

    if (
      candidate
        .requiresAIRepair ===
        true
    ) {
      usable = false;
      score -= 50;

      penalties.push(
        "candidate_requires_ai_repair"
      );

      rejectionReasons.push(
        "candidate_still_requires_repair"
      );
    }

    if (
      candidate.complete !==
      true
    ) {
      score -= 20;

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
      score += 8;

      strengths.push(
        "candidate_complete"
      );
    }

    if (
      this.containsInternalPlannerLanguage(
        text
      )
    ) {
      usable = false;
      score -= 120;

      penalties.push(
        "internal_planner_language"
      );

      rejectionReasons.push(
        "internal_planner_language_exposed"
      );
    }

    if (
      this.containsWriterFailureMessage(
        text
      )
    ) {
      usable = false;
      score -= 120;

      penalties.push(
        "writer_failure_message"
      );

      rejectionReasons.push(
        "writer_failure_message_exposed"
      );
    }

    if (
      this.containsStaleDeveloperLanguage({
        text,
        context
      })
    ) {
      usable = false;
      score -= 120;

      penalties.push(
        "stale_developer_content"
      );

      rejectionReasons.push(
        "stale_developer_content_for_normal_conversation"
      );
    }

    const sourceEvaluation =
      this.evaluateBySource({
        candidate,
        context
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

        interactionQuestionCount,

        totalQuestionMarkCount:
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

  evaluateBySource({
    candidate = {},
    context = {}
  } = {}) {
    switch (
      candidate.source
    ) {
      case "blueprint_writer":
        return this
          .evaluateBlueprintCandidate({
            candidate,
            context
          });

      case "ai_writer":
        return this
          .evaluateAIWriterCandidate({
            candidate,
            context
          });

      case "developer_handoff":
        return this
          .evaluateDeveloperCandidate({
            candidate,
            context
          });

      case "character_reasoning":
        return this
          .evaluateCharacterCandidate({
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
     SOURCE EVALUATION
  ===================================================== */

  evaluateBlueprintCandidate({
    candidate = {},
    context = {}
  } = {}) {
    let usable =
      true;

    let scoreAdjustment =
      0;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    const evidence =
      candidate.evidence ||
      {};

    if (
      evidence
        .blueprintWriterUsable ===
        true &&
      candidate.usable ===
        true
    ) {
      scoreAdjustment += 12;

      strengths.push(
        "blueprint_writer_marked_usable"
      );
    } else {
      usable = false;
      scoreAdjustment -= 45;

      penalties.push(
        "blueprint_writer_marked_unusable"
      );

      rejectionReasons.push(
        "blueprint_writer_marked_unusable"
      );
    }

    if (
      evidence
        .blueprintWriterComplete ===
        true &&
      candidate.complete ===
        true
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
      evidence
        .blueprintWriterRequiresAIRepair ===
        true ||
      candidate
        .requiresAIRepair ===
        true
    ) {
      usable = false;
      scoreAdjustment -= 60;

      penalties.push(
        "blueprint_requires_ai_repair"
      );

      rejectionReasons.push(
        "blueprint_requires_ai_repair"
      );
    }

    const unsupportedRequired =
      this.requiredUnsupportedMoves(
        candidate
      );

    if (
      unsupportedRequired.length
    ) {
      usable = false;

      scoreAdjustment -=
        Math.min(
          60,
          unsupportedRequired.length *
            20
        );

      penalties.push(
        "required_response_moves_unsupported"
      );

      rejectionReasons.push(
        "required_response_moves_need_ai_repair"
      );
    }

    const renderedMoves =
      this.toArray(
        evidence
          .renderedResponseMoves
      );

    if (
      renderedMoves.length
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
        true &&
      context.responsePlanAvailable
    ) {
      usable = false;
      scoreAdjustment -= 25;

      penalties.push(
        "no_canonical_response_moves_rendered"
      );

      rejectionReasons.push(
        "no_canonical_response_moves_rendered"
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

  evaluateAIWriterCandidate({
    candidate = {},
    context = {}
  } = {}) {
    let usable =
      true;

    let scoreAdjustment =
      0;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    const evidence =
      candidate.evidence ||
      {};

    if (
      evidence
        .writerMarkedUsable ===
        true &&
      candidate.usable ===
        true
    ) {
      scoreAdjustment += 12;

      strengths.push(
        "ai_writer_marked_candidate_usable"
      );
    } else {
      usable = false;
      scoreAdjustment -= 55;

      penalties.push(
        "ai_writer_marked_candidate_unusable"
      );

      rejectionReasons.push(
        "ai_writer_marked_candidate_unusable"
      );
    }

    if (
      evidence
        .writerMarkedComplete ===
        true &&
      candidate.complete ===
        true
    ) {
      scoreAdjustment += 10;

      strengths.push(
        "ai_writer_marked_candidate_complete"
      );
    } else {
      scoreAdjustment -= 20;

      penalties.push(
        "ai_writer_marked_candidate_incomplete"
      );
    }

    if (
      evidence
        .writerRequiresRepair ===
        true ||
      candidate
        .requiresAIRepair ===
        true
    ) {
      usable = false;
      scoreAdjustment -= 60;

      penalties.push(
        "ai_writer_candidate_still_requires_repair"
      );

      rejectionReasons.push(
        "ai_writer_candidate_still_requires_repair"
      );
    }

    if (
      evidence.validated ===
        true &&
      candidate.validation
        ?.valid ===
        true
    ) {
      scoreAdjustment += 10;

      strengths.push(
        "ai_writer_validation_passed"
      );
    } else {
      scoreAdjustment -= 25;

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
      evidence
        .repairRequested ===
        true
    ) {
      scoreAdjustment += 12;

      strengths.push(
        "ai_writer_answered_repair_request"
      );
    }

    if (
      context.developerRelevant &&
      this.looksLikeCodeAnswer(
        candidate.text
      ) &&
      evidence
        .groundedInCurrentFile !==
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

  evaluateDeveloperCandidate({
    candidate = {},
    context = {}
  } = {}) {
    let usable =
      true;

    let scoreAdjustment =
      0;

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

    if (locked) {
      scoreAdjustment += 100;

      strengths.push(
        "developer_response_locked"
      );

      return {
        usable,
        scoreAdjustment,
        strengths,
        penalties,
        rejectionReasons
      };
    }

    if (!relevant) {
      usable = false;
      scoreAdjustment -= 120;

      penalties.push(
        "developer_candidate_not_relevant"
      );

      rejectionReasons.push(
        "developer_candidate_not_relevant"
      );
    }

    if (
      relevant &&
      candidate.evidence
        ?.groundedInCurrentFile ===
        true
    ) {
      scoreAdjustment += 25;

      strengths.push(
        "developer_candidate_grounded_in_current_file"
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

  evaluateCharacterCandidate({
    candidate = {},
    context = {}
  } = {}) {
    let usable =
      true;

    let scoreAdjustment =
      0;

    const strengths = [];
    const penalties = [];
    const rejectionReasons = [];

    if (
      context.characterQuestion
    ) {
      scoreAdjustment += 30;

      strengths.push(
        "character_candidate_matches_character_question"
      );
    } else {
      scoreAdjustment -= 12;

      penalties.push(
        "character_candidate_not_primary_match"
      );
    }

    if (
      candidate.grounded ===
        true ||
      candidate.evidence
        ?.characterGrounded ===
        true
    ) {
      scoreAdjustment += 12;

      strengths.push(
        "character_candidate_grounded"
      );
    }

    if (
      candidate.evidence
        ?.characterNeedsAIWriter ===
        true ||
      candidate
        .requiresAIRepair ===
        true
    ) {
      usable = false;
      scoreAdjustment -= 50;

      penalties.push(
        "character_candidate_requires_ai_realization"
      );

      rejectionReasons.push(
        "character_candidate_requires_ai_realization"
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
     PLAN COMPLIANCE
  ===================================================== */

  evaluatePlanCompliance({
    candidate = {},
    context = {}
  } = {}) {
    let usable =
      true;

    let scoreAdjustment =
      0;

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
      canonicalResponsePlanSatisfied =
        candidate.evidence
          ?.blueprintWriterUsable ===
          true &&
        candidate.evidence
          ?.blueprintWriterComplete ===
          true &&
        candidate.evidence
          ?.blueprintWriterRequiresAIRepair !==
          true &&
        this.requiredUnsupportedMoves(
          candidate
        ).length === 0;

      if (
        canonicalResponsePlanUsed
      ) {
        scoreAdjustment += 18;

        strengths.push(
          "canonical_response_plan_used"
        );
      }

      if (
        context
          .finalCandidateMustSatisfyPlan &&
        !canonicalResponsePlanSatisfied
      ) {
        usable = false;

        rejectionReasons.push(
          "canonical_response_plan_not_satisfied"
        );
      }
    } else if (
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

      canonicalResponsePlanSatisfied =
        explicitSatisfaction &&
        candidate.complete ===
          true &&
        candidate.usable ===
          true &&
        candidate.requiresAIRepair !==
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
        context
          .finalCandidateMustSatisfyPlan &&
        !canonicalResponsePlanSatisfied
      ) {
        usable = false;

        penalties.push(
          "ai_candidate_plan_satisfaction_not_confirmed"
        );

        rejectionReasons.push(
          "ai_candidate_plan_satisfaction_not_confirmed"
        );
      }
    } else if (
      candidate.source ===
        "developer_handoff" &&
      candidate.evidence
        ?.responseLocked ===
        true
    ) {
      canonicalResponsePlanSatisfied =
        true;
    } else {
      /*
       * Character and other deterministic candidates may
       * satisfy a simple plan when they are explicitly
       * registered as complete and usable.
       */
      canonicalResponsePlanSatisfied =
        candidate.complete ===
          true &&
        candidate.usable ===
          true &&
        candidate.requiresAIRepair !==
          true;
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

    let usable =
      true;

    let scoreAdjustment =
      0;

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
        "question_limit_exceeded"
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
    let scoreAdjustment =
      0;

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
     AI REQUIREMENT
  ===================================================== */

  determineAIRequirement({
    bestCandidate = null,
    evaluatedCandidates = [],
    context = {}
  } = {}) {
    if (
      context.developerLocked
    ) {
      return {
        required:
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
      context.aiWriterAllowed !==
      true
    ) {
      return {
        required:
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
        required:
          true,

        reason:
          this.resolveNoCandidateReason(
            evaluatedCandidates
          ),

        source:
          "no_usable_candidate",

        bestCandidateSource:
          null
      };
    }

    if (
      bestCandidate
        .requiresAIRepair ===
        true
    ) {
      return {
        required:
          true,

        reason:
          "candidate_requires_ai_repair",

        source:
          "candidate_requires_ai_repair",

        bestCandidateSource:
          bestCandidate.source
      };
    }

    if (
      bestCandidate.source ===
      "blueprint_writer"
    ) {
      if (
        bestCandidate.evidence
          ?.blueprintWriterUsable !==
        true
      ) {
        return {
          required:
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
          required:
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
          required:
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
          required:
            true,

          reason:
            "blueprint_candidate_score_below_preferred_threshold",

          source:
            "blueprint_quality_threshold",

          bestCandidateSource:
            bestCandidate.source
        };
      }
    }

    return {
      required:
        false,

      reason:
        null,

      source:
        "usable_candidate_available",

      bestCandidateSource:
        bestCandidate.source
    };
  },

  resolveNoCandidateReason(
    evaluatedCandidates = []
  ) {
    const rejectedBlueprint =
      this.toArray(
        evaluatedCandidates
      ).find(
        candidate =>
          candidate.source ===
          "blueprint_writer"
      );

    if (rejectedBlueprint) {
      return (
        rejectedBlueprint
          .rejectionReasons
          ?.[0] ||
        "blueprint_candidate_rejected"
      );
    }

    const rejectedCharacter =
      this.toArray(
        evaluatedCandidates
      ).find(
        candidate =>
          candidate.source ===
            "character_reasoning" &&
          candidate
            .requiresAIRepair ===
            true
      );

    if (rejectedCharacter) {
      return "character_candidate_requires_ai_realization";
    }

    return "no_usable_response_candidate";
  },

  /* =====================================================
     PRECHECK SELECTION
  ===================================================== */

  selectPrecheckCandidate({
    usableCandidates = [],
    context = {}
  } = {}) {
    const available =
      this.toArray(
        usableCandidates
      );

    if (!available.length) {
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

      if (locked) {
        return locked;
      }
    }

    const preferredCharacter =
      available.find(
        candidate =>
          candidate.source ===
            "character_reasoning" &&
          candidate.preferred ===
            true
      );

    if (
      context.characterQuestion &&
      preferredCharacter
    ) {
      return preferredCharacter;
    }

    const blueprint =
      available.find(
        candidate =>
          candidate.source ===
            "blueprint_writer" &&
          candidate.complete ===
            true &&
          candidate
            .requiresAIRepair !==
            true &&
          candidate.quality
            ?.canonicalResponsePlanSatisfied ===
            true
      );

    if (blueprint) {
      return blueprint;
    }

    return available[0];
  },

  /* =====================================================
     FINAL SELECTION
  ===================================================== */

  selectFinalCandidate({
    usableCandidates = [],
    evaluatedCandidates = [],
    context = {}
  } = {}) {
    const available =
      this.toArray(
        usableCandidates
      );

    if (!available.length) {
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

      if (locked) {
        return locked;
      }
    }

    const aiCandidate =
      available.find(
        candidate =>
          candidate.source ===
          "ai_writer"
      );

    const blueprintCandidate =
      available.find(
        candidate =>
          candidate.source ===
          "blueprint_writer"
      );

    const characterCandidate =
      available.find(
        candidate =>
          candidate.source ===
          "character_reasoning"
      );

    /*
     * A valid AI repair wins when repair was explicitly
     * requested and the repaired candidate satisfies the
     * canonical response contract.
     */
    if (
      aiCandidate &&
      aiCandidate.evidence
        ?.repairRequested ===
        true &&
      aiCandidate.complete ===
        true &&
      aiCandidate
        .requiresAIRepair !==
        true &&
      aiCandidate.quality
        ?.canonicalResponsePlanSatisfied ===
        true
    ) {
      const failedUpstreamCandidate =
        this.toArray(
          evaluatedCandidates
        ).some(
          candidate =>
            [
              "blueprint_writer",
              "character_reasoning"
            ].includes(
              candidate.source
            ) &&
            candidate.usable !==
              true
        );

      if (failedUpstreamCandidate) {
        return aiCandidate;
      }
    }

    /*
     * A complete deterministic Blueprint wins when no AI
     * repair was required.
     */
    if (
      blueprintCandidate &&
      blueprintCandidate.complete ===
        true &&
      blueprintCandidate
        .requiresAIRepair !==
        true &&
      blueprintCandidate.quality
        ?.canonicalResponsePlanSatisfied ===
        true
    ) {
      return blueprintCandidate;
    }

    /*
     * Focused Character answers may win Character questions
     * when explicitly registered as complete and usable.
     */
    if (
      context.characterQuestion &&
      characterCandidate &&
      characterCandidate.complete ===
        true &&
      characterCandidate
        .requiresAIRepair !==
        true
    ) {
      return characterCandidate;
    }

    /*
     * A valid AI candidate may answer when no complete
     * deterministic candidate is available.
     */
    if (
      aiCandidate &&
      aiCandidate.complete ===
        true &&
      aiCandidate
        .requiresAIRepair !==
        true &&
      aiCandidate.quality
        ?.canonicalResponsePlanSatisfied ===
        true
    ) {
      return aiCandidate;
    }

    return available[0];
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
     CONTENT CHECKS
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
      "follow the response plan",
      "the user is asking",
      "the writer should",
      "the composer should",
      "blueprint writer",
      "ai writer",
      "candidate arbiter",
      "response candidate arbiter",
      "response move",
      "response strategy",
      "response shape",
      "composer packet",
      "canonical response plan",
      "internal planner",
      "pipeline diagnostics"
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
      "the writer was unavailable",
      "no usable response candidate",
      "composer packet missing",
      "ai writer not loaded",
      "blueprint writer not loaded",
      "try once more and ill answer",
      "try once more and i ll answer",
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

    if (!normalized) {
      return false;
    }

    return !this
      .opensWithClarifyingQuestion(
        text
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
        String(
          text ||
          ""
        )
      );
  },

  isDirectInformationRequest(
    text = ""
  ) {
    const value =
      String(
        text ||
        ""
      ).trim();

    return (
      /\?$/.test(
        value
      ) ||
      /^(?:what|why|how|when|where|who|which|is|are|do|does|did|can|could|should|would|will|has|have)\b/i
        .test(
          value
        )
    );
  },

  /* =====================================================
     QUESTION DETECTION
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

    const quotedQuestion =
      /["“'][^"”']*\?[^"”']*["”']/u
        .test(
          value
        );

    const attributedQuestion =
      /\?\s*["”']?\s*(?:he|she|they|i|we|the\s+\w+|[A-Z][a-z]+)\s+(?:asked|said|whispered|shouted|replied|wondered|called|murmured)\b/u
        .test(
          value
        );

    return (
      quotedQuestion ||
      attributedQuestion
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
    value = ""
  ) {
    return (
      String(
        value ||
        ""
      ).match(
        /\?/g
      ) ||
      []
    ).length;
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getFinalAuthorityBoundaries() {
    return {
      canCollectRegisteredCandidates:
        true,

      canReadCanonicalAIWriterCandidate:
        true,

      canEvaluateCandidates:
        true,

      canRejectInvalidCandidates:
        true,

      canSelectPreferredDraft:
        true,

      canAuthorizeFinalCandidate:
        true,

      canRequestAIRepair:
        true,

      canSynthesizeCharacterCandidate:
        false,

      canSynthesizeBlueprintCandidate:
        false,

      canSynthesizeDeveloperCandidate:
        false,

      canGenerateCandidateText:
        false,

      canRewriteCandidate:
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
    };
  },

  getPrecheckAuthorityBoundaries() {
    return {
      canEvaluatePreAIWriterCandidates:
        true,

      canRequestAIWriter:
        true,

      canSelectFinalDraft:
        false,

      canGenerateCandidate:
        false,

      canRewriteCandidate:
        false,

      canChooseResponsePlan:
        false,

      canComposeFinalResponse:
        false,

      canPersistState:
        false,

      role:
        "pre_ai_writer_candidate_quality_gate"
    };
  },

  /* =====================================================
     UTILITIES
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

    if (!value) {
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
      const value
      of values
    ) {
      if (
        value !==
          undefined &&
        value !==
          null
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
  window.AriResponseCandidateArbiter
    ?.version
);