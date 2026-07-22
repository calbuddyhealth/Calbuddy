// api/knowledge.js
// Ari Knowledge API
//
// Purpose:
// Provide the server-side OpenAI transport for Ari Rebirth cognitive reasoning.
//
// V6.0.0 — Standalone Cognitive Reasoning Route / Complete Runtime Utilities
//
// Supported actions:
// - openai_reasoning
//
// Responsibilities:
// - Validate and normalize the incoming reasoning request.
// - Build the authoritative cognitive-reasoning prompt.
// - Invoke OpenAI through a server-side API key.
// - Parse and validate the structured cognitive result.
// - Preserve exact transport and model-output diagnostics.
// - Return one canonical cognitiveReasoningResult.
//
// Non-responsibilities:
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

const MAX_MODEL_OUTPUT_PREVIEW =
  4000;

/* =====================================================
   VERCEL API ENTRY POINT
===================================================== */

export default async function handler(
  req,
  res
) {
  setCommonHeaders(
    res
  );

  if (
    req.method ===
    "OPTIONS"
  ) {
    return res
      .status(204)
      .end();
  }

  if (
    req.method !==
    "POST"
  ) {
    res.setHeader(
      "Allow",
      "POST, OPTIONS"
    );

    return res
      .status(405)
      .json({
        success:
          false,

        ready:
          false,

        error:
          "Method not allowed.",

        failureType:
          "method_not_allowed",

        source:
          "knowledge_api"
      });
  }

  const requestStart =
    Date.now();

  try {
    const body =
      await resolveRequestBody(
        req
      );

    const action =
      firstNonEmptyString([
        body.action,
        body.request
          ?.action
      ]) ||
      "openai_reasoning";

    switch (
      action
    ) {
      case "openai_reasoning":
      case "ari_cognitive_reasoning":
      case "reason":
        return await handleOpenAIReasoning(
          req,
          res,
          body
        );

      default:
        return res
          .status(400)
          .json({
            success:
              false,

            ready:
              false,

            error:
              `Unsupported knowledge action: ${action}.`,

            failureType:
              "unsupported_knowledge_action",

            action,

            supportedActions: [
              "openai_reasoning"
            ],

            source:
              "knowledge_api",

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
      serializeError(
        error
      )
    );

    if (
      res.headersSent
    ) {
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
        success:
          false,

        ready:
          false,

        error:
          error?.message ||
          "The Ari knowledge API encountered an unexpected failure.",

        failureType:
          error?.code ||
          "knowledge_api_unhandled_failure",

        diagnostics:
          serializeError(
            error
          ),

        source:
          "knowledge_api",

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
  req,
  res,
  suppliedBody = {}
) {
  const totalStart =
    Date.now();

  const timing = {};

  const body =
    isPlainObject(
      suppliedBody
    )
      ? suppliedBody
      : isPlainObject(
          req.body
        )
        ? req.body
        : {};

  if (
    !process.env
      .OPENAI_API_KEY
  ) {
    return res
      .status(500)
      .json({
        success:
          false,

        ready:
          false,

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

      body.request
        ?.original,

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

      body.request
        ?.effective,

      body.effectiveUserMessage,
      body.resolvedUserQuestion,
      body.resolvedQuestion,
      body.question,
      originalQuestion
    ]);

  if (
    !effectiveQuestion
  ) {
    return res
      .status(400)
      .json({
        success:
          false,

        ready:
          false,

        error:
          "No effective question was provided for cognitive reasoning.",

        failureType:
          "invalid_request",

        source:
          "openai_reasoning"
      });
  }

  if (
    !evidencePacket
  ) {
    return res
      .status(400)
      .json({
        success:
          false,

        ready:
          false,

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

  const allowedOperations =
    resolveAllowedOperations(
      outputContract
    );

  if (
    !allowedOperations.length
  ) {
    return res
      .status(400)
      .json({
        success:
          false,

        ready:
          false,

        error:
          "No canonical semantic operation registry was supplied to OpenAI reasoning.",

        failureType:
          "semantic_operation_registry_missing",

        outputContractKeys:
          Object.keys(
            outputContract
          ),

        source:
          "openai_reasoning"
      });
  }

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

    operationContract:
      normalizeObject(
        body.operationContract
      ),

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
                3200,

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
          serializeError(
            error
          )
      }
    );

    return res
      .status(
        isTimeout
          ? 504
          : 502
      )
      .json({
        success:
          false,

        ready:
          false,

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
          serializeError(
            error
          ),

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

  if (
    !response.ok
  ) {
    const providerError =
      extractProviderError(
        data
      );

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
        success:
          false,

        ready:
          false,

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
    !isPlainObject(
      parsed
    )
  ) {
    return res
      .status(502)
      .json({
        success:
          false,

        ready:
          false,

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

        finishReason:
          data?.choices?.[0]
            ?.finish_reason ||
          null,

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

  const requiredFieldChecks = [
    {
      valid:
        isNonEmptyObject(
          interpretation
        ),
      field:
        "interpretation",
      failureType:
        "interpretation_missing"
    },
    {
      valid:
        isNonEmptyObject(
          reasoningDecision
        ),
      field:
        "reasoningDecision",
      failureType:
        "reasoning_decision_missing"
    },
    {
      valid:
        isNonEmptyObject(
          semanticFrame
        ),
      field:
        "semanticFrame",
      failureType:
        "semantic_frame_missing"
    },
    {
      valid:
        isNonEmptyObject(
          responseRequirements
        ),
      field:
        "responseRequirements",
      failureType:
        "response_requirements_missing"
    },
    {
      valid:
        Boolean(
          authoritativeDraft
        ),
      field:
        "draftResponse",
      failureType:
        "authoritative_draft_missing"
    },
    {
      valid:
        isPlainObject(
          grounding
        ),
      field:
        "grounding",
      failureType:
        "grounding_missing"
    },
    {
      valid:
        Array.isArray(
          grounding
            ?.evidenceUsed
        ),
      field:
        "grounding.evidenceUsed",
      failureType:
        "grounding_evidence_used_invalid"
    },
    {
      valid:
        grounding
          ?.assumptions ==
          null ||
        Array.isArray(
          grounding
            ?.assumptions
        ),
      field:
        "grounding.assumptions",
      failureType:
        "grounding_assumptions_invalid"
    },
    {
      valid:
        grounding
          ?.unresolvedConflicts ==
          null ||
        Array.isArray(
          grounding
            ?.unresolvedConflicts
        ),
      field:
        "grounding.unresolvedConflicts",
      failureType:
        "grounding_conflicts_invalid"
    },
    {
      valid:
        Boolean(
          firstNonEmptyString([
            interpretation
              ?.userGoal
          ])
        ),
      field:
        "interpretation.userGoal",
      failureType:
        "interpretation_user_goal_missing"
    },
    {
      valid:
        Boolean(
          firstNonEmptyString([
            interpretation
              ?.meaning
          ])
        ),
      field:
        "interpretation.meaning",
      failureType:
        "interpretation_meaning_missing"
    },
    {
      valid:
        typeof reasoningDecision
          ?.answerDirectly ===
        "boolean",
      field:
        "reasoningDecision.answerDirectly",
      failureType:
        "reasoning_answer_directly_invalid"
    },
    {
      valid:
        Array.isArray(
          reasoningDecision
            ?.proposedActions
        ),
      field:
        "reasoningDecision.proposedActions",
      failureType:
        "reasoning_proposed_actions_invalid"
    },
    {
      valid:
        Boolean(
          firstNonEmptyString([
            semanticFrame
              ?.operation
          ])
        ),
      field:
        "semanticFrame.operation",
      failureType:
        "semantic_operation_missing"
    },
    {
      valid:
        Boolean(
          firstNonEmptyString([
            semanticFrame
              ?.requestedOutput
          ])
        ),
      field:
        "semanticFrame.requestedOutput",
      failureType:
        "semantic_requested_output_missing"
    },
    {
      valid:
        Boolean(
          firstNonEmptyString([
            responseRequirements
              ?.goal,

            responseRequirements
              ?.responseGoal
          ])
        ),
      field:
        "responseRequirements.goal",
      failureType:
        "response_goal_missing"
    },
    {
      valid:
        Array.isArray(
          responseRequirements
            ?.requiredMoves
        ),
      field:
        "responseRequirements.requiredMoves",
      failureType:
        "response_required_moves_invalid"
    },
    {
      valid:
        Array.isArray(
          responseRequirements
            ?.prohibitedMoves
        ),
      field:
        "responseRequirements.prohibitedMoves",
      failureType:
        "response_prohibited_moves_invalid"
    }
  ];

  const failedField =
    requiredFieldChecks.find(
      check =>
        check.valid !==
        true
    );

  if (
    failedField
  ) {
    return buildReasoningFieldFailure({
      res,
      data,
      parsed,
      rawModelOutput,
      timing,
      totalStart,
      field:
        failedField.field,
      failureType:
        failedField
          .failureType
    });
  }

  const canonicalOperation =
    firstNonEmptyString([
      semanticFrame.operation
    ]);

  if (
    !allowedOperations.includes(
      canonicalOperation
    )
  ) {
    return res
      .status(502)
      .json({
        success:
          false,

        ready:
          false,

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

  const claimedActionExecution =
    proposedActions.some(
      action =>
        isPlainObject(
          action
        ) &&
        (
          action.executed ===
            true ||
          action.completed ===
            true ||
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

  if (
    claimedActionExecution
  ) {
    return res
      .status(502)
      .json({
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
    parsed.ready ===
      true &&
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
          action =>
            isPlainObject(
              action
            )
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
                    String(
                      action
                    ),

                  executed:
                    false,

                  completed:
                    false,

                  status:
                    "proposed"
                }
        )
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
          grounding
            .evidenceUsed
        ),

      assumptions:
        normalizeArray(
          grounding
            .assumptions
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
        canonicalOperation,

      responseGoal:
        responseRequirements
          .goal ||
        responseRequirements
          .responseGoal ||
        null,

      authoritativeDraftAvailable:
        Boolean(
          authoritativeDraft
        ),

      authoritativeDraftLength:
        authoritativeDraft
          .length,

      authoritativeDraftPreview:
        authoritativeDraft
          .slice(
            0,
            300
          ),

      timing
    }
  );

  return res
    .status(200)
    .json({
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

Interpret the current user request using only the supplied request, evidence, routing constraints, deterministic context, knowledge evidence, developer evidence, capabilities, response controls, authority contract, operation contract, and output contract.

Produce one structured cognitive reasoning result and one complete authoritative user-facing draft in the same JSON object.

Authority rules:
- Interpret the user's meaning, goal, conversational function, and required response behavior.
- Resolve ambiguity only when supported by supplied evidence and continuity.
- Define the response strategy and response requirements.
- Produce the complete user-facing answer in draftResponse.
- Treat draftResponse as authoritative response language for downstream preservation.
- Distinguish direct evidence from inference.
- Do not fabricate user facts, memories, external facts, citations, actions, or tool results.
- Do not treat deterministic routing labels as semantic truth.
- Respect all supplied safety, routing, tone, and response constraints.
- Preserve the effective current-turn request.
- Do not claim that an action, message, tool call, file change, deployment, or persistence operation occurred.
- Return any action only as a proposal.
- semanticFrame must represent the meaning of the current request.
- responseRequirements must describe what the authoritative draft must accomplish.
- grounding must identify evidence, assumptions, and unresolved conflicts.
- evidenceReferences must identify supplied evidence supporting material conclusions.
- confidence must be numeric from 0 through 1.
- Do not expose private chain-of-thought or hidden reasoning.
- Return concise rationale and conclusions only.
- Output exactly one valid JSON object.
- Do not wrap the result in markdown.
- Do not add commentary outside the JSON object.

Return JSON only.
`.trim();
}

function buildOpenAIReasoningUserPrompt(
  reasoningInput = {}
) {
  const allowedOperations =
    resolveAllowedOperations(
      reasoningInput
        .outputContract
    );

  return `
CURRENT REASONING INPUT:
${safeJsonStringify(
  reasoningInput
)}

ALLOWED CANONICAL OPERATIONS:
${safeJsonStringify(
  allowedOperations
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
    "operation": "One exact operation from ALLOWED CANONICAL OPERATIONS.",
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
- semanticFrame.operation must exactly match one value in ALLOWED CANONICAL OPERATIONS.
- Do not invent, paraphrase, combine, or expand operation names.
- Put the domain in semanticFrame.domain, not semanticFrame.operation.
- Put subjects, targets, conditions, and artifact names in semantic slots, not the operation.
- For a conceptual definition such as "What is heart failure?", use "explain_or_teach" when available.

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
- semanticFrame.requestedOutput must be a non-empty string.
- responseRequirements must be a non-empty object.
- responseRequirements.goal must be a non-empty string.
- responseRequirements.requiredMoves must be an array.
- responseRequirements.prohibitedMoves must be an array.
- draftResponse must be a complete, natural, non-empty user-facing response.
- grounding must be an object.
- grounding.evidenceUsed must be an array.
- grounding.assumptions must be an array.
- grounding.unresolvedConflicts must be an array.
- confidence must be a number from 0 through 1.
- executionMetadata.confidence must be a number from 0 through 1.
- Never mark an action as executed, completed, successful, or persisted.
- Do not expose private chain-of-thought.
- Do not place the result inside an additional wrapper.
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
  const status =
    502;

  const totalMs =
    Date.now() -
    totalStart;

  const failure = {
    success:
      false,

    ready:
      false,

    error:
      `OpenAI reasoning returned an invalid or missing field: ${field}.`,

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
    "[Ari OpenAI Reasoning Contract Failure]",
    failure
  );

  return res
    .status(status)
    .json(failure);
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
    clearTimeout(
      timer
    );
  }
}

async function readJsonResponse(
  response
) {
  const rawText =
    await response.text();

  if (
    !rawText ||
    !rawText.trim()
  ) {
    return {
      _rawText:
        "",

      _emptyResponse:
        true
    };
  }

  try {
    const parsed =
      JSON.parse(
        rawText
      );

    if (
      isPlainObject(
        parsed
      )
    ) {
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
    isPlainObject(
      data?.error
    )
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
        .map(
          part => {
            if (
              typeof part ===
              "string"
            ) {
              return part;
            }

            if (
              isPlainObject(
                part
              )
            ) {
              return firstNonEmptyString([
                part.text,
                part.content,
                part.output_text
              ]);
            }

            return "";
          }
        )
        .filter(
          Boolean
        )
        .join(
          "\n"
        );

    if (
      combined
    ) {
      return combined;
    }
  }

  const directCandidates = [
    data?.output_text,
    data?.outputText,
    data?.responseText,
    data?.content,
    data?.text
  ];

  const direct =
    firstNonEmptyString(
      directCandidates
    );

  if (
    direct
  ) {
    return direct;
  }

  if (
    isPlainObject(
      data?.result
    ) ||
    Array.isArray(
      data?.result
    )
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
        JSON.parse(
          cleaned
        ),

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

    if (
      extracted
    ) {
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
        // Continue to the standard failure result.
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
  return String(
    value ||
    ""
  )
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
    String(
      value ||
      ""
    );

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

    if (
      start < 0
    ) {
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

    if (
      escaped
    ) {
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

    if (
      inString
    ) {
      continue;
    }

    if (
      character ===
      "{"
    ) {
      depth +=
        1;
    } else if (
      character ===
      "}"
    ) {
      depth -=
        1;

      if (
        depth ===
        0
      ) {
        return text.slice(
          start,
          index +
            1
        );
      }
    }
  }

  return null;
}

/* =====================================================
   REQUEST AND CONTRACT HELPERS
===================================================== */

async function resolveRequestBody(
  req
) {
  if (
    isPlainObject(
      req.body
    )
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
        JSON.parse(
          req.body
        );

      return isPlainObject(
        parsed
      )
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

function resolveAllowedOperations(
  outputContract = {}
) {
  const canonical =
    outputContract
      ?.properties
      ?.semanticFrame
      ?.properties
      ?.operation
      ?.enum;

  const fallbacks = [
    outputContract
      ?.semanticFrame
      ?.operation
      ?.enum,

    outputContract
      ?.operationEnum,

    outputContract
      ?.allowedOperations,

    outputContract
      ?.operationContract
      ?.allowedOperations
  ];

  const source =
    Array.isArray(
      canonical
    )
      ? canonical
      : fallbacks.find(
          Array.isArray
        ) ||
        [];

  return uniqueStrings(
    source
  );
}

/* =====================================================
   GENERAL UTILITIES
===================================================== */

function normalizeObject(
  value
) {
  return isPlainObject(
    value
  )
    ? value
    : {};
}

function normalizeObjectOrNull(
  value
) {
  return isPlainObject(
    value
  )
    ? value
    : null;
}

function normalizeArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
    : [];
}

function isPlainObject(
  value
) {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {
    return false;
  }

  const prototype =
    Object.getPrototypeOf(
      value
    );

  return (
    prototype ===
      Object.prototype ||
    prototype ===
      null
  );
}

function isNonEmptyObject(
  value
) {
  return (
    isPlainObject(
      value
    ) &&
    Object.keys(
      value
    ).length >
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

function uniqueStrings(
  values = []
) {
  return [
    ...new Set(
      normalizeArray(
        values
      )
        .filter(
          value =>
            typeof value ===
              "string"
        )
        .map(
          value =>
            value.trim()
        )
        .filter(
          Boolean
        )
    )
  ];
}

function normalizeReasoningConfidence(
  value
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
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
    Number(
      value
    );

  return (
    Number.isInteger(
      number
    ) &&
    number >
      0
  )
    ? number
    : fallback;
}

function normalizeHttpStatus(
  value,
  fallback =
    500
) {
  const status =
    Number(
      value
    );

  return (
    Number.isInteger(
      status
    ) &&
    status >=
      400 &&
    status <=
      599
  )
    ? status
    : fallback;
}

function safeJsonStringify(
  value
) {
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

function serializeError(
  error
) {
  if (
    !error
  ) {
    return null;
  }

  return {
    name:
      error.name ||
      "Error",

    message:
      error.message ||
      String(
        error
      ),

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
              error.cause
                .name ||
              null,

            message:
              error.cause
                .message ||
              String(
                error.cause
              )
          }
        : null
  };
}

function setCommonHeaders(
  res
) {
  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  res.setHeader(
    "Content-Type",
    "application/json; charset=utf-8"
  );
}
