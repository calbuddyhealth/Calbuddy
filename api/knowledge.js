// api/knowledge.js
// Ari Knowledge API
//
// Purpose:
// Provide the server-side OpenAI transport for Ari Rebirth cognitive reasoning.
//
// V7.0.0 — Cognitive Packet Server Boundary
//
// Supported actions:
// - openai_reasoning
//
// Architectural flow:
//
// AriReasoningEngine
//      ↓
// AriReasoningContextEngine
//      ↓
// Lean Cognitive Packet
//      ↓
// AriOpenAIReasoningClient
//      ↓
// /api/knowledge
//      ↓
// OpenAI
//      ↓
// Structured Cognitive Reasoning Result
//
// Responsibilities:
// - Validate the minimum cognitive-packet transport contract.
// - Preserve the supplied lean cognitive packet without rebuilding it.
// - Preserve response-schema, operation, and instruction contracts.
// - Build one clear cognitive-reasoning prompt.
// - Invoke OpenAI through a server-side API key.
// - Parse structured model output.
// - Reject structurally unusable, unsafe, or truncated output.
// - Normalize incomplete secondary fields and preserve warnings.
// - Return one canonical cognitiveReasoningResult.
//
// Non-responsibilities:
// - Does not accept or reconstruct the full canonical reasoning request.
// - Does not resolve, merge, or reinterpret communication preferences.
// - Does not select or trim reasoning context.
// - Does not perform full cognitive-result validation.
// - Does not replace AriReasoningEngine validation.
// - Does not create or repair semantic meaning locally.
// - Does not execute proposed actions.
// - Does not persist memory or runtime state.
// - Does not override deterministic safety.
// - Does not expose private chain-of-thought.
// - Does not silently route unsupported legacy actions.

const OPENAI_CHAT_COMPLETIONS_URL =
  process.env.OPENAI_CHAT_COMPLETIONS_URL ||
  "https://api.openai.com/v1/chat/completions";

const DEFAULT_OPENAI_MODEL =
  process.env.OPENAI_REASONING_MODEL ||
  process.env.OPENAI_MODEL ||
  "gpt-4.1-mini";

const OPENAI_TIMEOUT_MS =
  normalizePositiveInteger(
    process.env.OPENAI_REASONING_TIMEOUT_MS,
    45000
  );

const MAX_MODEL_OUTPUT_PREVIEW = 4000;

/* =====================================================
   VERCEL API ENTRY POINT
===================================================== */

export default async function handler(req, res) {
  setCommonHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");

    return res.status(405).json({
      success: false,
      ready: false,
      error: "Method not allowed.",
      failureType: "method_not_allowed",
      source: "knowledge_api"
    });
  }

  const requestStart = Date.now();

  try {
    const body =
      await resolveRequestBody(req);

    const action =
      firstNonEmptyString([
        body.action
      ]) ||
      "openai_reasoning";

    switch (action) {
      case "openai_reasoning":
      case "ari_cognitive_reasoning":
      case "reason":
        return await handleOpenAIReasoning(
          res,
          body
        );

      default:
        return res.status(400).json({
          success: false,
          ready: false,
          error:
            `Unsupported knowledge action: ${action}.`,
          failureType:
            "unsupported_knowledge_action",
          action,
          supportedActions: [
            "openai_reasoning"
          ],
          source: "knowledge_api",
          timing: {
            totalMs:
              Date.now() -
              requestStart
          }
        });
    }
  } catch (error) {
    console.error(
      "[Ari Knowledge API Unhandled Failure]",
      serializeError(error)
    );

    if (res.headersSent) {
      return;
    }

    return res
      .status(
        normalizeHttpStatus(
          error?.status,
          500
        )
      )
      .json({
        success: false,
        ready: false,
        error:
          error?.message ||
          "The Ari knowledge API encountered an unexpected failure.",
        failureType:
          error?.code ||
          "knowledge_api_unhandled_failure",
        diagnostics:
          serializeError(error),
        source: "knowledge_api",
        timing: {
          totalMs:
            Date.now() -
            requestStart
        }
      });
  }
}

/* =====================================================
   OPENAI COGNITIVE REASONING
===================================================== */

async function handleOpenAIReasoning(
  res,
  suppliedBody = {}
) {
  const totalStart = Date.now();
  const timing = {};

  const body =
    normalizeObject(suppliedBody);

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

  /*
   * The server accepts one lean cognitive packet.
   * It must never rebuild context from flattened
   * canonical request fields.
   */
  const transportValidation =
    validateReasoningTransport(body);

  if (
    transportValidation.valid !== true
  ) {
    return res.status(400).json({
      success: false,
      ready: false,
      error:
        transportValidation.errors.join(",") ||
        "Invalid cognitive reasoning transport.",
      failureType:
        "invalid_reasoning_transport",
      errors:
        transportValidation.errors,
      warnings:
        transportValidation.warnings,
      source:
        "openai_reasoning"
    });
  }

  const cognitivePacket =
    normalizeObject(
      body.cognitivePacket
    );

  const responseSchema =
    resolveResponseSchema(
      body,
      cognitivePacket
    );

  const operationContract =
    resolveOperationContract(
      body,
      cognitivePacket
    );

  const instructions =
    resolveInstructions(
      body,
      cognitivePacket
    );

  const requestWarnings = [
    ...transportValidation.warnings
  ];

  const originalQuestion =
    firstNonEmptyString([
      cognitivePacket.request
        ?.original,
      cognitivePacket.currentTurn
        ?.originalText
    ]);

  const effectiveQuestion =
    firstNonEmptyString([
      cognitivePacket.request
        ?.effective,
      cognitivePacket.request
        ?.resolved,
      cognitivePacket.currentTurn
        ?.effectiveText,
      originalQuestion
    ]);

  if (!effectiveQuestion) {
    return res.status(400).json({
      success: false,
      ready: false,
      error:
        "The cognitive packet does not contain an effective request.",
      failureType:
        "cognitive_packet_effective_request_missing",
      source:
        "openai_reasoning"
    });
  }

  const allowedOperations =
    resolveAllowedOperations(
      responseSchema,
      operationContract,
      cognitivePacket
    );

  if (!allowedOperations.length) {
    return res.status(400).json({
      success: false,
      ready: false,
      error:
        "No canonical semantic operation registry was supplied to OpenAI reasoning.",
      failureType:
        "semantic_operation_registry_missing",
      responseSchemaKeys:
        Object.keys(responseSchema),
      operationContractKeys:
        Object.keys(operationContract),
      source:
        "openai_reasoning"
    });
  }

  /*
   * Keep the selected packet intact. Only attach the
   * transport contracts needed by the provider prompt.
   */
  const reasoningInput = {
    schema:
      "ari_openai_reasoning_transport",

    schemaVersion:
      "1.0.0",

    cognitivePacket,

    responseSchema,

    operationContract,

    instructions,

    transportContract: {
      outputMode:
        body.outputMode ||
        "structured_json",

      responseContract:
        normalizeObject(
          body.responseContract
        ),

      clientVersion:
        body.clientVersion ||
        null
    },

    transportWarnings:
      requestWarnings
  };

  const systemPrompt =
    buildOpenAIReasoningSystemPrompt();

  const userPrompt =
    buildOpenAIReasoningUserPrompt(
      reasoningInput,
      allowedOperations
    );

  const isDeveloperReasoning =
    detectDeveloperReasoning(
      cognitivePacket
    );

  const maxOutputTokens =
    isDeveloperReasoning
      ? 7000
      : 4000;

  const serializedCognitivePacket =
    safeJsonStringify(
      cognitivePacket
    );

  console.log(
    "[Ari OpenAI Reasoning Request Size]",
    {
      model:
        DEFAULT_OPENAI_MODEL,

      isDeveloperReasoning,

      maxOutputTokens,

      systemPromptCharacters:
        systemPrompt.length,

      userPromptCharacters:
        userPrompt.length,

      cognitivePacketCharacters:
        serializedCognitivePacket.length,

      effectiveQuestionCharacters:
        effectiveQuestion.length,

      responseSchemaCharacters:
        safeJsonStringify(
          responseSchema
        ).length,

      operationContractCharacters:
        safeJsonStringify(
          operationContract
        ).length,

      instructionCount:
        instructions.length
    }
  );

  const openAIStart = Date.now();

  let response;
  let data;

  try {
    response =
      await fetchWithTimeout(
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
                maxOutputTokens,

              response_format: {
                type:
                  "json_object"
              }
            })
        },
        OPENAI_TIMEOUT_MS
      );

    data =
      await readJsonResponse(
        response
      );
  } catch (error) {
    timing.openAIMs =
      Date.now() -
      openAIStart;

    const isTimeout =
      error?.name ===
        "AbortError" ||
      error?.code ===
        "openai_request_timeout";

    console.error(
      "[Ari OpenAI Reasoning Transport Failure]",
      {
        endpoint:
          OPENAI_CHAT_COMPLETIONS_URL,

        model:
          DEFAULT_OPENAI_MODEL,

        timing,

        error:
          serializeError(error)
      }
    );

    return res
      .status(
        isTimeout
          ? 504
          : 502
      )
      .json({
        success: false,
        ready: false,
        error:
          isTimeout
            ? "OpenAI reasoning request timed out."
            : (
                error?.message ||
                "OpenAI reasoning transport failed."
              ),
        failureType:
          isTimeout
            ? "openai_reasoning_timeout"
            : "openai_reasoning_transport_failed",
        model:
          DEFAULT_OPENAI_MODEL,
        diagnostics:
          serializeError(error),
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

  timing.openAIMs =
    Date.now() -
    openAIStart;

  if (!response.ok) {
    const providerError =
      extractProviderError(data);

    console.error(
      "[Ari OpenAI Reasoning Provider Failure]",
      {
        status:
          response.status,

        model:
          DEFAULT_OPENAI_MODEL,

        providerError,

        response:
          data
      }
    );

    return res
      .status(
        normalizeHttpStatus(
          response.status,
          502
        )
      )
      .json({
        success: false,
        ready: false,
        error:
          providerError.message ||
          "OpenAI reasoning request failed.",
        failureType:
          "openai_reasoning_request_failed",
        providerError,
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
    extractRawModelOutput(data);

  const finishReason =
    data?.choices?.[0]
      ?.finish_reason ||
    null;

  if (finishReason === "length") {
    const truncationFailure = {
      success: false,
      ready: false,

      error:
        "OpenAI reasoning output was truncated before the cognitive result was complete.",

      failureType:
        "openai_reasoning_output_truncated",

      finishReason,

      rawModelOutputLength:
        typeof rawModelOutput ===
          "string"
          ? rawModelOutput.length
          : null,

      rawModelOutputPreview:
        previewText(
          rawModelOutput,
          MAX_MODEL_OUTPUT_PREVIEW
        ),

      model:
        data?.model ||
        DEFAULT_OPENAI_MODEL,

      usage:
        data?.usage ||
        null,

      source:
        "openai_reasoning",

      timing: {
        ...timing,

        totalMs:
          Date.now() -
          totalStart
      }
    };

    console.error(
      "[Ari OpenAI Reasoning Output Truncated]",
      truncationFailure
    );

    return res
      .status(502)
      .json(
        truncationFailure
      );
  }

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
      success: false,
      ready: false,
      error:
        "OpenAI reasoning returned a malformed cognitive result.",
      failureType:
        "invalid_reasoning_model_output",
      rawModelOutputPreview:
        previewText(
          rawModelOutput,
          MAX_MODEL_OUTPUT_PREVIEW
        ),
      parsedModelOutput:
        parsed ||
        null,
      model:
        data?.model ||
        DEFAULT_OPENAI_MODEL,
      finishReason,
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

  const validationWarnings = [
    ...requestWarnings
  ];

  if (
    typeof parsed.ready !==
      "boolean"
  ) {
    validationWarnings.push(
      "ready_missing_or_invalid_defaulted"
    );
  }

  const rawInterpretation =
    normalizeObject(
      parsed.interpretation
    );

  if (!Object.keys(rawInterpretation).length) {
    validationWarnings.push(
      "interpretation_missing_or_empty"
    );
  }

  const interpretation = {
    ...rawInterpretation,

    userGoal:
      firstNonEmptyString([
        rawInterpretation.userGoal,
        rawInterpretation.goal,
        effectiveQuestion
      ]),

    meaning:
      firstNonEmptyString([
        rawInterpretation.meaning,
        rawInterpretation
          .primaryMeaning,
        effectiveQuestion
      ]),

    subjects:
      normalizeArray(
        rawInterpretation.subjects
      ),

    contextUsed:
      rawInterpretation
        .contextUsed ===
      true,

    clarificationRequired:
      rawInterpretation
        .clarificationRequired ===
      true,

    clarificationQuestion:
      firstNonEmptyString([
        rawInterpretation
          .clarificationQuestion
      ]) ||
      null,

    ambiguity:
      normalizeArray(
        rawInterpretation.ambiguity
      )
  };

  const rawReasoningDecision =
    normalizeObject(
      parsed.reasoningDecision ||
      parsed.reasoning_decision ||
      parsed.decision
    );

  if (!Object.keys(rawReasoningDecision).length) {
    validationWarnings.push(
      "reasoning_decision_missing_or_empty"
    );
  }

  const proposedActions =
    normalizeArray(
      rawReasoningDecision
        .proposedActions ||
      parsed.proposedActions
    );

  const reasoningDecision = {
    ...rawReasoningDecision,

    answerDirectly:
      typeof rawReasoningDecision
        .answerDirectly ===
        "boolean"
        ? rawReasoningDecision
            .answerDirectly
        : true,

    reasoningMode:
      firstNonEmptyString([
        rawReasoningDecision
          .reasoningMode
      ]) ||
      "analysis",

    toolsNeeded:
      normalizeArray(
        rawReasoningDecision
          .toolsNeeded
      ),

    proposedActions,

    shouldAskClarifyingQuestion:
      rawReasoningDecision
        .shouldAskClarifyingQuestion ===
      true
  };

  const semanticFrame =
    normalizeObjectOrNull(
      parsed.semanticFrame ||
      parsed.semantic_frame
    );

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

  const canonicalOperation =
    firstNonEmptyString([
      semanticFrame.operation
    ]);

  if (!canonicalOperation) {
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
    !allowedOperations.includes(
      canonicalOperation
    )
  ) {
    return res.status(502).json({
      success: false,
      ready: false,
      error:
        `OpenAI reasoning returned an unregistered semantic operation: ${canonicalOperation}.`,
      failureType:
        "semantic_operation_not_registered",
      semanticOperation:
        canonicalOperation,
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

  const rawResponseRequirements =
    normalizeObject(
      parsed.responseRequirements ||
      parsed.response_requirements ||
      parsed.responseStrategy ||
      parsed.response_strategy
    );

  if (!Object.keys(rawResponseRequirements).length) {
    validationWarnings.push(
      "response_requirements_missing_or_empty"
    );
  }

  const responseRequirements = {
    ...rawResponseRequirements,

    goal:
      firstNonEmptyString([
        rawResponseRequirements.goal,
        rawResponseRequirements
          .responseGoal,
        `Answer the user's current request: ${effectiveQuestion}`
      ]),

    shape:
      firstNonEmptyString([
        rawResponseRequirements.shape
      ]) ||
      "single_lane",

    tone:
      firstNonEmptyString([
        rawResponseRequirements.tone
      ]) ||
      null,

    requiredMoves:
      normalizeArray(
        rawResponseRequirements
          .requiredMoves ||
        rawResponseRequirements
          .orderedPoints
      ),

    prohibitedMoves:
      normalizeArray(
        rawResponseRequirements
          .prohibitedMoves
      ),

    requiredBehaviors:
      normalizeArray(
        rawResponseRequirements
          .requiredBehaviors
      ),

    forbiddenBehaviors:
      normalizeArray(
        rawResponseRequirements
          .forbiddenBehaviors
      ),

    constraints:
      normalizeArray(
        rawResponseRequirements
          .constraints
      ),

    requiredFacts:
      normalizeArray(
        rawResponseRequirements
          .requiredFacts
      ),

    safetyRequirements:
      normalizeArray(
        rawResponseRequirements
          .safetyRequirements
      ),

    continuityRequirements:
      normalizeArray(
        rawResponseRequirements
          .continuityRequirements
      ),

    toneRequirements:
      normalizeArray(
        rawResponseRequirements
          .toneRequirements
      ),

    styleApplied:
      normalizeObject(
        rawResponseRequirements
          .styleApplied
      ),

    clarificationRequired:
      rawResponseRequirements
        .clarificationRequired ===
      true,

    clarificationQuestion:
      firstNonEmptyString([
        rawResponseRequirements
          .clarificationQuestion
      ]) ||
      null,

    actionRequired:
      rawResponseRequirements
        .actionRequired ===
      true
  };

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

  const claimedActionExecution =
    proposedActions.some(
      action =>
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
      success: false,
      ready: false,
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

  const rawGrounding =
    normalizeObject(
      parsed.grounding
    );

  if (!Object.keys(rawGrounding).length) {
    validationWarnings.push(
      "grounding_missing_or_empty"
    );
  }

  const grounding = {
    evidenceUsed:
      normalizeArray(
        rawGrounding.evidenceUsed
      ),

    assumptions:
      normalizeArray(
        rawGrounding.assumptions
      ),

    unresolvedConflicts:
      normalizeArray(
        rawGrounding
          .unresolvedConflicts
      )
  };

  const evidenceReferences =
    normalizeArray(
      parsed.evidenceReferences ||
      parsed.evidence_references ||
      grounding.evidenceUsed
    );

  const executionMetadata =
    normalizeObject(
      parsed.executionMetadata ||
      parsed.execution_metadata
    );

  const confidence =
    normalizeReasoningConfidence(
      parsed.confidence ??
      executionMetadata.confidence
    );

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

  const normalizedProposedActions =
    proposedActions.map(
      action =>
        isPlainObject(action)
          ? {
              ...action,
              executed:
                false,
              completed:
                false,
              status:
                "proposed"
            }
          : {
              description:
                String(action),
              executed:
                false,
              completed:
                false,
              status:
                "proposed"
            }
    );

  const modelReady =
    parsed.ready !== false;

  const ready =
    modelReady &&
    Boolean(authoritativeDraft) &&
    Boolean(canonicalOperation);

  timing.totalMs =
    Date.now() -
    totalStart;

  const cognitiveReasoningResult = {
    schema:
      "ari_cognitive_reasoning_result",

    schemaVersion:
      "2.0.1",

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
        normalizedProposedActions
    },

    semanticFrame: {
      ...semanticFrame,

      operation:
        canonicalOperation
    },

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
          .usedEvidence ===
        true ||
        evidenceReferences.length >
          0,

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

    grounding,

    confidence,

    validation: {
      passed:
        ready,

      errors:
        ready
          ? []
          : [
              "reasoning_result_not_ready"
            ],

      warnings:
        uniqueStrings(
          validationWarnings
        )
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

      finishReason,

      usage:
        data?.usage ||
        null,

      durationMs:
        timing.openAIMs
    },

    transportMetadata: {
      source:
        "knowledge_api",

      cognitivePacketReceived:
        true,

      cognitivePacketSchema:
        cognitivePacket.schema ||
        null,

      cognitivePacketSchemaVersion:
        cognitivePacket
          .schemaVersion ||
        null,

      responseSchemaReceived:
        isNonEmptyObject(
          responseSchema
        ),

      operationContractReceived:
        isNonEmptyObject(
          operationContract
        ),

      instructionCount:
        instructions.length,

      fullCanonicalRequestAccepted:
        false
    },

    timing
  };

  console.log(
    "[Ari OpenAI Reasoning Result]",
    {
      ready:
        cognitiveReasoningResult.ready,

      semanticOperation:
        canonicalOperation,

      responseGoal:
        responseRequirements.goal ||
        null,

      cognitivePacketSchema:
        cognitivePacket.schema ||
        null,

      preferenceContextPresent:
        isNonEmptyObject(
          cognitivePacket
            .preferenceContext
        ),

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
        ),

      warningCount:
        validationWarnings.length,

      warnings:
        uniqueStrings(
          validationWarnings
        ),

      timing
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

    validation:
      cognitiveReasoningResult
        .validation,

    modelInvocation:
      cognitiveReasoningResult
        .modelInvocation,

    transportMetadata:
      cognitiveReasoningResult
        .transportMetadata,

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
   TRANSPORT VALIDATION
===================================================== */

function validateReasoningTransport(
  body = {}
) {
  const errors = [];
  const warnings = [];

  if (!isPlainObject(body)) {
    return {
      valid:
        false,

      errors: [
        "request_body_must_be_an_object"
      ],

      warnings
    };
  }

  /*
   * Reject old flattened canonical request shapes.
   * The server now receives only cognitivePacket.
   */
  if (
    isNonEmptyObject(body.request) ||
    isNonEmptyObject(
      body.canonicalReasoningRequest
    )
  ) {
    errors.push(
      "full_canonical_reasoning_request_not_allowed"
    );
  }

  const cognitivePacket =
    normalizeObject(
      body.cognitivePacket
    );

  if (
    !isNonEmptyObject(
      cognitivePacket
    )
  ) {
    errors.push(
      "cognitive_packet_missing"
    );

    return {
      valid:
        false,

      errors:
        uniqueStrings(errors),

      warnings
    };
  }

  if (
    cognitivePacket.schema !==
      "ari_cognitive_context_packet"
  ) {
    errors.push(
      "invalid_cognitive_packet_schema"
    );
  }

  const effectiveQuestion =
    firstNonEmptyString([
      cognitivePacket.request
        ?.effective,
      cognitivePacket.request
        ?.resolved,
      cognitivePacket.currentTurn
        ?.effectiveText,
      cognitivePacket.request
        ?.original,
      cognitivePacket.currentTurn
        ?.originalText
    ]);

  if (!effectiveQuestion) {
    errors.push(
      "cognitive_packet_effective_request_missing"
    );
  }

  const authority =
    normalizeObject(
      cognitivePacket.authority
    );

  if (
    authority.safetyIsBinding !==
      true
  ) {
    errors.push(
      "cognitive_packet_safety_authority_missing"
    );
  }

  const forbiddenTrueAuthorities = [
    "mayExecuteActions",
    "mayPersistState",
    "mayOverrideSafety",
    "mayClaimToolSuccess",
    "mayAuthorizeDelivery",
    "mayExposePrivateChainOfThought"
  ];

  for (
    const field
    of forbiddenTrueAuthorities
  ) {
    if (
      authority[field] === true
    ) {
      errors.push(
        `cognitive_packet_forbidden_authority:${field}`
      );
    }
  }

  const responseSchema =
    resolveResponseSchema(
      body,
      cognitivePacket
    );

  if (
    !isNonEmptyObject(
      responseSchema
    )
  ) {
    errors.push(
      "reasoning_response_schema_missing"
    );
  }

  const operationContract =
    resolveOperationContract(
      body,
      cognitivePacket
    );

  if (
    !isNonEmptyObject(
      operationContract
    )
  ) {
    errors.push(
      "reasoning_operation_contract_missing"
    );
  }

  const instructions =
    resolveInstructions(
      body,
      cognitivePacket
    );

  if (!instructions.length) {
    warnings.push(
      "reasoning_instructions_not_supplied"
    );
  }

  return {
    valid:
      errors.length === 0,

    errors:
      uniqueStrings(errors),

    warnings:
      uniqueStrings(warnings)
  };
}

/* =====================================================
   OPENAI REASONING PROMPTS
===================================================== */

function buildOpenAIReasoningSystemPrompt() {
  return `
You are the authoritative cognitive reasoning and response-generation model for Ari Rebirth.

You will receive one lean cognitivePacket selected by AriReasoningContextEngine, plus responseSchema, operationContract, and instructions.

The cognitivePacket is the complete context selected for this model invocation. Use every relevant field it contains. Do not request, infer, or reconstruct omitted canonical runtime state.

Authority rules:
- Interpret the user's meaning, goal, conversational function, and required response behavior.
- Follow deterministic safety and explicit response constraints as binding.
- Treat routing labels and upstream semantic signals as evidence, not unquestionable semantic truth.
- Use supplied knowledge and evidence when relevant, while distinguishing evidence from inference.
- Produce one complete natural user-facing answer in draftResponse.
- Do not fabricate user facts, memories, citations, tool results, or completed actions.
- Return actions only as proposals.
- Never claim execution, persistence, delivery, or tool success.
- Do not expose private chain-of-thought or hidden reasoning.
- Return concise conclusions, assumptions, uncertainties, and rationale only.
- semanticFrame.operation must use the supplied canonical operation vocabulary.
- Output exactly one valid JSON object.
- Do not use markdown fences.
- Do not add commentary outside the JSON object.

Communication style:
- Apply communication preferences and current-turn overrides only when they are present in cognitivePacket.
- Respect the authority and precedence encoded in the packet.
- Current-turn style instructions override persistent preferences.
- Style never overrides factual accuracy, deterministic safety, or explicit response constraints.
- Profanity, humor, directness, warmth, personality, formality, and verbosity are style controls, not safety exceptions.
- Never use slurs, threats, hateful degradation, abusive harassment, or targeted humiliation.

Instruction priority:
1. Deterministic safety requirements.
2. Explicit response constraints and forbidden behaviors.
3. Explicit current-turn instructions.
4. Resolved response style.
5. Persistent communication preferences.
6. Default Ari style.

Return JSON only.
`.trim();
}

function buildOpenAIReasoningUserPrompt(
  reasoningInput = {},
  allowedOperations = []
) {
  return `
CURRENT REASONING TRANSPORT:
${safeJsonStringify(
  reasoningInput
)}

ALLOWED CANONICAL OPERATIONS:
${safeJsonStringify(
  allowedOperations
)}

Analyze the user's current request using only the supplied cognitivePacket and contracts.

Return exactly one valid JSON object using this core shape:

{
  "ready": true,
  "interpretation": {
    "conversationFunction": null,
    "userGoal": "What the user wants accomplished.",
    "operation": "One allowed canonical operation.",
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
    "decisionRationale": null,
    "shouldAskClarifyingQuestion": false
  },
  "semanticFrame": {
    "operation": "One exact value from ALLOWED CANONICAL OPERATIONS.",
    "requestType": null,
    "frameType": null,
    "interactionFamily": null,
    "intentFamily": null,
    "requestedOutput": "The output the user expects.",
    "domain": null,
    "subject": null,
    "object": null,
    "target": null,
    "constraints": [],
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
    }
  },
  "responseRequirements": {
    "goal": "What the response must accomplish.",
    "shape": "single_lane",
    "tone": null,
    "requiredMoves": [],
    "prohibitedMoves": [],
    "requiredBehaviors": [],
    "forbiddenBehaviors": [],
    "constraints": [],
    "requiredFacts": [],
    "safetyRequirements": [],
    "continuityRequirements": [],
    "toneRequirements": [],
    "styleApplied": {
      "source": null,
      "tone": null,
      "directness": null,
      "warmth": null,
      "humor": null,
      "formality": null,
      "verbosity": null,
      "profanityLevel": null
    },
    "clarificationRequired": false,
    "clarificationQuestion": null,
    "actionRequired": false
  },
  "draftResponse": "The complete natural response Ari should give the user.",
  "grounding": {
    "evidenceUsed": [],
    "assumptions": [],
    "unresolvedConflicts": []
  },
  "confidence": 0.9
}

Core requirements:
- Return one valid JSON object.
- Do not use markdown fences.
- Do not add text outside the JSON object.
- draftResponse must be complete, natural, user-facing, and non-empty.
- semanticFrame must be an object.
- semanticFrame.operation must exactly match one allowed canonical operation.
- Do not invent, combine, paraphrase, or expand operation names.
- Put the domain, target, condition, file name, or artifact name in semantic slots.
- Never mark an action as executed, completed, successful, delivered, or persisted.
- Actions may only be proposed.
- Do not expose private chain-of-thought.
- Do not place the cognitive result inside another wrapper.
- Apply communication style only from the supplied cognitivePacket.
- Reflect the style actually used in responseRequirements.styleApplied when practical.

Secondary fields may be concise. Empty arrays and objects are acceptable when no value applies.
`.trim();
}

/* =====================================================
   REASONING VALIDATION FAILURES
===================================================== */

function buildReasoningFieldFailure({
  res,
  data = null,
  parsed = null,
  rawModelOutput = "",
  timing = {},
  totalStart = Date.now(),
  field = "unknown",
  failureType =
    "reasoning_contract_validation_failed"
} = {}) {
  const totalMs =
    Date.now() -
    totalStart;

  const failure = {
    success:
      false,

    ready:
      false,

    error:
      `OpenAI reasoning returned an invalid or missing fatal field: ${field}.`,

    failureType,

    failedField:
      field,

    parsedModelOutput:
      parsed,

    rawModelOutputPreview:
      previewText(
        rawModelOutput,
        MAX_MODEL_OUTPUT_PREVIEW
      ),

    model:
      data?.model ||
      DEFAULT_OPENAI_MODEL,

    finishReason:
      data?.choices?.[0]
        ?.finish_reason ||
      null,

    source:
      "openai_reasoning",

    timing: {
      ...timing,
      totalMs
    }
  };

  console.error(
    "[Ari OpenAI Reasoning Fatal Contract Failure]",
    failure
  );

  return res
    .status(502)
    .json(failure);
}

/* =====================================================
   CONTRACT RESOLUTION
===================================================== */

function resolveResponseSchema(
  body = {},
  cognitivePacket = {}
) {
  const bodySchema =
    normalizeObject(
      body.responseSchema
    );

  if (
    isNonEmptyObject(bodySchema)
  ) {
    return bodySchema;
  }

  return normalizeObject(
    cognitivePacket.outputContract
  );
}

function resolveOperationContract(
  body = {},
  cognitivePacket = {}
) {
  const bodyContract =
    normalizeObject(
      body.operationContract
    );

  if (
    isNonEmptyObject(
      bodyContract
    )
  ) {
    return bodyContract;
  }

  return normalizeObject(
    cognitivePacket
      .operationContract
  );
}

function resolveInstructions(
  body = {},
  cognitivePacket = {}
) {
  const bodyInstructions =
    cleanStringList(
      body.instructions
    );

  if (
    bodyInstructions.length
  ) {
    return bodyInstructions;
  }

  return cleanStringList(
    cognitivePacket.instructions
  );
}

function resolveAllowedOperations(
  responseSchema = {},
  operationContract = {},
  cognitivePacket = {}
) {
  const canonical =
    responseSchema
      ?.properties
      ?.semanticFrame
      ?.properties
      ?.operation
      ?.enum;

  const fallbacks = [
    responseSchema
      ?.semanticFrame
      ?.operation
      ?.enum,

    responseSchema
      ?.operationEnum,

    responseSchema
      ?.allowedOperations,

    operationContract
      ?.allowedOperations,

    operationContract
      ?.operations,

    cognitivePacket
      ?.operationContract
      ?.allowedOperations,

    cognitivePacket
      ?.outputContract
      ?.allowedOperations
  ];

  const source =
    Array.isArray(canonical)
      ? canonical
      : fallbacks.find(
          Array.isArray
        ) ||
        [];

  return uniqueStrings(source);
}

function detectDeveloperReasoning(
  cognitivePacket = {}
) {
  const developerEvidence =
    normalizeObject(
      cognitivePacket.developerEvidence
    );

  const developerFileContent =
    firstNonEmptyString([
      developerEvidence
        ?.github
        ?.content,

      developerEvidence
        ?.github
        ?.fileContent,

      developerEvidence
        ?.fileContext
        ?.content,

      developerEvidence
        ?.fileContext
        ?.fileContent
    ]);

  const lane =
    firstNonEmptyString([
      cognitivePacket
        ?.responseControl
        ?.contextLane,

      cognitivePacket
        ?.responseControl
        ?.primaryLane,

      cognitivePacket
        ?.routingContract
        ?.contextLane,

      cognitivePacket
        ?.routingContract
        ?.primaryLane,

      cognitivePacket
        ?.routing
        ?.contextLane,

      cognitivePacket
        ?.routing
        ?.primaryLane
    ])
      .toLowerCase();

  return (
    isNonEmptyObject(
      developerEvidence
    ) ||
    Boolean(
      developerFileContent
    ) ||
    [
      "developer",
      "developer_task",
      "code",
      "project"
    ].includes(lane)
  );
}

/* =====================================================
   OPENAI TRANSPORT
===================================================== */

function getOpenAIHeaders() {
  return {
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${process.env.OPENAI_API_KEY}`
  };
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs =
    OPENAI_TIMEOUT_MS
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () =>
        controller.abort(),
      timeoutMs
    );

  try {
    return await fetch(
      url,
      {
        ...options,

        signal:
          controller.signal
      }
    );
  } catch (error) {
    if (
      error?.name ===
        "AbortError"
    ) {
      const timeoutError =
        new Error(
          `OpenAI request exceeded ${timeoutMs}ms.`
        );

      timeoutError.name =
        "AbortError";

      timeoutError.code =
        "openai_request_timeout";

      timeoutError.status =
        504;

      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function readJsonResponse(
  response
) {
  const rawText =
    await response.text();

  if (!rawText?.trim()) {
    return {
      _rawText:
        "",

      _emptyResponse:
        true
    };
  }

  try {
    const parsed =
      JSON.parse(rawText);

    if (isPlainObject(parsed)) {
      return {
        ...parsed,

        _rawText:
          rawText
      };
    }

    return {
      value:
        parsed,

      _rawText:
        rawText
    };
  } catch (error) {
    return {
      _rawText:
        rawText,

      _jsonParseError:
        error?.message ||
        "response_json_parse_failed"
    };
  }
}

function extractProviderError(
  data = {}
) {
  const errorObject =
    isPlainObject(data?.error)
      ? data.error
      : {};

  return {
    message:
      firstNonEmptyString([
        errorObject.message,
        data?.message,

        typeof data?.error ===
          "string"
          ? data.error
          : null,

        data?._rawText
      ]) ||
      "OpenAI request failed.",

    type:
      firstNonEmptyString([
        errorObject.type,
        data?.type
      ]),

    code:
      firstNonEmptyString([
        errorObject.code,
        data?.code
      ]),

    param:
      firstNonEmptyString([
        errorObject.param,
        data?.param
      ])
  };
}

/* =====================================================
   MODEL OUTPUT EXTRACTION
===================================================== */

function extractRawModelOutput(
  data = {}
) {
  const messageContent =
    data?.choices?.[0]
      ?.message?.content;

  if (
    typeof messageContent ===
      "string"
  ) {
    return messageContent;
  }

  if (
    Array.isArray(
      messageContent
    )
  ) {
    const combined =
      messageContent
        .map(part => {
          if (
            typeof part ===
              "string"
          ) {
            return part;
          }

          if (
            isPlainObject(part)
          ) {
            return firstNonEmptyString([
              part.text,
              part.content,
              part.output_text
            ]);
          }

          return "";
        })
        .filter(Boolean)
        .join("\n");

    if (combined) {
      return combined;
    }
  }

  const direct =
    firstNonEmptyString([
      data?.output_text,
      data?.outputText,
      data?.responseText,
      data?.content,
      data?.text
    ]);

  if (direct) {
    return direct;
  }

  if (
    isPlainObject(data?.result) ||
    Array.isArray(data?.result)
  ) {
    return safeJsonStringify(
      data.result
    );
  }

  return "";
}

function parseModelResult(
  rawModelOutput
) {
  if (
    isPlainObject(
      rawModelOutput
    )
  ) {
    return {
      value:
        rawModelOutput,

      wasJson:
        true,

      source:
        "object"
    };
  }

  if (
    typeof rawModelOutput !==
      "string" ||
    !rawModelOutput.trim()
  ) {
    return {
      value:
        null,

      wasJson:
        false,

      source:
        "empty"
    };
  }

  const cleaned =
    stripMarkdownCodeFence(
      rawModelOutput
    );

  try {
    return {
      value:
        JSON.parse(cleaned),

      wasJson:
        true,

      source:
        "json"
    };
  } catch {
    const extracted =
      extractFirstJsonObject(
        cleaned
      );

    if (extracted) {
      try {
        return {
          value:
            JSON.parse(
              extracted
            ),

          wasJson:
            true,

          source:
            "extracted_json"
        };
      } catch {
        // Continue to standard failure.
      }
    }

    return {
      value:
        cleaned,

      wasJson:
        false,

      source:
        "text"
    };
  }
}

function stripMarkdownCodeFence(
  value = ""
) {
  return String(value || "")
    .trim()
    .replace(
      /^```(?:json)?\s*/i,
      ""
    )
    .replace(
      /\s*```$/i,
      ""
    )
    .trim();
}

function extractFirstJsonObject(
  value = ""
) {
  const text =
    String(value || "");

  let start =
    -1;

  let depth =
    0;

  let inString =
    false;

  let escaped =
    false;

  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    const character =
      text[index];

    if (start < 0) {
      if (
        character ===
          "{"
      ) {
        start =
          index;

        depth =
          1;
      }

      continue;
    }

    if (escaped) {
      escaped =
        false;

      continue;
    }

    if (
      character ===
        "\\"
    ) {
      escaped =
        true;

      continue;
    }

    if (
      character ===
        '"'
    ) {
      inString =
        !inString;

      continue;
    }

    if (inString) {
      continue;
    }

    if (
      character ===
        "{"
    ) {
      depth += 1;
    } else if (
      character ===
        "}"
    ) {
      depth -= 1;

      if (depth === 0) {
        return text.slice(
          start,
          index + 1
        );
      }
    }
  }

  return null;
}

/* =====================================================
   REQUEST HELPERS
===================================================== */

async function resolveRequestBody(req) {
  if (
    isPlainObject(req.body)
  ) {
    return req.body;
  }

  if (
    typeof req.body ===
      "string" &&
    req.body.trim()
  ) {
    try {
      const parsed =
        JSON.parse(req.body);

      return isPlainObject(parsed)
        ? parsed
        : {};
    } catch {
      const error =
        new Error(
          "Request body must contain valid JSON."
        );

      error.code =
        "invalid_json_request_body";

      error.status =
        400;

      throw error;
    }
  }

  return {};
}

/* =====================================================
   GENERAL UTILITIES
===================================================== */

function normalizeObject(value) {
  return isPlainObject(value)
    ? value
    : {};
}

function normalizeObjectOrNull(
  value
) {
  return isPlainObject(value)
    ? value
    : null;
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value.filter(
        item =>
          item !==
            undefined &&
          item !==
            null
      )
    : [];
}

function isPlainObject(value) {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(value);

  return (
    prototype ===
      Object.prototype ||
    prototype ===
      null
  );
}

function isNonEmptyObject(value) {
  return (
    isPlainObject(value) &&
    Object.keys(value).length >
      0
  );
}

function firstNonEmptyString(
  values = []
) {
  for (
    const value
    of values
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

function cleanStringList(
  value
) {
  return uniqueStrings(
    Array.isArray(value)
      ? value
      : []
  );
}

function uniqueStrings(
  values = []
) {
  return [
    ...new Set(
      normalizeArray(values)
        .filter(
          value =>
            typeof value ===
              "string"
        )
        .map(
          value =>
            value.trim()
        )
        .filter(Boolean)
    )
  ];
}

function normalizeReasoningConfidence(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return 0.5;
  }

  return Math.min(
    1,
    Math.max(
      0,
      number
    )
  );
}

function normalizePositiveInteger(
  value,
  fallback
) {
  const number =
    Number(value);

  return (
    Number.isInteger(number) &&
    number > 0
  )
    ? number
    : fallback;
}

function normalizeHttpStatus(
  value,
  fallback = 500
) {
  const status =
    Number(value);

  return (
    Number.isInteger(status) &&
    status >= 400 &&
    status <= 599
  )
    ? status
    : fallback;
}

function safeJsonStringify(value) {
  const seen =
    new WeakSet();

  try {
    return JSON.stringify(
      value,
      (
        key,
        currentValue
      ) => {
        if (
          typeof currentValue ===
            "bigint"
        ) {
          return currentValue
            .toString();
        }

        if (
          currentValue &&
          typeof currentValue ===
            "object"
        ) {
          if (
            seen.has(
              currentValue
            )
          ) {
            return "[Circular]";
          }

          seen.add(
            currentValue
          );
        }

        return currentValue;
      },
      2
    );
  } catch (error) {
    return JSON.stringify({
      serializationError:
        error?.message ||
        "unknown_serialization_error"
    });
  }
}

function previewText(
  value,
  maximumLength =
    MAX_MODEL_OUTPUT_PREVIEW
) {
  if (
    typeof value !==
      "string"
  ) {
    return value ||
      null;
  }

  if (
    value.length <=
      maximumLength
  ) {
    return value;
  }

  return (
    value.slice(
      0,
      maximumLength
    ) +
    `…[truncated ${value.length - maximumLength} characters]`
  );
}

function serializeError(error) {
  if (!error) {
    return null;
  }

  return {
    name:
      error.name ||
      "Error",

    message:
      error.message ||
      String(error),

    code:
      error.code ||
      null,

    status:
      error.status ||
      null,

    stack:
      error.stack ||
      null,

    cause:
      error.cause
        ? {
            name:
              error.cause.name ||
              null,

            message:
              error.cause.message ||
              String(
                error.cause
              )
          }
        : null
  };
}

function setCommonHeaders(res) {
  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );
}
