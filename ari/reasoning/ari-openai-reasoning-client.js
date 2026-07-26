// ari/reasoning/ari-openai-reasoning-client.js
// Ari OpenAI Reasoning Client
//
// Purpose:
// Send one canonical cognitive reasoning request to the server-side
// OpenAI transport and return structured model output.
//
// V1.4.0 — Structured Server Failure Preservation
//
// Responsibilities:
// - Accept the canonical reasoning-engine payload.
// - Send a structured reasoning request to the server.
// - Preserve response-schema and instruction contracts.
// - Preserve persistent user communication preferences.
// - Preserve current-turn response-style overrides.
// - Parse structured JSON returned by the server.
// - Return model output to AriReasoningEngine.
// - Expose request, transport, style, and extraction diagnostics.
//
// Non-responsibilities:
// - Does not interpret user meaning locally.
// - Does not create or validate the semantic frame.
// - Does not create, merge, or reinterpret style preferences.
// - Does not execute actions.
// - Does not persist state.
// - Does not compose the final user-facing response.
// - Does not replace AriReasoningEngine validation.

window.Ari = window.Ari || {};

window.AriOpenAIReasoningClient = {
  version:
    "1.4.0",

  source:
    "ari-openai-reasoning-client",

  endpoint:
    "/api/knowledge",

  async invoke(
    payload = {}
  ) {
    return this.reason(
      payload
    );
  },

  async reason(
    payload = {}
  ) {
    const validation =
      this.validatePayload(
        payload
      );

    const effectiveText =
      this.resolveEffectiveText(
        payload.request
      );

    const preferenceTransport =
      this.resolvePreferenceTransport(
        payload
      );

    console.log(
      "ARI OPENAI REASONING CLIENT PAYLOAD DIAGNOSTIC:",
      {
        valid:
          validation.valid ===
          true,

        errors:
          validation.errors,

        warnings:
          validation.warnings,

        task:
          payload.task ||
          null,

        action:
          payload.action ||
          payload.request
            ?.action ||
          null,

        effectiveText:
          effectiveText ||
          null,

        effectiveTextSource:
          this.resolveEffectiveTextSource(
            payload.request
          ),

        responseSchema:
          payload.responseSchema
            ?.schema ||
          null,

        responseSchemaVersion:
          payload.responseSchema
            ?.schemaVersion ||
          null,

preferenceContextPresent:
  this.hasKeys(
    payload.preferenceContext ||
    payload.request
      ?.preferenceContext
  ),

preferenceContextReady:
  (
    payload.preferenceContext ||
    payload.request
      ?.preferenceContext
  )?.ready === true,

        userPreferencesPresent:
          this.hasKeys(
            preferenceTransport
              .userPreferences
          ),

        responseStylePresent:
          this.hasKeys(
            preferenceTransport
              .responseStyle
          ),

        userPreferencesSource:
          preferenceTransport
            .diagnostics
            .userPreferencesSource,

        responseStyleSource:
          preferenceTransport
            .diagnostics
            .responseStyleSource
      }
    );

    if (
      validation.valid !==
      true
    ) {
      console.error(
        "ARI OPENAI REASONING CLIENT PAYLOAD REJECTED:",
        {
          errors:
            validation.errors,

          warnings:
            validation.warnings,

          effectiveText:
            effectiveText ||
            null,

          effectiveTextSource:
            this.resolveEffectiveTextSource(
              payload.request
            ),

          preferenceTransport:
            preferenceTransport
              .diagnostics,

          payload
        }
      );

      throw new Error(
        validation.errors.join(
          ","
        ) ||
        "invalid_reasoning_client_payload"
      );
    }

    const requestBody =
      this.buildRequestBody(
        payload
      );

    console.log(
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

        effectiveText:
          this.resolveEffectiveText(
            requestBody
          ) ||
          null,

        effectiveTextSource:
          this.resolveEffectiveTextSource(
            requestBody
          ),

        responseContract:
          requestBody.responseContract ||
          null,

preferenceContextPresent:
  this.hasKeys(
    requestBody.preferenceContext
  ),

preferenceContextReady:
  requestBody
    .preferenceContext
    ?.ready === true,

        userPreferencesPresent:
          this.hasKeys(
            requestBody
              .userPreferences
          ),

        responseStylePresent:
          this.hasKeys(
            requestBody
              .responseStyle
          ),

        styleTransport:
          requestBody
            .styleTransport ||
          null
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
      console.error(
        "ARI OPENAI REASONING CLIENT NETWORK FAILURE:",
        {
          endpoint:
            this.endpoint,

          message:
            error?.message ||
            String(
              error
            ),

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

    console.log(
      "ARI OPENAI REASONING CLIENT RESPONSE DIAGNOSTIC:",
      {
        ok:
          response.ok ===
          true,

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
      this.parseJSON(
        rawText
      );

        if (
      response.ok !==
      true
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
        new Error(
          extractedError
        );

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
        this.normalizeObject(
          data
        );

      console.error(
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
              .rawModelOutputPreview,

          data
        }
      );

      throw serverError;
    }

    const result =
      this.extractStructuredResult(
        data
      );

    console.log(
      "ARI OPENAI REASONING CLIENT RESULT DIAGNOSTIC:",
      {
        extracted:
          Boolean(
            result
          ),

        resultType:
          Array.isArray(
            result
          )
            ? "array"
            : typeof result,

        resultKeys:
          result &&
          typeof result ===
            "object" &&
          !Array.isArray(
            result
          )
            ? Object.keys(
                result
              )
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

        hasStyleApplied:
          Boolean(
            result
              ?.responseRequirements
              ?.styleApplied ||
            result
              ?.responseStrategy
              ?.styleApplied
          )
      }
    );

    if (
      !result ||
      typeof result !==
        "object" ||
      Array.isArray(
        result
      )
    ) {
      console.error(
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

      throw new Error(
        "openai_reasoning_server_returned_invalid_structured_result"
      );
    }

    return {
      ...result,

      source:
        result.source ||
        data?.source ||
        this.source,

      clientMetadata: {
        client:
          this.source,

        clientVersion:
          this.version,

        endpoint:
          this.endpoint,

        status:
          response.status,

preferenceContextForwarded:
  this.hasKeys(
    requestBody.preferenceContext
  ),

        userPreferencesForwarded:
          this.hasKeys(
            requestBody
              .userPreferences
          ),

        responseStyleForwarded:
          this.hasKeys(
            requestBody
              .responseStyle
          )
      }
    };
  },

  buildRequestBody(
    payload = {}
  ) {
    const reasoningRequest =
      this.normalizeObject(
        payload.request
      );

const payloadPreferenceContext =
  this.normalizeObject(
    payload.preferenceContext
  );

const requestPreferenceContext =
  this.normalizeObject(
    reasoningRequest.preferenceContext
  );

const preferenceContext =
  this.hasKeys(
    payloadPreferenceContext
  )
    ? payloadPreferenceContext
    : requestPreferenceContext;

    const preferenceTransport =
      this.resolvePreferenceTransport(
        payload
      );

    return {
  /*
   * Flatten the canonical reasoning request so
   * /api/knowledge can read currentTurn,
   * evidencePacket, routingContract, and other
   * canonical fields directly from body.
   */
  ...reasoningRequest,

  /*
   * Explicitly preserve the canonical preference
   * wrapper for the server-side OpenAI transport.
   */
  preferenceContext,

  /*
   * Preserve communication-preference packets
   * unchanged. The client does not merge or
   * reinterpret them.
   */
  userPreferences:
    preferenceTransport
      .userPreferences,

  responseStyle:
    preferenceTransport
      .responseStyle,
      styleTransport:
        preferenceTransport
          .diagnostics,

      action:
        "openai_reasoning",

      task:
        payload.task ||
        "ari_cognitive_reasoning",

      clientVersion:
        this.version,

      responseSchema:
        this.normalizeObject(
          payload.responseSchema
        ),

      instructions:
        Array.isArray(
          payload.instructions
        )
          ? payload.instructions
          : [],

      outputMode:
        "structured_json",

      responseContract: {
        schema:
          payload.responseSchema
            ?.schema ||
          "ari_cognitive_reasoning_result",

        schemaVersion:
          payload.responseSchema
            ?.schemaVersion ||
          "1.1.1",

        requireValidJSON:
          true,

        allowPlainText:
          false,

preservePreferenceContext:
  true,

        preserveUserPreferences:
          true,

        preserveResponseStyle:
          true
      }
    };
  },

  resolvePreferenceTransport(
    payload = {}
  ) {
    const reasoningRequest =
      this.normalizeObject(
        payload.request
      );

    const userPreferencesCandidates = [
  [
    "payload.userPreferences",
    payload.userPreferences
  ],

  [
    "payload.preferenceContext.userPreferences",
    payload.preferenceContext
      ?.userPreferences
  ],

  [
    "request.preferenceContext.userPreferences",
    reasoningRequest
      .preferenceContext
      ?.userPreferences
  ],

  [
    "payload.communicationPreferences",
    payload.communicationPreferences
  ],

      [
        "payload.stylePreferences",
        payload.stylePreferences
      ],

      [
        "request.userPreferences",
        reasoningRequest
          .userPreferences
      ],

      [
        "request.communicationPreferences",
        reasoningRequest
          .communicationPreferences
      ],

      [
        "request.stylePreferences",
        reasoningRequest
          .stylePreferences
      ],

      [
        "request.memory.userPreferences",
        reasoningRequest
          .memory
          ?.userPreferences
      ],

      [
        "request.memory.communicationPreferences",
        reasoningRequest
          .memory
          ?.communicationPreferences
      ],

      [
        "request.memory.preferences.style",
        reasoningRequest
          .memory
          ?.preferences
          ?.style
      ]
    ];

    const responseStyleCandidates = [
  [
    "payload.responseStyle",
    payload.responseStyle
  ],

  [
    "payload.preferenceContext.currentTurnOverride",
    payload.preferenceContext
      ?.currentTurnOverride
  ],

  [
    "request.preferenceContext.currentTurnOverride",
    reasoningRequest
      .preferenceContext
      ?.currentTurnOverride
  ],

  [
    "payload.preferenceContext.responseStyle",
    payload.preferenceContext
      ?.responseStyle
  ],

  [
    "request.preferenceContext.responseStyle",
    reasoningRequest
      .preferenceContext
      ?.responseStyle
  ],

  [
    "payload.styleOverride",
    payload.styleOverride
  ],

[
  "request.responseStyle",
  reasoningRequest
    .responseStyle
],

[
  "request.styleOverride",
  reasoningRequest
    .styleOverride
],

      [
        "request.currentTurn.responseStyle",
        reasoningRequest
          .currentTurn
          ?.responseStyle
      ],

      [
        "request.currentTurn.styleOverride",
        reasoningRequest
          .currentTurn
          ?.styleOverride
      ],

      [
        "request.responseControl.responseStyle",
        reasoningRequest
          .responseControl
          ?.responseStyle
      ],

      [
        "request.responseControl.styleOverride",
        reasoningRequest
          .responseControl
          ?.styleOverride
      ]
    ];

    const userPreferencesResolution =
      this.resolveFirstObject(
        userPreferencesCandidates
      );

    const responseStyleResolution =
      this.resolveFirstObject(
        responseStyleCandidates
      );

    return {
      userPreferences:
        userPreferencesResolution
          .value,

      responseStyle:
        responseStyleResolution
          .value,

      diagnostics: {
        source:
          this.source,

        version:
          this.version,

        preservedWithoutInterpretation:
          true,

        userPreferencesSource:
          userPreferencesResolution
            .source,

        responseStyleSource:
          responseStyleResolution
            .source,

        userPreferencesPresent:
          this.hasKeys(
            userPreferencesResolution
              .value
          ),

        responseStylePresent:
          this.hasKeys(
            responseStyleResolution
              .value
          )
      }
    };
  },

  resolveFirstObject(
    candidates = []
  ) {
    for (
      const candidate
      of candidates
    ) {
      if (
        !Array.isArray(
          candidate
        ) ||
        candidate.length < 2
      ) {
        continue;
      }

      const [source, value] =
        candidate;

      if (
        this.isPlainObject(
          value
        ) &&
        Object.keys(
          value
        ).length
      ) {
        return {
          source,
          value
        };
      }
    }

    return {
      source: null,
      value: {}
    };
  },

  validatePayload(
    payload = {}
  ) {
    const errors = [];
    const warnings = [];

    if (
      !this.isPlainObject(
        payload
      )
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

    const reasoningRequest =
      this.isPlainObject(
        payload.request
      )
        ? payload.request
        : null;

    if (!reasoningRequest) {
      errors.push(
        "reasoning_request_missing"
      );
    }

    const effectiveText =
      this.resolveEffectiveText(
        reasoningRequest
      );

    if (!effectiveText) {
      errors.push(
        "effective_user_request_missing"
      );
    }

    if (
      !this.isPlainObject(
        payload.responseSchema
      )
    ) {
      errors.push(
        "reasoning_response_schema_missing"
      );
    }

    const preferenceTransport =
      this.resolvePreferenceTransport(
        payload
      );

    if (
      !preferenceTransport
        .diagnostics
        .userPreferencesPresent
    ) {
      warnings.push(
        "user_preferences_not_supplied"
      );
    }

    if (
      !preferenceTransport
        .diagnostics
        .responseStylePresent
    ) {
      warnings.push(
        "response_style_not_supplied"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      errors,
      warnings
    };
  },

  resolveEffectiveText(
    request = {}
  ) {
    if (
      !request ||
      typeof request !==
        "object" ||
      Array.isArray(
        request
      )
    ) {
      return "";
    }

    const candidates = [
      request.request
        ?.effective,

      request.currentTurn
        ?.effectiveText,

      request.effectiveUserMessage,

      request.resolvedUserQuestion,

      request.resolvedQuestion,

      request.question,

      request.request
        ?.original,

      request.currentTurn
        ?.originalText,

      request.originalUserMessage,

      request.rawQuestion,

      request.userMessage,

      request.message,

      request.input
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

  resolveEffectiveTextSource(
    request = {}
  ) {
    if (
      !request ||
      typeof request !==
        "object" ||
      Array.isArray(
        request
      )
    ) {
      return null;
    }

    const candidates = [
      [
        "request.effective",
        request.request
          ?.effective
      ],

      [
        "currentTurn.effectiveText",
        request.currentTurn
          ?.effectiveText
      ],

      [
        "effectiveUserMessage",
        request.effectiveUserMessage
      ],

      [
        "resolvedUserQuestion",
        request.resolvedUserQuestion
      ],

      [
        "resolvedQuestion",
        request.resolvedQuestion
      ],

      [
        "question",
        request.question
      ],

      [
        "request.original",
        request.request
          ?.original
      ],

      [
        "currentTurn.originalText",
        request.currentTurn
          ?.originalText
      ],

      [
        "originalUserMessage",
        request.originalUserMessage
      ],

      [
        "rawQuestion",
        request.rawQuestion
      ],

      [
        "userMessage",
        request.userMessage
      ],

      [
        "message",
        request.message
      ],

      [
        "input",
        request.input
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

  extractStructuredResult(
    data = null
  ) {
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
      Array.isArray(
        data
      )
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
        !Array.isArray(
          candidate
        )
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

  parseStructuredText(
    value = ""
  ) {
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

    return this.parseJSON(
      cleaned
    );
  },

  parseJSON(
    value = ""
  ) {
    if (
      typeof value !==
        "string" ||
      !value.trim()
    ) {
      return null;
    }

    try {
      return JSON.parse(
        value
      );
    } catch {
      return null;
    }
  },

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

  normalizeObject(
    value
  ) {
    return this.isPlainObject(
      value
    )
      ? value
      : {};
  },

  hasKeys(
    value
  ) {
    return (
      this.isPlainObject(
        value
      ) &&
      Object.keys(
        value
      ).length > 0
    );
  },

  isPlainObject(
    value
  ) {
    return Boolean(
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    );
  },

  validate() {
    const valid =
      typeof this.invoke ===
        "function" &&
      typeof this.reason ===
        "function" &&
      typeof this.buildRequestBody ===
        "function" &&
      typeof this.resolvePreferenceTransport ===
        "function" &&
      typeof this.resolveFirstObject ===
        "function" &&
      typeof this.validatePayload ===
        "function" &&
      typeof this.resolveEffectiveText ===
        "function" &&
      typeof this.resolveEffectiveTextSource ===
        "function" &&
      typeof this.extractStructuredResult ===
        "function";

    return {
      valid,

      ready:
        valid,

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
    ?.ready ===
    true
    ? "READY"
    : "NOT_READY",

  ariOpenAIReasoningClientValidation
);
