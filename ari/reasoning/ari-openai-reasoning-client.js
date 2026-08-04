// =====================================================
// ARI REBIRTH
// File: ari/reasoning/ari-openai-reasoning-client.js
// Version: 2.1.0
//
// Ari OpenAI Reasoning Client
//
// Purpose:
//   Transport one lean cognitive packet from AriReasoningEngine
//   to the server-side OpenAI endpoint and return structured
//   model output.
//
// V2.1.0 — Preference Context Preservation
//
// Architectural flow:
//
// AriReasoningEngine
//      ↓
// AriReasoningContextEngine
//      ↓
// Lean Cognitive Packet
//      │
//      ├── request
//      ├── reasoning context
//      ├── authority
//      ├── outputContract
//      ├── operationContract
//      └── preferenceContext
//              ↓
// AriOpenAIReasoningClient
//              ↓
// /api/knowledge
//              ↓
// Explicit Communication Guidance
//              ↓
// OpenAI
//              ↓
// Structured Cognitive Reasoning Result
//              ↓
// AriReasoningEngine Validation
//
// Responsibilities:
// - Accept one lean cognitive packet.
// - Preserve cognitivePacket without rebuilding it.
// - Preserve preferenceContext without rewriting it.
// - Preserve response-schema, operation, and instruction contracts.
// - Send exactly one structured HTTP request to the server.
// - Parse structured JSON returned by the server.
// - Preserve structured server and provider failures.
// - Preserve server-side transport diagnostics.
// - Expose preference-transport diagnostics.
// - Return model output to AriReasoningEngine.
//
// IMPORTANT:
//   This client does NOT resolve communication preferences.
//
//   If cognitivePacket.preferenceContext contains:
//
//     "Use profanity actively"
//
//   this client transports that exact upstream guidance.
//
//   It must never convert it to:
//
//     "Profanity is permitted"
//
//   Likewise, active humor instructions must remain active.
//
// Non-responsibilities:
// - Does not accept or flatten the full canonical reasoning request.
// - Does not inspect Ari memory, routing, continuity, or perception schemas.
// - Does not select or trim reasoning context.
// - Does not resolve communication preferences.
// - Does not merge communication preferences.
// - Does not reinterpret communication preferences.
// - Does not weaken communication preference instructions.
// - Does not interpret user meaning locally.
// - Does not create or validate the semantic frame.
// - Does not execute actions.
// - Does not persist state.
// - Does not compose the final user-facing response.
// - Does not replace AriReasoningEngine validation.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};

  const CLIENT_VERSION =
    "2.1.0";

  const EXPECTED_PREFERENCE_SCHEMA_VERSION =
    "3.0.0";

  const AriOpenAIReasoningClient = {
    version:
      CLIENT_VERSION,

    source:
      "ari-openai-reasoning-client",

    endpoint:
      "/api/knowledge",

    expectedPreferenceSchemaVersion:
      EXPECTED_PREFERENCE_SCHEMA_VERSION,

    // ===================================================
    // PUBLIC ENTRY POINTS
    // ===================================================

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

      const cognitivePacket =
        this.normalizeObject(
          payload.cognitivePacket
        );

      const requestText =
        this.resolvePacketRequestText(
          cognitivePacket
        );

      const preferenceDiagnostics =
        this.inspectPreferenceContext(
          cognitivePacket
        );

      // =================================================
      // INPUT DIAGNOSTIC
      // =================================================

      this.debugLog(
        "ARI OPENAI REASONING CLIENT PAYLOAD DIAGNOSTIC:",
        {
          valid:
            validation.valid ===
            true,

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
            cognitivePacket
              .schemaVersion ||
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
            ).length > 0,

          preferenceContextPresent:
            preferenceDiagnostics
              .present,

          preferenceContextReady:
            preferenceDiagnostics
              .ready,

          preferenceSchemaVersion:
            preferenceDiagnostics
              .schemaVersion,

          preferenceInstructionTextPresent:
            preferenceDiagnostics
              .instructionTextPresent,

          preferenceInstructionCharacters:
            preferenceDiagnostics
              .instructionTextLength,

          selectedStyleMustBeObservable:
            preferenceDiagnostics
              .selectedStyleMustBeObservable,

          frequentHumorActive:
            preferenceDiagnostics
              .frequentHumorActive,

          alwaysProfanityActive:
            preferenceDiagnostics
              .alwaysProfanityActive,

          personalityBoostActive:
            preferenceDiagnostics
              .personalityBoostActive
        }
      );

      // =================================================
      // VALIDATION FAILURE
      // =================================================

      if (
        validation.valid !==
        true
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
              null,

            preferenceContext:
              preferenceDiagnostics
          }
        );

        const payloadError =
          new Error(
            validation.errors
              .join(",") ||
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

        payloadError.preferenceDiagnostics =
          preferenceDiagnostics;

        throw payloadError;
      }

      // =================================================
      // REQUEST BODY
      // =================================================

      const requestBody =
        this.buildRequestBody(
          payload
        );

      const forwardedPreferenceDiagnostics =
        this.inspectPreferenceContext(
          requestBody
            .cognitivePacket
        );

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
              requestBody
                .cognitivePacket
            ) ||
            null,

          responseContract:
            requestBody
              .responseContract ||
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
              : 0,

          preferenceContextForwarded:
            forwardedPreferenceDiagnostics
              .present,

          preferenceInstructionTextForwarded:
            forwardedPreferenceDiagnostics
              .instructionTextPresent,

          preferenceInstructionCharacters:
            forwardedPreferenceDiagnostics
              .instructionTextLength,

          frequentHumorForwarded:
            forwardedPreferenceDiagnostics
              .frequentHumorActive,

          alwaysProfanityForwarded:
            forwardedPreferenceDiagnostics
              .alwaysProfanityActive,

          personalityBoostForwarded:
            forwardedPreferenceDiagnostics
              .personalityBoostActive
        }
      );

      // =================================================
      // NETWORK REQUEST
      // =================================================

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
              String(
                error
              ),

            stack:
              error?.stack ||
              null,

            preferenceContextForwarded:
              forwardedPreferenceDiagnostics
                .present
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

      // =================================================
      // RAW RESPONSE
      // =================================================

      const rawText =
        await response.text();

      this.debugLog(
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

      // =================================================
      // SERVER FAILURE
      // =================================================

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
          typeof data
            ?.failureType ===
            "string" &&
          data.failureType
            .trim()
            ? data.failureType
                .trim()
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
          data
            ?.modelInvocation
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
          data
            ?.rawModelOutputPreview ||
          null;

        serverError.parsedModelOutput =
          data
            ?.parsedModelOutput ||
          null;

        serverError.serverResponse =
          this.normalizeObject(
            data
          );

        serverError.preferenceDiagnostics =
          forwardedPreferenceDiagnostics;

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
              serverError
                .finishReason,

            failedField:
              serverError
                .failedField,

            semanticOperation:
              serverError
                .semanticOperation,

            usage:
              serverError
                .usage,

            providerError:
              serverError
                .providerError,

            serverTiming:
              serverError
                .serverTiming,

            rawModelOutputPreview:
              serverError
                .rawModelOutputPreview,

            preferenceContextForwarded:
              forwardedPreferenceDiagnostics
                .present,

            preferenceInstructionTextForwarded:
              forwardedPreferenceDiagnostics
                .instructionTextPresent,

            personalityBoostForwarded:
              forwardedPreferenceDiagnostics
                .personalityBoostActive
          }
        );

        throw serverError;
      }

      // =================================================
      // STRUCTURED RESULT
      // =================================================

      const result =
        this.extractStructuredResult(
          data
        );

      this.debugLog(
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
              result
                ?.interpretation
            ),

          hasReasoningDecision:
            Boolean(
              result
                ?.reasoningDecision ||
              result
                ?.decision
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
            ),

          serverPreferenceContextReceived:
            result
              ?.transportMetadata
              ?.preferenceContextReceived ??
            null,

          serverPreferenceInstructionReceived:
            result
              ?.transportMetadata
              ?.preferenceInstructionTextReceived ??
            null,

          serverPersonalityBoostActive:
            result
              ?.transportMetadata
              ?.personalityBoostActive ??
            null
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

      // =================================================
      // PRESERVE SERVER TRANSPORT METADATA
      //
      // CRITICAL:
      //
      // Older client replaced result.transportMetadata
      // completely, which erased server diagnostics.
      //
      // V2.1.0 MERGES instead.
      // =================================================

      const serverTransportMetadata =
        this.normalizeObject(
          result
            .transportMetadata
        );

      const mergedTransportMetadata = {
        ...serverTransportMetadata,

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
            requestBody
              .instructions
          ) &&
          requestBody
            .instructions
            .length > 0,

        preferenceContextForwarded:
          forwardedPreferenceDiagnostics
            .present,

        preferenceContextReady:
          forwardedPreferenceDiagnostics
            .ready,

        preferenceSchemaVersion:
          forwardedPreferenceDiagnostics
            .schemaVersion,

        preferenceInstructionTextForwarded:
          forwardedPreferenceDiagnostics
            .instructionTextPresent,

        preferenceInstructionCharactersForwarded:
          forwardedPreferenceDiagnostics
            .instructionTextLength,

        selectedStyleMustBeObservableForwarded:
          forwardedPreferenceDiagnostics
            .selectedStyleMustBeObservable,

        frequentHumorForwarded:
          forwardedPreferenceDiagnostics
            .frequentHumorActive,

        alwaysProfanityForwarded:
          forwardedPreferenceDiagnostics
            .alwaysProfanityActive,

        personalityBoostForwarded:
          forwardedPreferenceDiagnostics
            .personalityBoostActive
      };

      // =================================================
      // RETURN RESULT
      // =================================================

      return {
        ...result,

        source:
          result.source ||
          data?.source ||
          this.source,

        transportMetadata:
          mergedTransportMetadata,

        /*
         * Preserve this old metadata key temporarily
         * so existing diagnostics do not break.
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
            ),

          preferenceContextForwarded:
            forwardedPreferenceDiagnostics
              .present,

          preferenceInstructionTextForwarded:
            forwardedPreferenceDiagnostics
              .instructionTextPresent,

          personalityBoostForwarded:
            forwardedPreferenceDiagnostics
              .personalityBoostActive
        }
      };
    },

    // ===================================================
    // REQUEST BODY
    // ===================================================

    buildRequestBody(
      payload = {}
    ) {
      /*
       * Preserve the cognitive packet as the only Ari
       * runtime context sent to the server.
       *
       * DO NOT extract preferenceContext and rebuild it
       * as another transport field here.
       *
       * /api/knowledge is responsible for promoting the
       * already-resolved preference guidance after receipt.
       */
      const cognitivePacket =
        this.clone(
          this.normalizeObject(
            payload
              .cognitivePacket
          )
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

        // ===============================================
        // ONLY ARI CONTEXT PACKET
        // ===============================================

        cognitivePacket,

        // ===============================================
        // TRANSPORT CONTRACTS
        // ===============================================

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
            "2.1.0",

          requireValidJSON:
            true,

          allowPlainText:
            false,

          authoritativeDraftRequired:
            true,

          actionsAreProposalsOnly:
            true,

          preserveCognitivePacket:
            true,

          preservePreferenceContext:
            true,

          preservePreferenceInstructionStrength:
            true
        }
      };
    },

    // ===================================================
    // RESPONSE SCHEMA
    // ===================================================

    resolveResponseSchema(
      payload = {},
      cognitivePacket = {}
    ) {
      const payloadSchema =
        this.normalizeObject(
          payload.responseSchema
        );

      if (
        this.hasKeys(
          payloadSchema
        )
      ) {
        return payloadSchema;
      }

      return this.normalizeObject(
        cognitivePacket
          .outputContract
      );
    },

    // ===================================================
    // OPERATION CONTRACT
    // ===================================================

    resolveOperationContract(
      payload = {},
      cognitivePacket = {}
    ) {
      const payloadContract =
        this.normalizeObject(
          payload
            .operationContract
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

    // ===================================================
    // REASONING INSTRUCTIONS
    // ===================================================

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
        cognitivePacket
          .instructions
      );
    },

    // ===================================================
    // PREFERENCE CONTEXT INSPECTION
    //
    // Diagnostic only.
    //
    // This function does NOT resolve or modify preferences.
    // ===================================================

    inspectPreferenceContext(
      cognitivePacket = {}
    ) {
      const preferenceContext =
        this.normalizeObject(
          cognitivePacket
            ?.preferenceContext
        );

      if (
        !this.hasKeys(
          preferenceContext
        )
      ) {
        return {
          present:
            false,

          ready:
            false,

          source:
            null,

          version:
            null,

          schemaVersion:
            null,

          instructionTextPresent:
            false,

          instructionTextLength:
            0,

          resolvedPreferencesPresent:
            false,

          modelInstructionsPresent:
            false,

          modelInstructionCount:
            0,

          selectedStyleMustBeObservable:
            false,

          frequentHumorActive:
            false,

          alwaysProfanityActive:
            false,

          personalityBoostActive:
            false
        };
      }

      const guidance =
        this.firstNonEmptyObject([
          preferenceContext
            .openAIGuidance,

          preferenceContext
            .guidance,

          preferenceContext
            .runtimeGuidance,

          preferenceContext
        ]);

      const instructionText =
        this.firstNonEmptyString([
          guidance
            .instructionText,

          preferenceContext
            .instructionText
        ]);

      const resolvedPreferences =
        this.firstNonEmptyObject([
          guidance
            .resolvedPreferences,

          preferenceContext
            .resolvedPreferences
        ]);

      const modelInstructions =
        Array.isArray(
          guidance
            .modelInstructions
        )
          ? guidance
              .modelInstructions
          : Array.isArray(
              preferenceContext
                .modelInstructions
            )
            ? preferenceContext
                .modelInstructions
            : [];

      const styleExecution =
        this.firstNonEmptyObject([
          guidance
            .styleExecution,

          preferenceContext
            .styleExecution
        ]);

      return {
        present:
          true,

        ready:
          guidance.ready !==
          false,

        source:
          this.firstNonEmptyString([
            guidance.source,

            preferenceContext
              .source
          ]) ||
          null,

        version:
          this.firstNonEmptyString([
            guidance.version,

            preferenceContext
              .version
          ]) ||
          null,

        schemaVersion:
          this.firstNonEmptyString([
            guidance
              .schemaVersion,

            preferenceContext
              .schemaVersion
          ]) ||
          null,

        instructionTextPresent:
          Boolean(
            instructionText
          ),

        instructionTextLength:
          instructionText
            .length,

        resolvedPreferencesPresent:
          this.hasKeys(
            resolvedPreferences
          ),

        modelInstructionsPresent:
          modelInstructions
            .length > 0,

        modelInstructionCount:
          modelInstructions
            .length,

        selectedStyleMustBeObservable:
          guidance
            .selectedStyleMustBeObservable ===
            true ||
          styleExecution
            .selectedStyleMustBeObservable ===
            true,

        frequentHumorActive:
          resolvedPreferences
            ?.language
            ?.humor ===
          "frequent",

        alwaysProfanityActive:
          resolvedPreferences
            ?.language
            ?.profanity ===
          "always_allowed",

        personalityBoostActive:
          styleExecution
            ?.humorProfanityPersonalityBoostActive ===
          true
      };
    },

    // ===================================================
    // PAYLOAD VALIDATION
    // ===================================================

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

      // ===============================================
      // REJECT OLD FULL REQUEST SHAPE
      // ===============================================

      if (
        this.hasKeys(
          payload.request
        ) ||
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
          payload
            .cognitivePacket
        );

      if (
        !this.hasKeys(
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
            this.cleanStringList(
              errors
            ),

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

      // ===============================================
      // REQUEST TEXT
      // ===============================================

      const effectiveText =
        this.resolvePacketRequestText(
          cognitivePacket
        );

      if (
        !effectiveText
      ) {
        errors.push(
          "cognitive_packet_effective_request_missing"
        );
      }

      // ===============================================
      // RESPONSE SCHEMA
      // ===============================================

      const responseSchema =
        this.resolveResponseSchema(
          payload,
          cognitivePacket
        );

      if (
        !this.hasKeys(
          responseSchema
        )
      ) {
        errors.push(
          "reasoning_response_schema_missing"
        );
      }

      // ===============================================
      // OPERATION CONTRACT
      // ===============================================

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

      // ===============================================
      // GENERAL INSTRUCTIONS
      // ===============================================

      const instructions =
        this.resolveInstructions(
          payload,
          cognitivePacket
        );

      if (
        !instructions.length
      ) {
        warnings.push(
          "reasoning_instructions_not_supplied"
        );
      }

      // ===============================================
      // PREFERENCE CONTEXT
      //
      // Not fatal yet because AriReasoningContextEngine is
      // the upstream owner we still need to update.
      //
      // But absence MUST be visible.
      // ===============================================

      const preferenceDiagnostics =
        this.inspectPreferenceContext(
          cognitivePacket
        );

      if (
        !preferenceDiagnostics
          .present
      ) {
        warnings.push(
          "preference_context_not_supplied"
        );
      } else {
        if (
          preferenceDiagnostics
            .ready ===
          false
        ) {
          warnings.push(
            "preference_context_not_ready"
          );
        }

        if (
          !preferenceDiagnostics
            .instructionTextPresent
        ) {
          warnings.push(
            "preference_instruction_text_not_supplied"
          );
        }

        if (
          !preferenceDiagnostics
            .resolvedPreferencesPresent
        ) {
          warnings.push(
            "resolved_preferences_not_supplied"
          );
        }

        if (
          preferenceDiagnostics
            .schemaVersion &&
          preferenceDiagnostics
            .schemaVersion !==
          this
            .expectedPreferenceSchemaVersion
        ) {
          warnings.push(
            `unexpected_preference_schema_version:${preferenceDiagnostics.schemaVersion}`
          );
        }
      }

      // ===============================================
      // AUTHORITY VALIDATION
      // ===============================================

      if (
        cognitivePacket
          .authority
          ?.safetyIsBinding !==
        true
      ) {
        errors.push(
          "cognitive_packet_safety_authority_missing"
        );
      }

      if (
        cognitivePacket
          .authority
          ?.mayExecuteActions ===
        true
      ) {
        errors.push(
          "cognitive_packet_may_not_authorize_action_execution"
        );
      }

      if (
        cognitivePacket
          .authority
          ?.mayPersistState ===
        true
      ) {
        errors.push(
          "cognitive_packet_may_not_authorize_persistence"
        );
      }

      if (
        cognitivePacket
          .authority
          ?.mayOverrideSafety ===
        true
      ) {
        errors.push(
          "cognitive_packet_may_not_override_safety"
        );
      }

      if (
        cognitivePacket
          .authority
          ?.mayClaimToolSuccess ===
        true
      ) {
        errors.push(
          "cognitive_packet_may_not_claim_tool_success"
        );
      }

      if (
        cognitivePacket
          .authority
          ?.mayAuthorizeDelivery ===
        true
      ) {
        errors.push(
          "cognitive_packet_may_not_authorize_delivery"
        );
      }

      if (
        cognitivePacket
          .authority
          ?.mayExposePrivateChainOfThought ===
        true
      ) {
        errors.push(
          "cognitive_packet_may_not_expose_private_chain_of_thought"
        );
      }

      return {
        valid:
          errors.length ===
          0,

        errors:
          this.cleanStringList(
            errors
          ),

        warnings:
          this.cleanStringList(
            warnings
          ),

        preferenceContext:
          preferenceDiagnostics
      };
    },

    // ===================================================
    // REQUEST TEXT
    // ===================================================

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
        cognitivePacket
          .request
          ?.effective,

        cognitivePacket
          .request
          ?.resolved,

        cognitivePacket
          .request
          ?.original,

        cognitivePacket
          .currentTurn
          ?.effectiveText,

        cognitivePacket
          .currentTurn
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
          return candidate
            .trim();
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

          cognitivePacket
            .request
            ?.effective
        ],

        [
          "request.resolved",

          cognitivePacket
            .request
            ?.resolved
        ],

        [
          "request.original",

          cognitivePacket
            .request
            ?.original
        ],

        [
          "currentTurn.effectiveText",

          cognitivePacket
            .currentTurn
            ?.effectiveText
        ],

        [
          "currentTurn.originalText",

          cognitivePacket
            .currentTurn
            ?.originalText
        ]
      ];

      for (
        const [
          source,
          value
        ]
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

    // ===================================================
    // STRUCTURED RESPONSE EXTRACTION
    // ===================================================

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
        return this
          .parseStructuredText(
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
        data
          .cognitiveReasoningResult,

        data
          .reasoningResult,

        data
          .result
          ?.cognitiveReasoningResult,

        data
          .result
          ?.reasoningResult,

        data
          .result,

        data
          .output
          ?.cognitiveReasoningResult,

        data
          .output
          ?.reasoningResult,

        data
          .output,

        data
          .structuredOutput,

        data
          .parsed,

        data
          .response,

        data
          .data,

        data
          .rawContent,

        data
          .output_text,

        data
          .outputText,

        data
          .responseText,

        data
          .content,

        data
          .text
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

          if (
            parsed
          ) {
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

    // ===================================================
    // FAILURE EXTRACTION
    // ===================================================

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
              data.error
                .message ||
              data.error
                .error ||
              data.error
                .code ||
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
              data.details
                .message ||
              data.details
                .error ||
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
          return candidate
            .trim();
        }
      }

      return (
        `OpenAI reasoning request failed with status ${status}.`
      );
    },

    // ===================================================
    // DIAGNOSTIC LOGGING
    // ===================================================

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

    debugLog(
      ...args
    ) {
      if (
        this.isDeveloperLoggingEnabled()
      ) {
        console.log(
          ...args
        );
      }
    },

    errorLog(
      ...args
    ) {
      console.error(
        ...args
      );
    },

    // ===================================================
    // UTILITIES
    // ===================================================

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

    firstNonEmptyObject(
      values = []
    ) {
      for (
        const value
        of values
      ) {
        if (
          this.hasKeys(
            value
          )
        ) {
          return value;
        }
      }

      return {};
    },

    firstNonEmptyString(
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
          return value
            .trim();
        }
      }

      return "";
    },

    cleanStringList(
      value
    ) {
      return [
        ...new Set(
          (
            Array.isArray(
              value
            )
              ? value
              : []
          )
            .map(
              item =>
                typeof item ===
                  "string"
                  ? item.trim()
                  : ""
            )
            .filter(
              Boolean
            )
        )
      ];
    },

    clone(
      value
    ) {
      if (
        value ===
        undefined
      ) {
        return undefined;
      }

      if (
        value ===
        null
      ) {
        return null;
      }

      try {
        return structuredClone(
          value
        );
      } catch (_error) {
        try {
          return JSON.parse(
            JSON.stringify(
              value
            )
          );
        } catch (_fallbackError) {
          return value;
        }
      }
    },

    // ===================================================
    // VALIDATION
    // ===================================================

    validate() {
      const requiredMethods = [
        "invoke",
        "reason",
        "buildRequestBody",
        "resolveResponseSchema",
        "resolveOperationContract",
        "resolveInstructions",
        "inspectPreferenceContext",
        "validatePayload",
        "resolvePacketRequestText",
        "extractStructuredResult",
        "extractError"
      ];

      const missingMethods =
        requiredMethods.filter(
          method =>
            typeof this[
              method
            ] !==
            "function"
        );

      const valid =
        missingMethods.length ===
        0;

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

        preferenceContextPreserved:
          true,

        preferenceContextRebuilt:
          false,

        preferenceResolutionPerformed:
          false,

        preferenceInstructionRewritingPerformed:
          false,

        preferenceTransportDiagnosticsSupported:
          true,

        serverTransportMetadataPreserved:
          true,

        structuredFailurePreservation:
          true,

        developerLoggingGated:
          true,

        expectedPreferenceSchemaVersion:
          this
            .expectedPreferenceSchemaVersion,

        missingMethods,

        source:
          this.source,

        version:
          this.version,

        endpoint:
          this.endpoint
      };
    }
  };

  // =====================================================
  // GLOBAL EXPORTS
  // =====================================================

  window.AriOpenAIReasoningClient =
    AriOpenAIReasoningClient;

  window.Ari.openAIReasoningClient =
    AriOpenAIReasoningClient;

  // =====================================================
  // SELF VALIDATION
  // =====================================================

  const validation =
    AriOpenAIReasoningClient
      .validate();

  console.log(
    "ARI OPENAI REASONING CLIENT LOADED:",
    AriOpenAIReasoningClient
      .version,

    validation.ready ===
      true
      ? "READY"
      : "NOT_READY",

    validation
  );
})();