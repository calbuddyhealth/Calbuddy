// ari/reasoning/ari-openai-reasoning-client.js
// Ari OpenAI Reasoning Client
//
// Purpose:
// Send one canonical cognitive reasoning request to the server-side
// OpenAI transport and return structured model output.
//
// V1.1.0 — Canonical Flattened Reasoning Transport
//
// Responsibilities:
// - Accept the canonical reasoning-engine payload.
// - Send a structured reasoning request to the server.
// - Preserve response-schema and instruction contracts.
// - Parse structured JSON returned by the server.
// - Return model output to AriReasoningEngine.
//
// Non-responsibilities:
// - Does not interpret user meaning locally.
// - Does not create or validate the semantic frame.
// - Does not execute actions.
// - Does not persist state.
// - Does not compose the final user-facing response.
// - Does not replace AriReasoningEngine validation.

window.Ari = window.Ari || {};

window.AriOpenAIReasoningClient = {
  version:
    "1.1.0",

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

    if (
      validation.valid !==
      true
    ) {
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
      throw new Error(
        error?.message ||
        "openai_reasoning_network_request_failed"
      );
    }

    const rawText =
      await response.text();

    const data =
      this.parseJSON(
        rawText
      );

    if (
      response.ok !==
      true
    ) {
      throw new Error(
        this.extractError({
          data,
          rawText,
          status:
            response.status
        })
      );
    }

    const result =
      this.extractStructuredResult(
        data
      );

    if (
      !result ||
      typeof result !==
        "object" ||
      Array.isArray(result)
    ) {
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
          response.status
      }
    };
  },

  buildRequestBody(
  payload = {}
) {
  const reasoningRequest =
    payload.request &&
    typeof payload.request ===
      "object" &&
    !Array.isArray(
      payload.request
    )
      ? payload.request
      : {};

  return {
    /*
     * Flatten the canonical reasoning request so
     * /api/knowledge can read currentTurn,
     * evidencePacket, routingContract, and other
     * canonical fields directly from body.
     */
    ...reasoningRequest,

    action:
      "openai_reasoning",

    task:
      payload.task ||
      "ari_cognitive_reasoning",

    clientVersion:
      this.version,

    responseSchema:
      payload.responseSchema ||
      {},

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
        "1.1.0",

      requireValidJSON:
        true,

      allowPlainText:
        false
    }
  };
},

  validatePayload(
    payload = {}
  ) {
    const errors = [];

    if (
      !payload ||
      typeof payload !==
        "object" ||
      Array.isArray(payload)
    ) {
      return {
        valid:
          false,

        errors: [
          "reasoning_payload_must_be_an_object"
        ]
      };
    }

    if (
      !payload.request ||
      typeof payload.request !==
        "object" ||
      Array.isArray(
        payload.request
      )
    ) {
      errors.push(
        "reasoning_request_missing"
      );
    }

    const effectiveText =
      payload.request
        ?.request
        ?.effective;

    if (
      typeof effectiveText !==
        "string" ||
      !effectiveText.trim()
    ) {
      errors.push(
        "effective_user_request_missing"
      );
    }

    if (
      !payload.responseSchema ||
      typeof payload.responseSchema !==
        "object"
    ) {
      errors.push(
        "reasoning_response_schema_missing"
      );
    }

    return {
      valid:
        errors.length ===
        0,

      errors
    };
  },

  extractStructuredResult(
    data = null
  ) {
    if (
      !data
    ) {
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

  validate() {
  return {
    valid:
      typeof this.invoke ===
        "function" &&
      typeof this.reason ===
        "function" &&
      typeof this.buildRequestBody ===
        "function" &&
      typeof this.extractStructuredResult ===
        "function",

    ready:
      typeof this.invoke ===
        "function" &&
      typeof this.reason ===
        "function",

    source:
      this.source,

    version:
      this.version,

    endpoint:
      this.endpoint
  };
},

window.Ari.openAIReasoningClient =
  window.AriOpenAIReasoningClient;

console.log(
  "ARI OPENAI REASONING CLIENT LOADED:",
  window.AriOpenAIReasoningClient
    ?.version,

  window.AriOpenAIReasoningClient
    ?.validate?.()
);