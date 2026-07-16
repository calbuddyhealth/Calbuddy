// ari/character/ari-character-expression-engine.js
// Ari Character Expression Engine
//
// Purpose:
// Apply authorized Character presentation guidance to the focused output of
// Character Reasoning and return one normalized focused expression packet.
//
// V3.0.0 — Focused Character Expression / Reasoning Authority Preservation
//
// Architectural flow:
//
// Character Context
//      ↓
// Character Reasoning
//      ↓
// Character Expression Engine
//      ↓
// Focused Character Expression
//      ↓
// Character Stage
//      ↓
// Character Handoff
//
// Responsibilities:
// - Read the focused Character Context.
// - Read the focused Character Reasoning result.
// - Preserve Character Reasoning as the authority for answer meaning.
// - Preserve explicit Character status and grounding.
// - Preserve deterministic Character wording when available.
// - Preserve authorized AI-realization instructions.
// - Apply relationship, style, disclosure, and expression-budget guidance.
// - Merge authorized Character response controls.
// - Return one focused Character expression packet.
//
// Non-responsibilities:
// - Does not classify the conversation.
// - Does not reinterpret semantic meaning.
// - Does not change the Conversation Function.
// - Does not change the Situation Contract.
// - Does not determine safety severity.
// - Does not resolve preferences.
// - Does not create identity statements.
// - Does not create worldview positions.
// - Does not infer that a Character answer is grounded.
// - Does not promote inferred Character content to canonical status.
// - Does not create a new Character answer.
// - Does not rewrite Character meaning.
// - Does not create a Composer Packet.
// - Does not create response candidates.
// - Does not choose Blueprint Writer eligibility.
// - Does not activate the AI Writer.
// - Does not select the final draft.
// - Does not write the final response.
// - Does not retrieve or store user memory.
// - Does not access Supabase.
// - Does not execute tools.
// - Does not persist runtime state.

window.Ari = window.Ari || {};

window.AriCharacterExpressionEngine = {
  version: "3.0.0",
  schemaVersion: "3.0.0",
  source: "ari-character-expression-engine",
  authorityLevel: "focused_character_expression_authority",

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  create(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const context =
      this.readCharacterContext(
        summary
      );

    const reasoning =
      this.readCharacterReasoning(
        summary
      );

    const relationship =
      this.readRelationship({
        summary,
        context,
        reasoning
      });

    const situationContract =
      summary.situationContract ||
      summary.situationStagePacket
        ?.contract ||
      context.contractSnapshot ||
      {};

    const eligibility =
      this.resolveEligibility({
        summary,
        context,
        reasoning,
        relationship
      });

    const expressionLevel =
      this.resolveExpressionLevel({
        context,
        reasoning,
        relationship,
        eligibility
      });

    const realization =
      this.resolveRealization({
        reasoning,
        eligibility
      });

    const status =
      this.preserveStatus(
        reasoning.status,
        reasoning.type
      );

    const grounding =
      this.preserveGrounding(
        reasoning.grounding,
        status
      );

    const style =
      this.resolveStyle({
        summary,
        context,
        reasoning,
        relationship,
        situationContract,
        eligibility,
        expressionLevel
      });

    const responseControl =
      this.buildResponseControl({
        context,
        reasoning,
        relationship
      });

    const focusedCharacter =
      this.buildFocusedCharacterExpression({
        context,
        reasoning,
        relationship,
        eligibility,
        expressionLevel,
        realization,
        status,
        grounding,
        style,
        responseControl
      });

    return {
      schema:
        "ari_character_expression_result",

      schemaVersion:
        this.schemaVersion,

      characterExpressionRan:
        true,

      characterExpressionReady:
        focusedCharacter.ready ===
        true,

      characterExpressionVersion:
        this.version,

      characterExpressionSource:
        this.source,

      authorityLevel:
        this.authorityLevel,

      characterRelevant:
        focusedCharacter.relevant ===
        true,

      characterAnswerAvailable:
        focusedCharacter
          .answerAvailable ===
        true,

      characterGuidanceAvailable:
        focusedCharacter
          .guidanceAvailable ===
        true,

      expressionLevel,

      eligibility,

      focusedCharacter,

      responseControl,

      quality:
        this.buildQuality({
          focusedCharacter,
          reasoning,
          eligibility
        }),

      boundaries:
        this.getAuthorityBoundaries(),

      cannotSet:
        this.cannotSet()
    };
  },

  build(input = {}) {
    return this.create(
      input
    );
  },

  /* =====================================================
     INPUT READING
  ===================================================== */

  readCharacterContext(
    summary = {}
  ) {
    const raw =
      summary.characterContext ||
      summary.characterContextEngine ||
      summary.characterContextPacket ||
      {};

    return {
      ready:
        raw.ready ===
          true ||
        raw.characterContextEngineReady ===
          true,

      ran:
        raw.ran ===
          true ||
        raw.characterContextEngineRan ===
          true,

      source:
        raw.source ||
        raw.characterContextEngineSource ||
        "unknown",

      useAllowed:
        raw.useAllowed ===
          true ||
        raw.characterUseAllowed ===
          true,

      relevant:
        raw.relevant ===
          true ||
        raw.characterRelevant ===
          true ||
        raw.characterUseAllowed ===
          true,

      guidanceRequested:
        raw.guidanceRequested ===
          true ||
        raw.characterGuidanceRequested ===
          true,

      mode:
        raw.mode ||
        raw.characterMode ||
        "silent",

      visibility:
        raw.visibility ||
        raw.characterVisibility ||
        "background",

      focus:
        raw.focus ||
        raw.characterFocus ||
        null,

      subject:
        raw.subject ||
        raw.characterSubject ||
        null,

      preferredSource:
        raw.preferredSource ||
        raw.preferredCharacterSource ||
        null,

      reason:
        raw.reason ||
        raw.characterReason ||
        null,

      hints:
        raw.hints ||
        raw.characterHints ||
        {},

      budget:
        this.normalizeBudget(
          raw.budget ||
          raw.characterBudget
        ),

      authorityRequest:
        raw.authorityRequest ||
        {},

      relationship:
        raw.relationship ||
        raw.relationshipPacket ||
        null,

      implementationDisclosure:
        raw.implementationDisclosure ||
        null,

      responseControl:
        this.normalizeResponseControl(
          raw.responseControl
        ),

      contractSnapshot:
        raw.contractSnapshot ||
        null,

      raw,

      authority:
        "character_context_input_only"
    };
  },

  readCharacterReasoning(
    summary = {}
  ) {
    const raw =
      summary.characterReasoning ||
      summary.characterReasoningEngine ||
      {};

    const answerAvailable =
      raw.answerAvailable ===
        true ||
      raw.characterAnswerAvailable ===
        true;

    const guidanceAvailable =
      raw.guidanceAvailable ===
        true ||
      raw.characterGuidanceAvailable ===
        true;

    const deterministicDraft =
      this.cleanText(
        raw.deterministicDraft ||
        raw.userFacingDraft ||
        raw.draft ||
        ""
      );

    const realization =
      raw.realization ||
      raw.realizationPolicy ||
      {
        needsAIWriter:
          raw.needsAIWriter,

        aiWriterMode:
          raw.aiWriterMode,

        aiInstruction:
          raw.aiInstruction
      };

    return {
      ready:
        raw.ready ===
          true ||
        raw.characterReasoningReady ===
          true,

      ran:
        raw.ran ===
          true ||
        raw.characterReasoningRan ===
          true,

      usable:
        raw.usable !==
        false,

      complete:
        raw.complete !==
        false,

      source:
        raw.source ||
        raw.characterReasoningSource ||
        "unknown",

      answerAvailable,

      guidanceAvailable,

      type:
        raw.type ||
        (
          answerAvailable
            ? "character_answer"
            : "no_character_answer"
        ),

      subtype:
        raw.subtype ||
        null,

      focus:
        raw.focus ||
        null,

      subject:
        raw.subject ||
        null,

      preferenceSubject:
        raw.preferenceSubject ||
        null,

      status:
        raw.status ||
        null,

      answer:
        raw.answer ||
        null,

      values:
        raw.values ||
        null,

      groundedMeaning:
        raw.groundedMeaning ||
        null,

      grounding:
        raw.grounding ||
        null,

      deterministicDraft,

      userFacingDraft:
        deterministicDraft,

      realization,

      needsAIWriter:
        raw.needsAIWriter ===
          true ||
        realization
          ?.needsAIWriter ===
          true,

      aiWriterMode:
        raw.aiWriterMode ||
        realization
          ?.aiWriterMode ||
        null,

      aiInstruction:
        this.cleanText(
          raw.aiInstruction ||
          realization
            ?.aiInstruction ||
          ""
        ),

      relationship:
        raw.relationship ||
        null,

      implementationDisclosure:
        raw.implementationDisclosure ||
        null,

      confidence:
        raw.confidence ||
        null,

      confidenceScore:
        raw.confidenceScore ??
        null,

      authorityChain:
        this.toArray(
          raw.authorityChain
        ),

      authorityPacket:
        raw.authorityPacket ||
        null,

      responseControl:
        this.normalizeResponseControl(
          raw.responseControl
        ),

      reason:
        raw.reason ||
        null,

      raw,

      authority:
        "character_reasoning_meaning_authority"
    };
  },

  readRelationship({
    summary = {},
    context = {},
    reasoning = {}
  } = {}) {
    return this.normalizeRelationshipPacket(
      context.relationship ||
      reasoning.relationship ||
      summary.relationshipPacket ||
      null
    );
  },

  /* =====================================================
     ELIGIBILITY
  ===================================================== */

  resolveEligibility({
    summary = {},
    context = {},
    reasoning = {},
    relationship = {}
  } = {}) {
    const developerLocked =
      summary.developerResponseLocked ===
      true;

    const responseLocked =
      summary.responseLocked ===
      true;

    const safetyStopped =
      summary.safetyDisposition
        ?.shouldStopNormalResponse ===
        true ||
      summary.safetyShouldStopNormalResponse ===
        true;

    const hardSuppressed =
      context.budget
        ?.hardSuppressed ===
      true;

    const contextAllowed =
      context.useAllowed ===
      true;

    const answerAvailable =
      reasoning.answerAvailable ===
      true;

    const guidanceAvailable =
      reasoning.guidanceAvailable ===
        true ||
      context.guidanceRequested ===
        true ||
      relationship.available ===
        true;

    const expressionAllowed =
      !developerLocked &&
      !responseLocked &&
      !safetyStopped &&
      !hardSuppressed &&
      (
        contextAllowed ||
        guidanceAvailable
      );

    const useFocusedCharacter =
      expressionAllowed &&
      (
        answerAvailable ||
        guidanceAvailable
      );

    return {
      expressionAllowed,

      useFocusedCharacter,

      contextAllowed,

      contextReady:
        context.ready ===
        true,

      reasoningReady:
        reasoning.ready ===
        true,

      answerAvailable,

      guidanceAvailable,

      relationshipAvailable:
        relationship.available ===
        true,

      developerLocked,

      responseLocked,

      safetyStopped,

      hardSuppressed,

      source:
        "ari-character-expression-eligibility",

      reason:
        developerLocked
          ? "developer_response_locked"
          : responseLocked
            ? "response_locked"
            : safetyStopped
              ? "safety_stopped_character_expression"
              : hardSuppressed
                ? "character_hard_suppressed"
                : useFocusedCharacter
                  ? "focused_character_expression_authorized"
                  : "no_focused_character_material"
    };
  },

  /* =====================================================
     FOCUSED EXPRESSION PACKET
  ===================================================== */

  buildFocusedCharacterExpression({
    context = {},
    reasoning = {},
    relationship = {},
    eligibility = {},
    expressionLevel = "background",
    realization = {},
    status = {},
    grounding = {},
    style = {},
    responseControl = {}
  } = {}) {
    const answerAvailable =
      reasoning.answerAvailable ===
      true;

    const guidanceAvailable =
      eligibility.guidanceAvailable ===
      true;

    /*
     * Character Expression may preserve or lightly format
     * deterministic wording, but it does not generate a new
     * answer when Character Reasoning did not provide one.
     */
    const deterministicDraft =
      answerAvailable
        ? this.cleanText(
            reasoning
              .deterministicDraft
          )
        : "";

    const draft =
      deterministicDraft;

    const grounded =
      grounding.grounded ===
      true;

    const candidateAvailable =
      answerAvailable &&
      grounded &&
      Boolean(
        deterministicDraft
      ) &&
      realization.needsAIWriter !==
        true;

    const ready =
      eligibility
        .useFocusedCharacter ===
        true &&
      (
        answerAvailable ||
        guidanceAvailable
      );

    return {
      schema:
        "ari_focused_character_expression",

      schemaVersion:
        this.schemaVersion,

      ready,

      available:
        Boolean(
          context.ran ||
          reasoning.ran
        ),

      enabled:
        eligibility.expressionAllowed ===
        true,

      relevant:
        eligibility
          .useFocusedCharacter ===
        true,

      answerAvailable,

      guidanceAvailable,

      candidateAvailable,

      candidatePreferred:
        candidateAvailable,

      complete:
        reasoning.complete ===
          true &&
        (
          !answerAvailable ||
          candidateAvailable ||
          realization.needsAIWriter ===
            true
        ),

      usable:
        reasoning.usable !==
          false,

      source:
        this.source,

      version:
        this.version,

      authorityLevel:
        this.authorityLevel,

      mode:
        context.mode ||
        "silent",

      visibility:
        context.visibility ||
        relationship.visibility ||
        "background",

      expressionLevel,

      focus:
        reasoning.focus ||
        context.focus ||
        null,

      subject:
        reasoning.subject ||
        context.subject ||
        null,

      preferenceSubject:
        reasoning.preferenceSubject ||
        null,

      preferredSource:
        reasoning.source ||
        context.preferredSource ||
        null,

      type:
        reasoning.type ||
        null,

      subtype:
        reasoning.subtype ||
        null,

      status,

      answer:
        reasoning.answer ||
        null,

      values:
        reasoning.values ||
        null,

      groundedMeaning:
        reasoning.groundedMeaning ||
        null,

      draft,

      deterministicDraft,

      grounding,

      realization,

      needsAIWriter:
        realization.needsAIWriter ===
        true,

      aiWriterMode:
        realization.aiWriterMode ||
        null,

      aiInstruction:
        realization.aiInstruction ||
        "",

      style,

      relationship,

      implementationDisclosure:
        this.resolveImplementationDisclosure({
          context,
          reasoning
        }),

      responseControl,

      limits:
        this.resolveLimits({
          context,
          reasoning,
          relationship
        }),

      rules:
        this.buildRules({
          context,
          reasoning,
          status,
          realization
        }),

      evidence:
        this.buildEvidence({
          context,
          reasoning,
          grounding
        }),

      authorityChain:
        reasoning.authorityChain ||
        [],

      authorityPacket:
        reasoning.authorityPacket ||
        null,

      restrictions: {
        mayAddFacts:
          false,

        mayAddMeaning:
          false,

        mayInventPreference:
          false,

        mayInventIdentity:
          false,

        mayInventWorldview:
          false,

        mayInventExperience:
          false,

        mayInferGrounding:
          false,

        mayPromoteToCanonical:
          false,

        mayModifyCharacterAuthority:
          false
      },

      suppressors: {
        hardSuppressed:
          eligibility.hardSuppressed ===
          true,

        safetyStopped:
          eligibility.safetyStopped ===
          true,

        developerLocked:
          eligibility.developerLocked ===
          true,

        responseLocked:
          eligibility.responseLocked ===
          true,

        reason:
          eligibility.reason ||
          context.reason ||
          null
      },

      authority:
        this.getFocusedExpressionAuthority()
    };
  },

  /* =====================================================
     STATUS PRESERVATION
  ===================================================== */

  preserveStatus(
    value = null,
    type = null
  ) {
    if (
      value &&
      typeof value ===
        "object"
    ) {
      const overall =
        value.overall ||
        value.preferenceStatus ||
        value.worldviewStatus ||
        value.identityStatus ||
        "background";

      return {
        ...value,

        overall,

        preferenceStatus:
          value.preferenceStatus ||
          (
            type ===
            "character_preference"
              ? overall
              : null
          ),

        worldviewStatus:
          value.worldviewStatus ||
          (
            [
              "character_worldview",
              "character_perspective"
            ].includes(type)
              ? overall
              : null
          ),

        identityStatus:
          value.identityStatus ||
          (
            type ===
            "character_identity"
              ? overall
              : null
          ),

        canonical:
          value.canonical ===
            true ||
          overall ===
            "canonical",

        inferred:
          value.inferred ===
            true ||
          overall ===
            "inferred",

        open:
          value.open ===
            true ||
          overall ===
            "open",

        stable:
          value.stable ===
            true ||
          overall ===
            "stable",

        background:
          value.background ===
            true ||
          overall ===
            "background"
      };
    }

    const overall =
      typeof value ===
        "string" &&
      value
        ? value
        : "background";

    return {
      overall,

      preferenceStatus:
        type ===
        "character_preference"
          ? overall
          : null,

      worldviewStatus:
        [
          "character_worldview",
          "character_perspective"
        ].includes(type)
          ? overall
          : null,

      identityStatus:
        type ===
        "character_identity"
          ? overall
          : null,

      canonical:
        overall ===
        "canonical",

      inferred:
        overall ===
        "inferred",

      open:
        overall ===
        "open",

      stable:
        overall ===
        "stable",

      background:
        overall ===
        "background"
    };
  },

  /* =====================================================
     GROUNDING PRESERVATION
  ===================================================== */

  preserveGrounding(
    grounding = null,
    status = {}
  ) {
    /*
     * Grounding must be explicitly declared by Character
     * Reasoning. The Expression Engine does not infer it
     * from source names, authority packets, or draft presence.
     */
    if (
      !grounding ||
      typeof grounding !==
        "object"
    ) {
      return {
        grounded:
          false,

        status:
          status.overall ||
          null,

        source:
          null,

        authorityChain:
          [],

        canonicalValue:
          null,

        inferredValue:
          null,

        openStatus:
          status.open ===
          true,

        worldviewPosition:
          null,

        identityStatement:
          null,

        reason:
          "explicit_reasoning_grounding_missing"
      };
    }

    return {
      ...grounding,

      grounded:
        grounding.grounded ===
        true,

      status:
        grounding.status ||
        status.overall ||
        null,

      source:
        grounding.source ||
        null,

      authorityChain:
        this.toArray(
          grounding.authorityChain
        ),

      canonicalValue:
        grounding.canonicalValue ||
        null,

      inferredValue:
        grounding.inferredValue ||
        null,

      openStatus:
        grounding.openStatus ===
          true ||
        status.open ===
          true,

      worldviewPosition:
        grounding.worldviewPosition ||
        null,

      identityStatement:
        grounding.identityStatement ||
        null,

      reason:
        grounding.reason ||
        (
          grounding.grounded ===
            true
            ? "explicit_reasoning_grounding_preserved"
            : "reasoning_did_not_confirm_grounding"
        )
    };
  },

  /* =====================================================
     REALIZATION
  ===================================================== */

  resolveRealization({
    reasoning = {},
    eligibility = {}
  } = {}) {
    const policy =
      reasoning.realization &&
      typeof reasoning.realization ===
        "object"
        ? reasoning.realization
        : {};

    const needsAIWriter =
      reasoning.needsAIWriter ===
        true &&
      eligibility.expressionAllowed ===
        true;

    return {
      ...policy,

      mode:
        policy.mode ||
        (
          needsAIWriter
            ? "optional_ai_realization"
            : reasoning
                .deterministicDraft
              ? "local_candidate_preferred"
              : "guidance_only"
        ),

      needsAIWriter,

      aiWriterMode:
        needsAIWriter
          ? (
              reasoning.aiWriterMode ||
              policy.aiWriterMode ||
              "character_natural_realization"
            )
          : null,

      aiInstruction:
        needsAIWriter
          ? this.cleanText(
              reasoning.aiInstruction ||
              policy.aiInstruction ||
              ""
            )
          : "",

      deterministicDraftAvailable:
        Boolean(
          reasoning
            .deterministicDraft
        ),

      preserveMeaning:
        policy.preserveMeaning !==
        false,

      preserveStatus:
        policy.preserveStatus !==
        false,

      preserveValue:
        policy.preserveValue ===
          true ||
        policy
          .preserveSelectedValue ===
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
        false,

      mayInventPreference:
        false,

      mayInventIdentity:
        false,

      mayInventWorldview:
        false,

      mayInventExperience:
        false,

      mayModifyCharacterAuthority:
        false,

      mayPromoteToCanonical:
        false
    };
  },

  /* =====================================================
     EXPRESSION LEVEL
  ===================================================== */

  resolveExpressionLevel({
    context = {},
    reasoning = {},
    relationship = {},
    eligibility = {}
  } = {}) {
    if (
      eligibility.expressionAllowed !==
        true ||
      eligibility.developerLocked ===
        true ||
      eligibility.responseLocked ===
        true ||
      eligibility.safetyStopped ===
        true ||
      eligibility.hardSuppressed ===
        true
    ) {
      return "none";
    }

    const visibility =
      context.visibility ||
      relationship.visibility ||
      "background";

    if (
      [
        "foreground",
        "clear",
        "light",
        "subtle",
        "background"
      ].includes(
        visibility
      )
    ) {
      return visibility;
    }

    if (
      reasoning.answerAvailable ===
      true
    ) {
      return "light";
    }

    if (
      relationship.available ===
      true
    ) {
      return "subtle";
    }

    return "background";
  },

  /* =====================================================
     STYLE
  ===================================================== */

  resolveStyle({
    summary = {},
    context = {},
    reasoning = {},
    relationship = {},
    situationContract = {},
    eligibility = {},
    expressionLevel = "background"
  } = {}) {
    const hints =
      context.hints ||
      {};

    const relationshipPosture =
      relationship.posture ||
      {};

    const communicationProfile =
      situationContract
        .communicationProfile ||
      summary.communicationProfile ||
      {};

    const disclosure =
      this.resolveImplementationDisclosure({
        context,
        reasoning
      });

    return {
      expressionLevel,

      useFirstPerson:
        hints.useFirstPerson ===
          true ||
        reasoning.answerAvailable ===
          true,

      answerFirst:
        hints.answerFirst !==
        false,

      naturalLanguage:
        true,

      useValuesLanguage:
        hints.useValuesLanguage !==
        false,

      avoidConstitutionLanguage:
        hints.avoidConstitutionLanguage !==
        false,

      avoidPhilosophicalDrift:
        hints.avoidPhilosophicalDrift !==
        false,

      preserveUserTask:
        hints.preserveUserTask !==
        false,

      discloseImplementation:
        disclosure.required ===
        true,

      discloseAI:
        disclosure.required ===
        true,

      implementationLanguageAllowed:
        disclosure.allowed ===
        true,

      internalSystemLanguageAllowed:
        false,

      warmth:
        this.resolveStyleNumber({
          explicit:
            relationshipPosture.warmth,

          enabled:
            eligibility.expressionAllowed ===
              true &&
            context.budget
              ?.allowWarmth !==
              false,

          fallback:
            0.6
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
          reasoning.answerAvailable ===
            true
            ? 0.65
            : 0.1
        ),

      humility:
        hints.addHumility !==
        false,

      hope:
        hints
          .preserveHopeWhenAppropriate ===
          true ||
        relationshipPosture.hope ===
          true,

      humor:
        this.allowHumor({
          context,
          reasoning,
          relationship,
          communicationProfile,
          eligibility
        })
    };
  },

  resolveStyleNumber({
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
    const number =
      Number(value);

    if (
      !Number.isFinite(
        number
      )
    ) {
      return fallback;
    }

    return Math.max(
      0,
      Math.min(
        1,
        number
      )
    );
  },

  allowHumor({
    context = {},
    reasoning = {},
    relationship = {},
    communicationProfile = {},
    eligibility = {}
  } = {}) {
    if (
      communicationProfile
        .humorAllowed ===
        false ||
      context.budget
        ?.allowHumor ===
        false ||
      eligibility.expressionAllowed !==
        true ||
      eligibility.safetyStopped ===
        true ||
      eligibility.hardSuppressed ===
        true
    ) {
      return false;
    }

    if (
      reasoning.status
        ?.open ===
        true ||
      reasoning.status ===
        "open"
    ) {
      return false;
    }

    if (
      reasoning.type ===
        "character_worldview" ||
      reasoning.type ===
        "character_perspective" ||
      reasoning.subtype ===
        "implementation_disclosure" ||
      context.mode ===
        "ari_implementation_disclosure"
    ) {
      return false;
    }

    const explicit =
      Number(
        relationship.posture
          ?.humor
      );

    if (
      Number.isFinite(
        explicit
      )
    ) {
      return explicit >=
        0.35;
    }

    return [
      "canonical_preference_answer",
      "stable_preference_answer",
      "stable_or_inferred_preference_answer",
      "background_presence"
    ].includes(
      context.mode
    );
  },

  /* =====================================================
     RELATIONSHIP
  ===================================================== */

  normalizeRelationshipPacket(
    relationship = null
  ) {
    if (
      !relationship ||
      typeof relationship !==
        "object"
    ) {
      return {
        available:
          false,

        selectedMode:
          null,

        visibility:
          "background",

        purpose:
          null,

        signal:
          null,

        posture:
          {},

        guidance: {
          requiredBehaviors:
            [],

          forbiddenBehaviors:
            [],

          constraints:
            [],

          preferredLanguage:
            [],

          maxRelationshipSentences:
            0,

          answerFirst:
            true,

          preserveUserTask:
            true
        },

        dependencySafety:
          null,

        realizationPolicy:
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
        null,

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

        constraints:
          this.toArray(
            relationship
              .guidance
              ?.constraints
          ),

        preferredLanguage:
          this.toArray(
            relationship
              .guidance
              ?.preferredLanguage
          ),

        maxRelationshipSentences:
          this.numberOr(
            relationship
              .guidance
              ?.maxRelationshipSentences,
            0
          ),

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

      responseControl:
        this.normalizeResponseControl(
          relationship.responseControl
        ),

      dependencySafety:
        relationship.dependencySafety ||
        null,

      realizationPolicy:
        relationship.realizationPolicy ||
        null
    };
  },

  /* =====================================================
     IMPLEMENTATION DISCLOSURE
  ===================================================== */

  resolveImplementationDisclosure({
    context = {},
    reasoning = {}
  } = {}) {
    const contextDisclosure =
      context.implementationDisclosure &&
      typeof context
        .implementationDisclosure ===
        "object"
        ? context
            .implementationDisclosure
        : {};

    const reasoningDisclosure =
      reasoning
        .implementationDisclosure &&
      typeof reasoning
        .implementationDisclosure ===
        "object"
        ? reasoning
            .implementationDisclosure
        : {};

    const directlyRequested =
      contextDisclosure
        .directlyRequested ===
        true ||
      reasoningDisclosure
        .directlyRequested ===
        true;

    const required =
      contextDisclosure.required ===
        true ||
      reasoningDisclosure.required ===
        true ||
      reasoning.subtype ===
        "implementation_disclosure" ||
      context.mode ===
        "ari_implementation_disclosure";

    return {
      directlyRequested,

      required,

      allowed:
        required ||
        contextDisclosure.allowed ===
          true ||
        reasoningDisclosure.allowed ===
          true,

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
        reasoningDisclosure.reason ||
        (
          required
            ? "implementation_disclosure_authorized"
            : "implementation_disclosure_not_relevant"
        )
    };
  },

  /* =====================================================
     RESPONSE CONTROL
  ===================================================== */

  buildResponseControl({
    context = {},
    reasoning = {},
    relationship = {}
  } = {}) {
    return {
      requiredBehaviors:
        this.mergeUnique(
          context.responseControl
            ?.requiredBehaviors,

          reasoning.responseControl
            ?.requiredBehaviors,

          relationship.responseControl
            ?.requiredBehaviors,

          relationship.guidance
            ?.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          context.responseControl
            ?.forbiddenBehaviors,

          reasoning.responseControl
            ?.forbiddenBehaviors,

          relationship.responseControl
            ?.forbiddenBehaviors,

          relationship.guidance
            ?.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          context.responseControl
            ?.constraints,

          reasoning.responseControl
            ?.constraints,

          relationship.responseControl
            ?.constraints,

          relationship.guidance
            ?.constraints
        ),

      rules:
        this.mergeUnique(
          context.responseControl
            ?.rules,

          reasoning.responseControl
            ?.rules,

          relationship.responseControl
            ?.rules
        )
    };
  },

  normalizeResponseControl(
    control = {}
  ) {
    return {
      requiredBehaviors:
        this.toArray(
          control
            ?.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.toArray(
          control
            ?.forbiddenBehaviors
        ),

      constraints:
        this.toArray(
          control?.constraints
        ),

      rules:
        this.toArray(
          control?.rules
        )
    };
  },

  /* =====================================================
     LIMITS
  ===================================================== */

  resolveLimits({
    context = {},
    reasoning = {},
    relationship = {}
  } = {}) {
    const characterLimit =
      context.hints
        ?.maxCharacterSentences ??
      context.budget
        ?.maxCharacterSentences ??
      this.inferDefaultCharacterLimit(
        reasoning
      );

    const relationshipLimit =
      relationship.guidance
        ?.maxRelationshipSentences ??
      context.hints
        ?.maxRelationshipSentences ??
      context.budget
        ?.maxRelationshipSentences ??
      0;

    return {
      maxCharacterSentences:
        Math.max(
          0,
          this.numberOr(
            characterLimit,
            0
          )
        ),

      maxRelationshipSentences:
        Math.max(
          0,
          this.numberOr(
            relationshipLimit,
            0
          )
        ),

      preserveUserTask:
        true,

      neverOverrideResponsePlan:
        true,

      neverOverrideSituationContract:
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
    reasoning = {}
  ) {
    if (
      reasoning.answerAvailable !==
      true
    ) {
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
      ].includes(
        reasoning.type
      )
    ) {
      return 3;
    }

    return 1;
  },

  normalizeBudget(
    budget = {}
  ) {
    return {
      hardSuppressed:
        budget
          ?.hardSuppressed ===
        true,

      allowPresenceOnly:
        budget
          ?.allowPresenceOnly ===
        true,

      allowWarmth:
        budget?.allowWarmth !==
        false,

      allowHumor:
        budget?.allowHumor !==
        false,

      allowHumility:
        budget?.allowHumility !==
        false,

      maxCharacterSentences:
        this.numberOr(
          budget
            ?.maxCharacterSentences,
          0
        ),

      maxRelationshipSentences:
        this.numberOr(
          budget
            ?.maxRelationshipSentences,
          0
        ),

      reason:
        budget?.reason ||
        null
    };
  },

  /* =====================================================
     RULES
  ===================================================== */

  buildRules({
    context = {},
    reasoning = {},
    status = {},
    realization = {}
  } = {}) {
    const rules = [
      "Preserve the focused Character Reasoning answer.",
      "Do not add new Character meaning.",
      "Do not add unsupported Character facts.",
      "Do not infer that Character evidence is grounded.",
      "Do not mention internal Character files, schemas, scores, prompts, or storage.",
      "Do not say 'according to my Constitution.'",
      "Do not manufacture lived experience, memory, consciousness, biological life, or human identity.",
      "Do not use relational warmth to encourage dependency.",
      "Truth, safety, evidence, user intent, and the canonical Response Plan outrank Character presentation.",
      "Wording variation may not alter status, meaning, selected value, or worldview position."
    ];

    if (
      status.preferenceStatus ===
      "canonical"
    ) {
      rules.push(
        "Preserve the canonical preference value exactly in meaning."
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
        "Do not describe the inferred preference as fixed or canonical."
      );
    }

    if (
      status.open ===
      true
    ) {
      rules.push(
        "Preserve open status."
      );

      rules.push(
        "Do not invent a preference, identity position, or worldview."
      );
    }

    if (
      status.worldviewStatus
    ) {
      rules.push(
        "Present the worldview as Ari's grounded perspective, not universal objective fact."
      );

      rules.push(
        "Preserve material uncertainty and tradeoffs."
      );
    }

    if (
      context.mode ===
      "ari_implementation_disclosure"
    ) {
      rules.push(
        "Answer the authorized implementation question truthfully."
      );

      rules.push(
        "Use only as much implementation terminology as the request requires."
      );
    } else {
      rules.push(
        "Do not introduce implementation details unless disclosure was authorized."
      );
    }

    if (
      realization.needsAIWriter ===
      true
    ) {
      rules.push(
        "The AI Writer may vary wording but may not add meaning, facts, preferences, identity claims, beliefs, or experiences."
      );
    }

    return rules;
  },

  /* =====================================================
     EVIDENCE
  ===================================================== */

  buildEvidence({
    context = {},
    reasoning = {},
    grounding = {}
  } = {}) {
    return {
      contextSource:
        context.source ||
        null,

      reasoningSource:
        reasoning.source ||
        null,

      selectedAuthority:
        grounding.source ||
        reasoning.source ||
        context.preferredSource ||
        null,

      authorityChain:
        reasoning.authorityChain ||
        [],

      authorityPacket:
        reasoning.authorityPacket ||
        null,

      groundingExplicit:
        reasoning.grounding &&
        typeof reasoning.grounding ===
          "object",

      grounded:
        grounding.grounded ===
        true,

      groundedMeaning:
        reasoning.groundedMeaning ||
        null,

      answerProvidedByReasoning:
        reasoning.answerAvailable ===
        true,

      deterministicDraftProvidedByReasoning:
        Boolean(
          reasoning
            .deterministicDraft
        ),

      statusProvidedByReasoning:
        Boolean(
          reasoning.status
        ),

      realizationProvidedByReasoning:
        Boolean(
          reasoning.realization
        )
    };
  },

  /* =====================================================
     QUALITY
  ===================================================== */

  buildQuality({
    focusedCharacter = {},
    reasoning = {},
    eligibility = {}
  } = {}) {
    return {
      focusedExpressionProduced:
        focusedCharacter.schema ===
        "ari_focused_character_expression",

      answerMeaningPreserved:
        focusedCharacter.answer ===
        reasoning.answer,

      deterministicDraftPreserved:
        focusedCharacter
          .deterministicDraft ===
        (
          reasoning.answerAvailable ===
            true
            ? reasoning
                .deterministicDraft
            : ""
        ),

      explicitGroundingRequired:
        true,

      answerGrounded:
        focusedCharacter
          .answerAvailable !==
          true ||
        focusedCharacter
          .grounding
          ?.grounded ===
          true,

      ungroundedAnswerDoesNotBecomeCandidate:
        focusedCharacter
          .answerAvailable !==
          true ||
        focusedCharacter
          .grounding
          ?.grounded ===
          true ||
        focusedCharacter
          .candidateAvailable !==
          true,

      statusPreserved:
        focusedCharacter
          .answerAvailable !==
          true ||
        Boolean(
          focusedCharacter.status
        ),

      aiRealizationPreserved:
        focusedCharacter
          .needsAIWriter !==
          true ||
        Boolean(
          focusedCharacter
            .aiWriterMode ||
          focusedCharacter
            .aiInstruction
        ),

      noIndependentCharacterAnswerGenerated:
        true,

      noComposerCharacterPacketGenerated:
        true,

      noResponseCandidateRegistered:
        true,

      noFinalResponseGenerated:
        true,

      expressionAllowed:
        eligibility.expressionAllowed ===
        true
    };
  },

  /* =====================================================
     AUTHORITY
  ===================================================== */

  getFocusedExpressionAuthority() {
    return {
      canPreserveReasoningAnswer:
        true,

      canPreserveDeterministicDraft:
        true,

      canPreserveStatus:
        true,

      canPreserveExplicitGrounding:
        true,

      canPreserveRealizationPolicy:
        true,

      canApplyAuthorizedStyle:
        true,

      canApplyRelationshipGuidance:
        true,

      canMergeCharacterResponseControls:
        true,

      canCreateCharacterAnswer:
        false,

      canInferGrounding:
        false,

      canResolvePreference:
        false,

      canCreateIdentity:
        false,

      canCreateWorldview:
        false,

      canRegisterCandidate:
        false,

      canWriteFinalResponse:
        false,

      role:
        "focused_character_expression_only"
    };
  },

  getAuthorityBoundaries() {
    return {
      localOnly:
        true,

      advisoryOnly:
        true,

      focusedExpressionAuthority:
        true,

      canReadCharacterContext:
        true,

      canReadCharacterReasoning:
        true,

      canReadRelationshipGuidance:
        true,

      canPreserveCharacterMeaning:
        true,

      canPreserveCharacterDraft:
        true,

      canPreserveCanonicalStatus:
        true,

      canPreserveInferredStatus:
        true,

      canPreserveOpenStatus:
        true,

      canPreserveWorldviewStatus:
        true,

      canPreserveExplicitGrounding:
        true,

      canPreserveAIWriterInstruction:
        true,

      canGuideTone:
        true,

      canGuideWarmth:
        true,

      canGuideHumor:
        true,

      canGuideFirstPerson:
        true,

      canGuideImplementationDisclosure:
        true,

      canResolvePreference:
        false,

      canDefineCanonicalPreference:
        false,

      canPromoteInferenceToCanonical:
        false,

      canCreateCharacterIdentity:
        false,

      canCreateWorldviewPosition:
        false,

      canInventCharacterMeaning:
        false,

      canInventCharacterExperience:
        false,

      canInventRelationshipHistory:
        false,

      canInferGrounding:
        false,

      canClassifyConversation:
        false,

      canOverrideSemanticMeaning:
        false,

      canOverrideConversationFunction:
        false,

      canOverrideSituationContract:
        false,

      canOverrideSafety:
        false,

      canOverrideFacts:
        false,

      canOverrideUserIntent:
        false,

      canCreateResponsePlan:
        false,

      canCreateComposerPacket:
        false,

      canRegisterResponseCandidate:
        false,

      canDetermineBlueprintEligibility:
        false,

      canDetermineAIWriterActivation:
        false,

      canSelectFinalDraft:
        false,

      canWriteFinalResponse:
        false,

      canRetrieveUserMemory:
        false,

      canStoreUserMemory:
        false,

      canAccessSupabase:
        false,

      canExecuteTools:
        false,

      canPersistState:
        false,

      role:
        "focused_character_expression_normalization"
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
      "responseGoal",
      "responseShape",
      "responseMoves",
      "canonicalResponsePlan",
      "composerPacket",
      "candidateDrafts",
      "selectedDraft",
      "finalResponse",
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
      "characterIdentity",
      "worldviewPosition"
    ];
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const boundaries =
      this.getAuthorityBoundaries();

    const forbiddenTrue = [
      "canResolvePreference",
      "canDefineCanonicalPreference",
      "canPromoteInferenceToCanonical",
      "canCreateCharacterIdentity",
      "canCreateWorldviewPosition",
      "canInventCharacterMeaning",
      "canInventCharacterExperience",
      "canInventRelationshipHistory",
      "canInferGrounding",
      "canClassifyConversation",
      "canOverrideSemanticMeaning",
      "canOverrideConversationFunction",
      "canOverrideSituationContract",
      "canOverrideSafety",
      "canOverrideFacts",
      "canOverrideUserIntent",
      "canCreateResponsePlan",
      "canCreateComposerPacket",
      "canRegisterResponseCandidate",
      "canDetermineBlueprintEligibility",
      "canDetermineAIWriterActivation",
      "canSelectFinalDraft",
      "canWriteFinalResponse",
      "canRetrieveUserMemory",
      "canStoreUserMemory",
      "canAccessSupabase",
      "canExecuteTools",
      "canPersistState"
    ];

    const errors =
      forbiddenTrue
        .filter(
          key =>
            boundaries[key] ===
            true
        )
        .map(
          key =>
            `${key}_must_be_false`
        );

    const warnings = [];

    if (
      !window
        .AriCharacterContextEngine
    ) {
      warnings.push(
        "ari_character_context_engine_not_loaded"
      );
    }

    if (
      !window
        .AriCharacterReasoningEngine
    ) {
      warnings.push(
        "ari_character_reasoning_engine_not_loaded"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      source:
        "ari-character-expression-engine-validation",

      version:
        this.version,

      errors,

      warnings,

      checks: {
        focusedExpressionOnly:
          true,

        composerCharacterRemoved:
          true,

        preferenceResolutionSeparated:
          boundaries
            .canResolvePreference ===
          false,

        canonicalCreationDisabled:
          boundaries
            .canDefineCanonicalPreference ===
          false,

        inferencePromotionDisabled:
          boundaries
            .canPromoteInferenceToCanonical ===
          false,

        groundingInferenceDisabled:
          boundaries
            .canInferGrounding ===
          false,

        worldviewCreationDisabled:
          boundaries
            .canCreateWorldviewPosition ===
          false,

        responsePlanAuthorityDisabled:
          boundaries
            .canCreateResponsePlan ===
          false,

        composerPacketAuthorityDisabled:
          boundaries
            .canCreateComposerPacket ===
          false,

        candidateRegistrationDisabled:
          boundaries
            .canRegisterResponseCandidate ===
          false,

        finalDraftSelectionDisabled:
          boundaries
            .canSelectFinalDraft ===
          false,

        finalResponseAuthorityDisabled:
          boundaries
            .canWriteFinalResponse ===
          false,

        supabaseDisabled:
          boundaries
            .canAccessSupabase ===
          false
      }
    };
  },

  /* =====================================================
     COMPATIBILITY INSPECTION
  ===================================================== */

  getExpressionEngine() {
    const validation =
      this.validate();

    return {
      characterExpressionEngineRan:
        true,

      characterExpressionEngineReady:
        validation.valid ===
        true,

      characterExpressionEngineVersion:
        this.version,

      characterExpressionEngineSource:
        this.source,

      authorityLevel:
        this.authorityLevel,

      outputKey:
        "focusedCharacter",

      legacyComposerCharacterOutput:
        false,

      boundaries:
        this.getAuthorityBoundaries(),

      validation
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

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
      Array.isArray(
        value
      )
    ) {
      return value.filter(
        item =>
          item !==
            undefined &&
          item !==
            null &&
          item !==
            ""
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

  mergeUnique(
    ...values
  ) {
    const output = [];
    const seen =
      new Set();

    values
      .flatMap(
        value =>
          this.toArray(
            value
          )
      )
      .forEach(
        value => {
          const key =
            typeof value ===
              "string"
              ? this
                  .normalizeForComparison(
                    value
                  )
              : this
                  .normalizeForComparison(
                    value?.id ||
                    value?.name ||
                    value?.type ||
                    value?.value ||
                    value?.claim ||
                    this.safeJSONStringify(
                      value
                    )
                  );

          if (
            !key ||
            seen.has(
              key
            )
          ) {
            return;
          }

          seen.add(
            key
          );

          output.push(
            value
          );
        }
      );

    return output;
  },

  safeJSONStringify(
    value = null
  ) {
    const seen =
      new WeakSet();

    try {
      return JSON.stringify(
        value,
        (
          key,
          nestedValue
        ) => {
          if (
            nestedValue &&
            typeof nestedValue ===
              "object"
          ) {
            if (
              seen.has(
                nestedValue
              )
            ) {
              return "[Circular]";
            }

            seen.add(
              nestedValue
            );
          }

          return nestedValue;
        }
      );
    } catch (error) {
      return "";
    }
  },

  cleanText(
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
        /[ \t]+/g,
        " "
      )
      .replace(
        /\n[ \t]+/g,
        "\n"
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();
  },

  normalizeForComparison(
    value = ""
  ) {
    return this.cleanText(
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
  }
};

console.log(
  "ARI CHARACTER EXPRESSION ENGINE LOADED:",
  window.AriCharacterExpressionEngine?.version,
  window.AriCharacterExpressionEngine
    ?.validate?.().valid ===
    true
    ? "READY"
    : "INVALID"
);