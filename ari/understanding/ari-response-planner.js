// ari/understanding/ari-response-planner.js
// Ari Response Planner
//
// Purpose:
// Convert authoritative routing, continuity, safety, situation, reasoning,
// memory, meaning, and human-state outputs into one canonical response plan.
//
// V2.1.0 — Post-Continuity Resolution Overlay / Resolved Turn Handoff
//
// Architecture:
//
// Perception
//      ↓
// Executive Routing
//      ↓
// Continuity / Safety / Situation / Understanding / Reasoning / Memory
//      ↓
// Ari Response Planner
//      ↓
// Canonical ari_response_plan
//      ↓
// Response Planning Stage
//      ↓
// Composer Bridge
//      ↓
// Blueprint Renderer / AI Language Enhancement / Candidate Validation
//
// Responsibilities:
// - Define one response strategy for the current turn.
// - Preserve the current-turn identity and original text.
// - Preserve upstream routing and semantic authority.
// - Convert human need and meaning into structured response moves.
// - Define advice, question, safety, and writing policies.
// - Validate blueprint and move identifiers.
// - Produce one canonical response-plan contract.
//
// Non-responsibilities:
// - Does not reinterpret the user's raw language.
// - Does not change the canonical semantic meaning.
// - Does not change conversation function.
// - Does not change official routing.
// - Does not change safety severity.
// - Does not retrieve continuity or memory.
// - Does not write final user-facing language.
// - Does not select the final response candidate.
// - Does not persist thread or memory state.

window.Ari = window.Ari || {};

window.AriResponsePlanner = {
  version: "2.1.0",
  schemaVersion: "2.0.0",

  /* =====================================================
     CANONICAL REGISTRIES
  ===================================================== */

  blueprintRegistry: {
    safety_urgent_support: {
      id:
        "safety_urgent_support",

      family:
        "safety",

      defaultShape:
        "urgent_short_direct",

      aiAllowed:
        false
    },

    medical_context_calm_guidance: {
      id:
        "medical_context_calm_guidance",

      family:
        "medical",

      defaultShape:
        "calm_guidance_with_thresholds",

      aiAllowed:
        true
    },

    positive_connection_reflection: {
      id:
        "positive_connection_reflection",

      family:
        "emotion",

      defaultShape:
        "brief_warm_reflection",

      aiAllowed:
        true
    },

    validation_before_coaching: {
      id:
        "validation_before_coaching",

      family:
        "emotion",

      defaultShape:
        "validate_then_permission_or_step",

      aiAllowed:
        true
    },

    relationship_repair_clarity: {
      id:
        "relationship_repair_clarity",

      family:
        "relationship",

      defaultShape:
        "reflect_pattern_then_repair_step",

      aiAllowed:
        true
    },

    emotion_presence_grounding: {
      id:
        "emotion_presence_grounding",

      family:
        "emotion",

      defaultShape:
        "presence_then_grounding",

      aiAllowed:
        true
    },

    emotion_reflective_processing: {
      id:
        "emotion_reflective_processing",

      family:
        "emotion",

      defaultShape:
        "brief_reflection_then_translation",

      aiAllowed:
        true
    },

    decision_tradeoff: {
      id:
        "decision_tradeoff",

      family:
        "decision",

      defaultShape:
        "tradeoff_then_next_step",

      aiAllowed:
        true
    },

    knowledge_clear_explanation: {
      id:
        "knowledge_clear_explanation",

      family:
        "knowledge",

      defaultShape:
        "answer_then_context",

      aiAllowed:
        true
    },

    builder_direct_help: {
      id:
        "builder_direct_help",

      family:
        "developer",

      defaultShape:
        "contained_implementation_steps",

      aiAllowed:
        true
    },

    memory_direct_acknowledgment: {
      id:
        "memory_direct_acknowledgment",

      family:
        "memory",

      defaultShape:
        "brief_acknowledgment",

      aiAllowed:
        false
    },

    general_reflective_clarification: {
      id:
        "general_reflective_clarification",

      family:
        "conversation",

      defaultShape:
        "reflect_then_clarify",

      aiAllowed:
        true
    },

    general_direct_response: {
      id:
        "general_direct_response",

      family:
        "general",

      defaultShape:
        "direct_then_context",

      aiAllowed:
        true
    }
  },

  moveRegistry: {
    pause_and_prioritize_safety: {
      id:
        "pause_and_prioritize_safety",

      family:
        "safety",

      renderer:
        "deterministic",

      purpose:
        "Interrupt normal response flow and establish immediate safety as the first priority."
    },

    give_direct_safety_step: {
      id:
        "give_direct_safety_step",

      family:
        "safety",

      renderer:
        "deterministic",

      purpose:
        "Give one immediate action that reduces danger or increases protection."
    },

    urge_trusted_or_emergency_support: {
      id:
        "urge_trusted_or_emergency_support",

      family:
        "safety",

      renderer:
        "deterministic",

      purpose:
        "Direct the user toward emergency or trusted human support when appropriate."
    },

    calm_medical_frame: {
      id:
        "calm_medical_frame",

      family:
        "medical",

      renderer:
        "deterministic",

      purpose:
        "Frame the health concern calmly without dismissing risk."
    },

    name_safe_first_step: {
      id:
        "name_safe_first_step",

      family:
        "medical",

      renderer:
        "deterministic",

      purpose:
        "Give the safest practical first step supported by available information."
    },

    include_red_flags_or_clinician_boundary: {
      id:
        "include_red_flags_or_clinician_boundary",

      family:
        "medical",

      renderer:
        "deterministic",

      purpose:
        "State escalation thresholds, red flags, or clinician boundaries."
    },

    join_positive_emotion: {
      id:
        "join_positive_emotion",

      family:
        "emotion",

      renderer:
        "deterministic",

      purpose:
        "Join the user's positive emotional moment without converting it into coaching."
    },

    name_what_it_means: {
      id:
        "name_what_it_means",

      family:
        "emotion",

      renderer:
        "hybrid",

      purpose:
        "Reflect why the positive event or experience may matter emotionally."
    },

    reflect_strength_or_connection: {
      id:
        "reflect_strength_or_connection",

      family:
        "emotion",

      renderer:
        "hybrid",

      purpose:
        "Reflect a strength, bond, or source of connection present in the situation."
    },

    validate_feeling: {
      id:
        "validate_feeling",

      family:
        "emotion",

      renderer:
        "deterministic",

      purpose:
        "Acknowledge the user's stated feeling without exaggerating or diagnosing it."
    },

    name_pattern_gently: {
      id:
        "name_pattern_gently",

      family:
        "emotion",

      renderer:
        "hybrid",

      purpose:
        "Name a possible pattern carefully and without presenting inference as fact."
    },

    ask_permission_before_coaching: {
      id:
        "ask_permission_before_coaching",

      family:
        "emotion",

      renderer:
        "deterministic",

      purpose:
        "Ask whether the user wants advice before moving into coaching."
    },

    offer_small_practical_next_step: {
      id:
        "offer_small_practical_next_step",

      family:
        "general",

      renderer:
        "hybrid",

      purpose:
        "Offer one small and realistic next action."
    },

    name_relationship_or_conflict_truth: {
      id:
        "name_relationship_or_conflict_truth",

      family:
        "relationship",

      renderer:
        "hybrid",

      purpose:
        "Name the central relationship or conflict pattern without assigning blame."
    },

    lower_blame: {
      id:
        "lower_blame",

      family:
        "relationship",

      renderer:
        "deterministic",

      purpose:
        "Reduce blame and move the conversation toward shared understanding."
    },

    offer_one_repair_step: {
      id:
        "offer_one_repair_step",

      family:
        "relationship",

      renderer:
        "hybrid",

      purpose:
        "Provide one concrete relationship-repair action."
    },

    attune_to_emotion: {
      id:
        "attune_to_emotion",

      family:
        "emotion",

      renderer:
        "deterministic",

      purpose:
        "Signal emotional presence before analysis or advice."
    },

    validate_emotional_weight: {
      id:
        "validate_emotional_weight",

      family:
        "emotion",

      renderer:
        "hybrid",

      purpose:
        "Acknowledge the emotional weight or difficulty of the user's experience."
    },

    invite_context_or_stay_present: {
      id:
        "invite_context_or_stay_present",

      family:
        "emotion",

      renderer:
        "deterministic",

      purpose:
        "Invite more context or allow the user to remain with the feeling."
    },

    reflect_initial_defensiveness: {
      id:
        "reflect_initial_defensiveness",

      family:
        "emotion",

      renderer:
        "hybrid",

      purpose:
        "Reflect that the user's immediate reaction is defensive without treating it as their final position."
    },

    distinguish_first_reaction_from_final_position: {
      id:
        "distinguish_first_reaction_from_final_position",

      family:
        "emotion",

      renderer:
        "hybrid",

      purpose:
        "Separate the user's first protective reaction from their later considered response."
    },

    validate_processing_time: {
      id:
        "validate_processing_time",

      family:
        "emotion",

      renderer:
        "hybrid",

      purpose:
        "Validate the need for processing time while preserving responsibility to return to the issue."
    },

    translate_pattern_for_partner: {
      id:
        "translate_pattern_for_partner",

      family:
        "relationship",

      renderer:
        "hybrid",

      purpose:
        "Translate the user's internal pattern into a clear explanation they can give a partner."
    },

    name_tradeoff: {
      id:
        "name_tradeoff",

      family:
        "decision",

      renderer:
        "hybrid",

      purpose:
        "State the real tradeoff using the user's concrete terms."
    },

    separate_options: {
      id:
        "separate_options",

      family:
        "decision",

      renderer:
        "hybrid",

      purpose:
        "Separate competing options, questions, or decision criteria."
    },

    recommend_next_decision_step: {
      id:
        "recommend_next_decision_step",

      family:
        "decision",

      renderer:
        "hybrid",

      purpose:
        "Give one next step that advances the decision without pretending certainty."
    },

    answer_directly: {
      id:
        "answer_directly",

      family:
        "knowledge",

      renderer:
        "hybrid",

      purpose:
        "Answer the user's actual question before explanation."
    },

    brief_explanation: {
      id:
        "brief_explanation",

      family:
        "knowledge",

      renderer:
        "hybrid",

      purpose:
        "Give only the explanation needed to make the answer useful."
    },

    usable_context: {
      id:
        "usable_context",

      family:
        "knowledge",

      renderer:
        "hybrid",

      purpose:
        "Add practical context, an example, or an implication when it improves understanding."
    },

    confirm_practical_goal: {
      id:
        "confirm_practical_goal",

      family:
        "developer",

      renderer:
        "hybrid",

      purpose:
        "Confirm the concrete outcome the user is trying to achieve."
    },

    give_contained_steps: {
      id:
        "give_contained_steps",

      family:
        "developer",

      renderer:
        "hybrid",

      purpose:
        "Give contained implementation steps without mixing unrelated changes."
    },

    suggest_test_or_followup: {
      id:
        "suggest_test_or_followup",

      family:
        "developer",

      renderer:
        "hybrid",

      purpose:
        "Define the check that should occur before further changes."
    },

    acknowledge_memory_request: {
      id:
        "acknowledge_memory_request",

      family:
        "memory",

      renderer:
        "deterministic",

      purpose:
        "Acknowledge a memory request without adding unrelated conversation."
    },

    reflect_understanding: {
      id:
        "reflect_understanding",

      family:
        "conversation",

      renderer:
        "hybrid",

      purpose:
        "Reflect the most defensible interpretation of the user's current need."
    },

    name_possible_meaning: {
      id:
        "name_possible_meaning",

      family:
        "conversation",

      renderer:
        "ai",

      purpose:
        "Name a possible meaning while explicitly preserving uncertainty."
    },

    ask_clarifying_question: {
      id:
        "ask_clarifying_question",

      family:
        "conversation",

      renderer:
        "deterministic",

      purpose:
        "Ask one targeted question required to resolve a meaningful ambiguity."
    }
  },

  currentNeedRegistry: {
    immediate_safety: {
      id:
        "immediate_safety",

      blueprint:
        "safety_urgent_support"
    },

    safe_health_guidance: {
      id:
        "safe_health_guidance",

      blueprint:
        "medical_context_calm_guidance"
    },

    shared_positive_emotion: {
      id:
        "shared_positive_emotion",

      blueprint:
        "positive_connection_reflection"
    },

    validation_before_coaching: {
      id:
        "validation_before_coaching",

      blueprint:
        "validation_before_coaching"
    },

    deescalation_and_repair: {
      id:
        "deescalation_and_repair",

      blueprint:
        "relationship_repair_clarity"
    },

    emotional_presence: {
      id:
        "emotional_presence",

      blueprint:
        "emotion_presence_grounding"
    },

    reflective_emotional_processing: {
      id:
        "reflective_emotional_processing",

      blueprint:
        "emotion_reflective_processing"
    },

    decision_support: {
      id:
        "decision_support",

      blueprint:
        "decision_tradeoff"
    },

    clear_information: {
      id:
        "clear_information",

      blueprint:
        "knowledge_clear_explanation"
    },

    practical_next_step: {
      id:
        "practical_next_step",

      blueprint:
        "builder_direct_help"
    },

    memory_acknowledgment: {
      id:
        "memory_acknowledgment",

      blueprint:
        "memory_direct_acknowledgment"
    },

    reflect_then_clarify: {
      id:
        "reflect_then_clarify",

      blueprint:
        "general_reflective_clarification"
    },

    direct_response: {
      id:
        "direct_response",

      blueprint:
        "general_direct_response"
    }
  },

  /* =====================================================
     PUBLIC ENTRY POINT
  ===================================================== */

  plan(input = {}) {
    const summary =
      input.summary ||
      input ||
      {};

    const plannerInput =
      this.readPlannerInput(
        summary
      );

    const turn =
      this.buildTurnRecord({
        summary,
        plannerInput
      });

    const inputs =
      this.buildInputReferences({
        summary,
        plannerInput
      });

    const routing =
      this.buildRoutingContext({
        summary,
        plannerInput
      });

    const continuity =
      this.buildContinuityContext({
        summary,
        plannerInput,
        routing
      });

    const safety =
      this.buildSafetyContext({
        summary,
        plannerInput
      });

    const understanding =
      this.buildUnderstandingContext({
        summary,
        plannerInput
      });

    const interpretation =
      this.buildInterpretation({
        summary,
        routing,
        continuity,
        safety,
        understanding
      });

    const policy =
      this.resolvePolicy({
        summary,
        turn,
        routing,
        continuity,
        safety,
        understanding,
        interpretation
      });

    const strategy =
      this.buildStrategy({
        summary,
        routing,
        continuity,
        safety,
        understanding,
        interpretation,
        policy
      });

    const blueprint =
      this.resolveBlueprint({
        summary,
        strategy,
        interpretation,
        safety
      });

    const moves =
      this.resolveStructuredMoves({
        summary,
        turn,
        routing,
        continuity,
        safety,
        understanding,
        interpretation,
        policy,
        strategy,
        blueprint
      });

    const governance =
      this.buildGovernance({
        summary,
        routing,
        continuity,
        safety,
        understanding,
        interpretation,
        policy,
        strategy,
        moves
      });

    const interactionPolicy =
      this.buildInteractionPolicy({
        summary,
        interpretation,
        policy,
        safety
      });

    const writerInstructions =
      this.buildWriterInstructions({
        summary,
        turn,
        routing,
        continuity,
        safety,
        understanding,
        interpretation,
        policy,
        strategy,
        blueprint,
        moves,
        governance,
        interactionPolicy
      });

    const personalization =
      this.buildPersonalization({
        summary,
        continuity,
        plannerInput
      });

    const provenance =
      this.buildProvenance({
        summary,
        turn,
        routing,
        continuity,
        safety,
        understanding,
        interpretation,
        strategy,
        blueprint
      });

    const validation =
      this.validatePlanParts({
        turn,
        routing,
        continuity,
        safety,
        understanding,
        interpretation,
        policy,
        strategy,
        blueprint,
        moves,
        governance,
        interactionPolicy,
        writerInstructions,
        provenance
      });

    const quality =
      this.buildQuality({
        turn,
        routing,
        continuity,
        safety,
        understanding,
        interpretation,
        strategy,
        blueprint,
        moves,
        validation
      });

    const confidence =
      this.resolveConfidence({
        summary,
        routing,
        continuity,
        safety,
        understanding,
        interpretation,
        quality
      });

    const plan = {
      schema:
        "ari_response_plan",

      schemaVersion:
        this.schemaVersion,

      ready:
        validation.valid,

      usable:
        validation.valid,

      source:
        "ari-response-planner",

      version:
        this.version,

      createdAt:
        new Date().toISOString(),

      turn,

      /*
       * Compatibility aliases.
       *
       * These fields are derived from the canonical plan.
       * They are not separate planning authorities.
       */
      turnId:
        turn.turnId,

      sourceQuestion:
  turn.resolvedText ||
  turn.originalText,

userQuestion:
  turn.resolvedText ||
  turn.originalText,

originalUserQuestion:
  turn.originalText,

resolvedUserQuestion:
  turn.resolvedText ||
  turn.originalText,

      inputs,

      routing,

      continuity,

      safety,

      understanding,

      interpretation,

      strategy,

      objective:
        this.buildObjective({
          strategy,
          interpretation,
          blueprint
        }),

      blueprint,

      moves,

      responseMoves:
        moves,

      governance,

      interactionPolicy,

      writerInstructions,

      personalization,

      provenance,

      validation,

      quality,

      handoff:
        this.buildHandoff({
          validation,
          quality,
          blueprint,
          moves
        }),

      confidence,

      /*
       * Temporary compatibility aliases.
       */
      responseGoal:
        strategy.responseGoal,

      responseShape:
        strategy.responseShape,

      responsePosture:
        strategy.responsePosture,

      currentNeed:
        interpretation.currentNeed,

      adviceRequested:
        interactionPolicy.adviceRequested,

      advicePolicy:
        interactionPolicy.advicePolicy,

      coachingPermissionRequired:
        interactionPolicy
          .coachingPermissionRequired,

      blueprintHint:
        blueprint.id,

      shouldAskQuestion:
        interactionPolicy
          .shouldAskQuestion,

      questionPurpose:
        interactionPolicy
          .questionPurpose,

      required:
        governance.requiredBehaviors,

      avoid:
        governance.forbiddenBehaviors,

      constraints:
        governance.constraints,

      authority: {
        canDefineResponseGoal:
          true,

        canDefineResponseShape:
          true,

        canDefineResponsePosture:
          true,

        canDefineResponseMoves:
          true,

        canDefineAdvicePolicy:
          true,

        canDefineQuestionPolicy:
          true,

        canDefineWriterInstructions:
          true,

        canValidateBlueprintIds:
          true,

        canValidateMoveIds:
          true,

        canPreserveContinuityPolicy:
          true,

        canPreserveSafetyPolicy:
          true,

        canChangeOfficialRoute:
          false,

        canChangeSemanticMeaning:
          false,

        canChangeConversationFunction:
          false,

        canOverrideSafetySeverity:
          false,

        canRetrieveContinuity:
          false,

        canRetrieveMemory:
          false,

        canWriteFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        canPersistState:
          false,

        role:
          "canonical_response_strategy_and_writer_instruction_contract"
      }
    };

    const frozenPlan =
      this.deepFreeze(plan);

    window.Ari.responsePlan =
      frozenPlan;

    window.Ari.responsePlannerState =
      frozenPlan;

    return this.buildReturnPayload(
      frozenPlan
    );
  },

  /* =====================================================
     INPUT READING
  ===================================================== */

  readPlannerInput(
    summary = {}
  ) {
    return (
      summary.responsePlanningInput ||
      summary.understandingStageInput ||
      {}
    );
  },

  buildInputReferences({
    summary = {},
    plannerInput = {}
  } = {}) {
    return {
      perception:
        plannerInput.perception ||
        summary.perceptionPacket ||
        null,

      executive:
        plannerInput.executive ||
        summary.executivePacket ||
        null,

      routing:
        plannerInput.routing ||
        summary.routingContract ||
        null,

      continuity:
        plannerInput.continuity ||
        summary.continuityStagePacket ||
        null,

      safety:
        plannerInput.safety ||
        summary.safetyStagePacket ||
        null,

      situation:
        plannerInput.situation ||
        summary.situationStagePacket ||
        null,

      reasoning:
        plannerInput.reasoning ||
        summary.reasoningStagePacket ||
        null,

      memory:
        plannerInput.memory ||
        summary.memoryStagePacket ||
        null,

      understanding:
        plannerInput.understanding ||
        summary.understandingStagePacket ||
        null
    };
  },

  /* =====================================================
     TURN PROVENANCE
  ===================================================== */

  buildTurnRecord({
  summary = {},
  plannerInput = {}
} = {}) {
  const originalText =
    this.clean(
      plannerInput.request
        ?.original ||
      summary.originalUserMessage ||
      summary.continuityCurrentTurn
        ?.originalText ||
      summary.continuityStagePacket
        ?.currentTurn
        ?.originalText ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      ""
    );

  const resolvedText =
  this.clean(
    plannerInput.request
      ?.resolved ||
    summary.continuityResults
      ?.resolvedUserQuestion ||
    summary.continuityResults
      ?.resolvedCurrentTurn
      ?.resolvedText ||
    summary.continuityResults
      ?.outputs
      ?.elliptical
      ?.resolvedUserQuestion ||
    summary.continuityResults
      ?.outputs
      ?.elliptical
      ?.resolvedCurrentTurnText ||
    summary.continuityResults
      ?.outputs
      ?.elliptical
      ?.ellipticalFollowUpResolution
      ?.resolvedText ||
    summary.resolvedCurrentTurn
      ?.resolvedText ||
    summary.continuityPacket
      ?.resolvedUserQuestion ||
    summary.continuityStagePacket
      ?.currentTurn
      ?.resolvedText ||
    summary.resolvedUserQuestion ||
    originalText
  );

  const normalizedText =
    this.normalize(
      resolvedText ||
      summary.continuityCurrentTurn
        ?.normalizedText ||
      summary.continuityStagePacket
        ?.currentTurn
        ?.normalizedText ||
      summary.normalizedMessage ||
      originalText
    );

  const canonicalTurnId =
    summary.currentTurnId ||
    summary.turnId ||
    summary.continuityCurrentTurn
      ?.turnId ||
    summary.continuityStagePacket
      ?.currentTurn
      ?.turnId ||
    summary.perceptionPacket
      ?.currentTurn
      ?.turnId ||
    summary.perceptionPacket
      ?.semantic
      ?.turnId ||
    summary.semanticStructure
      ?.turnId ||
    this.createStableId(
      "turn",
      originalText
    );

  const continuityResolved =
    summary.currentTurnWasResolved ===
      true ||
    summary.ellipticalFollowUpResolved ===
      true ||
    summary.continuityResults
      ?.currentTurnWasResolved ===
      true ||
    summary.continuityResults
      ?.ellipticalFollowUp
      ?.resolved ===
      true ||
    summary.continuityStagePacket
      ?.ellipticalFollowUp
      ?.resolved ===
      true;

  const resolvedTextDiffers =
    Boolean(
      resolvedText
    ) &&
    this.normalize(
      resolvedText
    ) !==
    this.normalize(
      originalText
    );

  return {
    schema:
      "ari_response_plan_turn",

    schemaVersion:
      "1.1.0",

    turnId:
      canonicalTurnId,

    originalText,

    resolvedText:
      resolvedText ||
      originalText,

    semanticInputText:
      resolvedText ||
      originalText,

    normalizedText,

    originalTextPreserved:
      true,

    textWasRewritten:
      false,

    resolvedTextIsSeparateInterpretation:
      resolvedTextDiffers,

    createdForCurrentTurn:
      Boolean(
        originalText
      ),

    currentTurnWasSemanticallyResolved:
      continuityResolved ||
      resolvedTextDiffers,

    ellipticalFollowUpResolved:
      summary.ellipticalFollowUpResolved ===
        true ||
      summary.continuityResults
        ?.ellipticalFollowUp
        ?.resolved ===
        true,

    referenceResolutionAttached:
      Boolean(
        summary
          .continuityReferenceBinding ||
        summary.referenceResolution ||
        summary.continuityStagePacket
          ?.referenceResolution
          ?.binding
      ),

    authority:
      "current_turn_provenance_and_resolved_handoff_only"
  };
},

  /* =====================================================
     ROUTING
  ===================================================== */

  buildRoutingContext({
    summary = {},
    plannerInput = {}
  } = {}) {
    const route =
      plannerInput.routing ||
      summary.routingContract ||
      {};

    const modeValue =
      this.readModeValue(
        route.mode ||
        summary.conversationMode
      );

    const intent =
      route.primaryIntent ||
      route.intent ||
      summary.primaryIntent ||
      summary.semanticSummary
        ?.operation ||
      null;

    const domain =
      route.domain ||
      summary.conversationDomain ||
      summary.semanticSummary
        ?.domain ||
      "general";

    const contextLane =
      plannerInput.controls
        ?.contextLane ||
      route.contextLane ||
      summary.contextLane ||
      summary.laneSplit?.lane ||
      "direct_current_turn";

    const primaryLane =
      plannerInput.controls
        ?.primaryLane ||
      route.primaryLane ||
      summary.primaryLane ||
      summary.triage?.primaryLane ||
      "general_understanding";

    const useThread =
      summary.executivePacket
        ?.runInstructions
        ?.thread ===
        true ||
      summary.laneSplit
        ?.routing
        ?.useThread ===
        true ||
      route.run?.thread ===
        true;

    const useMemory =
      summary.executivePacket
        ?.runInstructions
        ?.memory ===
        true ||
      summary.laneSplit
        ?.routing
        ?.useMemory ===
        true ||
      route.run?.memory ===
        true;

    const useRelationship =
      summary.executivePacket
        ?.runInstructions
        ?.relationship ===
        true ||
      summary.laneSplit
        ?.routing
        ?.useRelationship ===
        true ||
      route.run?.relationship ===
        true;

    return {
      mode:
        modeValue,

      intent,

      domain,

      contextLane,

      primaryLane,

      planner:
        route.planner ||
        summary.selectedPlanner ||
        null,

      useThread,

      useMemory,

      useRelationship,

      mustUsePriorContext:
        contextLane ===
          "continuity_follow_up" ||
        contextLane ===
          "relationship_continuity" ||
        contextLane ===
          "correction_or_revision" ||
        summary.shouldUseContinuity ===
          true,

      mayUsePriorContext:
        contextLane !==
          "direct_current_turn" ||
        useThread ||
        useMemory ||
        useRelationship,

      directCurrentTurn:
        contextLane ===
          "direct_current_turn",

      routeReady:
        route.ready !==
        false,

      authority:
        "upstream_route_preservation_only"
    };
  },

  readModeValue(
    mode = null
  ) {
    if (
      mode &&
      typeof mode ===
        "object"
    ) {
      return (
        mode.mode ||
        mode.name ||
        mode.value ||
        "unknown"
      );
    }

    return mode ||
      "unknown";
  },

  /* =====================================================
     CONTINUITY
  ===================================================== */

  buildContinuityContext({
    summary = {},
    plannerInput = {},
    routing = {}
  } = {}) {
    const stage =
      plannerInput.continuity ||
      summary.continuityStagePacket ||
      {};

    const packet =
      summary.continuityPacket ||
      stage.continuityPacket
        ?.raw ||
      {};

    const contextAssembler =
      stage.contextAssembler ||
      {};

    const activeContext =
      packet.activeContext ||
      packet.contextAssemblerHandoff
        ?.activeContext ||
      summary.continuityContext ||
      summary.assembledContext ||
      {};

    const usableFacts =
      this.toArray(
        packet.usableFacts ||
        stage.continuityPacket
          ?.usableFacts ||
        summary.continuityUsableFacts
      );

    const resolvedReferences =
      this.toArray(
        packet.resolvedReferences ||
        packet.referenceResolution
          ?.resolvedReferences ||
        stage.referenceResolution
          ?.resolvedReferences ||
        summary.continuityResolvedReferences
      );

    const unresolvedReferences =
      this.toArray(
        packet.unresolvedReferences ||
        packet.referenceResolution
          ?.unresolvedReferences ||
        stage.referenceResolution
          ?.unresolvedReferences ||
        summary
          .continuityUnresolvedReferences
      );

    const available =
      stage.ready ===
        true ||
      packet.ready ===
        true ||
      Boolean(
        summary.threadContext ||
        packet.threadContext ||
        usableFacts.length
      );

    const shouldUse =
      routing.mustUsePriorContext ||
      packet.continuityDecision
        ?.shouldUsePriorContext ===
        true ||
      stage.eligibility
        ?.eligible ===
        true;

const ellipticalResolution =
  summary
    .ellipticalFollowUpResolution ||
  summary.continuityResults
    ?.outputs
    ?.elliptical
    ?.ellipticalFollowUpResolution ||
  summary.continuityResults
    ?.ellipticalFollowUp ||
  stage.ellipticalFollowUp ||
  {};

const resolvedCurrentTurn =
  summary.resolvedCurrentTurn ||
  summary.continuityResults
    ?.resolvedCurrentTurn ||
  ellipticalResolution
    .resolvedCurrentTurn ||
  {};

const resolvedUserQuestion =
  this.clean(
    summary.continuityResults
      ?.resolvedUserQuestion ||
    summary.continuityResults
      ?.resolvedCurrentTurn
      ?.resolvedText ||
    summary.continuityResults
      ?.outputs
      ?.elliptical
      ?.resolvedUserQuestion ||
    summary.continuityResults
      ?.outputs
      ?.elliptical
      ?.resolvedCurrentTurnText ||
    summary.continuityResults
      ?.outputs
      ?.elliptical
      ?.ellipticalFollowUpResolution
      ?.resolvedText ||
    resolvedCurrentTurn
      ?.resolvedText ||
    ellipticalResolution
      ?.resolvedText ||
    summary.resolvedUserQuestion ||
    ""
  );
    resolvedCurrentTurn
      ?.resolvedText ||
    ellipticalResolution
      ?.resolvedText ||
    ""
  );

const ellipticalDetected =
  summary.ellipticalFollowUpDetected ===
    true ||
  summary.continuityResults
    ?.ellipticalFollowUp
    ?.detected ===
    true ||
  ellipticalResolution.detected ===
    true;

const ellipticalResolved =
  summary.ellipticalFollowUpResolved ===
    true ||
  summary.currentTurnWasResolved ===
    true ||
  summary.continuityResults
    ?.ellipticalFollowUp
    ?.resolved ===
    true ||
  summary.continuityResults
    ?.currentTurnWasResolved ===
    true ||
  resolvedCurrentTurn
    ?.currentTurnWasResolved ===
    true;

    return {
      required:
        routing.mustUsePriorContext,

      available,

      shouldUse,

      type:
        packet.continuityType ||
        stage.continuityPacket
          ?.type ||
        routing.contextLane,

      activeTopic:
        activeContext.activeTopic ||
        packet.threadContext
          ?.activeTopic ||
        packet.activeThread
          ?.activeTopic ||
        summary.activeTopic ||
        null,

      activeSubject:
        activeContext.activeSubject ||
        packet.referenceResolution
          ?.activeSubject ||
        packet.threadContext
          ?.activeSubject ||
        summary.activeSubject ||
        null,

      activeObject:
        activeContext.activeObject ||
        packet.referenceResolution
          ?.activeObject ||
        packet.threadContext
          ?.activeObject ||
        null,

      activeIssue:
        activeContext.activeIssue ||
        packet.referenceResolution
          ?.activeIssue ||
        packet.threadContext
          ?.activeIssue ||
        summary.activeIssue ||
        null,

      activeGoal:
        activeContext.activeGoal ||
        packet.threadContext
          ?.activeGoal ||
        summary.activeGoal ||
        null,

      activeQuestion:
        activeContext.activeQuestion ||
        packet.threadContext
          ?.activeQuestion ||
        null,

      previousAnswer:
        activeContext.previousAnswer ||
        packet.threadContext
          ?.previousAnswer ||
        summary.threadState
          ?.previousAnswerSummary ||
        summary.previousAnswerSummary ||
        null,

ellipticalFollowUp: {
  detected:
    ellipticalDetected,

  resolved:
    ellipticalResolved,

  requiresClarification:
    ellipticalResolution
      ?.requiresClarification ===
      true,

  family:
    summary.followUpFamily ||
    summary.continuityResults
      ?.ellipticalFollowUp
      ?.family ||
    ellipticalResolution
      ?.followUpFamily ||
    null,

  operation:
    summary.followUpOperation ||
    summary.continuityResults
      ?.ellipticalFollowUp
      ?.operation ||
    ellipticalResolution
      ?.followUpOperation ||
    null,

  confidence:
    this.normalizeConfidence(
      summary.continuityResults
        ?.ellipticalFollowUp
        ?.confidence ??
      ellipticalResolution
        ?.confidence ??
      0
    )
},

resolvedCurrentTurn,

resolvedUserQuestion,

currentTurnWasResolved:
  ellipticalResolved,

missingContextRecovered:
  ellipticalResolved &&
  Boolean(
    resolvedUserQuestion
  ),

effectiveUnresolvedReferenceCount:
  ellipticalResolved
    ? 0
    : unresolvedReferences.length,

      usableFacts,

      resolvedReferences,

      unresolvedReferences,

      contextAssemblerReady:
        contextAssembler.ready ===
          true ||
        summary.contextAssemblerRan ===
          true,

      staleContextSuppressed:
        packet.threadContext
          ?.staleContextSuppressed ===
          true ||
        activeContext
          .staleContextSuppressed ===
          true,

      useRules: [
        "Use prior context only when the route permits or requires it.",
        "Do not replace the current turn with prior context.",
        "Do not inherit unrelated or stale developer evidence.",
        "Do not treat historical semantic meaning as the current meaning automatically."
      ],

      authority:
        "continuity_context_preservation_only"
    };
  },

  /* =====================================================
     SAFETY
  ===================================================== */

  buildSafetyContext({
    summary = {},
    plannerInput = {}
  } = {}) {
    const stage =
      plannerInput.safety ||
      summary.safetyStagePacket ||
      {};

    const disposition =
      summary.safetyDisposition ||
      stage.disposition ||
      stage.contract ||
      {};

    const riskLevel =
      summary.resolvedSafetyRiskLevel ||
      disposition.riskLevel ||
      stage.riskLevel ||
      "none";

    const riskType =
      summary.resolvedSafetyRiskType ||
      disposition.riskType ||
      stage.riskType ||
      "none";

    const shouldStopNormalResponse =
      summary
        .safetyShouldStopNormalResponse ===
        true ||
      disposition
        .shouldStopNormalResponse ===
        true ||
      stage
        .shouldStopNormalResponse ===
        true;

    const requiresClarification =
      summary
        .safetyRequiresClarification ===
        true ||
      disposition
        .requiresClarification ===
        true ||
      stage
        .requiresClarification ===
        true;

    return {
      applicable:
        summary.safetyApplicable ===
          true ||
        stage.applicable ===
          true ||
        riskLevel !==
          "none",

      riskLevel,

      riskType,

      authority:
        summary.resolvedSafetyAuthority ||
        disposition.safetyAuthority ||
        stage.authority ||
        "none",

      shouldStopNormalResponse,

      requiresClarification,

      requiredPlanner:
        summary.safetyRequiredPlanner ||
        disposition.requiredPlanner ||
        null,

      communicationStyle:
        summary.safetyCommunicationStyle ||
        disposition.communicationStyle ||
        null,

      requiredBehaviors:
        this.mergeUnique(
          disposition.requiredBehaviors,
          stage.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          disposition.forbiddenBehaviors,
          stage.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          disposition.constraints,
          stage.constraints
        ),

      contract:
        summary.safetyResponseContract ||
        stage.contract ||
        null,

      authorityBoundary:
        "safety_stage_authoritative"
    };
  },

  /* =====================================================
     UNDERSTANDING
  ===================================================== */

  buildUnderstandingContext({
    summary = {},
    plannerInput = {}
  } = {}) {
    const stage =
      plannerInput.understanding ||
      summary.understandingStagePacket ||
      {};

    const handoff =
      summary.understandingHandoff ||
      stage.handoff ||
      {};

    const meaning =
      summary.meaningInterpretation ||
      stage.meaning?.value ||
      handoff.meaning ||
      {};

    const humanState =
      summary.humanState ||
      stage.humanState?.value ||
      handoff.humanState ||
      {};

    const event =
      summary.eventUnderstanding ||
      stage.event?.value ||
      handoff.event ||
      {};

    const semantic =
      summary.semanticUnderstanding ||
      stage.semantic?.value ||
      handoff.semantic ||
      {};

    const language =
      summary.languageUnderstanding ||
      stage.language?.value ||
      handoff.language ||
      {};

    return {
      usable:
        handoff.usable ===
          true ||
        meaning.usable ===
          true ||
        humanState.usable ===
          true ||
        stage.ready ===
          true,

      language,

      semantic,

      event,

      meaning,

      humanState,

      userGoal:
        handoff.userGoal ||
        meaning.userGoal ||
        meaning.goal ||
        null,

      resolvedMeaning:
        handoff.resolvedMeaning ||
        meaning.resolvedMeaning ||
        meaning.primaryMeaning ||
        meaning.meaning ||
        meaning.summary ||
        null,

      userState:
        handoff.userState ||
        humanState.state ||
        humanState.primaryState ||
        null,

      emotionalTone:
        handoff.emotionalTone ||
        humanState.emotionalTone ||
        humanState.tone ||
        null,

      communicationNeeds:
        this.mergeUnique(
          handoff.communicationNeeds,
          humanState.communicationNeeds,
          meaning.communicationNeeds
        ),

      requiredBehaviors:
        this.mergeUnique(
          handoff.requiredBehaviors,
          humanState.requiredBehaviors,
          meaning.requiredBehaviors
        ),

      forbiddenBehaviors:
        this.mergeUnique(
          handoff.forbiddenBehaviors,
          humanState.forbiddenBehaviors,
          meaning.forbiddenBehaviors
        ),

      constraints:
        this.mergeUnique(
          handoff.constraints,
          humanState.constraints,
          meaning.constraints
        ),

      confidence:
        this.firstFinite([
          meaning.confidence,
          meaning.primaryMeaning
            ?.confidence,
          humanState.stateConfidence,
          humanState.confidence,
          handoff.confidence
        ]),

      sources: {
        meaning:
          summary.meaningInterpreterSource ||
          stage.meaning?.source ||
          null,

        humanState:
          summary.humanStateBuilderSource ||
          stage.humanState?.source ||
          null,

        event:
          summary.eventUnderstandingSource ||
          stage.event?.source ||
          null,

        semantic:
          summary.semanticUnderstandingSource ||
          stage.semantic?.source ||
          null,

        language:
          summary.languageUnderstandingSource ||
          stage.language?.source ||
          null
      },

      authority:
        "understanding_stage_preservation_only"
    };
  },

  /* =====================================================
     INTERPRETATION
  ===================================================== */

  buildInterpretation({
    summary = {},
    routing = {},
    continuity = {},
    safety = {},
    understanding = {}
  } = {}) {
    const meaning =
      understanding.meaning ||
      {};

    const humanState =
      understanding.humanState ||
      {};

    const rawCurrentNeed =
      humanState.currentNeed?.id ||
      humanState.currentNeed ||
      meaning.currentNeed?.id ||
      meaning.currentNeed ||
      null;

    const currentNeed =
      this.resolveCurrentNeed({
        summary,
        rawCurrentNeed,
        routing,
        continuity,
        safety,
        meaning,
        humanState
      });

    const requestedOperation =
      summary.perceptionPacket
        ?.semantic
        ?.canonicalMeaning
        ?.requestedOperation ||
      summary.perceptionPacket
        ?.semanticSummary
        ?.operation ||
      summary.semanticSummary
        ?.operation ||
      summary.routingContract
        ?.primaryIntent ||
      routing.intent ||
      null;

    const requestedOutput =
      summary.perceptionPacket
        ?.semantic
        ?.canonicalMeaning
        ?.requestedOutput ||
      summary.perceptionPacket
        ?.semanticSummary
        ?.requestedOutput ||
      summary.semanticSummary
        ?.requestedOutput ||
      null;

    const meaningId =
      meaning.meaningId ||
      meaning.primaryMeaning?.id ||
      this.extractIdentifier(
        understanding.resolvedMeaning
      ) ||
      null;

    const adviceRequested =
      meaning.adviceRequested ===
        true ||
      meaning.requestedAdvice ===
        true ||
      summary.perceptionPacket
        ?.semantic
        ?.responseCharacteristics
        ?.expectsCollaboration ===
        true &&
      this.operationSuggestsAdvice(
        requestedOperation
      );

    const emotionalState =
      this.buildEmotionalState({
        summary,
        humanState,
        meaning,
        understanding
      });

    return {
      currentNeed,

      rawCurrentNeed,

      requestedOperation,

      requestedOutput,

      userGoal:
        understanding.userGoal ||
        meaning.userGoal ||
        meaning.goal ||
        requestedOperation ||
        null,

      meaningId,

      resolvedMeaning:
        understanding.resolvedMeaning ||
        null,

      adviceRequested,

      emotionalState,

      riskLevel:
        safety.riskLevel,

      routeMode:
        routing.mode,

      primaryLane:
        routing.primaryLane,

      contextLane:
        routing.contextLane,

      clarificationRequired:
  this.resolveEffectiveClarificationRequirement({
    summary,
    safety,
    meaning,
    continuity
  }),

clarificationResolution:
  this.buildClarificationResolution({
    summary,
    safety,
    meaning,
    continuity
  }),

      confidence:
        this.normalizeConfidence(
          understanding.confidence ??
          summary.routingConfidence ??
          0.5
        ),

      authority:
        "response_planning_interpretation_only"
    };
  },

resolveEffectiveClarificationRequirement({
  summary = {},
  safety = {},
  meaning = {},
  continuity = {}
} = {}) {
  if (
    safety.requiresClarification ===
    true
  ) {
    return true;
  }

  const upstreamClarificationRequired =
    meaning.requiresClarification ===
      true ||
    summary.perceptionPacket
      ?.semantic
      ?.ambiguity
      ?.requiresClarification ===
      true ||
    summary.semanticSummary
      ?.ambiguity
      ?.requiresClarification ===
      true;

  const continuityResolved =
    continuity
      .currentTurnWasResolved ===
      true ||
    continuity
      .missingContextRecovered ===
      true ||
    continuity
      .ellipticalFollowUp
      ?.resolved ===
      true;

  const resolvedQuestionAvailable =
    Boolean(
      this.clean(
        continuity
          .resolvedUserQuestion ||
        continuity
          .resolvedCurrentTurn
          ?.resolvedText ||
        summary.resolvedUserQuestion ||
        ""
      )
    );

  const ellipticalStillRequiresClarification =
    continuity
      .ellipticalFollowUp
      ?.requiresClarification ===
      true;

  if (
    continuityResolved &&
    resolvedQuestionAvailable &&
    !ellipticalStillRequiresClarification
  ) {
    return false;
  }

  if (
    continuity
      .unresolvedReferences
      .length >
      0 &&
    !continuityResolved
  ) {
    return true;
  }

  return upstreamClarificationRequired;
},

buildClarificationResolution({
  summary = {},
  safety = {},
  meaning = {},
  continuity = {}
} = {}) {
  const upstreamRequired =
    meaning.requiresClarification ===
      true ||
    summary.perceptionPacket
      ?.semantic
      ?.ambiguity
      ?.requiresClarification ===
      true ||
    summary.semanticSummary
      ?.ambiguity
      ?.requiresClarification ===
      true;

  const resolvedByContinuity =
    continuity
      .currentTurnWasResolved ===
      true ||
    continuity
      .missingContextRecovered ===
      true ||
    continuity
      .ellipticalFollowUp
      ?.resolved ===
      true;

  const effectiveRequired =
    this.resolveEffectiveClarificationRequirement({
      summary,
      safety,
      meaning,
      continuity
    });

  return {
    upstreamRequired,

    effectiveRequired,

    resolvedByContinuity,

    safetyStillRequiresClarification:
      safety.requiresClarification ===
      true,

    resolvedQuestion:
      continuity
        .resolvedUserQuestion ||
      continuity
        .resolvedCurrentTurn
        ?.resolvedText ||
      summary.resolvedUserQuestion ||
      null,

    stalePerceptionAmbiguitySuppressed:
      upstreamRequired &&
      resolvedByContinuity &&
      !effectiveRequired,

    authority:
      "post_continuity_clarification_overlay_only"
  };
},

  resolveCurrentNeed({
    rawCurrentNeed = null,
    routing = {},
    continuity = {},
    safety = {},
    meaning = {},
    humanState = {}
  } = {}) {
    const normalizedRaw =
      this.normalizeIdentifier(
        rawCurrentNeed
      );

    if (
      normalizedRaw &&
      this.currentNeedRegistry[
        normalizedRaw
      ]
    ) {
      return normalizedRaw;
    }

    if (
      safety.shouldStopNormalResponse ||
      [
        "high",
        "critical",
        "imminent"
      ].includes(
        this.normalizeIdentifier(
          safety.riskLevel
        )
      )
    ) {
      return "immediate_safety";
    }

    const meaningId =
      this.normalizeIdentifier(
        meaning.meaningId ||
        meaning.primaryMeaning?.id ||
        ""
      );

    if (
      [
        "health_worry",
        "medical_question",
        "body_symptom",
        "safe_health_guidance"
      ].includes(meaningId) ||
      [
        "medical",
        "medical_body",
        "health"
      ].includes(
        this.normalizeIdentifier(
          routing.primaryLane
        )
      )
    ) {
      return "safe_health_guidance";
    }

    if (
      [
        "celebration",
        "support_received",
        "positive_connection",
        "shared_positive_emotion"
      ].includes(meaningId)
    ) {
      return "shared_positive_emotion";
    }

    if (
      [
        "self_criticism",
        "body_change_concern",
        "validation_before_coaching"
      ].includes(meaningId)
    ) {
      return "validation_before_coaching";
    }

    if (
      [
        "relationship_repair_need",
        "relationship_conflict",
        "deescalation_and_repair"
      ].includes(meaningId)
    ) {
      return "deescalation_and_repair";
    }

    if (
      [
        "criticism_processing_pattern",
        "defensive_processing_pattern",
        "reflective_emotional_processing"
      ].includes(meaningId)
    ) {
      return "reflective_emotional_processing";
    }

    if (
      [
        "decision",
        "decision_support",
        "tradeoff",
        "choice"
      ].includes(meaningId) ||
      [
        "executive_decision",
        "decision"
      ].includes(
        this.normalizeIdentifier(
          routing.primaryLane
        )
      )
    ) {
      return "decision_support";
    }

    if (
      [
        "developer",
        "builder",
        "project_help"
      ].includes(
        this.normalizeIdentifier(
          routing.primaryLane
        )
      )
    ) {
      return "practical_next_step";
    }

    const resolvedContinuityQuestion =
  continuity
    .currentTurnWasResolved ===
    true ||
  continuity
    .missingContextRecovered ===
    true ||
  continuity
    .ellipticalFollowUp
    ?.resolved ===
    true;

if (
  [
    "teacher",
    "knowledge",
    "general_understanding"
  ].includes(
    this.normalizeIdentifier(
      routing.primaryLane
    )
  ) &&
  (
    routing.contextLane ===
      "direct_current_turn" ||
    (
      routing.mustUsePriorContext &&
      resolvedContinuityQuestion
    )
  )
) {
  return "clear_information";
}

    if (
      [
        "emotion",
        "emotional_support"
      ].includes(
        this.normalizeIdentifier(
          routing.primaryLane
        )
      )
    ) {
      if (
        continuity.shouldUse &&
        this.detectReflectiveProcessing({
          meaning,
          humanState
        })
      ) {
        return "reflective_emotional_processing";
      }

      return "emotional_presence";
    }

    if (
      routing.contextLane ===
        "recall_or_memory_request"
    ) {
      return "memory_acknowledgment";
    }

    if (
      routing.contextLane ===
        "missing_context"
    ) {
      return "reflect_then_clarify";
    }

    return "direct_response";
  },

  detectReflectiveProcessing({
    meaning = {},
    humanState = {}
  } = {}) {
    const text =
      this.normalize(
        [
          meaning.summary,
          meaning.resolvedMeaning,
          meaning.description,
          humanState.state,
          humanState.primaryState,
          humanState.processingPattern
        ]
          .filter(Boolean)
          .join(" ")
      );

    return (
      /\bdefensiv/.test(text) &&
      /\b(?:time|process|later|after|reflect)\b/.test(
        text
      )
    );
  },

  buildEmotionalState({
    summary = {},
    humanState = {},
    meaning = {},
    understanding = {}
  } = {}) {
    const overlay =
      summary.perceptionPacket
        ?.semantic
        ?.emotionalOverlay ||
      summary.semanticSummary
        ?.emotionalOverlay ||
      {};

    const primary =
      humanState.primaryEmotion ||
      humanState.emotionalState
        ?.primary ||
      humanState.state?.id ||
      meaning.emotion ||
      overlay.states?.[0] ||
      understanding.emotionalTone ||
      null;

    const secondary =
      this.mergeUnique(
        humanState.secondaryEmotions,
        humanState.emotionalState
          ?.secondary,
        overlay.states
      ).filter(
        item =>
          this.normalizeIdentifier(
            item
          ) !==
          this.normalizeIdentifier(
            primary
          )
      );

    return {
      primary,

      secondary,

      intensity:
        humanState.intensity ||
        humanState.emotionalState
          ?.intensity ||
        overlay.intensity ||
        null,

      explicit:
        overlay.present ===
          true ||
        Boolean(primary),

      confidence:
        this.normalizeConfidence(
          humanState.emotionConfidence ??
          overlay.confidence ??
          understanding.confidence ??
          0.5
        )
    };
  },

  operationSuggestsAdvice(
    operation = ""
  ) {
    const normalized =
      this.normalizeIdentifier(
        operation
      );

    return [
      "advise",
      "recommend",
      "help_choose",
      "decision_support",
      "give_next_step",
      "solve_problem",
      "coach"
    ].some(
      value =>
        normalized.includes(
          value
        )
    );
  },

  /* =====================================================
     POLICY
  ===================================================== */

  resolvePolicy({
    summary = {},
    routing = {},
    continuity = {},
    safety = {},
    understanding = {},
    interpretation = {}
  } = {}) {
    const required =
      new Set();

    const forbidden =
      new Set();

    const constraints =
      new Set();

    const currentNeed =
      interpretation.currentNeed;

    const adviceRequested =
      interpretation.adviceRequested ===
      true;

    let advicePolicy =
      "allowed_if_useful";

    let coachingPermissionRequired =
      false;

    let shouldAskQuestion =
      false;

    let questionPurpose =
      null;

    let maxQuestions =
      0;

    this.mergeUnique(
      summary.responseRequired,
      understanding.requiredBehaviors,
      safety.requiredBehaviors
    ).forEach(
      value =>
        required.add(value)
    );

    this.mergeUnique(
      summary.responseAvoid,
      understanding.forbiddenBehaviors,
      safety.forbiddenBehaviors
    ).forEach(
      value =>
        forbidden.add(value)
    );

    this.mergeUnique(
      summary.responseConstraints,
      understanding.constraints,
      safety.constraints
    ).forEach(
      value =>
        constraints.add(value)
    );

    this.getMeaningAvoidRules(
      understanding.meaning
    ).forEach(
      value =>
        forbidden.add(value)
    );

    if (
      safety.shouldStopNormalResponse ||
      currentNeed ===
        "immediate_safety"
    ) {
      advicePolicy =
        "safety_first";

      required.add(
        "prioritize_immediate_safety"
      );

      required.add(
        "be_direct"
      );

      forbidden.add(
        "casual_tone"
      );

      forbidden.add(
        "abstract_analysis"
      );

      forbidden.add(
        "delay"
      );

      constraints.add(
        "safety_governance_overrides_normal_response_order"
      );

      return {
        advicePolicy,

        coachingPermissionRequired:
          false,

        shouldAskQuestion:
          safety.requiresClarification,

        questionPurpose:
          safety.requiresClarification
            ? "resolve_immediate_safety_ambiguity"
            : null,

        maxQuestions:
          safety.requiresClarification
            ? 1
            : 0,

        required:
          [...required],

        forbidden:
          [...forbidden],

        constraints:
          [...constraints]
      };
    }

    if (
      currentNeed ===
        "safe_health_guidance"
    ) {
      advicePolicy =
        "safe_general_guidance_only";

      required.add(
        "include_red_flags_or_clinician_boundary"
      );

      forbidden.add(
        "diagnosis"
      );

      forbidden.add(
        "false_reassurance"
      );

      forbidden.add(
        "unsafe_medical_specificity"
      );
    }

    if (
      currentNeed ===
        "validation_before_coaching"
    ) {
      advicePolicy =
        adviceRequested
          ? "brief_coaching_allowed_after_validation"
          : "permission_required";

      coachingPermissionRequired =
        !adviceRequested;

      shouldAskQuestion =
        !adviceRequested;

      questionPurpose =
        shouldAskQuestion
          ? "permission_before_coaching"
          : null;

      maxQuestions =
        shouldAskQuestion
          ? 1
          : 0;

      required.add(
        "validate_first"
      );

      required.add(
        "use_non_shaming_language"
      );

      forbidden.add(
        "diet_plan_too_fast"
      );

      forbidden.add(
        "shame_language"
      );

      forbidden.add(
        "lecturing"
      );

      forbidden.add(
        "assuming_advice_wanted"
      );
    }

    if (
      currentNeed ===
        "shared_positive_emotion"
    ) {
      advicePolicy =
        "do_not_coach_unless_asked";

      required.add(
        "join_positive_emotion"
      );

      forbidden.add(
        "overcoaching"
      );

      forbidden.add(
        "turning_positive_share_into_lesson"
      );
    }

    if (
      currentNeed ===
        "emotional_presence"
    ) {
      advicePolicy =
        adviceRequested
          ? "gentle_advice_after_presence"
          : "presence_first";

      required.add(
        "attune_first"
      );

      forbidden.add(
        "fixing_too_fast"
      );

      forbidden.add(
        "silver_lining"
      );

      forbidden.add(
        "analysis_before_presence"
      );

      shouldAskQuestion =
        interpretation
          .clarificationRequired ===
        true;

      questionPurpose =
        shouldAskQuestion
          ? "clarify_emotional_context"
          : null;

      maxQuestions =
        shouldAskQuestion
          ? 1
          : 0;
    }

    if (
      currentNeed ===
        "reflective_emotional_processing"
    ) {
      advicePolicy =
        "one_practical_step_after_reflection";

      required.add(
        "reflect_stated_pattern_accurately"
      );

      required.add(
        "separate_first_reaction_from_later_position"
      );

      required.add(
        "acknowledge_before_advising"
      );

      forbidden.add(
        "diagnose_user"
      );

      forbidden.add(
        "shame_defensiveness"
      );

      forbidden.add(
        "generic_follow_up_question"
      );

      forbidden.add(
        "treat_statement_as_yes_no_question"
      );

      shouldAskQuestion =
        false;

      questionPurpose =
        null;

      maxQuestions =
        0;
    }

    if (
      currentNeed ===
        "deescalation_and_repair"
    ) {
      advicePolicy =
        "one_repair_step";

      required.add(
        "lower_temperature"
      );

      required.add(
        "give_one_next_step"
      );

      forbidden.add(
        "blame_escalation"
      );

      forbidden.add(
        "winning_the_argument_frame"
      );

      forbidden.add(
        "over_apologizing"
      );
    }

    if (
      currentNeed ===
        "decision_support"
    ) {
      advicePolicy =
        "organize_tradeoff";

      required.add(
        "separate_options"
      );

      required.add(
        "give_next_step"
      );

      forbidden.add(
        "pretending_certainty"
      );
    }

    if (
      currentNeed ===
        "clear_information"
    ) {
      advicePolicy =
        "direct_answer";

      required.add(
        "answer_first"
      );

      forbidden.add(
        "overexplaining"
      );

      forbidden.add(
        "clarifying_question_before_direct_answer"
      );
    }

    if (
      currentNeed ===
        "practical_next_step"
    ) {
      advicePolicy =
        "practical_steps";

      required.add(
        "give_actionable_step"
      );

      forbidden.add(
        "vague_support"
      );
    }

    if (
      currentNeed ===
        "memory_acknowledgment"
    ) {
      advicePolicy =
        "acknowledge_only";

      required.add(
        "acknowledge_memory_request"
      );

      forbidden.add(
        "add_unrequested_advice"
      );
    }

    if (
      currentNeed ===
        "reflect_then_clarify"
    ) {
      advicePolicy =
        "clarify_before_solving";

      shouldAskQuestion =
        true;

      questionPurpose =
        "clarify_need";

      maxQuestions =
        1;

      required.add(
        "reflect_understanding"
      );

      forbidden.add(
        "assuming_need"
      );
    }

    if (
      routing.contextLane ===
        "missing_context"
    ) {
      advicePolicy =
        "recover_required_context";

      shouldAskQuestion =
        true;

      questionPurpose =
        "recover_missing_context";

      maxQuestions =
        1;

      required.add(
        "ask_for_missing_context"
      );

      forbidden.add(
        "invent_prior_context"
      );
    }

    if (
  continuity
    .effectiveUnresolvedReferenceCount >
    0 &&
  interpretation
    .clarificationRequired
) {
      shouldAskQuestion =
        true;

      questionPurpose =
        questionPurpose ||
        "resolve_reference";

      maxQuestions =
        1;

      constraints.add(
        "do_not_guess_unresolved_reference"
      );
    }

    return {
      advicePolicy,

      coachingPermissionRequired,

      shouldAskQuestion,

      questionPurpose,

      maxQuestions,

      required:
        [...required],

      forbidden:
        [...forbidden],

      constraints:
        [...constraints]
    };
  },

  getMeaningAvoidRules(
    meaning = {}
  ) {
    const meaningId =
      this.normalizeIdentifier(
        meaning.meaningId ||
        meaning.primaryMeaning?.id ||
        ""
      );

    const map = {
      safety_risk: [
        "casual_tone",
        "delayed_help"
      ],

      health_worry: [
        "diagnosis",
        "false_reassurance"
      ],

      self_criticism: [
        "shame_language",
        "agreeing_with_self_attack"
      ],

      body_change_concern: [
        "shame_language",
        "diet_plan_too_fast"
      ],

      grief_or_loss: [
        "silver_lining",
        "rushing_grief"
      ],

      celebration: [
        "overcoaching"
      ],

      support_received: [
        "turning_positive_share_into_lesson"
      ],

      relationship_repair_need: [
        "blame_escalation"
      ]
    };

    return map[meaningId] ||
      [];
  },

  /* =====================================================
     STRATEGY
  ===================================================== */

  buildStrategy({
    summary = {},
    routing = {},
    safety = {},
    understanding = {},
    interpretation = {},
    policy = {}
  } = {}) {
    const currentNeed =
      interpretation.currentNeed;

    const responseGoal =
      this.resolveResponseGoal({
        currentNeed,
        interpretation
      });

    const responseShape =
      this.resolveResponseShape({
        currentNeed,
        safety,
        interpretation,
        policy
      });

    const responsePosture =
      this.resolveResponsePosture({
        currentNeed,
        safety,
        understanding
      });

    return {
      responseGoal,

      responseShape,

      responsePosture,

      currentNeed,

      advicePolicy:
        policy.advicePolicy,

      coachingPermissionRequired:
        policy
          .coachingPermissionRequired,

      answerMode:
        this.resolveAnswerMode({
          currentNeed,
          safety,
          policy
        }),

      desiredOutcome:
        this.resolveDesiredOutcome({
          currentNeed,
          interpretation
        }),

      contextLane:
        routing.contextLane,

      primaryLane:
        routing.primaryLane,

      planner:
        routing.planner,

      source:
        "ari-response-planner",

      authority:
        "response_strategy_only"
    };
  },

  resolveResponseGoal({
    currentNeed = "",
    interpretation = {}
  } = {}) {
    const map = {
      immediate_safety:
        "protect_user",

      safe_health_guidance:
        "provide_safe_health_orientation",

      shared_positive_emotion:
        "share_and_strengthen_positive_moment",

      validation_before_coaching:
        "support_before_coaching",

      deescalation_and_repair:
        "lower_temperature_and_support_repair",

      emotional_presence:
        "help_user_feel_understood",

      reflective_emotional_processing:
        "help_user_understand_and_communicate_their_processing_pattern",

      practical_next_step:
        "help_user_act",

      decision_support:
        "help_user_choose",

      clear_information:
        "answer_question",

      memory_acknowledgment:
        "acknowledge_memory_request",

      reflect_then_clarify:
        "understand_need_before_solving",

      direct_response:
        "respond_directly"
    };

    return map[currentNeed] ||
      interpretation.userGoal ||
      "respond_helpfully";
  },

  resolveResponseShape({
    currentNeed = "",
    safety = {},
    interpretation = {},
    policy = {}
  } = {}) {
    if (
      safety.shouldStopNormalResponse ||
      currentNeed ===
        "immediate_safety"
    ) {
      return "urgent_short_direct";
    }

    const map = {
      safe_health_guidance:
        "calm_guidance_with_thresholds",

      shared_positive_emotion:
        "brief_warm_reflection",

      validation_before_coaching:
        policy
          .coachingPermissionRequired
          ? "validate_then_permission_question"
          : "validate_then_small_step",

      deescalation_and_repair:
        "relationship_truth_then_repair_step",

      emotional_presence:
        interpretation
          .clarificationRequired
          ? "presence_then_question"
          : "presence_then_grounding",

      reflective_emotional_processing:
        "brief_reflection_then_relationship_translation",

      decision_support:
        "tradeoff_then_next_step",

      clear_information:
        "answer_then_context",

      practical_next_step:
        "contained_steps",

      memory_acknowledgment:
        "brief_acknowledgment",

      reflect_then_clarify:
        "reflect_then_clarify",

      direct_response:
        "direct_then_context"
    };

    return map[currentNeed] ||
      "direct_then_context";
  },

  resolveResponsePosture({
    currentNeed = "",
    safety = {},
    understanding = {}
  } = {}) {
    const humanState =
      understanding.humanState ||
      {};

    const declared =
      humanState.responsePosture
        ?.id ||
      humanState.responsePosture ||
      null;

    if (declared) {
      return declared;
    }

    if (
      safety.shouldStopNormalResponse ||
      currentNeed ===
        "immediate_safety"
    ) {
      return "calm_direct_protective";
    }

    const map = {
      safe_health_guidance:
        "calm_clear",

      shared_positive_emotion:
        "warm_joining",

      validation_before_coaching:
        "warm_non_shaming",

      deescalation_and_repair:
        "steady_non_blaming",

      emotional_presence:
        "warm_present",

      reflective_emotional_processing:
        "warm_reflective_direct",

      decision_support:
        "clear_protective",

      clear_information:
        "clear_patient",

      practical_next_step:
        "focused_practical",

      memory_acknowledgment:
        "brief_confirming",

      reflect_then_clarify:
        "warm_curious",

      direct_response:
        "natural_direct"
    };

    return map[currentNeed] ||
      "natural_direct";
  },

  resolveAnswerMode({
    currentNeed = "",
    safety = {},
    policy = {}
  } = {}) {
    if (
      safety.shouldStopNormalResponse ||
      currentNeed ===
        "immediate_safety"
    ) {
      return "urgent_action_first";
    }

    const map = {
      safe_health_guidance:
        "safe_step_then_thresholds",

      shared_positive_emotion:
        "join_then_reflect",

      validation_before_coaching:
        policy
          .coachingPermissionRequired
          ? "validate_then_permission"
          : "validate_then_small_step",

      deescalation_and_repair:
        "name_pattern_then_repair",

      emotional_presence:
        "attune_then_ground",

      reflective_emotional_processing:
        "reflect_distinguish_translate",

      decision_support:
        "tradeoff_then_action",

      clear_information:
        "direct_answer_then_context",

      practical_next_step:
        "steps_first",

      memory_acknowledgment:
        "acknowledge_only",

      reflect_then_clarify:
        "reflect_then_one_question",

      direct_response:
        "direct_then_context"
    };

    return map[currentNeed] ||
      "direct_then_context";
  },

  resolveDesiredOutcome({
    currentNeed = "",
    interpretation = {}
  } = {}) {
    const map = {
      immediate_safety:
        "The user receives an immediate protective next step.",

      safe_health_guidance:
        "The user understands the safest first step and when to seek care.",

      shared_positive_emotion:
        "The user feels that Ari genuinely shared the positive moment.",

      validation_before_coaching:
        "The user feels understood before any coaching begins.",

      deescalation_and_repair:
        "The user receives one concrete step that lowers conflict and supports repair.",

      emotional_presence:
        "The user feels emotionally met without being rushed into fixing.",

      reflective_emotional_processing:
        "The user recognizes the difference between an immediate defensive reaction and a later considered response, and can communicate that pattern clearly.",

      decision_support:
        "The user understands the tradeoff and knows the next decision step.",

      clear_information:
        "The user receives a direct and useful answer.",

      practical_next_step:
        "The user knows the next contained action and how to test it.",

      memory_acknowledgment:
        "The user receives a clear acknowledgment that the memory request was understood.",

      reflect_then_clarify:
        "The user is understood and asked only the clarification needed to proceed.",

      direct_response:
        "The user receives a direct response aligned with the current request."
    };

    return map[currentNeed] ||
      interpretation.userGoal ||
      "The user receives a useful response.";
  },

  /* =====================================================
     BLUEPRINT
  ===================================================== */

  resolveBlueprint({
    summary = {},
    strategy = {},
    interpretation = {},
    safety = {}
  } = {}) {
    const requested =
      summary.responseBlueprintHint ||
      summary.plannerBlueprintHint ||
      this.currentNeedRegistry[
        interpretation.currentNeed
      ]?.blueprint ||
      null;

    let id =
      requested;

    let fallbackUsed =
      false;

    let fallbackReason =
      null;

    if (
      safety.shouldStopNormalResponse
    ) {
      id =
        "safety_urgent_support";
    }

    if (
      !id ||
      !this.blueprintRegistry[id]
    ) {
      id =
        this.fallbackBlueprintForStrategy(
          strategy
        );

      fallbackUsed =
        true;

      fallbackReason =
        requested
          ? `Unknown blueprint identifier: ${requested}`
          : "No blueprint identifier was produced.";
    }

    const registryEntry =
      this.blueprintRegistry[id];

    return {
      id,

      family:
        registryEntry.family,

      valid:
        true,

      registered:
        true,

      fallbackUsed,

      fallbackReason,

      aiAllowed:
        registryEntry.aiAllowed !==
        false,

      defaultShape:
        registryEntry.defaultShape,

      requestedId:
        requested,

      authority:
        "registered_blueprint_selection_only"
    };
  },

  fallbackBlueprintForStrategy(
    strategy = {}
  ) {
    const primaryLane =
      this.normalizeIdentifier(
        strategy.primaryLane
      );

    if (
      [
        "emotion",
        "emotional_support"
      ].includes(primaryLane)
    ) {
      return "emotion_presence_grounding";
    }

    if (
      [
        "builder",
        "developer",
        "project_help"
      ].includes(primaryLane)
    ) {
      return "builder_direct_help";
    }

    if (
      [
        "teacher",
        "knowledge"
      ].includes(primaryLane)
    ) {
      return "knowledge_clear_explanation";
    }

    if (
      [
        "medical",
        "medical_body",
        "health"
      ].includes(primaryLane)
    ) {
      return "medical_context_calm_guidance";
    }

    return "general_direct_response";
  },

  /* =====================================================
     STRUCTURED RESPONSE MOVES
  ===================================================== */

  resolveStructuredMoves({
    summary = {},
    turn = {},
    continuity = {},
    safety = {},
    understanding = {},
    interpretation = {},
    policy = {},
    strategy = {},
    blueprint = {}
  } = {}) {
    const moveIds =
      this.resolveMoveIds({
        currentNeed:
          interpretation.currentNeed,

        policy,

        safety,

        clarificationRequired:
          interpretation
            .clarificationRequired
      });

    return moveIds.map(
      (
        moveId,
        index
      ) =>
        this.buildMove({
          moveId,
          order:
            index + 1,

          required:
            true,

          turn,
          continuity,
          safety,
          understanding,
          interpretation,
          strategy,
          blueprint,
          summary
        })
    );
  },

  resolveMoveIds({
    currentNeed = "",
    policy = {},
    safety = {},
    clarificationRequired = false
  } = {}) {
    if (
      safety.shouldStopNormalResponse ||
      currentNeed ===
        "immediate_safety"
    ) {
      return [
        "pause_and_prioritize_safety",
        "give_direct_safety_step",
        "urge_trusted_or_emergency_support"
      ];
    }

    const map = {
      safe_health_guidance: [
        "calm_medical_frame",
        "name_safe_first_step",
        "include_red_flags_or_clinician_boundary"
      ],

      shared_positive_emotion: [
        "join_positive_emotion",
        "name_what_it_means",
        "reflect_strength_or_connection"
      ],

      validation_before_coaching:
        policy
          .coachingPermissionRequired
          ? [
              "validate_feeling",
              "name_pattern_gently",
              "ask_permission_before_coaching"
            ]
          : [
              "validate_feeling",
              "name_pattern_gently",
              "offer_small_practical_next_step"
            ],

      deescalation_and_repair: [
        "name_relationship_or_conflict_truth",
        "lower_blame",
        "offer_one_repair_step"
      ],

      emotional_presence:
        clarificationRequired
          ? [
              "attune_to_emotion",
              "validate_emotional_weight",
              "invite_context_or_stay_present"
            ]
          : [
              "attune_to_emotion",
              "validate_emotional_weight",
              "offer_small_practical_next_step"
            ],

      reflective_emotional_processing: [
        "reflect_initial_defensiveness",
        "distinguish_first_reaction_from_final_position",
        "validate_processing_time",
        "translate_pattern_for_partner"
      ],

      decision_support: [
        "name_tradeoff",
        "separate_options",
        "recommend_next_decision_step"
      ],

      clear_information: [
        "answer_directly",
        "brief_explanation",
        "usable_context"
      ],

      practical_next_step: [
        "confirm_practical_goal",
        "give_contained_steps",
        "suggest_test_or_followup"
      ],

      memory_acknowledgment: [
        "acknowledge_memory_request"
      ],

      reflect_then_clarify: [
        "reflect_understanding",
        "name_possible_meaning",
        "ask_clarifying_question"
      ],

      direct_response: [
        "answer_directly",
        "brief_explanation"
      ]
    };

    return map[currentNeed] ||
      map.direct_response;
  },

  buildMove({
    moveId = "",
    order = 0,
    required = true,
    continuity = {},
    safety = {},
    understanding = {},
    interpretation = {},
    strategy = {},
    blueprint = {},
    summary = {}
  } = {}) {
    const registryEntry =
      this.moveRegistry[moveId] ||
      null;

    if (!registryEntry) {
      return {
        id:
          moveId,

        order,

        required,

        registered:
          false,

        renderer:
          "unknown",

        purpose:
          "Unknown response move.",

        contentGuidance:
          null,

        evidenceRefs:
          [],

        warnings: [
          {
            type:
              "unknown_response_move",

            moveId
          }
        ]
      };
    }

    return {
      id:
        registryEntry.id,

      order,

      required,

      registered:
        true,

      family:
        registryEntry.family,

      renderer:
        registryEntry.renderer,

      purpose:
        registryEntry.purpose,

      contentGuidance:
        this.buildMoveGuidance({
          moveId,
          continuity,
          safety,
          understanding,
          interpretation,
          strategy,
          blueprint,
          summary
        }),

      evidenceRefs:
        this.collectMoveEvidenceRefs({
          moveId,
          continuity,
          safety,
          understanding,
          summary
        }),

      authority:
        "response_move_instruction_only"
    };
  },

  buildMoveGuidance({
    moveId = "",
    continuity = {},
    safety = {},
    interpretation = {},
    strategy = {}
  } = {}) {
    const map = {
      pause_and_prioritize_safety:
        "Lead with immediate safety and suspend normal conversational framing.",

      give_direct_safety_step:
        "Give one direct action supported by the safety contract.",

      urge_trusted_or_emergency_support:
        "Direct the user toward appropriate emergency or trusted human support without delay.",

      calm_medical_frame:
        "Treat the concern seriously without panic, dismissal, or diagnosis.",

      name_safe_first_step:
        "Give the safest practical first step supported by available evidence.",

      include_red_flags_or_clinician_boundary:
        "Name the clearest escalation thresholds or clinician boundary.",

      join_positive_emotion:
        "Join the positive feeling naturally and avoid converting it into a lesson.",

      name_what_it_means:
        "Reflect the likely emotional importance only when evidence supports it.",

      reflect_strength_or_connection:
        "Reflect the connection, support, or strength present in the user's account.",

      validate_feeling:
        "Acknowledge the user's stated feeling without exaggerating or agreeing with self-attack.",

      name_pattern_gently:
        "Describe the possible pattern as an inference, not a diagnosis or established fact.",

      ask_permission_before_coaching:
        "Ask one direct question about whether the user wants advice.",

      offer_small_practical_next_step:
        "Offer one realistic action and stop after it.",

      name_relationship_or_conflict_truth:
        "Name the central relationship dynamic without deciding who is morally right.",

      lower_blame:
        "Shift from blame and winning toward understanding and repair.",

      offer_one_repair_step:
        "Give one concrete relationship-repair action or sentence.",

      attune_to_emotion:
        "Signal presence before explanation or advice.",

      validate_emotional_weight:
        "Acknowledge the emotional weight in plain language.",

      invite_context_or_stay_present:
        "Ask one targeted question only when more context is genuinely needed.",

      reflect_initial_defensiveness:
        "Reflect that the user initially becomes defensive when criticized.",

      distinguish_first_reaction_from_final_position:
        "Explain that the first defensive reaction is not necessarily the user's final considered position.",

      validate_processing_time:
        "Frame processing time as legitimate when the user communicates it and returns to the conversation.",

      translate_pattern_for_partner:
        "Give one concise way to explain this pattern to the partner without using it as an excuse.",

      name_tradeoff:
        "Name the tradeoff using concrete user terms rather than abstract priority language.",

      separate_options:
        "Separate the competing questions, costs, or options.",

      recommend_next_decision_step:
        "Give one next decision step without pretending certainty.",

      answer_directly:
        "Answer the actual current-turn request before explanation.",

      brief_explanation:
        "Explain only enough to make the answer useful.",

      usable_context:
        "Add one relevant example, implication, or practical context when it improves comprehension.",

      confirm_practical_goal:
        "State the concrete implementation goal before describing changes.",

      give_contained_steps:
        "Give a contained set of steps and avoid combining unrelated architecture changes.",

      suggest_test_or_followup:
        "Define the exact test or validation step before more changes.",

      acknowledge_memory_request:
        "Acknowledge the memory request directly without adding unrelated content.",

      reflect_understanding:
        "Reflect the most defensible understanding of the user's need.",

      name_possible_meaning:
        "Name a possible meaning while preserving uncertainty.",

      ask_clarifying_question:
        "Ask one specific question required to resolve the ambiguity."
    };

    return (
      map[moveId] ||
      strategy.responseGoal ||
      interpretation.userGoal ||
      null
    );
  },

  collectMoveEvidenceRefs({
    moveId = "",
    continuity = {},
    safety = {},
    understanding = {},
    summary = {}
  } = {}) {
    const refs = [];

    if (
      moveId.startsWith(
        "reflect_"
      ) ||
      moveId.includes(
        "relationship"
      ) ||
      moveId.includes(
        "processing"
      )
    ) {
      continuity.usableFacts
        .slice(0, 5)
        .forEach(
          fact => {
            this.toArray(
              fact.evidenceRefs
            ).forEach(
              ref =>
                refs.push(ref)
            );
          }
        );
    }

    if (
      moveId.includes(
        "safety"
      ) ||
      moveId.includes(
        "red_flags"
      )
    ) {
      this.toArray(
        safety.contract
          ?.evidenceRefs
      ).forEach(
        ref =>
          refs.push(ref)
      );
    }

    this.toArray(
      understanding.meaning
        ?.evidenceRefs
    ).forEach(
      ref =>
        refs.push(ref)
    );

    this.toArray(
      summary.perceptionPacket
        ?.semantic
        ?.canonicalMeaning
        ?.evidenceRefs
    ).forEach(
      ref =>
        refs.push(ref)
    );

    return [
      ...new Set(
        refs.filter(Boolean)
      )
    ];
  },

  /* =====================================================
     GOVERNANCE
  ===================================================== */

  buildGovernance({
    summary = {},
    routing = {},
    continuity = {},
    safety = {},
    understanding = {},
    interpretation = {},
    policy = {},
    strategy = {},
    moves = []
  } = {}) {
    const requiredBehaviors =
      this.mergeUnique(
        policy.required,
        understanding.requiredBehaviors,
        safety.requiredBehaviors,
        summary.responseRequired,
        this.requiredForNeed(
          interpretation.currentNeed
        )
      );

    const forbiddenBehaviors =
      this.mergeUnique(
        policy.forbidden,
        understanding.forbiddenBehaviors,
        safety.forbiddenBehaviors,
        summary.responseAvoid,
        this.forbiddenForNeed(
          interpretation.currentNeed
        ),
        [
          "do_not_expose_internal_pipeline_language",
          "do_not_report_ai_draft_failure_to_user",
          "do_not_use_stale_developer_evidence_for_normal_conversation"
        ]
      );

    const constraints =
      this.mergeUnique(
        policy.constraints,
        understanding.constraints,
        safety.constraints,
        summary.responseConstraints,
        [
          "preserve_original_current_turn_meaning",
          "preserve_upstream_route",
          "preserve_safety_authority",
          "do_not_present_inference_as_explicit_fact"
        ]
      );

    const responseRules =
      this.mergeUnique(
        summary.responseRules,
        [
          "answer_or_reflect_the_current_turn_before_expanding",
          "use_concrete_language",
          "use_only_relevant_continuity",
          "stop_when_the_response_goal_is_met"
        ]
      );

    return {
      requiredBehaviors,

      forbiddenBehaviors,

      constraints,

      responseRules,

      useContinuity:
        continuity.shouldUse,

      useMemory:
        routing.useMemory,

      useRelationshipContext:
        routing.useRelationship ||
        interpretation.currentNeed ===
          "deescalation_and_repair" ||
        interpretation.currentNeed ===
          "reflective_emotional_processing",

      moveCount:
        moves.length,

      authority:
        "response_content_governance_only"
    };
  },

  requiredForNeed(
    currentNeed = ""
  ) {
    const map = {
      reflective_emotional_processing: [
        "reflect_the_users_stated_pattern_accurately",
        "distinguish_immediate_defensiveness_from_later_reflection",
        "give_no_more_than_one_practical_communication_step"
      ],

      clear_information: [
        "answer_the_actual_question_first"
      ],

      deescalation_and_repair: [
        "reduce_blame",
        "give_one_repair_step"
      ],

      emotional_presence: [
        "acknowledge_before_advice"
      ],

      practical_next_step: [
        "give_contained_actionable_steps"
      ]
    };

    return map[currentNeed] ||
      [];
  },

  forbiddenForNeed(
    currentNeed = ""
  ) {
    const map = {
      reflective_emotional_processing: [
        "do_not_diagnose_the_user",
        "do_not_shame_defensiveness",
        "do_not_force_advice_before_acknowledgment",
        "do_not_ask_a_generic_follow_up_question"
      ],

      clear_information: [
        "do_not_replace_the_answer_with_a_clarifying_question"
      ],

      shared_positive_emotion: [
        "do_not_turn_the_positive_moment_into_a_lesson"
      ],

      practical_next_step: [
        "do_not_mix_multiple_unrelated_changes"
      ]
    };

    return map[currentNeed] ||
      [];
  },

  /* =====================================================
     INTERACTION POLICY
  ===================================================== */

  buildInteractionPolicy({
    interpretation = {},
    policy = {},
    safety = {}
  } = {}) {
    return {
      adviceRequested:
        interpretation
          .adviceRequested ===
        true,

      advicePolicy:
        policy.advicePolicy,

      coachingPermissionRequired:
        policy
          .coachingPermissionRequired ===
        true,

      shouldAskQuestion:
        policy.shouldAskQuestion ===
          true,

      questionPurpose:
        policy.questionPurpose ||
        null,

      maxQuestions:
        policy.maxQuestions ??
        0,

      finalQuestionAllowed:
        policy.shouldAskQuestion ===
          true,

      clarificationRequired:
        interpretation
          .clarificationRequired ===
          true ||
        safety.requiresClarification ===
          true,

      authority:
        "interaction_policy_only"
    };
  },

  /* =====================================================
     WRITER INSTRUCTIONS
  ===================================================== */

  buildWriterInstructions({
    summary = {},
    turn = {},
    routing = {},
    continuity = {},
    safety = {},
    interpretation = {},
    policy = {},
    strategy = {},
    blueprint = {},
    moves = [],
    governance = {},
    interactionPolicy = {}
  } = {}) {
    const budget =
      this.resolveLanguageBudget({
        summary,
        currentNeed:
          interpretation.currentNeed,

        safety,

        routing
      });

    return {
      answerFirst:
        ![
          "emotional_presence",
          "validation_before_coaching",
          "reflective_emotional_processing",
          "reflect_then_clarify"
        ].includes(
          interpretation.currentNeed
        ),

      reflectFirst:
        [
          "emotional_presence",
          "validation_before_coaching",
          "reflective_emotional_processing",
          "reflect_then_clarify"
        ].includes(
          interpretation.currentNeed
        ),

      turnId:
        turn.turnId,

      sourceQuestion:
  turn.resolvedText ||
  turn.originalText,

originalQuestion:
  turn.originalText,

resolvedQuestion:
  turn.resolvedText ||
  turn.originalText,

useResolvedQuestionForAnswering:
  turn.currentTurnWasSemanticallyResolved ===
    true,

resolvedQuestionIsInterpretiveHandoff:
  turn.resolvedTextIsSeparateInterpretation ===
    true,

      blueprintId:
        blueprint.id,

      openingMove:
        moves[0]?.id ||
        null,

      sequence:
        moves.map(
          move =>
            move.id
        ),

      endingMove:
        moves[
          moves.length - 1
        ]?.id ||
        null,

      tone:
        strategy.responsePosture,

      shape:
        strategy.responseShape,

      maxSentences:
        budget.maxSentences,

      maxWords:
        budget.maxWords,

      maxParagraphs:
        budget.maxParagraphs,

      maxQuestions:
        interactionPolicy
          .maxQuestions,

      finalQuestionAllowed:
        interactionPolicy
          .finalQuestionAllowed,

      useHeadings:
        budget.useHeadings,

      useBullets:
        budget.useBullets,

      oneIdeaPerSentence:
        true,

      onePracticalStepMaximum:
        [
          "emotional_presence",
          "reflective_emotional_processing",
          "deescalation_and_repair"
        ].includes(
          interpretation.currentNeed
        ),

      useContinuity:
        continuity.shouldUse,

      mentionPriorConversation:
        false,

      preserveFacts:
        true,

      preserveOriginalTurn:
        true,

      doNotRewriteQuestion:
        true,

      required:
        governance.requiredBehaviors,

      avoid:
        governance.forbiddenBehaviors,

      constraints:
        governance.constraints,

      doNotWrite: [
        "diagnosis_without_authority",
        "moralizing",
        "generic_lecture",
        "unsupported_certainty",
        "internal_pipeline_diagnostic",
        "AI_failure_message",
        "stale_developer_context",
        "raw_JSON",
        "response_planning_instructions"
      ],

      stopRules: {
        stopWhenGoalMet:
          true,

        stopAfterNextStep:
          true,

        noSecondSummary:
          true,

        noGenericCloser:
          true,

        noExtraWisdomAfterAction:
          true
      },

      authority:
        "writer_instruction_only"
    };
  },

  resolveLanguageBudget({
    summary = {},
    currentNeed = "",
    safety = {},
    routing = {}
  } = {}) {
    const text =
      this.normalize(
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const wantsConcise =
      /\b(?:concise|short|brief|quick|simple|straight to the point)\b/.test(
        text
      );

    const wantsDepth =
      /\b(?:deep|detailed|full|thorough|break it down|step by step|explain everything)\b/.test(
        text
      );

    if (
      safety.shouldStopNormalResponse ||
      currentNeed ===
        "immediate_safety"
    ) {
      return {
        maxSentences:
          4,

        maxWords:
          110,

        maxParagraphs:
          3,

        useHeadings:
          false,

        useBullets:
          false
      };
    }

    if (wantsConcise) {
      return {
        maxSentences:
          3,

        maxWords:
          70,

        maxParagraphs:
          2,

        useHeadings:
          false,

        useBullets:
          false
      };
    }

    if (wantsDepth) {
      return {
        maxSentences:
          10,

        maxWords:
          240,

        maxParagraphs:
          6,

        useHeadings:
          [
            "builder",
            "teacher",
            "medical_body"
          ].includes(
            routing.primaryLane
          ),

        useBullets:
          routing.primaryLane ===
            "builder"
      };
    }

    const map = {
      shared_positive_emotion: {
        maxSentences:
          3,

        maxWords:
          70,

        maxParagraphs:
          2,

        useHeadings:
          false,

        useBullets:
          false
      },

      validation_before_coaching: {
        maxSentences:
          3,

        maxWords:
          80,

        maxParagraphs:
          2,

        useHeadings:
          false,

        useBullets:
          false
      },

      emotional_presence: {
        maxSentences:
          3,

        maxWords:
          80,

        maxParagraphs:
          2,

        useHeadings:
          false,

        useBullets:
          false
      },

      reflective_emotional_processing: {
        maxSentences:
          4,

        maxWords:
          105,

        maxParagraphs:
          2,

        useHeadings:
          false,

        useBullets:
          false
      },

      deescalation_and_repair: {
        maxSentences:
          4,

        maxWords:
          105,

        maxParagraphs:
          2,

        useHeadings:
          false,

        useBullets:
          false
      },

      clear_information: {
        maxSentences:
          5,

        maxWords:
          140,

        maxParagraphs:
          3,

        useHeadings:
          false,

        useBullets:
          false
      },

      practical_next_step: {
        maxSentences:
          7,

        maxWords:
          180,

        maxParagraphs:
          5,

        useHeadings:
          true,

        useBullets:
          true
      },

      decision_support: {
        maxSentences:
          5,

        maxWords:
          125,

        maxParagraphs:
          3,

        useHeadings:
          false,

        useBullets:
          false
      },

      reflect_then_clarify: {
        maxSentences:
          3,

        maxWords:
          75,

        maxParagraphs:
          2,

        useHeadings:
          false,

        useBullets:
          false
      },

      memory_acknowledgment: {
        maxSentences:
          1,

        maxWords:
          30,

        maxParagraphs:
          1,

        useHeadings:
          false,

        useBullets:
          false
      }
    };

    return map[currentNeed] ||
      {
        maxSentences:
          4,

        maxWords:
          100,

        maxParagraphs:
          3,

        useHeadings:
          false,

        useBullets:
          false
      };
  },

  /* =====================================================
     PERSONALIZATION
  ===================================================== */

  buildPersonalization({
    summary = {},
    continuity = {}
  } = {}) {
    const memoryHandoff =
      summary.memoryHandoff ||
      summary.memoryStagePacket
        ?.handoff ||
      {};

    const facts =
      this.toArray(
        memoryHandoff.facts ||
        summary.memoryFacts ||
        summary.usableMemories
      );

    return {
      allowed:
        memoryHandoff
          .personalizationAllowed !==
        false,

      memoryUsed:
        summary.memoryRetrievalRan ===
          true ||
        facts.length >
          0,

      shouldMentionMemory:
        memoryHandoff
          .shouldMentionMemory ===
        true,

      relationshipContextUsed:
        Boolean(
          continuity.shouldUse &&
          (
            summary.relationshipContinuityContext ||
            summary.continuityStagePacket
              ?.relationship
              ?.used
          )
        ),

      facts,

      rules: [
        "Use only relevant and sufficiently reliable personalization.",
        "Do not mention memory retrieval unless the user asks.",
        "Do not use unrelated memory to fill missing facts.",
        "Do not let memory override the current turn."
      ],

      authority:
        "personalization_policy_only"
    };
  },

  /* =====================================================
     PROVENANCE
  ===================================================== */

  buildProvenance({
    summary = {},
    turn = {},
    routing = {},
    continuity = {},
    safety = {},
    understanding = {},
    interpretation = {},
    strategy = {},
    blueprint = {}
  } = {}) {
    return {
      turnId:
        turn.turnId,

      originalText:
        turn.originalText,

      normalizedText:
        turn.normalizedText,

      createdForCurrentTurn:
        turn.createdForCurrentTurn,

      currentTurnTextPreserved:
        turn.originalTextPreserved,

      currentTurnWasRewritten:
        turn.textWasRewritten,

      currentNeedSource:
        this.resolveCurrentNeedSource({
          summary,
          interpretation,
          understanding
        }),

      meaningSource:
        understanding.sources
          ?.meaning ||
        null,

      humanStateSource:
        understanding.sources
          ?.humanState ||
        null,

      safetySource:
        summary.safetyStageSource ||
        summary.safetyDisposition
          ?.source ||
        null,

      continuitySource:
        summary.continuityStageSource ||
        summary.continuityPacket
          ?.source ||
        null,

      routingSource:
        summary
          .executiveRoutingPipelineSource ||
        summary.laneSplitterSource ||
        summary.routingContract
          ?.source ||
        null,

      responseGoalSource:
        "ari-response-planner",

      blueprintSource:
        blueprint.fallbackUsed
          ? "ari-response-planner-fallback"
          : "current_need_registry",

      routePreserved:
        true,

      semanticMeaningPreserved:
        true,

      safetyAuthorityPreserved:
        true,

      continuityAuthorityPreserved:
        true,

      authority:
        "response_plan_provenance_only"
    };
  },

  resolveCurrentNeedSource({
    summary = {},
    interpretation = {},
    understanding = {}
  } = {}) {
    if (
      understanding.humanState
        ?.currentNeed
    ) {
      return "human_state";
    }

    if (
      understanding.meaning
        ?.currentNeed
    ) {
      return "meaning_interpreter";
    }

    if (
      interpretation.currentNeed ===
        "immediate_safety"
    ) {
      return "safety_policy";
    }

    if (
      summary.primaryLane
    ) {
      return "route_and_meaning_fallback";
    }

    return "response_planner_fallback";
  },

  /* =====================================================
     OBJECTIVE
  ===================================================== */

  buildObjective({
    strategy = {},
    interpretation = {},
    blueprint = {}
  } = {}) {
    return {
      responseGoal:
        strategy.responseGoal,

      responseShape:
        strategy.responseShape,

      responsePosture:
        strategy.responsePosture,

      currentNeed:
        interpretation.currentNeed,

      blueprintHint:
        blueprint.id,

      answerMode:
        strategy.answerMode,

      desiredOutcome:
        strategy.desiredOutcome,

      authority:
        "response_objective_only"
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validatePlanParts({
    turn = {},
    routing = {},
    continuity = {},
    safety = {},
    interpretation = {},
    strategy = {},
    blueprint = {},
    moves = [],
    governance = {},
    interactionPolicy = {},
    writerInstructions = {},
    provenance = {}
  } = {}) {
    const errors = [];
    const warnings = [];

    if (!turn.turnId) {
      errors.push({
        type:
          "missing_turn_id",

        message:
          "The response plan does not contain a current-turn identifier."
      });
    }

    if (!turn.originalText) {
      errors.push({
        type:
          "missing_original_text",

        message:
          "The response plan does not contain the original user text."
      });
    }

    if (
      turn.textWasRewritten ===
      true
    ) {
      errors.push({
        type:
          "current_turn_rewritten",

        message:
          "The response planner may not rewrite the current turn."
      });
    }

    if (
      !strategy.responseGoal
    ) {
      errors.push({
        type:
          "missing_response_goal"
      });
    }

    if (
      !strategy.responseShape
    ) {
      errors.push({
        type:
          "missing_response_shape"
      });
    }

    if (
      !blueprint.id ||
      !this.blueprintRegistry[
        blueprint.id
      ]
    ) {
      errors.push({
        type:
          "unregistered_blueprint",

        blueprintId:
          blueprint.id ||
          null
      });
    }

    if (!moves.length) {
      errors.push({
        type:
          "no_response_moves"
      });
    }

    moves.forEach(
      move => {
        if (
          !move.id ||
          !this.moveRegistry[
            move.id
          ]
        ) {
          errors.push({
            type:
              "unregistered_response_move",

            moveId:
              move.id ||
              null
          });
        }
      }
    );

    const duplicateMoveIds =
      this.findDuplicates(
        moves.map(
          move =>
            move.id
        )
      );

    if (
      duplicateMoveIds.length
    ) {
      warnings.push({
        type:
          "duplicate_response_moves",

        moveIds:
          duplicateMoveIds
      });
    }

    if (
      continuity.required &&
      !continuity.available
    ) {
      warnings.push({
        type:
          "required_continuity_unavailable",

        message:
          "The route requires continuity, but the continuity packet is not ready."
      });
    }

    if (
  continuity
    .effectiveUnresolvedReferenceCount >
    0 &&
  interactionPolicy
    .shouldAskQuestion !==
    true &&
  interpretation
    .clarificationRequired ===
    true
) {
      warnings.push({
        type:
          "unresolved_reference_without_question_policy",

        count:
  continuity
    .effectiveUnresolvedReferenceCount
      });
    }

    if (
      safety.shouldStopNormalResponse &&
      blueprint.id !==
        "safety_urgent_support"
    ) {
      errors.push({
        type:
          "safety_blueprint_mismatch",

        blueprintId:
          blueprint.id
      });
    }

    if (
      interactionPolicy
        .maxQuestions >
        1
    ) {
      warnings.push({
        type:
          "question_budget_above_one",

        maxQuestions:
          interactionPolicy
            .maxQuestions
      });
    }

    if (
      !writerInstructions
        .turnId ||
      writerInstructions
        .turnId !==
        turn.turnId
    ) {
      errors.push({
        type:
          "writer_instruction_turn_mismatch"
      });
    }

    if (
      provenance.turnId !==
        turn.turnId
    ) {
      errors.push({
        type:
          "provenance_turn_mismatch"
      });
    }

    if (
      !governance
        .requiredBehaviors
        ?.length
    ) {
      warnings.push({
        type:
          "no_required_behaviors"
      });
    }

    return {
      valid:
        errors.length ===
        0,

      errors,

      warnings,

      checkedAt:
        new Date().toISOString(),

      authority:
        "response_plan_contract_validation"
    };
  },

  /* =====================================================
     QUALITY
  ===================================================== */

  buildQuality({
    turn = {},
    routing = {},
    continuity = {},
    safety = {},
    understanding = {},
    interpretation = {},
    strategy = {},
    blueprint = {},
    moves = [],
    validation = {}
  } = {}) {
    const unsupportedMoves =
      moves
        .filter(
          move =>
            !move.registered
        )
        .map(
          move =>
            move.id
        );

    return {
      hasCurrentTurnProvenance:
        Boolean(
          turn.turnId &&
          turn.originalText
        ),

      currentTurnMatches:
        turn.createdForCurrentTurn ===
          true,

      originalTextPreserved:
        turn.originalTextPreserved ===
          true,

      hasRouting:
        Boolean(
          routing.contextLane &&
          routing.primaryLane
        ),

      hasResponseGoal:
        Boolean(
          strategy.responseGoal
        ),

      hasResponseShape:
        Boolean(
          strategy.responseShape
        ),

      hasCurrentNeed:
        Boolean(
          interpretation.currentNeed
        ),

      hasBlueprintHint:
        Boolean(
          blueprint.id
        ),

      hasWriterInstructions:
        true,

      hasResponseMoves:
        moves.length >
        0,

      continuityRequired:
        continuity.required,

      continuityAvailable:
        continuity.available,

      safetyApplicable:
        safety.applicable,

      moveCount:
        moves.length,

      unsupportedMoves,

      unresolvedReferenceCount:
        continuity
          .unresolvedReferences
          .length,

      validationErrorCount:
        validation.errors
          .length,

      validationWarningCount:
        validation.warnings
          .length,

      readyForBlueprintWriter:
        validation.valid &&
        Boolean(
          blueprint.id
        ),

      readyForAIWriter:
        validation.valid &&
        blueprint.aiAllowed !==
          false,

      readyForCandidateArbiter:
        validation.valid,

      authority:
        "response_plan_quality_report_only"
    };
  },

  /* =====================================================
     CONFIDENCE
  ===================================================== */

  resolveConfidence({
    summary = {},
    routing = {},
    continuity = {},
    safety = {},
    understanding = {},
    interpretation = {},
    quality = {}
  } = {}) {
    const values = [
      interpretation.confidence,
      understanding.confidence,
      summary.routingConfidence,
      summary.routingConfidenceScore,
      summary.continuityPacketConfidence,
      summary.safetyConfidence
    ]
      .map(
        value =>
          this.normalizeConfidence(
            value
          )
      )
      .filter(
        value =>
          value >
          0
      );

    let confidence =
      values.length
        ? values.reduce(
            (
              total,
              value
            ) =>
              total + value,
            0
          ) /
          values.length
        : 0.5;

    if (
      routing.mustUsePriorContext &&
      continuity.available
    ) {
      confidence +=
        0.05;
    }

    if (
      routing.mustUsePriorContext &&
      !continuity.available
    ) {
      confidence -=
        0.2;
    }

    if (
  continuity
    .effectiveUnresolvedReferenceCount >
    0
) {
  confidence -=
    Math.min(
      0.2,
      continuity
        .effectiveUnresolvedReferenceCount *
        0.05
    );
}

    if (
      quality
        .validationErrorCount >
        0
    ) {
      confidence -=
        0.25;
    }

    if (
      safety.shouldStopNormalResponse &&
      safety.riskLevel ===
        "none"
    ) {
      confidence -=
        0.1;
    }

    return Number(
      this.normalizeConfidence(
        confidence
      ).toFixed(3)
    );
  },

  /* =====================================================
     HANDOFF
  ===================================================== */

  buildHandoff({
    validation = {},
    quality = {},
    blueprint = {},
    moves = []
  } = {}) {
    return {
      nextStage:
        "expression",

      preferredConsumer:
        "ari-blueprint-writer",

      fallbackConsumer:
        "ari-ai-writer",

      validationConsumer:
        "ari-response-candidate-arbiter",

      canonicalPath:
        "composerPacket.responsePlan",

      blueprintPath:
        "composerPacket.responsePlan.blueprint.id",

      responseMovesPath:
        "composerPacket.responsePlan.moves",

      writerInstructionsPath:
        "composerPacket.responsePlan.writerInstructions",

      readyForExpression:
        validation.valid,

      readyForBlueprintWriter:
        quality
          .readyForBlueprintWriter,

      readyForAIWriter:
        quality
          .readyForAIWriter,

      readyForCandidateArbiter:
        quality
          .readyForCandidateArbiter,

      blueprintId:
        blueprint.id,

      moveIds:
        moves.map(
          move =>
            move.id
        ),

      authority:
        "response_plan_expression_handoff_only"
    };
  },

  /* =====================================================
     RETURN PAYLOAD
  ===================================================== */

  buildReturnPayload(
    responsePlan = {}
  ) {
    return {
      responsePlannerRan:
        true,

      responsePlannerVersion:
        this.version,

      responsePlannerSource:
        "ari-response-planner",

      schema:
        responsePlan.schema,

      schemaVersion:
        responsePlan.schemaVersion,

      ready:
        responsePlan.ready,

      usable:
        responsePlan.usable,

      responsePlan,

      canonicalResponsePlan:
        responsePlan,

      /*
       * Temporary compatibility aliases.
       *
       * Every alias is derived from responsePlan.
       */
      turnId:
        responsePlan.turnId,

      sourceQuestion:
        responsePlan.sourceQuestion,

      userQuestion:
        responsePlan.userQuestion,

      responseGoal:
        responsePlan.strategy
          ?.responseGoal ||
        null,

      responseShape:
        responsePlan.strategy
          ?.responseShape ||
        null,

      responsePosture:
        responsePlan.strategy
          ?.responsePosture ||
        null,

      currentNeed:
        responsePlan.interpretation
          ?.currentNeed ||
        null,

      adviceRequested:
        responsePlan.interactionPolicy
          ?.adviceRequested ===
        true,

      advicePolicy:
        responsePlan.interactionPolicy
          ?.advicePolicy ||
        null,

      coachingPermissionRequired:
        responsePlan.interactionPolicy
          ?.coachingPermissionRequired ===
        true,

      responseMoves:
        responsePlan.moves ||
        [],

      blueprintHint:
        responsePlan.blueprint
          ?.id ||
        null,

      writerInstructions:
        responsePlan.writerInstructions ||
        null,

      shouldAskQuestion:
        responsePlan.interactionPolicy
          ?.shouldAskQuestion ===
        true,

      questionPurpose:
        responsePlan.interactionPolicy
          ?.questionPurpose ||
        null,

      requiredBehaviors:
        responsePlan.governance
          ?.requiredBehaviors ||
        [],

      forbiddenBehaviors:
        responsePlan.governance
          ?.forbiddenBehaviors ||
        [],

      constraints:
        responsePlan.governance
          ?.constraints ||
        [],

      required:
        responsePlan.governance
          ?.requiredBehaviors ||
        [],

      avoid:
        responsePlan.governance
          ?.forbiddenBehaviors ||
        [],

      validation:
        responsePlan.validation ||
        null,

      quality:
        responsePlan.quality ||
        null,

      confidence:
        responsePlan.confidence,

      authority: {
        canDefineResponseStrategy:
          true,

        canDefineResponseMoves:
          true,

        canDefineWriterInstructions:
          true,

        canWriteFinalLanguage:
          false,

        canSelectFinalDraft:
          false,

        role:
          "canonical_response_plan_return_handoff"
      }
    };
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  extractIdentifier(
    value = null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (
      typeof value ===
        "string"
    ) {
      return this.normalizeIdentifier(
        value
      );
    }

    if (
      typeof value ===
        "object"
    ) {
      return this.normalizeIdentifier(
        value.id ||
        value.name ||
        value.type ||
        value.label ||
        value.value ||
        ""
      );
    }

    return this.normalizeIdentifier(
      value
    );
  },

  firstFinite(
    values = []
  ) {
    for (
      const value
      of this.toArray(values)
    ) {
      const normalized =
        this.normalizeConfidence(
          value
        );

      if (
        normalized >
        0
      ) {
        return normalized;
      }
    }

    return null;
  },

  findDuplicates(
    values = []
  ) {
    const seen =
      new Set();

    const duplicates =
      new Set();

    this.toArray(values)
      .forEach(
        value => {
          const key =
            this.normalizeIdentifier(
              value
            );

          if (!key) {
            return;
          }

          if (
            seen.has(key)
          ) {
            duplicates.add(
              value
            );

            return;
          }

          seen.add(key);
        }
      );

    return [
      ...duplicates
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
          this.toArray(value)
      )
      .forEach(
        value => {
          if (
            value ===
              null ||
            value ===
              undefined ||
            value ===
              ""
          ) {
            return;
          }

          const key =
            this.normalizeIdentifier(
              typeof value ===
                "object"
                ? (
                    value.id ||
                    value.name ||
                    value.type ||
                    value.value ||
                    value.claim ||
                    JSON.stringify(
                      value
                    )
                  )
                : value
            );

          if (
            !key ||
            seen.has(key)
          ) {
            return;
          }

          seen.add(key);

          output.push(value);
        }
      );

    return output;
  },

  toArray(
    value = []
  ) {
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
        null ||
      value ===
        undefined ||
      value ===
        ""
    ) {
      return [];
    }

    return [value];
  },

  normalizeConfidence(
    value = 0
  ) {
    if (
      typeof value ===
        "string"
    ) {
      const normalized =
        value
          .toLowerCase()
          .trim();

      const labels = {
        none:
          0,

        very_low:
          0.2,

        low:
          0.4,

        medium:
          0.65,

        medium_high:
          0.75,

        high:
          0.85,

        very_high:
          0.95,

        critical:
          0.98
      };

      if (
        labels[normalized] !==
        undefined
      ) {
        return labels[normalized];
      }
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return 0;
    }

    if (
      number >
      1
    ) {
      return Math.max(
        0,
        Math.min(
          1,
          number /
          100
        )
      );
    }

    return Math.max(
      0,
      Math.min(
        1,
        number
      )
    );
  },

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
      index <
      text.length;
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
      hash >>>
      0
    ).toString(36);
  },

  deepFreeze(
    value,
    seen = new WeakSet()
  ) {
    if (
      value ===
        null ||
      typeof value !==
        "object"
    ) {
      return value;
    }

    if (
      seen.has(value)
    ) {
      return value;
    }

    seen.add(value);

    Reflect
      .ownKeys(value)
      .forEach(
        key => {
          const child =
            value[key];

          if (
            child &&
            typeof child ===
              "object"
          ) {
            this.deepFreeze(
              child,
              seen
            );
          }
        }
      );

    return Object.freeze(
      value
    );
  },

  clean(
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
    return this.clean(
      value
    )
      .toLowerCase()
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  },

  normalizeIdentifier(
    value = ""
  ) {
    return this.clean(
      value
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );
  }
};

window.Ari.responsePlanner =
  window.AriResponsePlanner;

console.log(
  "ARI RESPONSE PLANNER LOADED:",
  window.AriResponsePlanner?.version
);