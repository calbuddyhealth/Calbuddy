// api/knowledge.js
// REPLACEMENT SECTIONS FOR OPENAI COGNITIVE REASONING
//
// Apply these sections to the existing api/knowledge.js file.
//
// V5.0.0 — Authoritative Cognitive Reasoning and Draft Contract
//
// This replacement updates:
// - handleOpenAIReasoning
// - buildOpenAIReasoningSystemPrompt
// - buildOpenAIReasoningUserPrompt
//
// It preserves the existing preference lookup, semantic search,
// embedding, legacy realization, parsing, and shared utility sections.

/* =====================================================
   OPENAI COGNITIVE REASONING
===================================================== */

async function handleOpenAIReasoning(
  req,
  res,
  suppliedBody = {}
) {
  const totalStart =
    Date.now();

  const timing = {};

  const body =
    isPlainObject(suppliedBody)
      ? suppliedBody
      : isPlainObject(req.body)
        ? req.body
        : {};

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      ready: false,
      error:
        "Missing OPENAI_API_KEY.",
      failureType:
        "missing_environment_configuration",
      source:
        "openai_reasoning"
    });
  }

  const evidencePacket =
    normalizeObjectOrNull(
      body.evidencePacket ||
      body.perceptionPacket
        ?.evidencePacket
    );

  const executivePacket =
    normalizeObjectOrNull(
      body.executivePacket
    );

  const routingContract =
    normalizeObjectOrNull(
      body.routingContract ||
      executivePacket
        ?.routingContract
    );

  const continuity =
    normalizeObject(
      body.continuity ||
      body.continuityStagePacket ||
      body.continuityResolution
    );

  const safety =
    normalizeObject(
      body.safety ||
      body.safetyStagePacket ||
      body.safetyDisposition
    );

  const situation =
    normalizeObject(
      body.situation ||
      body.situationStagePacket ||
      body.situationContract ||
      body.situationMap
    );

  const memory =
    normalizeObject(
      body.memory ||
      body.memoryStagePacket ||
      body.memoryContext ||
      body.memoryHandoff
    );

  const originalQuestion =
    firstNonEmptyString([
      body.currentTurn
        ?.originalText,
      body.originalUserMessage,
      body.rawQuestion,
      body.userMessage,
      body.message,
      body.input
    ]);

  const effectiveQuestion =
    firstNonEmptyString([
      body.currentTurn
        ?.effectiveText,
      body.effectiveUserMessage,
      body.resolvedUserQuestion,
      body.resolvedQuestion,
      body.question,
      body.request
        ?.effective,
      originalQuestion
    ]);

  if (!effectiveQuestion) {
    return res.status(400).json({
      success: false,
      ready: false,
      error:
        "No effective question was provided for cognitive reasoning.",
      failureType:
        "invalid_request",
      source:
        "openai_reasoning"
    });
  }

  if (!evidencePacket) {
    return res.status(400).json({
      success: false,
      ready: false,
      error:
        "No evidencePacket was provided for cognitive reasoning.",
      failureType:
        "evidence_packet_missing",
      source:
        "openai_reasoning"
    });
  }

  const outputContract =
    normalizeObject(
      body.outputContract ||
      body.responseSchema
    );

  const reasoningInput = {
    schema:
      body.schema ||
      "ari_cognitive_reasoning_request",

    schemaVersion:
      body.schemaVersion ||
      "2.0.0",

    request: {
      original:
        originalQuestion,

      effective:
        effectiveQuestion,

      currentTurnWasResolved:
        body.currentTurnWasResolved ===
          true,

      turnId:
        body.currentTurn
          ?.turnId ||
        body.turnId ||
        null,

      language:
        body.request
          ?.language ||
        body.language ||
        null
    },

    currentTurn: {
      originalText:
        originalQuestion,

      effectiveText:
        effectiveQuestion,

      turnId:
        body.currentTurn
          ?.turnId ||
        body.turnId ||
        null
    },

    evidencePacket,

    perceptionPacket:
      normalizeObjectOrNull(
        body.perceptionPacket ||
        body.perception
      ),

    executivePacket,

    routingContract,

    conversation:
      normalizeObject(
        body.conversation
      ),

    knowledge:
      normalizeObject(
        body.knowledge
      ),

    understanding:
      normalizeObjectOrNull(
        body.understanding
      ),

    developerEvidence:
      normalizeObject(
        body.developerEvidence
      ),

    responseControl:
      normalizeObject(
        body.responseControl
      ),

    capabilities:
      normalizeObject(
        body.capabilities
      ),

    authority: {
      ...normalizeObject(
        body.authority
      ),

      safetyIsBinding:
        true,

      mayPlanResponse:
        true,

      mayDraftResponse:
        true,

      mustProduceDraftResponse:
        true,

      draftResponseIsAuthoritative:
        true,

      mayExecuteActions:
        false,

      mayPersistState:
        false,

      mayOverrideSafety:
        false,

      mayClaimToolSuccess:
        false,

      mayAuthorizeDelivery:
        false,

      mayExposePrivateChainOfThought:
        false
    },

    outputContract,

    deterministicContext: {
      continuity,
      safety,
      situation,
      memory
    },

    instructions:
      normalizeArray(
        body.instructions
      )
  };

  const systemPrompt =
    buildOpenAIReasoningSystemPrompt();

  const userPrompt =
    buildOpenAIReasoningUserPrompt(
      reasoningInput
    );

  const openAIStart =
    Date.now();

  const response =
    await fetch(
      OPENAI_CHAT_COMPLETIONS_URL,
      {
        method:
          "POST",

        headers:
          getOpenAIHeaders(),

        body:
          JSON.stringify({
            model:
              DEFAULT_OPENAI_MODEL,

            messages: [
              {
                role:
                  "system",

                content:
                  systemPrompt
              },

              {
                role:
                  "user",

                content:
                  userPrompt
              }
            ],

            temperature:
              0.2,

            max_tokens:
              3200,

            response_format: {
              type:
                "json_object"
            }
          })
      }
    );

  const data =
    await readJsonResponse(
      response
    );

  timing.openAIMs =
    Date.now() -
    openAIStart;

  if (!response.ok) {
    return res
      .status(response.status)
      .json({
        success:
          false,

        ready:
          false,

        error:
          data?.error
            ?.message ||
          data?.message ||
          "OpenAI reasoning request failed.",

        failureType:
          "openai_reasoning_request_failed",

        status:
          response.status,

        model:
          data?.model ||
          DEFAULT_OPENAI_MODEL,

        source:
          "openai_reasoning",

        timing: {
          ...timing,

          totalMs:
            Date.now() -
            totalStart
        }
      });
  }

  const rawModelOutput =
    extractRawModelOutput(
      data
    );

  const parsedResult =
    parseModelResult(
      rawModelOutput
    );

  const parsed =
    parsedResult.value;

  if (
    !parsedResult.wasJson ||
    !isPlainObject(parsed)
  ) {
    return res.status(502).json({
      success:
        false,

      ready:
        false,

      error:
        "OpenAI reasoning returned a malformed cognitive result.",

      failureType:
        "invalid_reasoning_model_output",

      rawModelOutput:
        rawModelOutput ||
        null,

      parsedModelOutput:
        parsed ||
        null,

      model:
        data?.model ||
        DEFAULT_OPENAI_MODEL,

      source:
        "openai_reasoning",

      timing: {
        ...timing,

        totalMs:
          Date.now() -
          totalStart
      }
    });
  }

  if (
    typeof parsed.ready !==
    "boolean"
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "ready",

      failureType:
        "reasoning_ready_invalid"
    });
  }

  const interpretation =
    normalizeObjectOrNull(
      parsed.interpretation
    );

  const reasoningDecision =
    normalizeObjectOrNull(
      parsed.reasoningDecision ||
      parsed.reasoning_decision ||
      parsed.decision
    );

  const semanticFrame =
    normalizeObjectOrNull(
      parsed.semanticFrame ||
      parsed.semantic_frame
    );

  const responseRequirements =
    normalizeObjectOrNull(
      parsed.responseRequirements ||
      parsed.response_requirements ||
      parsed.responseStrategy ||
      parsed.response_strategy
    );

  const authoritativeDraft =
    firstNonEmptyString([
      parsed.authoritativeDraft,
      parsed.authoritative_draft,
      parsed.draftResponse,
      parsed.draft_response,
      parsed.responseText,
      parsed.response_text,
      parsed.finalResponse,
      parsed.final_response,
      parsed.answer,
      parsed.reply
    ]);

  const caseModel =
    normalizeObject(
      parsed.caseModel ||
      parsed.case_model
    );

  const options =
    normalizeArray(
      parsed.options
    );

  const tradeoffs =
    normalizeArray(
      parsed.tradeoffs
    );

  const uncertainties =
    normalizeArray(
      parsed.uncertainties ||
      parsed.unknowns
    );

  const executionMetadata =
    normalizeObject(
      parsed.executionMetadata ||
      parsed.execution_metadata
    );

  const grounding =
    normalizeObjectOrNull(
      parsed.grounding
    );

  const evidenceReferences =
    normalizeArray(
      parsed.evidenceReferences ||
      parsed.evidence_references ||
      grounding?.evidenceUsed
    );

  const confidence =
    normalizeReasoningConfidence(
      parsed.confidence ??
      executionMetadata.confidence
    );

  const proposedActions =
    normalizeArray(
      reasoningDecision
        ?.proposedActions ||
      parsed.proposedActions
    );

  if (!isNonEmptyObject(interpretation)) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "interpretation",

      failureType:
        "interpretation_missing"
    });
  }

  if (!isNonEmptyObject(reasoningDecision)) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "reasoningDecision",

      failureType:
        "reasoning_decision_missing"
    });
  }

  if (!isNonEmptyObject(semanticFrame)) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "semanticFrame",

      failureType:
        "semantic_frame_missing"
    });
  }

  if (!isNonEmptyObject(responseRequirements)) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "responseRequirements",

      failureType:
        "response_requirements_missing"
    });
  }

  if (!authoritativeDraft) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "draftResponse",

      failureType:
        "authoritative_draft_missing"
    });
  }

  if (!isPlainObject(grounding)) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "grounding",

      failureType:
        "grounding_missing"
    });
  }

  if (
    !Array.isArray(
      grounding.evidenceUsed
    )
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "grounding.evidenceUsed",

      failureType:
        "grounding_evidence_used_invalid"
    });
  }

  if (
    grounding.assumptions != null &&
    !Array.isArray(
      grounding.assumptions
    )
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "grounding.assumptions",

      failureType:
        "grounding_assumptions_invalid"
    });
  }

  if (
    grounding.unresolvedConflicts != null &&
    !Array.isArray(
      grounding.unresolvedConflicts
    )
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "grounding.unresolvedConflicts",

      failureType:
        "grounding_conflicts_invalid"
    });
  }

  if (
    !firstNonEmptyString([
      interpretation.userGoal
    ])
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "interpretation.userGoal",

      failureType:
        "interpretation_user_goal_missing"
    });
  }

  if (
    !firstNonEmptyString([
      interpretation.meaning
    ])
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "interpretation.meaning",

      failureType:
        "interpretation_meaning_missing"
    });
  }

  if (
    typeof reasoningDecision
      .answerDirectly !==
    "boolean"
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "reasoningDecision.answerDirectly",

      failureType:
        "reasoning_answer_directly_invalid"
    });
  }

  if (
    !Array.isArray(
      reasoningDecision
        .proposedActions
    )
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "reasoningDecision.proposedActions",

      failureType:
        "reasoning_proposed_actions_invalid"
    });
  }

  if (
    !firstNonEmptyString([
      semanticFrame.operation
    ])
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "semanticFrame.operation",

      failureType:
        "semantic_operation_missing"
    });
  }

  if (
    !firstNonEmptyString([
      semanticFrame.requestedOutput
    ])
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "semanticFrame.requestedOutput",

      failureType:
        "semantic_requested_output_missing"
    });
  }

  if (
    !firstNonEmptyString([
      responseRequirements.goal,
      responseRequirements
        .responseGoal
    ])
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "responseRequirements.goal",

      failureType:
        "response_goal_missing"
    });
  }

  if (
    !Array.isArray(
      responseRequirements
        .requiredMoves
    )
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "responseRequirements.requiredMoves",

      failureType:
        "response_required_moves_invalid"
    });
  }

  if (
    !Array.isArray(
      responseRequirements
        .prohibitedMoves
    )
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,

      field:
        "responseRequirements.prohibitedMoves",

      failureType:
        "response_prohibited_moves_invalid"
    });
  }

  const canonicalOperationEnum =
    reasoningInput
      .outputContract
      ?.properties
      ?.semanticFrame
      ?.properties
      ?.operation
      ?.enum;

  const fallbackOperationEnum =
    reasoningInput
      .outputContract
      ?.semanticFrame
      ?.operation
      ?.enum ||
    reasoningInput
      .outputContract
      ?.operationEnum ||
    reasoningInput
      .outputContract
      ?.allowedOperations;

  const allowedOperations =
    normalizeArray(
      Array.isArray(
        canonicalOperationEnum
      )
        ? canonicalOperationEnum
        : fallbackOperationEnum
    );

  if (!allowedOperations.length) {
    return res.status(500).json({
      success:
        false,

      ready:
        false,

      error:
        "No canonical semantic operation registry was supplied to OpenAI reasoning.",

      failureType:
        "semantic_operation_registry_missing",

      semanticOperation:
        semanticFrame.operation,

      model:
        data?.model ||
        DEFAULT_OPENAI_MODEL,

      source:
        "openai_reasoning",

      timing: {
        ...timing,

        totalMs:
          Date.now() -
          totalStart
      }
    });
  }

  if (
    !allowedOperations.includes(
      semanticFrame.operation
    )
  ) {
    return res.status(502).json({
      success:
        false,

      ready:
        false,

      error:
        `OpenAI reasoning returned an unregistered semantic operation: ${semanticFrame.operation}.`,

      failureType:
        "semantic_operation_not_registered",

      semanticOperation:
        semanticFrame.operation,

      allowedOperations,

      parsedModelOutput:
        parsed,

      model:
        data?.model ||
        DEFAULT_OPENAI_MODEL,

      source:
        "openai_reasoning",

      timing: {
        ...timing,

        totalMs:
          Date.now() -
          totalStart
      }
    });
  }

  const claimedActionExecution =
    proposedActions.some(action =>
      isPlainObject(action) &&
      (
        action.executed === true ||
        action.completed === true ||
        [
          "executed",
          "completed",
          "success",
          "succeeded"
        ].includes(
          String(
            action.status ||
            ""
          )
            .trim()
            .toLowerCase()
        )
      )
    );

  if (claimedActionExecution) {
    return res.status(502).json({
      success:
        false,

      ready:
        false,

      error:
        "OpenAI reasoning falsely claimed that a proposed action was executed.",

      failureType:
        "model_claimed_action_execution",

      parsedModelOutput:
        parsed,

      model:
        data?.model ||
        DEFAULT_OPENAI_MODEL,

      source:
        "openai_reasoning",

      timing: {
        ...timing,

        totalMs:
          Date.now() -
          totalStart
      }
    });
  }

  const ready =
    parsed.ready === true &&
    Boolean(
      authoritativeDraft
    );

  timing.totalMs =
    Date.now() -
    totalStart;

  const cognitiveReasoningResult = {
    schema:
      "ari_cognitive_reasoning_result",

    schemaVersion:
      "2.0.0",

    ready,

    authoritative:
      ready,

    success:
      true,

    source:
      "openai_reasoning",

    model:
      data?.model ||
      DEFAULT_OPENAI_MODEL,

    interpretation,

    reasoningDecision: {
      ...reasoningDecision,

      proposedActions:
        proposedActions.map(
          action => ({
            ...action,

            executed:
              false,

            status:
              "proposed"
          })
        )
    },

    semanticFrame,

    responseRequirements,

    responseStrategy:
      responseRequirements,

    authoritativeDraft,

    draftResponse:
      authoritativeDraft,

    responseText:
      authoritativeDraft,

    caseModel,

    options,

    tradeoffs,

    uncertainties,

    executionMetadata: {
      ...executionMetadata,

      confidence,

      usedCurrentTurn:
        executionMetadata
          .usedCurrentTurn !==
        false,

      usedPriorContext:
        executionMetadata
          .usedPriorContext ===
        true,

      usedEvidence:
        executionMetadata
          .usedEvidence !==
        false,

      evidenceCount:
        Number.isFinite(
          Number(
            executionMetadata
              .evidenceCount
          )
        )
          ? Number(
              executionMetadata
                .evidenceCount
            )
          : evidenceReferences.length
    },

    evidenceReferences,

    grounding: {
      evidenceUsed:
        normalizeArray(
          grounding.evidenceUsed
        ),

      assumptions:
        normalizeArray(
          grounding.assumptions
        ),

      unresolvedConflicts:
        normalizeArray(
          grounding
            .unresolvedConflicts
        )
    },

    confidence,

    validation: {
      passed:
        ready,

      errors:
        ready
          ? []
          : [
              "reasoning_result_not_ready"
            ]
    },

    authority:
      ready
        ? "authoritative_cognitive_reasoning_and_draft"
        : "none",

    modelInvocation: {
      succeeded:
        true,

      model:
        data?.model ||
        DEFAULT_OPENAI_MODEL,

      finishReason:
        data?.choices?.[0]
          ?.finish_reason ||
        null,

      usage:
        data?.usage ||
        null,

      durationMs:
        timing.openAIMs
    },

    timing
  };

  console.log(
    "[Ari OpenAI Reasoning Result]",
    {
      ready:
        cognitiveReasoningResult
          .ready,

      semanticOperation:
        semanticFrame.operation ||
        null,

      responseGoal:
        responseRequirements.goal ||
        responseRequirements
          .responseGoal ||
        null,

      authoritativeDraftAvailable:
        Boolean(
          authoritativeDraft
        ),

      authoritativeDraftLength:
        authoritativeDraft.length,

      authoritativeDraftPreview:
        authoritativeDraft.slice(
          0,
          300
        )
    }
  );

  return res.status(200).json({
    success:
      true,

    ready:
      cognitiveReasoningResult
        .ready ===
      true,

    authoritative:
      cognitiveReasoningResult
        .authoritative ===
      true,

    cognitiveReasoningResult,

    reasoningResult:
      cognitiveReasoningResult,

    interpretation:
      cognitiveReasoningResult
        .interpretation,

    reasoningDecision:
      cognitiveReasoningResult
        .reasoningDecision,

    semanticFrame:
      cognitiveReasoningResult
        .semanticFrame,

    responseRequirements:
      cognitiveReasoningResult
        .responseRequirements,

    responseStrategy:
      cognitiveReasoningResult
        .responseRequirements,

    authoritativeDraft:
      cognitiveReasoningResult
        .authoritativeDraft,

    draftResponse:
      cognitiveReasoningResult
        .draftResponse,

    responseText:
      cognitiveReasoningResult
        .draftResponse,

    finalResponse:
      cognitiveReasoningResult
        .draftResponse,

    answer:
      cognitiveReasoningResult
        .draftResponse,

    reply:
      cognitiveReasoningResult
        .draftResponse,

    caseModel:
      cognitiveReasoningResult
        .caseModel,

    options:
      cognitiveReasoningResult
        .options,

    tradeoffs:
      cognitiveReasoningResult
        .tradeoffs,

    uncertainties:
      cognitiveReasoningResult
        .uncertainties,

    executionMetadata:
      cognitiveReasoningResult
        .executionMetadata,

    evidenceReferences:
      cognitiveReasoningResult
        .evidenceReferences,

    grounding:
      cognitiveReasoningResult
        .grounding,

    confidence:
      cognitiveReasoningResult
        .confidence,

    modelInvocation:
      cognitiveReasoningResult
        .modelInvocation,

    model:
      cognitiveReasoningResult
        .model,

    authority:
      cognitiveReasoningResult
        .authority,

    source:
      "openai_reasoning",

    timing
  });
}

/* =====================================================
   OPENAI REASONING PROMPTS
===================================================== */

function buildOpenAIReasoningSystemPrompt() {
  return `
You are the authoritative cognitive reasoning and response-generation model for Ari Rebirth.

Your task is to interpret the current user request using the supplied request, evidence, routing constraints, deterministic context, knowledge evidence, developer evidence, capabilities, response controls, authority contract, operation contract, and output contract.

You must produce one structured cognitive reasoning result and one complete authoritative user-facing draft in the same JSON object.

Authority rules:
- You may interpret the user's meaning, goal, conversational function, and required response behavior.
- You may resolve ambiguity only when supported by supplied evidence and continuity.
- You may define the response strategy and response requirements.
- You must produce the complete user-facing answer in draftResponse.
- draftResponse is authoritative response language for downstream preservation.
- You must distinguish direct evidence from inference.
- You must not fabricate user facts, memories, external facts, citations, actions, or tool results.
- You must not treat deterministic routing labels as semantic truth.
- You must respect all supplied safety, routing, tone, and response constraints.
- You must preserve the effective current-turn request.
- You must not claim that an action, message, tool call, file change, deployment, or persistence operation occurred.
- Any action must be returned only as a proposal.
- semanticFrame must represent the meaning of the current request.
- responseRequirements must describe what the authoritative draft must accomplish.
- grounding must identify evidence, assumptions, and unresolved conflicts.
- evidenceReferences must identify supplied evidence supporting material conclusions.
- confidence must be numeric from 0 through 1.
- Do not expose private chain-of-thought or hidden reasoning.
- Return concise rationale and conclusions only.
- Output must be exactly one valid JSON object.
- Do not wrap the result in markdown.
- Do not add commentary outside the JSON object.

Return JSON only.
`.trim();
}

function buildOpenAIReasoningUserPrompt(
  reasoningInput = {}
) {
  return `
CURRENT REASONING INPUT:
${safeJsonStringify(
  reasoningInput
)}

Analyze the current request using the complete supplied evidence and contracts.

Return exactly one JSON object using this shape:

{
  "ready": true,

  "interpretation": {
    "conversationFunction": "The functional role of the user's turn.",
    "userGoal": "What the user wants accomplished.",
    "operation": "The canonical semantic operation requested.",
    "meaning": "The resolved meaning of the current turn.",
    "subjects": [],
    "contextUsed": false,
    "clarificationRequired": false,
    "clarificationQuestion": null,
    "ambiguity": []
  },

  "reasoningDecision": {
    "answerDirectly": true,
    "reasoningMode": "analysis",
    "toolsNeeded": [],
    "proposedActions": [],
    "decisionRationale": "A concise rationale for the response strategy.",
    "shouldAskClarifyingQuestion": false
  },

  "semanticFrame": {
    "operation": "One exact operation from the supplied operation contract.",
    "requestType": "The canonical request type.",
    "frameType": "The canonical frame type.",
    "interactionFamily": "The interaction family.",
    "intentFamily": "The intent family.",
    "requestedOutput": "The output the user expects.",
    "domain": "The relevant domain.",

    "participants": [],
    "subject": null,
    "object": null,
    "target": null,
    "artifactTarget": null,
    "referent": null,

    "options": [],
    "criteria": [],
    "timeframe": null,
    "audience": null,
    "location": null,

    "contextModifiers": [],
    "constraints": [],
    "stakes": "low",

    "continuity": {
      "requiresPriorContext": false,
      "referencePresent": false,
      "referenceResolved": false,
      "missingAnchor": false
    },

    "ambiguity": {
      "present": false,
      "requiresClarification": false,
      "reason": null,
      "unresolvedSlots": [],
      "competingInterpretations": [],
      "clarificationQuestion": null
    },

    "execution": {
      "executionRequested": false,
      "executionKind": null,
      "executionAllowed": false,
      "analysisOnly": true,
      "prohibitedOperations": [],
      "deferredOperations": []
    },

    "secondaryRequests": [],
    "confidence": 0.9,
    "evidenceRefs": []
  },

  "responseRequirements": {
    "goal": "What the authoritative response must accomplish.",
    "shape": "single_lane",
    "tone": "The appropriate response tone.",
    "requiredMoves": [],
    "prohibitedMoves": [],
    "requiredBehaviors": [],
    "forbiddenBehaviors": [],
    "constraints": [],
    "requiredFacts": [],
    "safetyRequirements": [],
    "continuityRequirements": [],
    "toneRequirements": [],
    "clarificationRequired": false,
    "clarificationQuestion": null,
    "actionRequired": false
  },

  "draftResponse": "The complete natural response Ari should give the user.",

  "caseModel": {},

  "options": [],

  "tradeoffs": [],

  "uncertainties": [],

  "evidenceReferences": [],

  "executionMetadata": {
    "confidence": 0.9,
    "reasoningMode": "analysis",
    "usedCurrentTurn": true,
    "usedPriorContext": false,
    "usedEvidence": true,
    "evidenceCount": 0,
    "requiresExternalKnowledge": false,
    "requiresToolExecution": false
  },

  "grounding": {
    "evidenceUsed": [],
    "assumptions": [],
    "unresolvedConflicts": []
  },

  "confidence": 0.9
}

Canonical operation requirements:
- semanticFrame.operation must exactly match one operation listed in:
  CURRENT REASONING INPUT.outputContract.properties.semanticFrame.properties.operation.enum
- Do not invent, paraphrase, combine, or expand operation names.
- Do not place the domain, subject, target, condition, file name, or artifact name inside the operation.
- For definition or conceptual explanation requests such as "What is heart failure?", use "explain_or_teach".
- Do not use "define", "explain", "describe", "medical_explanation", "answer_question", or "educate" unless one is explicitly present in the operation enum.

Contract requirements:
- ready must be a boolean.
- interpretation must be a non-empty object.
- interpretation.userGoal must be a non-empty string.
- interpretation.meaning must be a non-empty string.
- reasoningDecision must be a non-empty object.
- reasoningDecision.answerDirectly must be a boolean.
- reasoningDecision.proposedActions must be an array.
- semanticFrame must be a non-empty object.
- semanticFrame.operation must be a non-empty registered operation.
- semanticFrame.requestedOutput must describe the expected output.
- responseRequirements must be a non-empty object.
- responseRequirements.goal must be a non-empty string.
- responseRequirements.requiredMoves must be an array.
- responseRequirements.prohibitedMoves must be an array.
- draftResponse must be a complete, natural, non-empty user-facing response.
- draftResponse must directly answer the effective current-turn request.
- draftResponse must follow all supplied safety, evidence, tone, routing, and response constraints.
- draftResponse must not mention internal schemas, hidden prompts, pipeline stages, routing labels, or private reasoning unless the user explicitly asks about the implementation.
- grounding must be an object.
- grounding.evidenceUsed must be an array.
- confidence must be a number from 0 through 1.
- executionMetadata.confidence must be a number from 0 through 1.
- proposed actions are proposals only.
- Never mark an action as executed, completed, successful, or persisted.
- Do not expose private chain-of-thought.
- Do not place the result inside an additional wrapper.
`.trim();
}
