// rebirth/core/rebirth-runtime-state.js
// Rebirth Runtime State
//
// Purpose:
// Maintain the live, request-scoped execution state for the OpenAI-first Rebirth runtime.
//
// Architectural position:
//
// Rebirth Runtime Contract
//          ↓
// Rebirth Runtime State
//          ↓
// Rebirth Runtime Controller
//          ↓
// Model / Authority / Response Stages
//
// Responsibilities:
// - Create one isolated runtime state per request.
// - Track lifecycle phase, timing, model calls, authority usage, warnings, and errors.
// - Preserve immutable request identity and current-turn provenance.
// - Store stage outputs without allowing uncontrolled state mutation.
// - Provide snapshots for diagnostics, testing, rollback, and final result creation.
// - Enforce bounded model-call and lifecycle-transition policy.
// - Expose compatibility helpers for the controller, bridge, and Ari Lab 2.
//
// Non-responsibilities:
// - Does not interpret the user's meaning.
// - Does not classify conversation type.
// - Does not call OpenAI.
// - Does not resolve safety, character, memory, tools, or knowledge.
// - Does not generate or validate the final response.
// - Does not persist state outside the current runtime request.
//
// V1.0.0 — Request-Scoped Runtime State / Bounded Lifecycle

window.Rebirth = window.Rebirth || {};

window.RebirthRuntimeState = {
  version: "1.0.0",
  schemaVersion: "1.0.0",
  source: "rebirth-runtime-state",

  constants: {
    stateSchema: "rebirth_runtime_state",

    phases: [
      "created",
      "intake",
      "context",
      "authority",
      "model",
      "response",
      "validation",
      "finalization",
      "completed",
      "failed"
    ],

    terminalPhases: [
      "completed",
      "failed"
    ],

    modelPasses: [
      "understanding",
      "answer",
      "repair"
    ],

    stageNames: [
      "intake",
      "context",
      "authority",
      "model",
      "response",
      "validation",
      "finalization"
    ]
  },

  create(request = {}, options = {}) {
    const now = this.now();

    const state = {
      schema: this.constants.stateSchema,
      schemaVersion: this.schemaVersion,

      stateId: this.createId("state"),
      requestId: request.requestId || null,
      turnId: request.turnId || null,

      source: this.source,
      runtimeVersion: options.runtimeVersion || request.runtime?.version || null,

      createdAt: now,
      updatedAt: now,
      completedAt: null,

      phase: "created",
      previousPhase: null,
      terminal: false,

      request: this.freezeRequestReference(request),

      policy: this.cloneSerializable(
        options.policy ||
        request.policy ||
        {}
      ),

      currentTurn: {
        originalText:
          request.currentTurn?.originalText ||
          request.currentTurn?.text ||
          "",

        normalizedText:
          request.currentTurn?.normalizedText ||
          "",

        preserved:
          request.currentTurn?.provenance?.originalTextPreserved === true,

        rewritten:
          request.currentTurn?.provenance?.textWasRewritten === true
      },

      execution: {
        started: false,
        completed: false,
        failed: false,
        degraded: false,

        executionMode:
          request.runtime?.executionMode ||
          "automatic",

        modelCallCount: 0,
        maximumModelCalls:
          this.resolveMaximumModelCalls(request),

        activeStage: null,
        completedStages: [],
        skippedStages: [],
        stageOutputs: {}
      },

      understanding: null,

      context: {
        ready: false,
        packet: null,
        itemCount: 0,
        tokenEstimate: null
      },

      authorities: {
        requested: {},
        used: {},
        skipped: {},
        failed: {}
      },

      model: {
        provider:
          request.model?.provider ||
          "openai",

        selectedModel:
          request.model?.model ||
          null,

        fallbackModel:
          request.model?.fallbackModel ||
          null,

        activePass: null,
        passes: [],
        totalUsage: {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0
        }
      },

      response: {
        candidate: null,
        repairedCandidate: null,
        final: null,
        selectedSource: null,
        usable: false,
        complete: false,
        degraded: false
      },

      validation: {
        ran: false,
        valid: false,
        checks: [],
        warnings: [],
        errors: []
      },

      toolExecution: {
        requested: false,
        executed: false,
        requiresApproval: false,
        actions: [],
        results: []
      },

      timing: {
        startedAt: now,
        completedAt: null,
        totalMilliseconds: null,
        stages: [],
        activeMarks: {}
      },

      trace: {
        events: [],
        decisions: [],
        fallbacks: []
      },

      warnings: [],
      errors: [],

      metadata: this.cloneSerializable(
        options.metadata ||
        {}
      ),

      authority: {
        mayStoreRequestScopedState: true,
        mayTrackLifecycle: true,
        mayTrackModelCalls: true,
        mayTrackAuthorityUsage: true,
        mayTrackDiagnostics: true,
        mayCreateSnapshots: true,

        mayInterpretMeaning: false,
        mayCallOpenAI: false,
        mayResolveAuthorities: false,
        mayGenerateResponse: false,
        mayValidateResponse: false,
        maySelectFinalResponse: false,
        mayPersistExternally: false,

        role: "request_scoped_runtime_state_container"
      }
    };

    this.addEvent(state, "state_created", {
      phase: state.phase,
      requestId: state.requestId,
      turnId: state.turnId
    });

    const validation = this.validate(state);

    state.ready = validation.valid;
    state.stateValidation = validation;

    return state;
  },

  begin(state = {}) {
    this.assertMutable(state);

    if (state.execution.started === true) {
      return state;
    }

    state.execution.started = true;
    state.updatedAt = this.now();

    this.transition(state, "intake", {
      reason: "runtime_execution_started"
    });

    return state;
  },

  transition(state = {}, nextPhase = "", metadata = {}) {
    this.assertMutable(state);

    const normalizedNext = this.normalizeIdentifier(nextPhase);

    if (!this.constants.phases.includes(normalizedNext)) {
      throw new Error(`unsupported_runtime_phase:${normalizedNext}`);
    }

    if (state.terminal === true) {
      throw new Error(`runtime_state_is_terminal:${state.phase}`);
    }

    if (!this.transitionAllowed(state.phase, normalizedNext)) {
      throw new Error(
        `invalid_runtime_phase_transition:${state.phase}->${normalizedNext}`
      );
    }

    const previous = state.phase;

    state.previousPhase = previous;
    state.phase = normalizedNext;
    state.updatedAt = this.now();

    if (this.constants.terminalPhases.includes(normalizedNext)) {
      state.terminal = true;
      state.completedAt = state.updatedAt;
      state.timing.completedAt = state.updatedAt;
      state.timing.totalMilliseconds =
        state.timing.completedAt -
        state.timing.startedAt;

      state.execution.completed =
        normalizedNext === "completed";

      state.execution.failed =
        normalizedNext === "failed";
    }

    this.addEvent(state, "phase_transition", {
      from: previous,
      to: normalizedNext,
      ...this.cloneSerializable(metadata || {})
    });

    return state;
  },

  transitionAllowed(current = "", next = "") {
    if (current === next) {
      return true;
    }

    const allowed = {
      created: ["intake", "failed"],
      intake: ["context", "authority", "model", "response", "failed"],
      context: ["authority", "model", "response", "failed"],
      authority: ["model", "response", "failed"],
      model: ["response", "validation", "failed"],
      response: ["validation", "finalization", "failed"],
      validation: ["model", "response", "finalization", "failed"],
      finalization: ["completed", "failed"],
      completed: [],
      failed: []
    };

    return this.toArray(allowed[current]).includes(next);
  },

  startStage(state = {}, stageName = "", metadata = {}) {
    this.assertMutable(state);

    const name = this.normalizeIdentifier(stageName);

    if (!this.constants.stageNames.includes(name)) {
      throw new Error(`unsupported_runtime_stage:${name}`);
    }

    const startedAt = this.now();

    state.execution.activeStage = name;
    state.timing.activeMarks[name] = startedAt;
    state.updatedAt = startedAt;

    this.addEvent(state, "stage_started", {
      stage: name,
      ...this.cloneSerializable(metadata || {})
    });

    return state;
  },

  completeStage(state = {}, stageName = "", output = null, metadata = {}) {
    this.assertMutable(state);

    const name = this.normalizeIdentifier(stageName);

    if (!this.constants.stageNames.includes(name)) {
      throw new Error(`unsupported_runtime_stage:${name}`);
    }

    const completedAt = this.now();
    const startedAt =
      state.timing.activeMarks[name] ||
      completedAt;

    const durationMilliseconds =
      Math.max(0, completedAt - startedAt);

    state.execution.stageOutputs[name] =
      this.cloneSerializable(output);

    if (!state.execution.completedStages.includes(name)) {
      state.execution.completedStages.push(name);
    }

    state.execution.activeStage =
      state.execution.activeStage === name
        ? null
        : state.execution.activeStage;

    delete state.timing.activeMarks[name];

    state.timing.stages.push({
      stage: name,
      startedAt,
      completedAt,
      durationMilliseconds,
      metadata: this.cloneSerializable(metadata || {})
    });

    state.updatedAt = completedAt;

    this.addEvent(state, "stage_completed", {
      stage: name,
      durationMilliseconds
    });

    return state;
  },

  skipStage(state = {}, stageName = "", reason = "") {
    this.assertMutable(state);

    const name = this.normalizeIdentifier(stageName);

    if (!this.constants.stageNames.includes(name)) {
      throw new Error(`unsupported_runtime_stage:${name}`);
    }

    if (!state.execution.skippedStages.includes(name)) {
      state.execution.skippedStages.push(name);
    }

    this.addDecision(state, "stage_skipped", {
      stage: name,
      reason: this.cleanText(reason)
    });

    return state;
  },

  setUnderstanding(state = {}, understanding = null) {
    this.assertMutable(state);

    state.understanding =
      this.cloneSerializable(understanding);

    this.addEvent(state, "understanding_recorded", {
      ready:
        understanding?.ready === true,

      confidence:
        understanding?.confidence ??
        null
    });

    return state;
  },

  setContext(state = {}, contextPacket = null, metadata = {}) {
    this.assertMutable(state);

    const packet =
      this.cloneSerializable(contextPacket);

    state.context = {
      ready:
        metadata.ready === true ||
        Boolean(packet),

      packet,

      itemCount:
        Number.isFinite(Number(metadata.itemCount))
          ? Number(metadata.itemCount)
          : this.estimateContextItemCount(packet),

      tokenEstimate:
        Number.isFinite(Number(metadata.tokenEstimate))
          ? Number(metadata.tokenEstimate)
          : null
    };

    this.addEvent(state, "context_recorded", {
      ready: state.context.ready,
      itemCount: state.context.itemCount,
      tokenEstimate: state.context.tokenEstimate
    });

    return state;
  },

  markAuthorityRequested(state = {}, name = "", request = {}) {
    this.assertMutable(state);

    const key = this.normalizeIdentifier(name);

    state.authorities.requested[key] = {
      requestedAt: this.now(),
      request: this.cloneSerializable(request)
    };

    return state;
  },

  markAuthorityUsed(state = {}, name = "", result = {}) {
    this.assertMutable(state);

    const key = this.normalizeIdentifier(name);

    state.authorities.used[key] = {
      usedAt: this.now(),
      result: this.cloneSerializable(result)
    };

    delete state.authorities.skipped[key];
    delete state.authorities.failed[key];

    this.addEvent(state, "authority_used", {
      authority: key
    });

    return state;
  },

  markAuthoritySkipped(state = {}, name = "", reason = "") {
    this.assertMutable(state);

    const key = this.normalizeIdentifier(name);

    state.authorities.skipped[key] = {
      skippedAt: this.now(),
      reason: this.cleanText(reason)
    };

    this.addDecision(state, "authority_skipped", {
      authority: key,
      reason: this.cleanText(reason)
    });

    return state;
  },

  markAuthorityFailed(state = {}, name = "", error = null) {
    this.assertMutable(state);

    const key = this.normalizeIdentifier(name);

    state.authorities.failed[key] = {
      failedAt: this.now(),
      error: this.normalizeError(error, "authority_failure")
    };

    this.addError(state, {
      code: "authority_failure",
      message:
        error?.message ||
        String(error || "Authority failed."),
      source: key,
      fatal: false
    });

    return state;
  },

  beginModelPass(state = {}, passName = "answer", metadata = {}) {
    this.assertMutable(state);

    const pass = this.normalizeIdentifier(passName);

    if (!this.constants.modelPasses.includes(pass)) {
      throw new Error(`unsupported_model_pass:${pass}`);
    }

    if (!this.canCallModel(state)) {
      throw new Error("maximum_model_calls_reached");
    }

    const record = {
      id: this.createId(`model_${pass}`),
      pass,
      startedAt: this.now(),
      completedAt: null,
      durationMilliseconds: null,
      provider:
        metadata.provider ||
        state.model.provider ||
        "openai",

      model:
        metadata.model ||
        state.model.selectedModel ||
        null,

      status: "running",
      requestMetadata:
        this.cloneSerializable(
          metadata.requestMetadata ||
          {}
        ),

      responseMetadata: null,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
      },

      error: null
    };

    state.execution.modelCallCount += 1;
    state.model.activePass = pass;
    state.model.passes.push(record);
    state.updatedAt = record.startedAt;

    this.addEvent(state, "model_pass_started", {
      pass,
      modelCallCount: state.execution.modelCallCount,
      maximumModelCalls: state.execution.maximumModelCalls
    });

    return record.id;
  },

  completeModelPass(state = {}, passId = "", result = {}) {
    this.assertMutable(state);

    const record = state.model.passes.find(
      item => item.id === passId
    );

    if (!record) {
      throw new Error(`model_pass_not_found:${passId}`);
    }

    const completedAt = this.now();
    const usage = this.normalizeUsage(
      result.usage ||
      result.modelUsage ||
      {}
    );

    record.completedAt = completedAt;
    record.durationMilliseconds =
      Math.max(0, completedAt - record.startedAt);

    record.status =
      result.success === false
        ? "failed"
        : "completed";

    record.responseMetadata =
      this.cloneSerializable(
        result.metadata ||
        {}
      );

    record.usage = usage;

    if (result.error) {
      record.error =
        this.normalizeError(
          result.error,
          "model_pass_failed"
        );
    }

    state.model.totalUsage.inputTokens +=
      usage.inputTokens;

    state.model.totalUsage.outputTokens +=
      usage.outputTokens;

    state.model.totalUsage.totalTokens +=
      usage.totalTokens;

    state.model.activePass = null;
    state.updatedAt = completedAt;

    this.addEvent(state, "model_pass_completed", {
      pass: record.pass,
      status: record.status,
      durationMilliseconds: record.durationMilliseconds,
      usage
    });

    return state;
  },

  failModelPass(state = {}, passId = "", error = null) {
    this.assertMutable(state);

    const record = state.model.passes.find(
      item => item.id === passId
    );

    if (!record) {
      throw new Error(`model_pass_not_found:${passId}`);
    }

    const completedAt = this.now();

    record.completedAt = completedAt;
    record.durationMilliseconds =
      Math.max(0, completedAt - record.startedAt);

    record.status = "failed";
    record.error =
      this.normalizeError(
        error,
        "model_pass_failed"
      );

    state.model.activePass = null;
    state.updatedAt = completedAt;

    this.addError(state, {
      code: "model_pass_failed",
      message:
        error?.message ||
        String(error || "Model pass failed."),
      source: record.pass,
      fatal: false
    });

    return state;
  },

  canCallModel(state = {}) {
    return (
      state.terminal !== true &&
      Number(state.execution?.modelCallCount || 0) <
        Number(state.execution?.maximumModelCalls || 0)
    );
  },

  remainingModelCalls(state = {}) {
    return Math.max(
      0,
      Number(state.execution?.maximumModelCalls || 0) -
      Number(state.execution?.modelCallCount || 0)
    );
  },

  setResponseCandidate(state = {}, candidate = null, source = null) {
    this.assertMutable(state);

    state.response.candidate =
      this.cloneSerializable(candidate);

    state.response.selectedSource =
      source ||
      candidate?.source ||
      null;

    this.addEvent(state, "response_candidate_recorded", {
      source: state.response.selectedSource,
      available: Boolean(
        candidate?.text ||
        candidate?.reply ||
        candidate
      )
    });

    return state;
  },

  setRepairedCandidate(state = {}, candidate = null) {
    this.assertMutable(state);

    state.response.repairedCandidate =
      this.cloneSerializable(candidate);

    state.execution.degraded = true;

    this.addFallback(state, "response_repair", {
      available: Boolean(candidate)
    });

    return state;
  },

  setValidation(state = {}, validation = {}) {
    this.assertMutable(state);

    state.validation = {
      ran: true,
      valid: validation.valid === true,
      checks: this.toArray(validation.checks),
      warnings: this.toArray(validation.warnings),
      errors: this.toArray(validation.errors)
    };

    if (state.validation.warnings.length) {
      state.validation.warnings.forEach(
        warning =>
          this.addWarning(state, warning)
      );
    }

    if (state.validation.errors.length) {
      state.validation.errors.forEach(
        error =>
          this.addError(state, {
            ...this.normalizeError(error, "response_validation_error"),
            fatal: false
          })
      );
    }

    this.addEvent(state, "response_validation_recorded", {
      valid: state.validation.valid,
      warningCount: state.validation.warnings.length,
      errorCount: state.validation.errors.length
    });

    return state;
  },

  setFinalResponse(state = {}, response = {}) {
    this.assertMutable(state);

    const normalized =
      this.normalizeResponse(response);

    state.response.final = normalized;
    state.response.usable =
      normalized.usable === true;

    state.response.complete =
      normalized.complete === true;

    state.response.degraded =
      normalized.degraded === true;

    state.execution.degraded =
      state.execution.degraded ||
      normalized.degraded === true;

    this.addEvent(state, "final_response_recorded", {
      usable: state.response.usable,
      complete: state.response.complete,
      degraded: state.response.degraded,
      source: normalized.source
    });

    return state;
  },

  setToolExecution(state = {}, toolExecution = {}) {
    this.assertMutable(state);

    state.toolExecution = {
      requested:
        toolExecution.requested === true,

      executed:
        toolExecution.executed === true,

      requiresApproval:
        toolExecution.requiresApproval === true,

      actions:
        this.toArray(
          toolExecution.actions
        ),

      results:
        this.toArray(
          toolExecution.results
        )
    };

    return state;
  },

  complete(state = {}, response = null) {
    this.assertMutable(state);

    if (response) {
      this.setFinalResponse(state, response);
    }

    if (!state.response.final?.text) {
      throw new Error(
        "cannot_complete_runtime_without_final_response"
      );
    }

    if (
      state.phase !== "finalization"
    ) {
      this.transition(state, "finalization", {
        reason: "runtime_preparing_completion"
      });
    }

    this.transition(state, "completed", {
      degraded: state.execution.degraded
    });

    return state;
  },

  fail(state = {}, error = null, metadata = {}) {
    if (!state || typeof state !== "object") {
      throw new Error("runtime_state_missing");
    }

    if (state.terminal === true) {
      return state;
    }

    this.addError(state, {
      code:
        metadata.code ||
        "runtime_failure",

      message:
        error?.message ||
        String(error || "Runtime failed."),

      source:
        metadata.source ||
        this.source,

      fatal: true,

      metadata:
        this.cloneSerializable(
          metadata.metadata ||
          {}
        )
    });

    this.transition(state, "failed", {
      code:
        metadata.code ||
        "runtime_failure"
    });

    return state;
  },

  addEvent(state = {}, name = "", data = {}) {
    if (!state.trace) {
      state.trace = {
        events: [],
        decisions: [],
        fallbacks: []
      };
    }

    state.trace.events.push({
      id: this.createId("event"),
      name: this.normalizeIdentifier(name),
      at: this.now(),
      phase: state.phase || null,
      data: this.cloneSerializable(data || {})
    });

    return state;
  },

  addDecision(state = {}, name = "", data = {}) {
    state.trace.decisions.push({
      id: this.createId("decision"),
      name: this.normalizeIdentifier(name),
      at: this.now(),
      phase: state.phase || null,
      data: this.cloneSerializable(data || {})
    });

    return state;
  },

  addFallback(state = {}, name = "", data = {}) {
    state.trace.fallbacks.push({
      id: this.createId("fallback"),
      name: this.normalizeIdentifier(name),
      at: this.now(),
      phase: state.phase || null,
      data: this.cloneSerializable(data || {})
    });

    state.execution.degraded = true;

    return state;
  },

  addWarning(state = {}, warning = {}) {
    const normalized =
      typeof warning === "string"
        ? {
            code:
              this.normalizeIdentifier(warning) ||
              "runtime_warning",
            message: warning,
            source: null,
            metadata: {}
          }
        : {
            code:
              warning.code ||
              "runtime_warning",

            message:
              this.cleanText(
                warning.message ||
                warning.code ||
                "Runtime warning."
              ),

            source:
              warning.source ||
              null,

            metadata:
              this.cloneSerializable(
                warning.metadata ||
                {}
              )
          };

    state.warnings.push(normalized);

    return state;
  },

  addError(state = {}, error = {}) {
    const normalized = {
      ...this.normalizeError(
        error,
        "runtime_error"
      ),

      fatal:
        error?.fatal === true
    };

    state.errors.push(normalized);

    return state;
  },

  snapshot(state = {}, options = {}) {
    const snapshot = this.cloneSerializable(state);

    if (options.includeRequest !== true) {
      snapshot.request = {
        requestId:
          state.requestId ||
          null,

        turnId:
          state.turnId ||
          null,

        currentTurn:
          state.currentTurn?.originalText ||
          ""
      };
    }

    if (options.includeTrace === false) {
      snapshot.trace = null;
    }

    if (options.includeStageOutputs === false) {
      snapshot.execution.stageOutputs = {};
    }

    return {
      schema: "rebirth_runtime_state_snapshot",
      schemaVersion: this.schemaVersion,
      createdAt: this.now(),
      state: snapshot
    };
  },

  restore(snapshot = {}) {
    const state =
      snapshot.state ||
      snapshot;

    const restored =
      this.cloneSerializable(state);

    const validation =
      this.validate(restored);

    if (!validation.valid) {
      throw new Error(
        `invalid_runtime_state_snapshot:${validation.errors.join(",")}`
      );
    }

    restored.updatedAt = this.now();

    this.addEvent(restored, "state_restored", {
      source:
        snapshot.schema ||
        "unknown"
    });

    return restored;
  },

  buildResultInput(state = {}) {
    const response =
      state.response.final ||
      state.response.repairedCandidate ||
      state.response.candidate ||
      {};

    return {
      requestId:
        state.requestId,

      turnId:
        state.turnId,

      status:
        state.phase === "completed"
          ? (
              state.execution.degraded
                ? "degraded"
                : "success"
            )
          : state.phase === "failed"
            ? "failed"
            : "degraded",

      response:
        this.normalizeResponse(response),

      understanding:
        this.cloneSerializable(
          state.understanding
        ),

      authorities:
        this.cloneSerializable(
          state.authorities.used
        ),

      toolExecution:
        this.cloneSerializable(
          state.toolExecution
        ),

      model: {
        provider:
          state.model.provider,

        model:
          state.model.selectedModel,

        fallbackModel:
          state.model.fallbackModel,

        callCount:
          state.execution.modelCallCount,

        passes:
          this.cloneSerializable(
            state.model.passes
          ),

        usage:
          this.cloneSerializable(
            state.model.totalUsage
          )
      },

      timing:
        this.cloneSerializable(
          state.timing
        ),

      trace:
        this.cloneSerializable(
          state.trace
        ),

      errors:
        this.cloneSerializable(
          state.errors
        ),

      warnings:
        this.cloneSerializable(
          state.warnings
        ),

      metadata: {
        stateId:
          state.stateId,

        phase:
          state.phase,

        degraded:
          state.execution.degraded,

        completedStages:
          this.cloneSerializable(
            state.execution.completedStages
          ),

        skippedStages:
          this.cloneSerializable(
            state.execution.skippedStages
          )
      }
    };
  },

  validate(state = {}) {
    const errors = [];
    const warnings = [];

    if (!state || typeof state !== "object") {
      errors.push("state_not_object");
    }

    if (state.schema !== this.constants.stateSchema) {
      errors.push("invalid_state_schema");
    }

    if (!state.stateId) {
      errors.push("state_id_missing");
    }

    if (!state.requestId) {
      warnings.push("request_id_missing");
    }

    if (!state.turnId) {
      warnings.push("turn_id_missing");
    }

    if (!this.constants.phases.includes(state.phase)) {
      errors.push("invalid_runtime_phase");
    }

    if (
      state.currentTurn?.preserved !== true
    ) {
      errors.push("current_turn_not_preserved");
    }

    if (
      state.currentTurn?.rewritten === true
    ) {
      errors.push("current_turn_was_rewritten");
    }

    if (
      Number(state.execution?.modelCallCount || 0) >
      Number(state.execution?.maximumModelCalls || 0)
    ) {
      errors.push("model_call_limit_exceeded");
    }

    if (
      state.terminal === true &&
      !this.constants.terminalPhases.includes(
        state.phase
      )
    ) {
      errors.push("terminal_state_has_nonterminal_phase");
    }

    if (
      this.constants.terminalPhases.includes(
        state.phase
      ) &&
      state.terminal !== true
    ) {
      errors.push("terminal_phase_not_marked_terminal");
    }

    if (
      state.phase === "completed" &&
      !state.response?.final?.text
    ) {
      errors.push("completed_state_missing_final_response");
    }

    return {
      valid: errors.length === 0,
      source: "rebirth-runtime-state-validation",
      version: this.version,
      schemaVersion: this.schemaVersion,
      errors,
      warnings,

      checks: {
        schemaValid:
          state.schema ===
          this.constants.stateSchema,

        stateIdAvailable:
          Boolean(state.stateId),

        phaseValid:
          this.constants.phases.includes(
            state.phase
          ),

        currentTurnPreserved:
          state.currentTurn?.preserved ===
          true,

        currentTurnNotRewritten:
          state.currentTurn?.rewritten !==
          true,

        modelCallsBounded:
          Number(state.execution?.modelCallCount || 0) <=
          Number(state.execution?.maximumModelCalls || 0)
      }
    };
  },

  assertMutable(state = {}) {
    if (!state || typeof state !== "object") {
      throw new Error("runtime_state_missing");
    }

    if (state.terminal === true) {
      throw new Error(
        `runtime_state_is_terminal:${state.phase}`
      );
    }
  },

  resolveMaximumModelCalls(request = {}) {
    const value =
      Number(
        request.policy
          ?.modelPassPolicy
          ?.maximumModelCalls
      );

    if (!Number.isFinite(value)) {
      return 2;
    }

    return Math.max(
      0,
      Math.min(
        3,
        Math.floor(value)
      )
    );
  },

  normalizeResponse(response = {}) {
    if (typeof response === "string") {
      return {
        text: this.cleanText(response),
        source: null,
        usable: Boolean(
          this.cleanText(response)
        ),
        complete: Boolean(
          this.cleanText(response)
        ),
        degraded: false,
        mode: "conversational",
        emotion: "idle",
        citations: [],
        evidenceRefs: [],
        proposedActions: []
      };
    }

    const text =
      this.cleanText(
        response?.text ||
        response?.reply ||
        response?.finalResponse ||
        response?.answer ||
        ""
      );

    return {
      text,

      source:
        response?.source ||
        null,

      usable:
        response?.usable !== false &&
        Boolean(text),

      complete:
        response?.complete !== false &&
        Boolean(text),

      degraded:
        response?.degraded === true,

      mode:
        response?.mode ||
        "conversational",

      emotion:
        response?.emotion ||
        "idle",

      confidence:
        this.normalizeConfidence(
          response?.confidence
        ),

      citations:
        this.toArray(
          response?.citations
        ),

      evidenceRefs:
        this.toArray(
          response?.evidenceRefs
        ),

      proposedActions:
        this.toArray(
          response?.proposedActions
        ),

      metadata:
        this.cloneSerializable(
          response?.metadata ||
          {}
        )
    };
  },

  normalizeUsage(usage = {}) {
    const inputTokens =
      this.toFiniteNumber(
        usage.inputTokens ||
        usage.promptTokens ||
        usage.input_tokens,
        0
      );

    const outputTokens =
      this.toFiniteNumber(
        usage.outputTokens ||
        usage.completionTokens ||
        usage.output_tokens,
        0
      );

    const totalTokens =
      this.toFiniteNumber(
        usage.totalTokens ||
        usage.total_tokens,
        inputTokens + outputTokens
      );

    return {
      inputTokens,
      outputTokens,
      totalTokens
    };
  },

  normalizeError(error = null, fallbackCode = "runtime_error") {
    if (typeof error === "string") {
      return {
        code:
          this.normalizeIdentifier(error) ||
          fallbackCode,

        message:
          this.cleanText(error),

        source:
          null,

        metadata:
          {}
      };
    }

    if (!error || typeof error !== "object") {
      return {
        code:
          fallbackCode,

        message:
          this.cleanText(
            String(
              error ||
              fallbackCode
            )
          ),

        source:
          null,

        metadata:
          {}
      };
    }

    return {
      code:
        error.code ||
        fallbackCode,

      message:
        this.cleanText(
          error.message ||
          error.code ||
          fallbackCode
        ),

      source:
        error.source ||
        null,

      metadata:
        this.cloneSerializable(
          error.metadata ||
          {}
        )
    };
  },

  estimateContextItemCount(packet = null) {
    if (!packet) {
      return 0;
    }

    if (Array.isArray(packet)) {
      return packet.length;
    }

    if (typeof packet !== "object") {
      return 1;
    }

    return Object.values(packet).reduce(
      (total, value) => {
        if (Array.isArray(value)) {
          return total + value.length;
        }

        if (
          value &&
          typeof value === "object"
        ) {
          return total + 1;
        }

        return value === null ||
          value === undefined ||
          value === ""
            ? total
            : total + 1;
      },
      0
    );
  },

  freezeRequestReference(request = {}) {
    const clone =
      this.cloneSerializable(request);

    try {
      return Object.freeze(clone);
    } catch (_error) {
      return clone;
    }
  },

  normalizeConfidence(value = null) {
    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return null;
    }

    const normalized =
      number > 1
        ? number / 100
        : number;

    return Math.max(
      0,
      Math.min(
        1,
        normalized
      )
    );
  },

  toFiniteNumber(value, fallback = null) {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : fallback;
  },

  cleanText(value = "") {
    return String(value ?? "")
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },

  normalizeIdentifier(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, "\"")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  },

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

  cloneSerializable(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return value ?? null;
    }

    if (
      typeof structuredClone ===
      "function"
    ) {
      try {
        return structuredClone(value);
      } catch (_error) {
        // Fall through.
      }
    }

    const seen = new WeakSet();

    try {
      return JSON.parse(
        JSON.stringify(
          value,
          (_key, nestedValue) => {
            if (
              nestedValue &&
              typeof nestedValue === "object"
            ) {
              if (seen.has(nestedValue)) {
                return "[Circular]";
              }

              seen.add(nestedValue);
            }

            if (
              typeof nestedValue === "function"
            ) {
              return undefined;
            }

            return nestedValue;
          }
        )
      );
    } catch (_error) {
      return null;
    }
  },

  createId(prefix = "rebirth") {
    const random =
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    return `${prefix}_${random}`;
  },

  now() {
    return Date.now();
  },

  getAuthorityBoundaries() {
    return {
      runtimeStateAuthority: true,
      requestScopedOnly: true,

      mayCreateState: true,
      mayTrackLifecycle: true,
      mayTrackTiming: true,
      mayTrackModelCalls: true,
      mayTrackAuthorityUsage: true,
      mayRecordStageOutputs: true,
      mayCreateSnapshots: true,
      mayRestoreSnapshots: true,
      mayBuildResultInput: true,

      mayInterpretMeaning: false,
      mayClassifyConversation: false,
      mayResolveContinuity: false,
      mayRetrieveMemory: false,
      mayStoreMemory: false,
      mayResolveSafety: false,
      mayResolveCharacter: false,
      mayRetrieveKnowledge: false,
      mayCallOpenAI: false,
      mayExecuteTools: false,
      mayGenerateResponse: false,
      mayValidateResponse: false,
      maySelectFinalResponse: false,
      mayPersistExternally: false,

      role: "request_scoped_runtime_state_authority"
    };
  },

  selfValidate() {
    const errors = [];
    const warnings = [];
    const boundaries =
      this.getAuthorityBoundaries();

    if (boundaries.mayCallOpenAI === true) {
      errors.push(
        "runtime_state_may_not_call_openai"
      );
    }

    if (boundaries.mayInterpretMeaning === true) {
      errors.push(
        "runtime_state_may_not_interpret_meaning"
      );
    }

    if (boundaries.mayResolveSafety === true) {
      errors.push(
        "runtime_state_may_not_resolve_safety"
      );
    }

    if (boundaries.mayGenerateResponse === true) {
      errors.push(
        "runtime_state_may_not_generate_response"
      );
    }

    if (boundaries.mayPersistExternally === true) {
      errors.push(
        "runtime_state_may_not_persist_externally"
      );
    }

    const missingPhases = [
      "created",
      "intake",
      "model",
      "validation",
      "finalization",
      "completed",
      "failed"
    ].filter(
      phase =>
        !this.constants.phases.includes(
          phase
        )
    );

    if (missingPhases.length) {
      errors.push(
        `missing_runtime_phases:${missingPhases.join(",")}`
      );
    }

    return {
      valid: errors.length === 0,
      source: "rebirth-runtime-state-self-validation",
      version: this.version,
      schemaVersion: this.schemaVersion,
      errors,
      warnings,

      checks: {
        openAICallingDisabled:
          boundaries.mayCallOpenAI ===
          false,

        semanticInterpretationDisabled:
          boundaries.mayInterpretMeaning ===
          false,

        safetyResolutionDisabled:
          boundaries.mayResolveSafety ===
          false,

        responseGenerationDisabled:
          boundaries.mayGenerateResponse ===
          false,

        externalPersistenceDisabled:
          boundaries.mayPersistExternally ===
          false,

        lifecycleDefined:
          missingPhases.length === 0
      }
    };
  },

  getStateModule() {
    const validation =
      this.selfValidate();

    return {
      runtimeStateReady:
        validation.valid === true,

      runtimeStateVersion:
        this.version,

      runtimeStateSchemaVersion:
        this.schemaVersion,

      runtimeStateSource:
        this.source,

      constants:
        this.cloneSerializable(
          this.constants
        ),

      boundaries:
        this.getAuthorityBoundaries(),

      validation
    };
  },

  initialize() {
    const module =
      this.getStateModule();

    window.Rebirth.state =
      module;

    window.Rebirth.core =
      window.Rebirth.core ||
      {};

    window.Rebirth.core.runtimeState = {
      source: this.source,
      version: this.version,
      schemaVersion: this.schemaVersion,
      ready:
        module.runtimeStateReady === true,

      create:
        (request, options) =>
          this.create(request, options),

      begin:
        state =>
          this.begin(state),

      transition:
        (state, nextPhase, metadata) =>
          this.transition(
            state,
            nextPhase,
            metadata
          ),

      startStage:
        (state, stageName, metadata) =>
          this.startStage(
            state,
            stageName,
            metadata
          ),

      completeStage:
        (state, stageName, output, metadata) =>
          this.completeStage(
            state,
            stageName,
            output,
            metadata
          ),

      snapshot:
        (state, options) =>
          this.snapshot(
            state,
            options
          ),

      restore:
        snapshot =>
          this.restore(snapshot),

      validate:
        state =>
          this.validate(state),

      selfValidate:
        () =>
          this.selfValidate()
    };

    return {
      runtimeStateInitialized: true,
      runtimeStateReady:
        module.runtimeStateReady === true,
      runtimeStateVersion:
        this.version,
      runtimeStateSource:
        this.source,
      validation:
        module.validation
    };
  }
};

window.RebirthRuntimeStateInitialization =
  window.RebirthRuntimeState.initialize();

console.log(
  "REBIRTH RUNTIME STATE LOADED:",
  window.RebirthRuntimeState?.version,
  window.RebirthRuntimeStateInitialization
    ?.runtimeStateReady === true
    ? "READY"
    : "INVALID"
);
