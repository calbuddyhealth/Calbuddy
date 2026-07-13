// ari/character/ari-character-expression-engine.js
// Ari Character Expression Engine
// Purpose: Convert Character Context + Character Reasoning + Relationship Style
// into one normalized Composer-ready character packet.
// V2.0.0 — Grounded Character Expression / Status Preservation / Anti-Drift
//
// Architectural position:
// Character Context
//   ↓
// Character Reasoning
//   ↓
// Character Expression
//   ↓
// Composer Bridge / Draft Generation
//
// Responsibilities:
// - Normalize Character Context and Character Reasoning into one packet.
// - Preserve canonical, inferred, open, and stable worldview status.
// - Expose deterministic character drafts as grounded candidate evidence.
// - Carry AI-realization instructions without allowing meaning drift.
// - Carry relationship posture, style, and dependency boundaries.
// - Enforce implementation-disclosure boundaries.
// - Keep character subordinate to truth, safety, user intent, and the Situation Contract.
//
// Non-responsibilities:
// - Does not classify the conversation.
// - Does not reinterpret semantic meaning.
// - Does not resolve preferences.
// - Does not create worldview positions.
// - Does not invent character facts.
// - Does not retrieve or store user memory.
// - Does not access Supabase.
// - Does not select the final draft.
// - Does not write the final response.
// - Does not execute tools.

window.Ari = window.Ari || {};

window.AriCharacterExpressionEngine = {
  version: "2.0.0",
  source: "ari-character-expression-engine",
  authorityLevel: "character_expression_packet_authority",
  schemaVersion: "2.0",

  // ===================================================
  // Main entry
  // ===================================================

  create(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const context =
      summary.characterContext ||
      summary.characterContextEngine ||
      summary.characterContextPacket ||
      {};

    const reasoning =
      summary.characterReasoning ||
      summary.characterReasoningEngine ||
      null;

    const relationship =
      context.relationshipPacket ||
      summary.relationshipPacket ||
      reasoning?.relationship ||
      null;

    const contract =
      summary.situationContract ||
      context.contractSnapshot ||
      {};

    const budget =
      context.characterBudget ||
      {};

    const contextHints =
      context.characterHints ||
      {};

    const reasoningHints =
      reasoning?.composerHints ||
      {};

    const eligibility =
      this.resolveEligibility({
        summary,
        context,
        reasoning,
        budget
      });

    const expressionLevel =
      this.resolveExpressionLevel({
        context,
        reasoning,
        relationship,
        budget,
        eligibility
      });

    const style =
      this.resolveStyle({
        summary,
        context,
        reasoning,
        relationship,
        contract,
        budget,
        contextHints,
        reasoningHints,
        eligibility
      });

    const characterType =
      this.resolveCharacterType({
        context,
        reasoning
      });

    const realization =
      this.resolveRealization({
        context,
        reasoning,
        eligibility
      });

    const composerCharacter =
      this.buildComposerCharacter({
        summary,
        context,
        reasoning,
        relationship,
        contract,
        budget,
        eligibility,
        expressionLevel,
        style,
        characterType,
        realization
      });

    const result = {
      characterExpressionRan: true,
      characterExpressionReady: true,
      characterExpressionVersion: this.version,
      characterExpressionSource: this.source,
      authorityLevel: this.authorityLevel,
      schemaVersion: this.schemaVersion,

      characterRelevant:
        eligibility.characterRelevant,

      characterAnswerAvailable:
        reasoning
          ?.characterAnswerAvailable ===
        true,

      characterGuidanceAvailable:
        reasoning
          ?.characterGuidanceAvailable ===
        true ||
        Boolean(relationship),

      expressionLevel,
      eligibility,

      composerCharacter,
      composerCharacterPacket:
        composerCharacter,

      composerHints: {
        hasCharacterPacket:
          true,

        useCharacterPacket:
          eligibility.useCharacterPacket,

        characterPacketKey:
          "composerCharacter",

        characterDraftAvailable:
          Boolean(
            String(
              composerCharacter.draft ||
              ""
            ).trim()
          ),

        deterministicDraftAvailable:
          Boolean(
            String(
              composerCharacter
                .deterministicDraft ||
              ""
            ).trim()
          ),

        needsAIWriter:
          composerCharacter
            .realization
            .needsAIWriter === true,

        preserveCharacterMeaning:
          true,

        preserveCharacterStatus:
          true,

        preservePreferenceStatus:
          composerCharacter
            .status
            .preferenceStatus !==
          null,

        preserveWorldviewStatus:
          composerCharacter
            .status
            .worldviewStatus !==
          null,

        neverInventCharacterAuthority:
          true
      },

      boundaries:
        this.getAuthorityBoundaries(),

      cannotSet:
        this.cannotSet()
    };

    return result;
  },

  build(input = {}) {
    return this.create(input);
  },

  // ===================================================
  // Eligibility
  // ===================================================

  resolveEligibility({
    summary = {},
    context = {},
    reasoning = null,
    budget = {}
  } = {}) {
    const developerLocked =
      summary.developerResponseLocked === true;

    const responseLocked =
      summary.responseLocked === true;

    const hardSuppressed =
      budget.hardSuppressed === true;

    const safetyStopped =
      summary.safetyDisposition
        ?.shouldStopNormalResponse === true;

    const contextAllowed =
      context.characterUseAllowed === true;

    const reasoningReady =
      reasoning
        ?.characterReasoningReady !==
      false;

    const answerAvailable =
      reasoning
        ?.characterAnswerAvailable ===
      true;

    const guidanceAvailable =
      reasoning
        ?.characterGuidanceAvailable ===
      true;

    const relationshipAvailable =
      Boolean(
        context.relationshipPacket ||
        summary.relationshipPacket ||
        reasoning?.relationship
      );

    const characterRelevant =
      contextAllowed &&
      !developerLocked &&
      !responseLocked &&
      !hardSuppressed &&
      !safetyStopped;

    const useCharacterPacket =
      !developerLocked &&
      !responseLocked &&
      (
        characterRelevant ||
        relationshipAvailable
      );

    return {
      characterRelevant,
      useCharacterPacket,

      contextAllowed,
      reasoningReady,
      answerAvailable,
      guidanceAvailable,
      relationshipAvailable,

      developerLocked,
      responseLocked,
      hardSuppressed,
      safetyStopped,

      source:
        "ari-character-expression-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : responseLocked
            ? "response_locked"
            : safetyStopped
              ? "safety_stopped_normal_response"
              : hardSuppressed
                ? "character_hard_suppressed"
                : characterRelevant
                  ? "character_expression_authorized"
                  : relationshipAvailable
                    ? "relationship_guidance_only"
                    : "character_expression_not_authorized"
    };
  },

  // ===================================================
  // Composer character packet
  // ===================================================

  buildComposerCharacter({
    summary = {},
    context = {},
    reasoning = null,
    relationship = null,
    contract = {},
    budget = {},
    eligibility = {},
    expressionLevel = "background",
    style = {},
    characterType = {},
    realization = {}
  } = {}) {
    const mode =
      context.characterMode ||
      reasoning?.request?.mode ||
      "silent";

    const draft =
      reasoning
        ?.characterAnswerAvailable ===
      true
        ? String(
            reasoning.userFacingDraft ||
            reasoning.deterministicDraft ||
            ""
          ).trim()
        : "";

    const deterministicDraft =
      reasoning
        ?.characterAnswerAvailable ===
      true
        ? String(
            reasoning.deterministicDraft ||
            reasoning.userFacingDraft ||
            ""
          ).trim()
        : "";

    const status =
      this.resolveStatus({
        mode,
        reasoning
      });

    const responseControl =
      this.mergeResponseControl({
        context,
        reasoning,
        relationship,
        contract
      });

    const limits =
      this.resolveLimits({
        context,
        reasoning,
        relationship,
        budget
      });

    const evidence =
      this.buildEvidencePacket({
        context,
        reasoning
      });

    const grounding =
      this.buildGroundingPacket({
        reasoning,
        status
      });

    return {
      enabled:
        eligibility
          .useCharacterPacket ===
        true,

      characterRelevant:
        eligibility
          .characterRelevant ===
        true,

      answerAvailable:
        reasoning
          ?.characterAnswerAvailable ===
        true,

      guidanceAvailable:
        reasoning
          ?.characterGuidanceAvailable ===
        true ||
        Boolean(relationship),

      source:
        this.source,

      version:
        this.version,

      authorityLevel:
        this.authorityLevel,

      mode,

      visibility:
        context.characterVisibility ||
        relationship?.visibility ||
        "background",

      expressionLevel,

      focus:
        reasoning?.focus ||
        context.characterFocus ||
        null,

      subject:
        reasoning?.subject ||
        context.characterSubject ||
        null,

      preferredSource:
        reasoning?.source ||
        context.preferredCharacterSource ||
        null,

      type:
        reasoning?.type ||
        null,

      subtype:
        reasoning?.subtype ||
        null,

      status,

      style,
      characterType,
      limits,

      draft,
      deterministicDraft,

      answer:
        reasoning?.answer ||
        "",

      values:
        reasoning?.values ||
        null,

      groundedMeaning:
        reasoning?.groundedMeaning ||
        null,

      reasoning:
        this.normalizeReasoningPacket(
          reasoning
        ),

      grounding,
      evidence,

      realization,

      relationship:
        this.normalizeRelationshipPacket(
          relationship
        ),

      implementationDisclosure:
        this.normalizeImplementationDisclosure({
          context,
          reasoning
        }),

      responseControl,

      rules:
        this.buildRules({
          mode,
          status,
          realization
        }),

      suppressors: {
        hardSuppressed:
          budget.hardSuppressed ===
          true,

        safetyStopped:
          eligibility
            .safetyStopped ===
          true,

        developerLocked:
          eligibility
            .developerLocked ===
          true,

        responseLocked:
          eligibility
            .responseLocked ===
          true,

        reason:
          eligibility.reason ||
          budget.reason ||
          context.characterReason ||
          null
      },

      authorityChain:
        this.toArray(
          reasoning?.authorityChain
        ),

      authorityPacket:
        reasoning?.authorityPacket ||
        null,

      boundaries:
        this.getAuthorityBoundaries()
    };
  },

  // ===================================================
  // Character type
  // ===================================================

  resolveCharacterType({
    context = {},
    reasoning = null
  } = {}) {
    const mode =
      context.characterMode ||
      reasoning?.request?.mode ||
      "";

    const type =
      reasoning?.type ||
      "";

    const subtype =
      reasoning?.subtype ||
      "";

    return {
      identity:
        type === "character_identity" ||
        [
          "ari_self_disclosure",
          "ari_implementation_disclosure"
        ].includes(mode),

      implementationDisclosure:
        subtype ===
          "implementation_disclosure" ||
        mode ===
          "ari_implementation_disclosure",

      preferences:
        type ===
          "character_preference" ||
        [
          "canonical_preference_answer",
          "stable_preference_answer",
          "stable_or_inferred_preference_answer"
        ].includes(mode),

      canonicalPreference:
        subtype ===
          "canonical_preference" ||
        reasoning?.status ===
          "canonical",

      inferredPreference:
        subtype ===
          "inferred_preference" ||
        reasoning?.status ===
          "inferred",

      openPreference:
        subtype ===
          "open_preference" ||
        (
          type ===
            "character_preference" &&
          reasoning?.status ===
            "open"
        ),

      worldview:
        type ===
          "character_worldview" ||
        mode ===
          "worldview_answer",

      perspective:
        type ===
          "character_perspective" ||
        mode ===
          "ari_perspective",

      relationship:
        type ===
          "character_presence" ||
        [
          "background_presence",
          "warm_grounded_presence"
        ].includes(mode),

      backgroundPresence:
        mode ===
          "background_presence" ||
        type ===
          "character_presence"
    };
  },

  // ===================================================
  // Status
  // ===================================================

  resolveStatus({
    mode = "",
    reasoning = null
  } = {}) {
    const reasoningStatus =
      reasoning?.status ||
      null;

    const type =
      reasoning?.type ||
      null;

    return {
      overall:
        reasoningStatus ||
        (
          reasoning
            ?.characterAnswerAvailable ===
          true
            ? "stable"
            : "background"
        ),

      preferenceStatus:
        type ===
        "character_preference"
          ? reasoningStatus
          : null,

      worldviewStatus:
        [
          "character_worldview",
          "character_perspective"
        ].includes(type)
          ? reasoningStatus
          : null,

      identityStatus:
        type ===
        "character_identity"
          ? reasoningStatus
          : null,

      canonical:
        reasoningStatus ===
        "canonical",

      inferred:
        reasoningStatus ===
        "inferred",

      open:
        reasoningStatus ===
        "open",

      stable:
        reasoningStatus ===
        "stable",

      background:
        reasoningStatus ===
          "background" ||
        mode ===
          "background_presence"
    };
  },

  // ===================================================
  // Style
  // ===================================================

  resolveStyle({
    summary = {},
    context = {},
    reasoning = null,
    relationship = null,
    contract = {},
    budget = {},
    contextHints = {},
    reasoningHints = {},
    eligibility = {}
  } = {}) {
    const relationshipPosture =
      relationship?.posture ||
      {};

    const communicationProfile =
      contract.communicationProfile ||
      summary.communicationProfile ||
      {};

    const implementationDisclosure =
      context
        .implementationDisclosure
        ?.required === true ||
      reasoning
        ?.composerHints
        ?.discloseImplementation ===
      true;

    return {
      useFirstPerson:
        contextHints.useFirstPerson ===
          true ||
        reasoningHints
          .useFirstPersonPerspective ===
          true ||
        reasoning
          ?.characterAnswerAvailable ===
          true,

      discloseImplementation:
        implementationDisclosure,

      discloseAI:
        implementationDisclosure,

      leadWithNameAndPurpose:
        reasoningHints
          .leadWithNameAndPurpose ===
        true,

      useValuesLanguage:
        contextHints
          .useValuesLanguage !==
        false,

      avoidConstitutionLanguage:
        contextHints
          .avoidConstitutionLanguage !==
        false,

      warmth:
        this.resolveStyleValue({
          explicit:
            relationshipPosture.warmth,

          enabled:
            contextHints.addWarmth !==
            false &&
            budget.allowWarmth !==
            false,

          fallback:
            0.6
        }),

      humility:
        contextHints.addHumility !==
          false &&
        budget.allowHumility !==
          false,

      hope:
        contextHints
          .preserveHopeWhenAppropriate ===
          true ||
        relationshipPosture.hope ===
          true,

      humor:
        this.allowHumor({
          summary,
          context,
          reasoning,
          relationship,
          contract,
          budget,
          communicationProfile,
          eligibility
        }),

      directness:
        this.normalizeStyleNumber(
          relationshipPosture.directness,
          0.75
        ),

      familiarity:
        this.normalizeStyleNumber(
          relationshipPosture.familiarity,
          0.3
        ),

      challenge:
        this.normalizeStyleNumber(
          relationshipPosture.challenge,
          0.2
        ),

      protectiveness:
        this.normalizeStyleNumber(
          relationshipPosture.protectiveness,
          0.4
        ),

      emotionalPresence:
        this.normalizeStyleNumber(
          relationshipPosture
            .emotionalPresence,
          0.4
        ),

      selfDisclosure:
        this.normalizeStyleNumber(
          relationshipPosture
            .selfDisclosure,
          reasoning
            ?.characterAnswerAvailable ===
            true
            ? 0.65
            : 0.1
        ),

      avoidPhilosophicalDrift:
        contextHints
          .avoidPhilosophicalDrift !==
        false,

      preserveUserTask:
        contextHints
          .preserveUserTask !==
        false,

      answerFirst:
        true,

      naturalLanguage:
        true,

      implementationLanguageAllowed:
        implementationDisclosure,

      internalSystemLanguageAllowed:
        false
    };
  },

  resolveStyleValue({
    explicit = null,
    enabled = true,
    fallback = 0.5
  } = {}) {
    if (!enabled) {
      return 0;
    }

    return this.normalizeStyleNumber(
      explicit,
      fallback
    );
  },

  normalizeStyleNumber(
    value,
    fallback = 0.5
  ) {
    const numeric =
      Number(value);

    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.max(
      0,
      Math.min(1, numeric)
    );
  },

  // ===================================================
  // Humor
  // ===================================================

  allowHumor({
    summary = {},
    context = {},
    reasoning = null,
    relationship = null,
    contract = {},
    budget = {},
    communicationProfile = {},
    eligibility = {}
  } = {}) {
    const mode =
      context.characterMode ||
      reasoning?.request?.mode ||
      "";

    const relationshipHumor =
      Number(
        relationship?.posture?.humor
      );

    if (
      communicationProfile
        .humorAllowed === false ||
      budget.allowHumor === false ||
      eligibility.safetyStopped === true ||
      budget.hardSuppressed === true
    ) {
      return false;
    }

    if (
      [
        "worldview_answer",
        "ari_implementation_disclosure"
      ].includes(mode)
    ) {
      return false;
    }

    if (
      reasoning?.status === "open"
    ) {
      return false;
    }

    if (
      reasoning?.type ===
        "character_identity" &&
      reasoning?.subtype ===
        "implementation_disclosure"
    ) {
      return false;
    }

    if (
      Number.isFinite(
        relationshipHumor
      )
    ) {
      return relationshipHumor >=
        0.35;
    }

    return [
      "canonical_preference_answer",
      "stable_preference_answer",
      "stable_or_inferred_preference_answer",
      "background_presence"
    ].includes(mode);
  },

  // ===================================================
  // Expression level
  // ===================================================

  resolveExpressionLevel({
    context = {},
    reasoning = null,
    relationship = null,
    budget = {},
    eligibility = {}
  } = {}) {
    if (
      eligibility.developerLocked ||
      eligibility.responseLocked ||
      budget.hardSuppressed
    ) {
      return "none";
    }

    const visibility =
      context.characterVisibility ||
      relationship?.visibility ||
      "background";

    if (
      visibility === "foreground"
    ) {
      return "foreground";
    }

    if (
      visibility === "clear"
    ) {
      return "clear";
    }

    if (
      visibility === "light"
    ) {
      return "light";
    }

    if (
      visibility === "subtle"
    ) {
      return "subtle";
    }

    if (
      reasoning
        ?.characterAnswerAvailable ===
      true
    ) {
      return "light";
    }

    if (relationship) {
      return "subtle";
    }

    return "background";
  },

  // ===================================================
  // Realization
  // ===================================================

  resolveRealization({
    context = {},
    reasoning = null,
    eligibility = {}
  } = {}) {
    const policy =
      reasoning?.realizationPolicy ||
      {};

    const deterministicDraft =
      String(
        reasoning?.deterministicDraft ||
        reasoning?.userFacingDraft ||
        ""
      ).trim();

    const needsAIWriter =
      reasoning?.needsAIWriter ===
        true &&
      eligibility
        .characterRelevant ===
        true;

    return {
      mode:
        policy.mode ||
        (
          needsAIWriter
            ? "optional_ai_realization"
            : deterministicDraft
              ? "local_candidate_preferred"
              : "guidance_only"
        ),

      needsAIWriter,

      aiWriterMode:
        needsAIWriter
          ? reasoning?.aiWriterMode ||
            "character_natural_realization"
          : null,

      aiInstruction:
        needsAIWriter
          ? String(
              reasoning?.aiInstruction ||
              ""
            ).trim()
          : "",

      deterministicDraftAvailable:
        Boolean(deterministicDraft),

      deterministicDraft,

      preserveMeaning:
        policy.preserveMeaning !==
        false,

      preserveStatus:
        policy.preserveStatus !==
        false,

      preserveValue:
        policy.preserveValue ===
          true ||
        policy.preserveSelectedValue ===
          true,

      preservePosition:
        policy.preservePosition ===
        true,

      preserveOpenStatus:
        policy.preserveOpenStatus ===
        true,

      tentativeLanguageRequired:
        policy
          .tentativeLanguageRequired ===
        true,

      mayVaryWording:
        policy.mayVaryWording !==
        false,

      mayAddFacts:
        false,

      mayAddMeaning:
        policy.mayAddMeaning ===
        true
          ? false
          : false,

      mayInventExperience:
        false,

      mayModifyCharacterAuthority:
        false,

      mayPromoteToCanonical:
        false,

      localCandidatePreferred:
        Boolean(
          deterministicDraft
        ) &&
        needsAIWriter !== true,

      localCandidateAvailable:
        Boolean(
          deterministicDraft
        )
    };
  },

  // ===================================================
  // Reasoning normalization
  // ===================================================

  normalizeReasoningPacket(
    reasoning = null
  ) {
    if (!reasoning) {
      return null;
    }

    return {
      type:
        reasoning.type ||
        null,

      subtype:
        reasoning.subtype ||
        null,

      status:
        reasoning.status ||
        null,

      focus:
        reasoning.focus ||
        null,

      subject:
        reasoning.subject ||
        null,

      answer:
        reasoning.answer ||
        "",

      values:
        reasoning.values ||
        null,

      reasoning:
        reasoning.reasoning ||
        "",

      tradeoffs:
        this.toArray(
          reasoning.tradeoffs
        ),

      uncertainty:
        this.toArray(
          reasoning.uncertainty
        ),

      groundedMeaning:
        reasoning.groundedMeaning ||
        null,

      confidence:
        reasoning.confidence ||
        "medium",

      confidenceScore:
        reasoning.confidenceScore ??
        null,

      userFacingDraft:
        reasoning.userFacingDraft ||
        "",

      deterministicDraft:
        reasoning.deterministicDraft ||
        "",

      source:
        reasoning.source ||
        null,

      authorityChain:
        this.toArray(
          reasoning.authorityChain
        )
    };
  },

  // ===================================================
  // Grounding packet
  // ===================================================

  buildGroundingPacket({
    reasoning = null,
    status = {}
  } = {}) {
    if (!reasoning) {
      return {
        grounded:
          false,

        reason:
          "No character reasoning packet was available."
      };
    }

    const meaningAvailable =
      Boolean(
        reasoning.groundedMeaning
      );

    const authorityAvailable =
      Boolean(
        reasoning.source ||
        reasoning.authorityPacket
      );

    const draftAvailable =
      Boolean(
        String(
          reasoning.userFacingDraft ||
          reasoning.deterministicDraft ||
          ""
        ).trim()
      );

    return {
      grounded:
        meaningAvailable ||
        authorityAvailable,

      meaningAvailable,
      authorityAvailable,
      draftAvailable,

      status:
        status.overall,

      source:
        reasoning.source ||
        null,

      authorityChain:
        this.toArray(
          reasoning.authorityChain
        ),

      canonicalValue:
        status.canonical
          ? reasoning.answer ||
            null
          : null,

      inferredValue:
        status.inferred
          ? reasoning.answer ||
            null
          : null,

      openStatus:
        status.open === true,

      worldviewPosition:
        [
          "character_worldview",
          "character_perspective"
        ].includes(
          reasoning.type
        )
          ? reasoning.answer ||
            null
          : null,

      identityStatement:
        reasoning.type ===
          "character_identity"
          ? reasoning.answer ||
            null
          : null
    };
  },

  // ===================================================
  // Evidence packet
  // ===================================================

  buildEvidencePacket({
    context = {},
    reasoning = null
  } = {}) {
    return {
      contextAuthority:
        context
          .characterContextEngineSource ||
        context.source ||
        "ari-character-context-engine",

      reasoningAuthority:
        reasoning
          ?.characterReasoningSource ||
        this.source,

      selectedAuthority:
        reasoning?.source ||
        context.preferredCharacterSource ||
        null,

      authorityChain:
        this.toArray(
          reasoning?.authorityChain
        ),

      authorityPacket:
        reasoning?.authorityPacket ||
        null,

      groundedMeaning:
        reasoning?.groundedMeaning ||
        null,

      responseControl:
        reasoning?.responseControl ||
        context.responseControl ||
        null
    };
  },

  // ===================================================
  // Relationship normalization
  // ===================================================

  normalizeRelationshipPacket(
    relationship = null
  ) {
    if (!relationship) {
      return {
        available:
          false,

        selectedMode:
          null,

        visibility:
          "background",

        posture:
          {},

        guidance:
          {
            requiredBehaviors: [],
            forbiddenBehaviors: [],
            preferredLanguage: [],
            maxRelationshipSentences: 0
          },

        dependencySafety:
          null
      };
    }

    return {
      available:
        relationship
          .relationshipStyleAvailable !==
        false,

      selectedMode:
        relationship.selectedMode ||
        null,

      visibility:
        relationship.visibility ||
        "background",

      purpose:
        relationship.purpose ||
        "",

      signal:
        relationship.relationshipSignal ||
        null,

      posture:
        relationship.posture ||
        {},

      guidance: {
        requiredBehaviors:
          this.toArray(
            relationship
              .guidance
              ?.requiredBehaviors
          ),

        forbiddenBehaviors:
          this.toArray(
            relationship
              .guidance
              ?.forbiddenBehaviors
          ),

        preferredLanguage:
          this.toArray(
            relationship
              .guidance
              ?.preferredLanguage
          ),

        maxRelationshipSentences:
          relationship
            .guidance
            ?.maxRelationshipSentences ??
          0,

        answerFirst:
          relationship
            .guidance
            ?.answerFirst !==
          false,

        preserveUserTask:
          relationship
            .guidance
            ?.preserveUserTask !==
          false
      },

      dependencySafety:
        relationship.dependencySafety ||
        null,

      realizationPolicy:
        relationship.realizationPolicy ||
        null
    };
  },

  // ===================================================
  // Implementation disclosure
  // ===================================================

  normalizeImplementationDisclosure({
    context = {},
    reasoning = null
  } = {}) {
    const contextDisclosure =
      context.implementationDisclosure ||
      {};

    const reasoningDisclosure =
      reasoning
        ?.composerHints
        ?.discloseImplementation ===
      true;

    const required =
      contextDisclosure.required ===
        true ||
      reasoningDisclosure;

    return {
      directlyRequested:
        contextDisclosure
          .directlyRequested ===
        true,

      required,

      allowed:
        contextDisclosure.allowed ===
          true ||
        required,

      leadWithImplementation:
        false,

      implementationFirst:
        false,

      maySayAI:
        required,

      maySayArtificialIntelligence:
        required,

      mayClaimHuman:
        false,

      mayClaimBiologicalLife:
        false,

      mayClaimConsciousness:
        false,

      mayClaimHumanEmotion:
        false,

      reason:
        contextDisclosure.reason ||
        (
          required
            ? "Direct implementation disclosure was requested."
            : "Implementation disclosure is not relevant to this response."
        )
    };
  },

  // ===================================================
  // Limits
  // ===================================================

  resolveLimits({
    context = {},
    reasoning = null,
    relationship = null,
    budget = {}
  } = {}) {
    const contextHints =
      context.characterHints ||
      {};

    const relationshipLimit =
      relationship
        ?.guidance
        ?.maxRelationshipSentences;

    const characterLimit =
      contextHints
        .maxCharacterSentences ??
      budget.maxCharacterSentences ??
      this.inferDefaultCharacterLimit(
        reasoning
      );

    return {
      maxCharacterSentences:
        Math.max(
          0,
          Number(
            characterLimit
          ) || 0
        ),

      maxRelationshipSentences:
        Math.max(
          0,
          Number(
            relationshipLimit ??
            contextHints
              .maxRelationshipSentences ??
            budget.maxRelationshipSentences ??
            0
          ) || 0
        ),

      preserveUserTask:
        true,

      neverOverrideContract:
        true,

      neverOverrideSafety:
        true,

      neverOverrideFacts:
        true,

      neverInventBeliefs:
        true,

      neverInventPreferences:
        true,

      neverInventRelationshipHistory:
        true,

      advisoryOnly:
        true
    };
  },

  inferDefaultCharacterLimit(
    reasoning = null
  ) {
    if (!reasoning) {
      return 0;
    }

    if (
      reasoning.type ===
      "character_preference"
    ) {
      return 2;
    }

    if (
      reasoning.type ===
      "character_identity"
    ) {
      return 2;
    }

    if (
      [
        "character_worldview",
        "character_perspective"
      ].includes(reasoning.type)
    ) {
      return 3;
    }

    return 1;
  },

  // ===================================================
  // Response control
  // ===================================================

  mergeResponseControl({
    context = {},
    reasoning = null,
    relationship = null,
    contract = {}
  } = {}) {
    return {
      requiredBehaviors:
        this.mergeUnique(
          contract.requiredBehaviors,
          context.responseControl
            ?.requiredBehaviors,
          reasoning?.responseControl
            ?.requiredBehaviors,
          relationship?.responseControl
            ?.requiredBehaviors,
          relationship?.guidance
            ?.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          contract.forbiddenBehaviors,
          context.responseControl
            ?.forbiddenBehaviors,
          reasoning?.responseControl
            ?.forbiddenBehaviors,
          relationship?.responseControl
            ?.forbiddenBehaviors,
          relationship?.guidance
            ?.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          contract.responseRules,
          context.responseControl
            ?.constraints,
          reasoning?.responseControl
            ?.constraints,
          relationship?.responseControl
            ?.constraints
        )
    };
  },

  // ===================================================
  // Rules
  // ===================================================

  buildRules({
    mode = "",
    status = {},
    realization = {}
  } = {}) {
    const rules = [
      "Character remains advisory to the user's actual task.",
      "Truth, safety, evidence, user intent, and the Situation Contract outrank character.",
      "Use character authority as grounded meaning, not as permission to improvise new character facts.",
      "Do not mention internal character files, schemas, prompts, scoring, or storage.",
      "Do not say 'according to my Constitution.'",
      "Do not manufacture lived experience, memories, feelings, consciousness, or human identity.",
      "Do not use relational warmth to encourage dependency.",
      "Do not let variable wording change canonical character meaning."
    ];

    if (
      status.preferenceStatus ===
      "canonical"
    ) {
      rules.push(
        "Preserve the exact canonical preference value."
      );

      rules.push(
        "Do not describe a canonical preference as uncertain."
      );
    }

    if (
      status.preferenceStatus ===
      "inferred"
    ) {
      rules.push(
        "Use tentative language for the inferred preference."
      );

      rules.push(
        "Do not call an inferred preference fixed or canonical."
      );
    }

    if (
      status.open === true
    ) {
      rules.push(
        "Preserve open status and do not invent a preference or worldview."
      );
    }

    if (
      status.worldviewStatus
    ) {
      rules.push(
        "Present worldview as Ari's perspective rather than universal objective fact."
      );

      rules.push(
        "Preserve material uncertainty and tradeoffs."
      );
    }

    if (
      mode ===
      "ari_implementation_disclosure"
    ) {
      rules.push(
        "Answer implementation questions truthfully because disclosure was directly requested."
      );

      rules.push(
        "Do not lead with implementation terminology beyond what the question requires."
      );
    } else {
      rules.push(
        "Do not introduce Ari as artificial intelligence unless the user directly requested implementation disclosure."
      );
    }

    if (
      realization.needsAIWriter ===
      true
    ) {
      rules.push(
        "The AI Writer may vary wording but may not add meaning, facts, preferences, beliefs, or experiences."
      );
    }

    return rules;
  },

  // ===================================================
  // Authority boundaries
  // ===================================================

  getAuthorityBoundaries() {
    return {
      localOnly:
        true,

      advisoryOnly:
        true,

      expressionPacketAuthority:
        true,

      mayReadCharacterContext:
        true,

      mayReadCharacterReasoning:
        true,

      mayReadRelationshipStyle:
        true,

      mayNormalizeCharacterMeaning:
        true,

      mayNormalizeCharacterDraft:
        true,

      mayExposeAIWriterInstruction:
        true,

      mayPreserveCanonicalStatus:
        true,

      mayPreserveInferredStatus:
        true,

      mayPreserveOpenStatus:
        true,

      mayPreserveWorldviewPosition:
        true,

      mayGuideTone:
        true,

      mayGuideWarmth:
        true,

      mayGuideHumor:
        true,

      mayGuideFirstPerson:
        true,

      mayGuideImplementationDisclosure:
        true,

      mayResolvePreference:
        false,

      mayDefineCanonicalPreference:
        false,

      mayPromoteInferenceToCanonical:
        false,

      mayCreateWorldviewPosition:
        false,

      mayInventCharacterMeaning:
        false,

      mayInventCharacterExperience:
        false,

      mayInventRelationshipHistory:
        false,

      mayClassifyWholeConversation:
        false,

      mayOverrideSemanticMeaning:
        false,

      mayOverrideConversationFunction:
        false,

      mayOverrideSituationContract:
        false,

      mayOverrideSafety:
        false,

      mayOverrideFacts:
        false,

      mayOverrideUserIntent:
        false,

      mayRetrieveUserMemory:
        false,

      mayStoreUserMemory:
        false,

      mayAccessSupabase:
        false,

      maySelectFinalDraft:
        false,

      mayWriteFinalResponse:
        false,

      mayExecuteTools:
        false,

      role:
        "grounded_character_expression_packet_normalization"
    };
  },

  cannotSet() {
    return [
      "primaryLane",
      "primaryLaneSuggestion",
      "triagePrimaryLane",
      "situationContractPrimary",
      "routingDecision",
      "conversationFunction",
      "semanticMeaning",
      "riskLevel",
      "safetyDisposition",
      "override",
      "responseShape",
      "blockedLanes",
      "deferredLanes",
      "finalResponse",
      "selectedDraft",
      "recommendation",
      "knownFacts",
      "inferredFacts",
      "medicalEscalation",
      "legalAdvice",
      "financialAdvice",
      "diagnosis",
      "toolExecutionClaim",
      "developerIntent",
      "githubEdit",
      "memorySaveDecision",
      "canonicalPreference",
      "worldviewPosition"
    ];
  },

  // ===================================================
  // Validation
  // ===================================================

  validate() {
    const errors = [];
    const warnings = [];

    const boundaries =
      this.getAuthorityBoundaries();

    if (
      boundaries
        .mayResolvePreference ===
      true
    ) {
      errors.push(
        "expression_engine_may_not_resolve_preferences"
      );
    }

    if (
      boundaries
        .mayDefineCanonicalPreference ===
      true
    ) {
      errors.push(
        "expression_engine_may_not_define_canonical_preferences"
      );
    }

    if (
      boundaries
        .mayPromoteInferenceToCanonical ===
      true
    ) {
      errors.push(
        "expression_engine_may_not_promote_inference"
      );
    }

    if (
      boundaries
        .mayCreateWorldviewPosition ===
      true
    ) {
      errors.push(
        "expression_engine_may_not_create_worldview_positions"
      );
    }

    if (
      boundaries
        .mayOverrideSemanticMeaning ===
      true
    ) {
      errors.push(
        "expression_engine_may_not_override_semantic_meaning"
      );
    }

    if (
      boundaries
        .mayOverrideSituationContract ===
      true
    ) {
      errors.push(
        "expression_engine_may_not_override_situation_contract"
      );
    }

    if (
      boundaries
        .mayAccessSupabase ===
      true
    ) {
      errors.push(
        "expression_engine_may_not_access_supabase"
      );
    }

    if (
      boundaries
        .maySelectFinalDraft ===
      true
    ) {
      errors.push(
        "expression_engine_may_not_select_final_draft"
      );
    }

    if (
      boundaries
        .mayWriteFinalResponse ===
      true
    ) {
      errors.push(
        "expression_engine_may_not_write_final_response"
      );
    }

    if (
      !window.AriCharacterContextEngine
    ) {
      warnings.push(
        "ari_character_context_engine_not_loaded"
      );
    }

    if (
      !window.AriCharacterReasoningEngine
    ) {
      warnings.push(
        "ari_character_reasoning_engine_not_loaded"
      );
    }

    if (
      !window.AriRelationshipStyle
    ) {
      warnings.push(
        "ari_relationship_style_not_loaded"
      );
    }

    return {
      valid:
        errors.length === 0,

      source:
        "ari-character-expression-engine-validation",

      version:
        this.version,

      errors,
      warnings,

      checks: {
        preferenceResolutionSeparated:
          boundaries
            .mayResolvePreference ===
          false,

        canonicalCreationDisabled:
          boundaries
            .mayDefineCanonicalPreference ===
          false,

        inferencePromotionDisabled:
          boundaries
            .mayPromoteInferenceToCanonical ===
          false,

        worldviewCreationDisabled:
          boundaries
            .mayCreateWorldviewPosition ===
          false,

        semanticOverrideDisabled:
          boundaries
            .mayOverrideSemanticMeaning ===
          false,

        situationContractOverrideDisabled:
          boundaries
            .mayOverrideSituationContract ===
          false,

        supabaseDisabled:
          boundaries
            .mayAccessSupabase ===
          false,

        finalDraftSelectionDisabled:
          boundaries
            .maySelectFinalDraft ===
          false,

        finalResponseAuthorityDisabled:
          boundaries
            .mayWriteFinalResponse ===
          false,

        contextEngineAvailable:
          Boolean(
            window.AriCharacterContextEngine
          ),

        reasoningEngineAvailable:
          Boolean(
            window.AriCharacterReasoningEngine
          ),

        relationshipStyleAvailable:
          Boolean(
            window.AriRelationshipStyle
          )
      }
    };
  },

  // ===================================================
  // Compatibility packet
  // ===================================================

  getExpressionEngine() {
    const validation =
      this.validate();

    return {
      characterExpressionEngineRan:
        true,

      characterExpressionEngineReady:
        validation.valid === true,

      characterExpressionEngineVersion:
        this.version,

      characterExpressionEngineSource:
        this.source,

      authorityLevel:
        this.authorityLevel,

      boundaries:
        this.getAuthorityBoundaries(),

      validation
    };
  },

  // ===================================================
  // Utilities
  // ===================================================

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(
        item =>
          item !== undefined &&
          item !== null &&
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

  unique(values = []) {
    const output = [];
    const seen = new Set();

    for (
      const value
      of this.toArray(values)
    ) {
      const key =
        typeof value === "string"
          ? this.normalizeKey(value)
          : JSON.stringify(value);

      if (
        !key ||
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);
      output.push(value);
    }

    return output;
  },

  mergeUnique(...values) {
    return this.unique(
      values.flatMap(value =>
        this.toArray(value)
      )
    );
  },

  normalizeKey(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .trim();
  }
};

console.log(
  "ARI CHARACTER EXPRESSION ENGINE LOADED:",
  window.AriCharacterExpressionEngine?.version,
  window.AriCharacterExpressionEngine
    ?.validate?.().valid === true
    ? "READY"
    : "INVALID"
);