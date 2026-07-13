// ari/language/ari-language-composer-v9.js
// Ari Language Composer V9
//
// Purpose:
// Render the final user-facing response from the candidate selected by the
// Response Candidate Arbiter.
//
// V9.4.0 — Arbiter Authority / Thin Final Rendering / No Independent Selection
//
// Architectural flow:
//
// Canonical Response Plan
//      ↓
// Blueprint Writer / AI Writer
//      ↓
// Response Candidate Arbiter
//      ↓
// Ari Language Composer
//      ↓
// Final user-facing response
//
// Responsibilities:
// - Read the current-turn Composer Packet.
// - Read the candidate selected by the Response Candidate Arbiter.
// - Preserve the selected candidate text without independently rewriting it.
// - Preserve locked developer and safety authority only through authorized handoffs.
// - Return the stable final-response contract.
// - Return an honest fallback when no authorized selected draft exists.
//
// Non-responsibilities:
// - Does not interpret the user’s meaning.
// - Does not choose a response strategy.
// - Does not choose response moves.
// - Does not compare Blueprint and AI candidates.
// - Does not independently select a candidate.
// - Does not repair or rewrite a candidate.
// - Does not read GitHub evidence to create a response.
// - Does not create developer responses.
// - Does not create character responses.
// - Does not expose internal pipeline diagnostics to the user.
// - Does not persist state.

window.Ari = window.Ari || {};

window.AriLanguageComposerV9 = {
  version: "9.4.0",
  schemaVersion: "1.0.0",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  async compose(input = {}) {
    const summary = input.summary || input || {};
    const packet = input.composerPacket || summary.composerPacket || {};
    const request = this.readRequest({ input, summary, packet });
    const arbitration = this.readArbitration({ input, summary, packet });

    if (!packet || typeof packet !== "object" || packet.ready !== true) {
      return this.returnFinal({
        text: this.honestUnknownFallback(),
        validation: "composer_packet_missing_or_not_ready",
        request,
        packet,
        arbitration,
        selectedCandidate: null
      });
    }

    const lockedReply = this.readAuthorizedLockedReply({ packet, summary });

    if (lockedReply) {
      return this.returnFinal({
        text: lockedReply.text,
        validation: lockedReply.reason,
        request,
        packet,
        arbitration,
        selectedCandidate: {
          source: "developer_handoff",
          text: lockedReply.text,
          locked: true,
          authorized: true
        }
      });
    }

    const safetyReply = this.readAuthorizedSafetyReply({ packet, summary });

    if (safetyReply) {
      return this.returnFinal({
        text: safetyReply.text,
        validation: safetyReply.reason,
        request,
        packet,
        arbitration,
        selectedCandidate: {
          source: "safety_contract",
          text: safetyReply.text,
          safetyAuthorized: true,
          authorized: true
        }
      });
    }

    const selected = this.readSelectedCandidate({ input, summary, packet, arbitration, request });

    if (!selected.text) {
      return this.returnFinal({
        text: this.honestUnknownFallback(),
        validation: selected.reason || "arbiter_selected_candidate_missing",
        request,
        packet,
        arbitration,
        selectedCandidate: null
      });
    }

    return this.returnFinal({
      text: selected.text,
      validation: selected.reason,
      request,
      packet,
      arbitration,
      selectedCandidate: selected.candidate
    });
  },

  /* =====================================================
     REQUEST
  ===================================================== */

  readRequest({ input = {}, summary = {}, packet = {} } = {}) {
    const packetRequest = packet.request || {};

    const originalText = this.cleanOriginal(
      packetRequest.originalText ||
      packetRequest.currentText ||
      packet.currentTurnText ||
      packet.originalUserQuestion ||
      packet.userQuestion ||
      summary.originalUserMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      input.userQuestion ||
      input.message ||
      ""
    );

    const turnId =
      packetRequest.turnId ||
      packet.turnId ||
      packet.responsePlan?.turnId ||
      packet.canonicalResponsePlan?.turnId ||
      summary.currentTurnId ||
      summary.turnId ||
      input.turnId ||
      null;

    return {
      turnId,
      originalText,
      normalizedText: this.normalize(packetRequest.normalizedText || originalText),
      originalTextPreserved: packetRequest.originalTextPreserved !== false,
      textWasRewritten: packetRequest.textWasRewritten === true,
      authority: "composer_packet_current_turn"
    };
  },

  /* =====================================================
     ARBITRATION
  ===================================================== */

  readArbitration({ input = {}, summary = {}, packet = {} } = {}) {
    const raw =
      input.responseCandidateArbitration ||
      input.arbitration ||
      summary.responseCandidateArbitration ||
      summary.responseCandidateArbiter ||
      summary.responseCandidateArbiterResult ||
      packet.responseCandidateArbitration ||
      packet.responseCandidateArbiter ||
      null;

    if (!raw || typeof raw !== "object") {
      return {
        available: false,
        ready: false,
        selectedCandidate: null,
        selectedDraft: "",
        selectedSource: null,
        reason: "candidate_arbitration_missing",
        raw: null
      };
    }

    const selectedCandidate =
      raw.selectedCandidate && typeof raw.selectedCandidate === "object"
        ? raw.selectedCandidate
        : null;

    const selectedDraft = this.cleanOriginal(
      selectedCandidate?.text ||
      raw.selectedDraft ||
      raw.finalResponseCandidate ||
      ""
    );

    return {
      available: true,
      ready: raw.selectionReady === true || Boolean(selectedDraft),
      selectedCandidate,
      selectedDraft,
      selectedSource: selectedCandidate?.source || raw.selectedSource || raw.selectedDraftSource || null,
      reason: raw.selectedDraftReason || raw.reason || "arbiter_selected_candidate",
      canonicalResponsePlanUsed:
        raw.canonicalResponsePlanUsed === true ||
        selectedCandidate?.quality?.canonicalResponsePlanUsed === true,
      canonicalResponsePlanSatisfied:
        raw.canonicalResponsePlanSatisfied === true ||
        selectedCandidate?.quality?.canonicalResponsePlanSatisfied === true,
      selectedCandidateComplete:
        raw.selectedCandidateComplete === true ||
        selectedCandidate?.quality?.complete === true ||
        selectedCandidate?.complete === true,
      raw
    };
  },

  readSelectedCandidate({
    input = {},
    summary = {},
    packet = {},
    arbitration = {},
    request = {}
  } = {}) {
    if (arbitration.available && arbitration.ready && arbitration.selectedDraft) {
      const candidate = arbitration.selectedCandidate || {
        source: arbitration.selectedSource || "response_candidate_arbiter",
        text: arbitration.selectedDraft,
        complete: arbitration.selectedCandidateComplete,
        quality: {
          canonicalResponsePlanUsed: arbitration.canonicalResponsePlanUsed,
          canonicalResponsePlanSatisfied: arbitration.canonicalResponsePlanSatisfied
        }
      };

      const validation = this.validateSelectedCandidate({ candidate, text: arbitration.selectedDraft, request, packet });

      if (!validation.valid) {
        return {
          text: "",
          reason: validation.reason,
          candidate
        };
      }

      return {
        text: arbitration.selectedDraft,
        reason: `arbiter_selected_${this.normalizeIdentifier(candidate.source || arbitration.selectedSource || "candidate")}`,
        candidate
      };
    }

    /*
     * Compatibility path:
     * A selected draft may be passed directly only when it is explicitly
     * marked as having been selected by the Arbiter.
     */
    const directSelectionReady =
      input.selectionReady === true ||
      summary.selectionReady === true ||
      packet.selectionReady === true;

    const directDraft = this.cleanOriginal(
      input.selectedDraft ||
      input.finalResponseCandidate ||
      summary.selectedDraft ||
      summary.finalResponseCandidate ||
      packet.selectedDraft ||
      packet.finalResponseCandidate ||
      ""
    );

    if (!directSelectionReady || !directDraft) {
      return {
        text: "",
        reason: arbitration.available
          ? "arbiter_selection_not_ready"
          : "arbiter_selected_candidate_missing",
        candidate: null
      };
    }

    const directCandidate = {
      source:
        input.selectedSource ||
        input.selectedDraftSource ||
        summary.selectedSource ||
        summary.selectedDraftSource ||
        packet.selectedSource ||
        packet.selectedDraftSource ||
        "response_candidate_arbiter",

      text: directDraft,
      complete: true,
      authorized: true,
      compatibilitySelection: true
    };

    const validation = this.validateSelectedCandidate({
      candidate: directCandidate,
      text: directDraft,
      request,
      packet
    });

    if (!validation.valid) {
      return {
        text: "",
        reason: validation.reason,
        candidate: directCandidate
      };
    }

    return {
      text: directDraft,
      reason: `arbiter_selected_${this.normalizeIdentifier(directCandidate.source)}`,
      candidate: directCandidate
    };
  },

  /* =====================================================
     AUTHORIZED OVERRIDES
  ===================================================== */

  readAuthorizedLockedReply({ packet = {}, summary = {} } = {}) {
    const locked =
      packet.developerPacketLocked === true ||
      packet.developer?.locked === true ||
      summary.developerResponseLocked === true ||
      summary.responseLocked === true;

    if (!locked) return null;

    const text = this.cleanOriginal(
      packet.lockedDeveloperReply ||
      packet.developer?.lockedReply ||
      packet.developerPacket?.reply ||
      packet.developerPacket?.finalResponse ||
      packet.evidence?.developerReply ||
      summary.developerHandoff?.reply ||
      summary.developerHandoff?.finalResponse ||
      summary.developerReply ||
      summary.developerResponse ||
      ""
    );

    if (!text) return null;

    return {
      text,
      reason: "authorized_locked_developer_reply"
    };
  },

  readAuthorizedSafetyReply({ packet = {}, summary = {} } = {}) {
    const safety = packet.safety || {};
    const shouldStopNormalResponse =
      safety.shouldStopNormalResponse === true ||
      safety.gate?.shouldStopNormalResponse === true ||
      summary.safetyShouldStopNormalResponse === true ||
      summary.safetyDisposition?.shouldStopNormalResponse === true;

    if (!shouldStopNormalResponse) return null;

    const contract = safety.contract || summary.safetyResponseContract || {};
    const gate = safety.gate || summary.safetyContextGate || {};

    const text = this.cleanOriginal(
      gate.response ||
      gate.message ||
      contract.finalResponse ||
      contract.response ||
      contract.message ||
      ""
    );

    /*
     * The Composer does not invent a safety response. If the safety layer
     * stopped normal answering but supplied no authorized response, the
     * selected Arbiter candidate remains the required path.
     */
    if (!text) return null;

    return {
      text,
      reason: "authorized_safety_contract_response"
    };
  },

  /* =====================================================
     SELECTED-CANDIDATE VALIDATION
  ===================================================== */

  validateSelectedCandidate({
    candidate = {},
    text = "",
    request = {},
    packet = {}
  } = {}) {
    const draft = this.cleanOriginal(text);

    if (!draft) {
      return {
        valid: false,
        reason: "selected_candidate_empty"
      };
    }

    if (draft.length < 2) {
      return {
        valid: false,
        reason: "selected_candidate_has_no_meaningful_content"
      };
    }

    if (this.containsInternalPipelineLanguage(draft)) {
      return {
        valid: false,
        reason: "selected_candidate_contains_internal_pipeline_language"
      };
    }

    if (this.containsWriterFailureMessage(draft)) {
      return {
        valid: false,
        reason: "selected_candidate_contains_writer_failure_message"
      };
    }

    if (
      this.containsStaleDeveloperLanguage(draft) &&
      packet.developerRelevant !== true &&
      packet.developer?.relevant !== true
    ) {
      return {
        valid: false,
        reason: "selected_candidate_contains_stale_developer_language"
      };
    }

    const candidateTurnId =
      candidate.turnId ||
      candidate.evidence?.turnId ||
      candidate.raw?.turnId ||
      null;

    if (
      request.turnId &&
      candidateTurnId &&
      String(candidateTurnId) !== String(request.turnId)
    ) {
      return {
        valid: false,
        reason: "selected_candidate_turn_mismatch"
      };
    }

    const candidateQuestion = this.cleanOriginal(
      candidate.question ||
      candidate.sourceQuestion ||
      candidate.userQuestion ||
      candidate.evidence?.sourceQuestion ||
      candidate.raw?.sourceQuestion ||
      ""
    );

    if (
      request.originalText &&
      candidateQuestion &&
      this.normalize(candidateQuestion) !== this.normalize(request.originalText)
    ) {
      return {
        valid: false,
        reason: "selected_candidate_question_mismatch"
      };
    }

    return {
      valid: true,
      reason: "selected_candidate_valid"
    };
  },

  containsInternalPipelineLanguage(text = "") {
    const normalized = this.normalize(text);

    const phrases = [
      "according to the composer packet",
      "follow the response plan",
      "the writer should",
      "the composer should",
      "blueprint writer",
      "ai writer",
      "candidate arbiter",
      "response candidate arbiter",
      "internal planner",
      "response move",
      "response strategy",
      "response shape",
      "canonical response plan used",
      "render diagnostics",
      "pipeline diagnostics"
    ];

    return phrases.some(phrase => normalized.includes(phrase));
  },

  containsWriterFailureMessage(text = "") {
    const normalized = this.normalize(text);

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
      "i won t use stale developer evidence"
    ];

    return phrases.some(phrase => normalized.includes(phrase));
  },

  containsStaleDeveloperLanguage(text = "") {
    const normalized = this.normalize(text);

    return (
      /\b(?:github|repository|repo|codebase|loaded file|file evidence)\b/i.test(normalized) ||
      /\bi read\b.*\b(?:index html|style css|javascript|file|repo)\b/i.test(normalized)
    );
  },

  /* =====================================================
     FINAL RESPONSE
  ===================================================== */

  returnFinal({
    text = "",
    validation = "passed",
    request = {},
    packet = {},
    arbitration = {},
    selectedCandidate = null
  } = {}) {
    const finalText = this.cleanOriginal(text) || this.honestUnknownFallback();
    const selectedSource =
      selectedCandidate?.source ||
      arbitration.selectedSource ||
      null;

    const result = {
      schema: "ari_final_language_response",
      schemaVersion: this.schemaVersion,

      languageComposerRan: true,
      languageComposerVersion: this.version,
      languageComposerSource: "ari-language-composer-v9",

      languageMode:
        packet.primary ||
        packet.responseStrategy?.primaryLane ||
        packet.responsePlan?.strategy?.primaryLane ||
        "general_understanding",

      languageBody: finalText,
      languageSections: [finalText],
      finalResponse: finalText,

      composerVersion: this.version,
      source: "ari-language-composer-v9",

      composerUsedAI:
        selectedSource === "ai_writer" ||
        selectedCandidate?.evidence?.usedAI === true,

      composerValidation: validation,

      selectedCandidateSource: selectedSource,
      selectedCandidateId: selectedCandidate?.id || null,

      selectedCandidateWasArbiterAuthorized:
        Boolean(
          arbitration.available ||
          selectedCandidate?.authorized === true ||
          selectedCandidate?.locked === true ||
          selectedCandidate?.safetyAuthorized === true
        ),

      canonicalResponsePlanUsed:
        selectedCandidate?.quality?.canonicalResponsePlanUsed === true ||
        selectedCandidate?.evidence?.canonicalResponsePlanUsed === true ||
        arbitration.canonicalResponsePlanUsed === true,

      canonicalResponsePlanSatisfied:
        selectedCandidate?.quality?.canonicalResponsePlanSatisfied === true ||
        selectedCandidate?.evidence?.canonicalResponsePlanSatisfied === true ||
        arbitration.canonicalResponsePlanSatisfied === true,

      turnId: request.turnId || null,
      sourceQuestion: request.originalText || "",

      composerDebug: {
        usedPacket: Boolean(packet && typeof packet === "object"),
        thinComposer: true,
        arbiterAuthoritative: true,
        independentCandidateSelectionUsed: false,
        independentCandidateRepairUsed: false,
        independentDeveloperCompositionUsed: false,
        independentGithubCompositionUsed: false,
        independentCharacterCompositionUsed: false,
        originalTurnPreserved: request.originalTextPreserved !== false,
        textWasRewritten: request.textWasRewritten === true,
        arbitrationAvailable: arbitration.available === true,
        arbitrationReady: arbitration.ready === true,
        selectedCandidateSource: selectedSource,
        validation
      },

      authority: {
        canRenderSelectedCandidate: true,
        canPreserveLockedDeveloperReply: true,
        canPreserveAuthorizedSafetyReply: true,
        canReturnHonestFallback: true,

        canInterpretMeaning: false,
        canChooseResponsePlan: false,
        canChooseResponseMoves: false,
        canCompareCandidates: false,
        canSelectCandidate: false,
        canRepairCandidate: false,
        canGenerateDeveloperResponse: false,
        canGenerateGithubResponse: false,
        canGenerateCharacterResponse: false,
        canPersistState: false,

        role: "thin_final_selected_candidate_renderer"
      }
    };

    window.Ari.languageComposerState = result;

    return result;
  },

  honestUnknownFallback() {
    return "I know what you’re asking, but I don’t have a reliable answer ready. I’d rather be honest than make something up.";
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

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
    return this.cleanOriginal(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }
};

window.Ari.languageComposerV9 = window.AriLanguageComposerV9;
window.Ari.languageComposer = window.AriLanguageComposerV9;

console.log(
  "ARI LANGUAGE COMPOSER V9 LOADED:",
  window.AriLanguageComposerV9?.version
);