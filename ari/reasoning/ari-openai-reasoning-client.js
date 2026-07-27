// ari/reasoning/ari-openai-reasoning-client.js
// Ari OpenAI Reasoning Client
//
// Purpose:
// Transport one lean cognitive packet from AriReasoningEngine to the
// server-side OpenAI endpoint and return structured model output.
//
// V2.0.0 — Cognitive Packet Transport Boundary
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
// Structured OpenAI Result
//      ↓
// AriReasoningEngine Validation
//
// Responsibilities:
// - Accept one lean cognitive packet.
// - Preserve the response-schema, operation, and instruction contracts.
// - Send exactly one structured HTTP request to the server.
// - Parse structured JSON returned by the server.
// - Preserve structured server and provider failures.
// - Return model output to AriReasoningEngine.
// - Expose transport and extraction diagnostics.
//
// Non-responsibilities:
// - Does not accept or flatten the full canonical reasoning request.
// - Does not inspect Ari memory, routing, continuity, or perception schemas.
// - Does not select or trim reasoning context.
// - Does not resolve, merge, or reinterpret communication preferences.
// - Does not interpret user meaning locally.
// - Does not create or validate the semantic frame.
// - Does not execute actions.
// - Does not persist state.
// - Does not compose the final user-facing response.
// - Does not replace AriReasoningEngine validation.

window.Ari = window.Ari || {};

window.AriOpenAIReasoningClient = {
  version:
    "2.0.0",

  source:
    "ari-openai-reasoning-client",

  endpoint:
    "/api/knowledge",

  /* =====================================================
     PUBLIC ENTRY POINTS
  ===================================================== */

  async invoke(payload = {}) {
    return this.reason(payload);
  },

  async reason(payload = {}) {
    const validation =
      this.validatePayload(payload);

    const cognitivePacket =
      this.normalizeObject(
        payload.cognitivePacket
      );

    const requestText =
      this.resolvePacketRequestText(
        cognitivePacket
      );

    this.debugLog(
      "ARI OPENAI REASONING CLIENT PAYLOAD DIAGNOSTIC:",
      {
        valid:
          validation.valid === true,

        errors:
          validation.errors,

        warnings:
          validation.warnings,

        action:
          payload.action ||
          null,

        task:
          payload.task ||
          null,

        cognitivePacketSchema:
          cognitivePacket.schema ||
          null,

        cognitivePacketSchemaVersion:
          cognitivePacket.schemaVersion ||
          null,

        requestText:
          requestText ||
          null,

        requestTextSource:
          this.resolvePacketRequestTextSource(
            cognitivePacket
          ),

        responseSchema:
          payload.responseSchema
            ?.schema ||
          cognitivePacket
            ?.outputContract
            ?.schema ||
          null,

        responseSchemaVersion:
          payload.responseSchema
            ?.schemaVersion ||
          cognitivePacket
            ?.outputContract
            ?.schemaVersion ||
          null,

        operationContractPresent:
          this.hasKeys(
            payload.operationContract ||
            cognitivePacket
              .operationContract
          ),

        instructionsPresent:
          this.resolveInstructions(
            payload,
            cognitivePacket
          ).length > 0
      }
    );

    if (
      validation.valid !== true
    ) {
      this.errorLog(
        "ARI OPENAI REASONING CLIENT PAYLOAD REJECTED:",
        {
          errors:
            validation.errors,

          warnings:
            validation.warnings,

          requestText:
            requestText ||
            null,

          requestTextSource:
            this.resolvePacketRequestTextSource(
              cognitivePacket
            ),

          cognitivePacketSchema:
            cognitivePacket.schema ||
            null
        }
      );

      const payloadError =
        new Error(
          validation.errors.join(",") ||
          "invalid_reasoning_client_payload"
        );

      payloadError.name =
        "AriOpenAIReasoningPayloadError";

      payloadError.code =
        "invalid_reasoning_client_payload";

      payloadError.failureType =
        "invalid_reasoning_client_payload";

      payloadError.source =
        this.source;

      payloadError.validation =
        validation;

      throw payloadError;
    }

    const requestBody =
      this.buildRequestBody(payload);

    this.debugLog(
      "ARI OPENAI REASONING CLIENT REQUEST DIAGNOSTIC:",
      {
        endpoint:
          this.endpoint,

        action:
          requestBody.action ||
          null,

        task:
          requestBody.task ||
          null,

        cognitivePacketSchema:
          requestBody
            .cognitivePacket
            ?.schema ||
          null,

        cognitivePacketSchemaVersion:
          requestBody
            .cognitivePacket
            ?.schemaVersion ||
          null,

        requestText:
          this.resolvePacketRequestText(
            requestBody.cognitivePacket
          ) ||
          null,

        responseContract:
          requestBody.responseContract ||
          null,

        operationContractPresent:
          this.hasKeys(
            requestBody
              .operationContract
          ),

        instructionsCount:
          Array.isArray(
            requestBody.instructions
          )
            ? requestBody
                .instructions
                .length
            : 0
      }
    );

    let response;

    try {
      response =
        await fetch(
          this.endpoint,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(
                requestBody
              )
          }
        );
    } catch (error) {
      this.errorLog(
        "ARI OPENAI REASONING CLIENT NETWORK FAILURE:",
        {
          endpoint:
            this.endpoint,

          message:
            error?.message ||
            String(error),

          stack:
            error?.stack ||
            null
        }
      );

      const networkError =
        new Error(
          error?.message ||
          "OpenAI reasoning network request failed."
        );

      networkError.name =
        "AriOpenAIReasoningNetworkError";

      networkError.code =
        "openai_reasoning_network_request_failed";

      networkError.failureType =
        "openai_reasoning_network_request_failed";

      networkError.source =
        this.source;

      networkError.endpoint =
        this.endpoint;

      networkError.cause =
        error;

      throw networkError;
    }

    const rawText =
      await response.text();

    this.debugLog(
      "ARI OPENAI REASONING CLIENT RESPONSE DIAGNOSTIC:",
      {
        ok:
          response.ok === true,

        status:
          response.status,

        contentType:
          response.headers
            ?.get?.(
              "content-type"
            ) ||
          null,

        rawTextPreview:
          typeof rawText ===
            "string"
            ? rawText.slice(
                0,
                1000
              )
            : null
      }
    );

    const data =
      this.parseJSON(rawText);

    if (
      response.ok !== true
    ) {
      const extractedError =
        this.extractError({
          data,
          rawText,
          status:
            response.status
        });

      const failureType =
        typeof data?.failureType ===
          "string" &&
        data.failureType.trim()
          ? data.failureType.trim()
          : "openai_reasoning_server_failure";

      const serverError =
        new Error(extractedError);

      serverError.name =
        "AriOpenAIReasoningServerError";

      serverError.code =
        failureType;

      serverError.failureType =
        failureType;

      serverError.status =
        response.status;

      serverError.source =
        data?.source ||
        this.source;

      serverError.finishReason =
        data?.finishReason ||
        null;

      serverError.failedField =
        data?.failedField ||
        null;

      serverError.semanticOperation =
        data?.semanticOperation ||
        null;

      serverError.usage =
        data?.usage ||
        data?.modelInvocation
          ?.usage ||
        null;

      serverError.providerError =
        data?.providerError ||
        null;

      serverError.serverDiagnostics =
        data?.diagnostics ||
        null;

      serverError.serverTiming =
        data?.timing ||
        null;

      serverError.rawModelOutputPreview =
        data?.rawModelOutputPreview ||
        null;

      serverError.parsedModelOutput =
        data?.parsedModelOutput ||
        null;

      serverError.serverResponse =
        this.normalizeObject(data);

      this.errorLog(
        "ARI OPENAI REASONING CLIENT SERVER FAILURE:",
        {
          endpoint:
            this.endpoint,

          status:
            response.status,

          error:
            extractedError,

          failureType,

          finishReason:
            serverError.finishReason,

          failedField:
            serverError.failedField,

          semanticOperation:
            serverError.semanticOperation,

          usage:
            serverError.usage,

          providerError:
            serverError.providerError,

          serverTiming:
            serverError.serverTiming,

          rawModelOutputPreview:
            serverError
              .rawModelOutputPreview
        }
      );

      throw serverError;
    }

    const result =
      this.extractStructuredResult(data);

    this.debugLog(
      "ARI OPENAI REASONING CLIENT RESULT DIAGNOSTIC:",
      {
        extracted:
          Boolean(result),

        resultType:
          Array.isArray(result)
            ? "array"
            : typeof result,

        resultKeys:
          result &&
          typeof result ===
            "object" &&
          !Array.isArray(result)
            ? Object.keys(result)
            : [],

        hasInterpretation:
          Boolean(
            result?.interpretation
          ),

        hasReasoningDecision:
          Boolean(
            result
              ?.reasoningDecision ||
            result?.decision
          ),

        hasSemanticFrame:
          Boolean(
            result
              ?.semanticFrame
          ),

        hasResponseRequirements:
          Boolean(
            result
              ?.responseRequirements ||
            result
              ?.responseStrategy
          ),

        hasDraftResponse:
          Boolean(
            result
              ?.draftResponse ||
            result
              ?.authoritativeDraft
          )
      }
    );

    if (
      !result ||
      typeof result !==
        "object" ||
      Array.isArray(result)
    ) {
      this.errorLog(
        "ARI OPENAI REASONING CLIENT INVALID STRUCTURED RESULT:",
        {
          endpoint:
            this.endpoint,

          status:
            response.status,

          parsedData:
            data,

          rawTextPreview:
            typeof rawText ===
              "string"
              ? rawText.slice(
                  0,
                  1000
                )
              : null
        }
      );

      const resultError =
        new Error(
          "openai_reasoning_server_returned_invalid_structured_result"
        );

      resultError.name =
        "AriOpenAIReasoningResultError";

      resultError.code =
        "openai_reasoning_server_returned_invalid_structured_result";

      resultError.failureType =
        "openai_reasoning_server_returned_invalid_structured_result";

      resultError.source =
        this.source;

      resultError.status =
        response.status;

      throw resultError;
    }

    return {
      ...result,

      source:
        result.source ||
        data?.source ||
        this.source,

      transportMetadata: {
        client:
          this.source,

        clientVersion:
          this.version,

        endpoint:
          this.endpoint,

        status:
          response.status,

        cognitivePacketForwarded:
          this.hasKeys(
            requestBody
              .cognitivePacket
          ),

        cognitivePacketSchema:
          requestBody
            .cognitivePacket
            ?.schema ||
          null,

        cognitivePacketSchemaVersion:
          requestBody
            .cognitivePacket
            ?.schemaVersion ||
          null,

        responseSchemaForwarded:
          this.hasKeys(
            requestBody
              .responseSchema
          ),

        operationContractForwarded:
          this.hasKeys(
            requestBody
              .operationContract
          ),

        instructionsForwarded:
          Array.isArray(
            requestBody.instructions
          ) &&
          requestBody
            .instructions
            .length > 0
      },

      /*
       * Preserve the old metadata key temporarily so existing
       * diagnostics do not break during migration.
       */
      clientMetadata: {
        client:
          this.source,

        clientVersion:
          this.version,

        endpoint:
          this.endpoint,

        status:
          response.status,

        cognitivePacketForwarded:
          this.hasKeys(
            requestBody
              .cognitivePacket
          )
      }
    };
  },

  /* =====================================================
     REQUEST BODY
  ===================================================== */

  buildRequestBody(payload = {}) {
    const cognitivePacket =
      this.normalizeObject(
        payload.cognitivePacket
      );

    const responseSchema =
      this.resolveResponseSchema(
        payload,
        cognitivePacket
      );

    const operationContract =
      this.resolveOperationContract(
        payload,
        cognitivePacket
      );

    const instructions =
      this.resolveInstructions(
        payload,
        cognitivePacket
      );

    return {
      action:
        payload.action ||
        "openai_reasoning",

      task:
        payload.task ||
        "ari_cognitive_reasoning",

      clientVersion:
        this.version,

      /*
       * This is the only Ari context packet sent to the
       * server. Never spread or attach the full canonical
       * reasoning request here.
       */
      cognitivePacket,

      /*
       * These contracts remain top-level transport fields so
       * /api/knowledge can configure the provider request
       * without reconstructing Ari context.
       */
      responseSchema,

      operationContract,

      instructions,

      outputMode:
        "structured_json",

      responseContract: {
        schema:
          responseSchema.schema ||
          "ari_cognitive_reasoning_result",

        schemaVersion:
          responseSchema
            .schemaVersion ||
          "2.0.1",

        requireValidJSON:
          true,

        allowPlainText:
          false,

        authoritativeDraftRequired:
          true,

        actionsAreProposalsOnly:
          true,

        preserveCognitivePacket:
          true
      }
    };
  },

  resolveResponseSchema(
    payload = {},
    cognitivePacket = {}
  ) {
    const payloadSchema =
      this.normalizeObject(
        payload.responseSchema
      );

    if (
      this.hasKeys(payloadSchema)
    ) {
      return payloadSchema;
    }

    return this.normalizeObject(
      cognitivePacket.outputContract
    );
  },

  resolveOperationContract(
    payload = {},
    cognitivePacket = {}
  ) {
    const payloadContract =
      this.normalizeObject(
        payload.operationContract
      );

    if (
      this.hasKeys(
        payloadContract
      )
    ) {
      return payloadContract;
    }

    return this.normalizeObject(
      cognitivePacket
        .operationContract
    );
  },

  resolveInstructions(
    payload = {},
    cognitivePacket = {}
  ) {
    const payloadInstructions =
      this.cleanStringList(
        payload.instructions
      );

    if (
      payloadInstructions.length
    ) {
      return payloadInstructions;
    }

    return this.cleanStringList(
      cognitivePacket.instructions
    );
  },

  /* =====================================================
     PAYLOAD VALIDATION
  ===================================================== */

  validatePayload(payload = {}) {
    const errors = [];
    const warnings = [];

    if (
      !this.isPlainObject(payload)
    ) {
      return {
        valid:
          false,

        errors: [
          "reasoning_payload_must_be_an_object"
        ],

        warnings
      };
    }

    /*
     * Reject the former canonical request transport shape.
     * The client should receive only cognitivePacket.
     */
    if (
      this.hasKeys(payload.request) ||
      this.hasKeys(
        payload
          .canonicalReasoningRequest
      )
    ) {
      errors.push(
        "full_canonical_reasoning_request_not_allowed"
      );
    }

    const cognitivePacket =
      this.normalizeObject(
        payload.cognitivePacket
      );

    if (
      !this.hasKeys(cognitivePacket)
    ) {
      errors.push(
        "cognitive_packet_missing"
      );

      return {
        valid:
          false,

        errors:
          this.cleanStringList(errors),

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

    const effectiveText =
      this.resolvePacketRequestText(
        cognitivePacket
      );

    if (!effectiveText) {
      errors.push(
        "cognitive_packet_effective_request_missing"
      );
    }

    const responseSchema =
      this.resolveResponseSchema(
        payload,
        cognitivePacket
      );

    if (
      !this.hasKeys(responseSchema)
    ) {
      errors.push(
        "reasoning_response_schema_missing"
      );
    }

    const operationContract =
      this.resolveOperationContract(
        payload,
        cognitivePacket
      );

    if (
      !this.hasKeys(
        operationContract
      )
    ) {
      errors.push(
        "reasoning_operation_contract_missing"
      );
    }

    const instructions =
      this.resolveInstructions(
        payload,
        cognitivePacket
      );

    if (!instructions.length) {
      warnings.push(
        "reasoning_instructions_not_supplied"
      );
    }

    if (
      cognitivePacket.authority
        ?.safetyIsBinding !==
      true
    ) {
      errors.push(
        "cognitive_packet_safety_authority_missing"
      );
    }

    if (
      cognitivePacket.authority
        ?.mayExecuteActions ===
      true
    ) {
      errors.push(
        "cognitive_packet_may_not_authorize_action_execution"
      );
    }

    if (
      cognitivePacket.authority
        ?.mayPersistState ===
      true
    ) {
      errors.push(
        "cognitive_packet_may_not_authorize_persistence"
      );
    }

    if (
      cognitivePacket.authority
        ?.mayOverrideSafety ===
      true
    ) {
      errors.push(
        "cognitive_packet_may_not_override_safety"
      );
    }

    if (
      cognitivePacket.authority
        ?.mayClaimToolSuccess ===
      true
    ) {
      errors.push(
        "cognitive_packet_may_not_claim_tool_success"
      );
    }

    if (
      cognitivePacket.authority
        ?.mayAuthorizeDelivery ===
      true
    ) {
      errors.push(
        "cognitive_packet_may_not_authorize_delivery"
      );
    }

    if (
      cognitivePacket.authority
        ?.mayExposePrivateChainOfThought ===
      true
    ) {
      errors.push(
        "cognitive_packet_may_not_expose_private_chain_of_thought"
      );
    }

    return {
      valid:
        errors.length === 0,

      errors:
        this.cleanStringList(errors),

      warnings:
        this.cleanStringList(warnings)
    };
  },

  resolvePacketRequestText(
    cognitivePacket = {}
  ) {
    if (
      !this.isPlainObject(
        cognitivePacket
      )
    ) {
      return "";
    }

    const candidates = [
      cognitivePacket.request
        ?.effective,

      cognitivePacket.request
        ?.resolved,

      cognitivePacket.request
        ?.original,

      cognitivePacket.currentTurn
        ?.effectiveText,

      cognitivePacket.currentTurn
        ?.originalText
    ];

    for (
      const candidate
      of candidates
    ) {
      if (
        typeof candidate ===
          "string" &&
        candidate.trim()
      ) {
        return candidate.trim();
      }
    }

    return "";
  },

  resolvePacketRequestTextSource(
    cognitivePacket = {}
  ) {
    if (
      !this.isPlainObject(
        cognitivePacket
      )
    ) {
      return null;
    }

    const candidates = [
      [
        "request.effective",
        cognitivePacket.request
          ?.effective
      ],

      [
        "request.resolved",
        cognitivePacket.request
          ?.resolved
      ],

      [
        "request.original",
        cognitivePacket.request
          ?.original
      ],

      [
        "currentTurn.effectiveText",
        cognitivePacket.currentTurn
          ?.effectiveText
      ],

      [
        "currentTurn.originalText",
        cognitivePacket.currentTurn
          ?.originalText
      ]
    ];

    for (
      const [source, value]
      of candidates
    ) {
      if (
        typeof value ===
          "string" &&
        value.trim()
      ) {
        return source;
      }
    }

    return null;
  },

  /* =====================================================
     STRUCTURED RESPONSE EXTRACTION
  ===================================================== */

  extractStructuredResult(data = null) {
    if (!data) {
      return null;
    }

    if (
      typeof data ===
        "string"
    ) {
      return this.parseStructuredText(
        data
      );
    }

    if (
      typeof data !==
        "object" ||
      Array.isArray(data)
    ) {
      return null;
    }

    const candidates = [
      data.cognitiveReasoningResult,
      data.reasoningResult,

      data.result
        ?.cognitiveReasoningResult,

      data.result
        ?.reasoningResult,

      data.result,

      data.output
        ?.cognitiveReasoningResult,

      data.output
        ?.reasoningResult,

      data.output,

      data.structuredOutput,
      data.parsed,
      data.response,
      data.data,
      data.rawContent,
      data.output_text,
      data.outputText,
      data.responseText,
      data.content,
      data.text
    ];

    for (
      const candidate
      of candidates
    ) {
      if (
        candidate &&
        typeof candidate ===
          "object" &&
        !Array.isArray(candidate)
      ) {
        return candidate;
      }

      if (
        typeof candidate ===
          "string"
      ) {
        const parsed =
          this.parseStructuredText(
            candidate
          );

        if (parsed) {
          return parsed;
        }
      }
    }

    const appearsToBeReasoningResult =
      Object.prototype
        .hasOwnProperty.call(
          data,
          "semanticFrame"
        ) ||
      Object.prototype
        .hasOwnProperty.call(
          data,
          "interpretation"
        ) ||
      data.schema ===
        "ari_cognitive_reasoning_result";

    return appearsToBeReasoningResult
      ? data
      : null;
  },

  parseStructuredText(value = "") {
    if (
      typeof value !==
        "string" ||
      !value.trim()
    ) {
      return null;
    }

    const cleaned =
      value
        .trim()
        .replace(
          /^```(?:json)?\s*/i,
          ""
        )
        .replace(
          /\s*```$/,
          ""
        )
        .trim();

    return this.parseJSON(cleaned);
  },

  parseJSON(value = "") {
    if (
      typeof value !==
        "string" ||
      !value.trim()
    ) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },

  /* =====================================================
     FAILURE EXTRACTION
  ===================================================== */

  extractError({
    data = null,
    rawText = "",
    status = 0
  } = {}) {
    const structuredError =
      data?.error &&
      typeof data.error ===
        "object" &&
      !Array.isArray(
        data.error
      )
        ? (
            data.error.message ||
            data.error.error ||
            data.error.code ||
            null
          )
        : null;

    const structuredDetails =
      data?.details &&
      typeof data.details ===
        "object" &&
      !Array.isArray(
        data.details
      )
        ? (
            data.details.message ||
            data.details.error ||
            null
          )
        : null;

    const candidates = [
      structuredError,

      typeof data?.error ===
        "string"
        ? data.error
        : null,

      data?.message,
      data?.reason,

      structuredDetails,

      typeof data?.details ===
        "string"
        ? data.details
        : null,

      rawText
    ];

    for (
      const candidate
      of candidates
    ) {
      if (
        typeof candidate ===
          "string" &&
        candidate.trim()
      ) {
        return candidate.trim();
      }
    }

    return (
      `OpenAI reasoning request failed with status ${status}.`
    );
  },

  /* =====================================================
     DIAGNOSTIC LOGGING
  ===================================================== */

  isDeveloperLoggingEnabled() {
    return (
      window.AriDeveloperMode ===
        true ||
      window.Ari
        ?.developerMode ===
        true ||
      window.Ari
        ?.config
        ?.developerMode ===
        true ||
      window.Ari
        ?.config
        ?.debug ===
        true
    );
  },

  debugLog(...args) {
    if (
      this.isDeveloperLoggingEnabled()
    ) {
      console.log(...args);
    }
  },

  errorLog(...args) {
    /*
     * Failures remain visible even when developer logging is
     * disabled because they are operationally meaningful.
     */
    console.error(...args);
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  normalizeObject(value) {
    return this.isPlainObject(value)
      ? value
      : {};
  },

  hasKeys(value) {
    return (
      this.isPlainObject(value) &&
      Object.keys(value).length > 0
    );
  },

  isPlainObject(value) {
    return Boolean(
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
    );
  },

  cleanStringList(value) {
    return [
      ...new Set(
        (
          Array.isArray(value)
            ? value
            : []
        )
          .map(item =>
            typeof item ===
              "string"
              ? item.trim()
              : ""
          )
          .filter(Boolean)
      )
    ];
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const valid =
      typeof this.invoke ===
        "function" &&
      typeof this.reason ===
        "function" &&
      typeof this.buildRequestBody ===
        "function" &&
      typeof this.resolveResponseSchema ===
        "function" &&
      typeof this.resolveOperationContract ===
        "function" &&
      typeof this.resolveInstructions ===
        "function" &&
      typeof this.validatePayload ===
        "function" &&
      typeof this.resolvePacketRequestText ===
        "function" &&
      typeof this.extractStructuredResult ===
        "function" &&
      typeof this.extractError ===
        "function";

    return {
      valid,

      ready:
        valid,

      cognitivePacketOnly:
        true,

      acceptsCanonicalReasoningRequest:
        false,

      fullCanonicalRequestForwarded:
        false,

      structuredFailurePreservation:
        true,

      developerLoggingGated:
        true,

      source:
        this.source,

      version:
        this.version,

      endpoint:
        this.endpoint
    };
  }
};

window.Ari.openAIReasoningClient =
  window.AriOpenAIReasoningClient;

const ariOpenAIReasoningClientValidation =
  window.AriOpenAIReasoningClient
    ?.validate?.();

console.log(
  "ARI OPENAI REASONING CLIENT LOADED:",
  window.AriOpenAIReasoningClient
    ?.version,

  ariOpenAIReasoningClientValidation
    ?.ready === true
    ? "READY"
    : "NOT_READY",

  ariOpenAIReasoningClientValidation
);