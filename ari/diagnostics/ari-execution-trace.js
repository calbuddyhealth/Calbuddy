// ari/diagnostics/ari-execution-trace.js
// Ari Execution Trace
//
// Purpose:
// Provide one shared, deterministic execution trace across the entire ARI
// runtime. Record component entry, completion, blocking, failure, timing,
// parent-child relationships, dependency resolution, and diagnostic context.
//
// V1.0.0 — Hierarchical Runtime Trace / First-Failure Authority
//
// Architectural flow:
//
// App Bridge
//      ↓
// Rebirth Pipeline
//      ↓
// Deliberation Pipeline
//      ↓
// Reasoning Stage
//      ↓
// Reasoning Engine
//      ↓
// Reasoning Client
//      ↓
// API
//
// Every component writes to the same trace instance.
//
// Responsibilities:
// - Generate and preserve one trace ID per turn.
// - Record nested execution spans.
// - Record entered, completed, failed, skipped, and blocked states.
// - Preserve the first authoritative failure.
// - Track the last entered and last completed components.
// - Measure duration for every span.
// - Preserve component source and version information.
// - Record structured checkpoints and dependency resolutions.
// - Prevent later failures from replacing the first failure.
// - Produce safe serializable diagnostics for Ari Lab.
// - Support incomplete and interrupted runtime execution.
//
// Non-responsibilities:
// - Does not decide whether a stage should run.
// - Does not repair runtime failures.
// - Does not interpret user meaning.
// - Does not select operations.
// - Does not perform logging policy decisions.
// - Does not expose secrets, prompts, tokens, or raw credentials.

window.Ari = window.Ari || {};

window.AriExecutionTrace = {
  version: "1.0.0",

  schema: "ari.execution_trace",
  schemaVersion: "1.0.0",

  source: "ari-execution-trace",

  status: {
    CREATED: "created",
    ENTERED: "entered",
    COMPLETED: "completed",
    FAILED: "failed",
    BLOCKED: "blocked",
    SKIPPED: "skipped",
    CANCELLED: "cancelled"
  },

  severity: {
    INFO: "info",
    WARNING: "warning",
    ERROR: "error",
    FATAL: "fatal"
  },

  /**
   * Create one trace for one runtime turn.
   */
  create(input = {}) {
    const now = this.now();

    const trace = {
      schema: this.schema,
      schemaVersion: this.schemaVersion,
      traceVersion: this.version,

      traceId:
        this.normalizeString(input.traceId) ||
        this.createTraceId(),

      turnId:
        this.normalizeString(input.turnId) ||
        null,

      requestId:
        this.normalizeString(input.requestId) ||
        null,

      parentTraceId:
        this.normalizeString(input.parentTraceId) ||
        null,

      source:
        this.normalizeString(input.source) ||
        "ari-runtime",

      environment:
        this.sanitizeObject(input.environment),

      startedAt: now.iso,
      startedAtMs: now.ms,

      completedAt: null,
      completedAtMs: null,

      durationMs: null,

      status: this.status.CREATED,

      enteredRuntime: false,
      completedRuntime: false,

      sequence: 0,

      spans: {},
      spanOrder: [],

      events: [],
      checkpoints: [],
      dependencies: [],

      activeSpanStack: [],

      firstFailure: null,
      latestFailure: null,

      firstBlocked: null,

      lastEntered: null,
      lastCompleted: null,
      lastFailed: null,
      lastBlocked: null,
      lastEvent: null,

      counters: {
        spansCreated: 0,
        spansEntered: 0,
        spansCompleted: 0,
        spansFailed: 0,
        spansBlocked: 0,
        spansSkipped: 0,
        checkpoints: 0,
        dependencies: 0,
        warnings: 0,
        errors: 0
      },

      metadata:
        this.sanitizeObject(input.metadata),

      diagnostics: {
        errors: [],
        warnings: []
      }
    };

    this.recordEvent(trace, {
      type: "trace_created",
      component: "execution_trace",
      status: this.status.CREATED,
      data: {
        source: trace.source
      }
    });

    return trace;
  },

  /**
   * Mark the entire runtime as entered.
   */
  enterRuntime(trace, input = {}) {
    if (!this.isTrace(trace)) {
      return null;
    }

    trace.enteredRuntime = true;
    trace.status = this.status.ENTERED;

    return this.recordEvent(trace, {
      type: "runtime_entered",
      component:
        this.normalizeString(input.component) ||
        "ari_runtime",
      status: this.status.ENTERED,
      source: input.source,
      version: input.version,
      data: input.data
    });
  },

  /**
   * Start a hierarchical execution span.
   */
  startSpan(trace, component, input = {}) {
    if (!this.isTrace(trace)) {
      return null;
    }

    const normalizedComponent =
      this.normalizeComponent(component);

    if (!normalizedComponent) {
      this.addTraceError(
        trace,
        "trace_component_missing"
      );

      return null;
    }

    const now = this.now();

    const parentSpanId =
      this.resolveParentSpanId(
        trace,
        input.parentSpanId
      );

    const spanId =
      this.normalizeString(input.spanId) ||
      this.createSpanId(
        normalizedComponent,
        trace.sequence + 1
      );

    const depth =
      parentSpanId &&
      trace.spans[parentSpanId]
        ? trace.spans[parentSpanId].depth + 1
        : 0;

    const span = {
      spanId,

      component: normalizedComponent,

      label:
        this.normalizeString(input.label) ||
        normalizedComponent,

      parentSpanId:
        parentSpanId || null,

      depth,

      status: this.status.ENTERED,

      entered: true,
      completed: false,
      failed: false,
      blocked: false,
      skipped: false,

      startedAt: now.iso,
      startedAtMs: now.ms,

      completedAt: null,
      completedAtMs: null,

      durationMs: null,

      source:
        this.normalizeString(input.source) ||
        null,

      version:
        this.normalizeString(input.version) ||
        null,

      operation:
        this.normalizeString(input.operation) ||
        null,

      stage:
        this.normalizeString(input.stage) ||
        null,

      boundary:
        this.normalizeString(input.boundary) ||
        null,

      attempt:
        this.normalizePositiveInteger(
          input.attempt
        ) || 1,

      inputSummary:
        this.sanitizeObject(
          input.inputSummary
        ),

      outputSummary: null,

      failure: null,
      blockReason: null,
      skipReason: null,

      metadata:
        this.sanitizeObject(input.metadata),

      checkpoints: [],

      childSpanIds: []
    };

    trace.spans[spanId] = span;
    trace.spanOrder.push(spanId);

    if (
      parentSpanId &&
      trace.spans[parentSpanId]
    ) {
      trace.spans[parentSpanId]
        .childSpanIds
        .push(spanId);
    }

    trace.activeSpanStack.push(spanId);

    trace.lastEntered = {
      spanId,
      component: normalizedComponent,
      at: now.iso
    };

    trace.counters.spansCreated += 1;
    trace.counters.spansEntered += 1;

    this.recordEvent(trace, {
      type: "span_entered",
      component: normalizedComponent,
      spanId,
      parentSpanId,
      status: this.status.ENTERED,
      source: span.source,
      version: span.version,
      data: {
        stage: span.stage,
        operation: span.operation,
        depth: span.depth,
        attempt: span.attempt
      }
    });

    return span;
  },

  /**
   * Complete a span successfully.
   */
  completeSpan(trace, spanReference, input = {}) {
    const span =
      this.resolveSpan(
        trace,
        spanReference
      );

    if (!span) {
      return null;
    }

    if (this.isTerminalSpan(span)) {
      return span;
    }

    const now = this.now();

    span.status = this.status.COMPLETED;
    span.completed = true;

    span.completedAt = now.iso;
    span.completedAtMs = now.ms;

    span.durationMs =
      this.calculateDuration(
        span.startedAtMs,
        now.ms
      );

    span.outputSummary =
      this.sanitizeObject(
        input.outputSummary
      );

    if (input.metadata) {
      span.metadata = {
        ...span.metadata,
        ...this.sanitizeObject(
          input.metadata
        )
      };
    }

    this.removeActiveSpan(
      trace,
      span.spanId
    );

    trace.lastCompleted = {
      spanId: span.spanId,
      component: span.component,
      at: now.iso,
      durationMs: span.durationMs
    };

    trace.counters.spansCompleted += 1;

    this.recordEvent(trace, {
      type: "span_completed",
      component: span.component,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      status: this.status.COMPLETED,
      source: span.source,
      version: span.version,
      durationMs: span.durationMs,
      data: {
        outputSummary:
          span.outputSummary
      }
    });

    return span;
  },

  /**
   * Fail a span and preserve the first authoritative failure.
   */
  failSpan(trace, spanReference, failure = {}) {
    const span =
      this.resolveSpan(
        trace,
        spanReference
      );

    if (!span) {
      return null;
    }

    if (this.isTerminalSpan(span)) {
      return span;
    }

    const now = this.now();

    const normalizedFailure =
      this.normalizeFailure(
        failure,
        {
          component: span.component,
          spanId: span.spanId,
          parentSpanId:
            span.parentSpanId
        }
      );

    span.status = this.status.FAILED;
    span.failed = true;

    span.completedAt = now.iso;
    span.completedAtMs = now.ms;

    span.durationMs =
      this.calculateDuration(
        span.startedAtMs,
        now.ms
      );

    span.failure = normalizedFailure;

    this.removeActiveSpan(
      trace,
      span.spanId
    );

    trace.lastFailed = {
      spanId: span.spanId,
      component: span.component,
      at: now.iso,
      code: normalizedFailure.code
    };

    trace.latestFailure = {
      ...normalizedFailure,
      at: now.iso
    };

    if (!trace.firstFailure) {
      trace.firstFailure = {
        ...normalizedFailure,
        at: now.iso,
        sequence:
          trace.sequence + 1
      };
    }

    trace.counters.spansFailed += 1;
    trace.counters.errors += 1;

    this.recordEvent(trace, {
      type: "span_failed",
      component: span.component,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      status: this.status.FAILED,
      severity:
        normalizedFailure.severity,
      source: span.source,
      version: span.version,
      durationMs: span.durationMs,
      code: normalizedFailure.code,
      message:
        normalizedFailure.message,
      data: {
        failure:
          normalizedFailure
      }
    });

    return span;
  },

  /**
   * Mark a component as blocked by an upstream failure.
   */
  blockSpan(trace, spanReference, input = {}) {
    const span =
      this.resolveSpan(
        trace,
        spanReference
      );

    if (!span) {
      return null;
    }

    if (this.isTerminalSpan(span)) {
      return span;
    }

    const now = this.now();

    const blockReason = {
      code:
        this.normalizeString(input.code) ||
        "component_blocked",

      message:
        this.normalizeString(input.message) ||
        "Execution was blocked by an upstream condition.",

      blockedBy:
        this.normalizeString(
          input.blockedBy
        ) ||
        trace.firstFailure?.component ||
        null,

      upstreamFailureCode:
        this.normalizeString(
          input.upstreamFailureCode
        ) ||
        trace.firstFailure?.code ||
        null,

      details:
        this.sanitizeObject(
          input.details
        )
    };

    span.status = this.status.BLOCKED;
    span.blocked = true;

    span.completedAt = now.iso;
    span.completedAtMs = now.ms;

    span.durationMs =
      this.calculateDuration(
        span.startedAtMs,
        now.ms
      );

    span.blockReason = blockReason;

    this.removeActiveSpan(
      trace,
      span.spanId
    );

    trace.lastBlocked = {
      spanId: span.spanId,
      component: span.component,
      at: now.iso,
      code: blockReason.code
    };

    if (!trace.firstBlocked) {
      trace.firstBlocked = {
        component: span.component,
        spanId: span.spanId,
        at: now.iso,
        ...blockReason
      };
    }

    trace.counters.spansBlocked += 1;

    this.recordEvent(trace, {
      type: "span_blocked",
      component: span.component,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      status: this.status.BLOCKED,
      code: blockReason.code,
      message: blockReason.message,
      durationMs: span.durationMs,
      data: blockReason
    });

    return span;
  },

  /**
   * Mark a span as intentionally skipped.
   */
  skipSpan(trace, spanReference, input = {}) {
    const span =
      this.resolveSpan(
        trace,
        spanReference
      );

    if (!span) {
      return null;
    }

    if (this.isTerminalSpan(span)) {
      return span;
    }

    const now = this.now();

    span.status = this.status.SKIPPED;
    span.skipped = true;

    span.completedAt = now.iso;
    span.completedAtMs = now.ms;

    span.durationMs =
      this.calculateDuration(
        span.startedAtMs,
        now.ms
      );

    span.skipReason = {
      code:
        this.normalizeString(input.code) ||
        "component_skipped",

      message:
        this.normalizeString(input.message) ||
        "The component was intentionally skipped.",

      details:
        this.sanitizeObject(
          input.details
        )
    };

    this.removeActiveSpan(
      trace,
      span.spanId
    );

    trace.counters.spansSkipped += 1;

    this.recordEvent(trace, {
      type: "span_skipped",
      component: span.component,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      status: this.status.SKIPPED,
      code: span.skipReason.code,
      message: span.skipReason.message,
      durationMs: span.durationMs,
      data: span.skipReason
    });

    return span;
  },

  /**
   * Add a precise checkpoint inside a span.
   */
  checkpoint(
    trace,
    component,
    checkpoint,
    input = {}
  ) {
    if (!this.isTrace(trace)) {
      return null;
    }

    const now = this.now();

    const normalizedComponent =
      this.normalizeComponent(component);

    const normalizedCheckpoint =
      this.normalizeString(checkpoint);

    if (
      !normalizedComponent ||
      !normalizedCheckpoint
    ) {
      return null;
    }

    const span =
      this.resolveSpan(
        trace,
        input.spanId ||
        normalizedComponent
      );

    const item = {
      checkpointId:
        this.createCheckpointId(
          trace.sequence + 1
        ),

      component:
        normalizedComponent,

      checkpoint:
        normalizedCheckpoint,

      spanId:
        span?.spanId ||
        null,

      status:
        this.normalizeString(
          input.status
        ) ||
        "observed",

      at: now.iso,
      atMs: now.ms,

      source:
        this.normalizeString(
          input.source
        ) ||
        span?.source ||
        null,

      version:
        this.normalizeString(
          input.version
        ) ||
        span?.version ||
        null,

      code:
        this.normalizeString(
          input.code
        ) ||
        null,

      message:
        this.normalizeString(
          input.message
        ) ||
        null,

      data:
        this.sanitizeObject(
          input.data
        )
    };

    trace.checkpoints.push(item);

    if (span) {
      span.checkpoints.push(
        item.checkpointId
      );
    }

    trace.counters.checkpoints += 1;

    this.recordEvent(trace, {
      type: "checkpoint",
      component:
        normalizedComponent,
      spanId:
        item.spanId,
      status:
        item.status,
      code:
        item.code,
      message:
        item.message,
      data: {
        checkpoint:
          normalizedCheckpoint,

        checkpointId:
          item.checkpointId,

        details:
          item.data
      }
    });

    return item;
  },

  /**
   * Record how a dependency was resolved.
   */
  dependency(
    trace,
    dependencyName,
    input = {}
  ) {
    if (!this.isTrace(trace)) {
      return null;
    }

    const now = this.now();

    const name =
      this.normalizeString(
        dependencyName
      );

    if (!name) {
      return null;
    }

    const dependency = {
      dependencyId:
        `dep_${trace.sequence + 1}`,

      name,

      required:
        input.required !== false,

      available:
        Boolean(input.available),

      ready:
        input.ready === undefined
          ? Boolean(input.available)
          : Boolean(input.ready),

      resolvedFrom:
        this.normalizeString(
          input.resolvedFrom
        ) ||
        null,

      source:
        this.normalizeString(
          input.source
        ) ||
        null,

      version:
        this.normalizeString(
          input.version
        ) ||
        null,

      schema:
        this.normalizeString(
          input.schema
        ) ||
        null,

      schemaVersion:
        this.normalizeString(
          input.schemaVersion
        ) ||
        null,

      validation:
        this.sanitizeObject(
          input.validation
        ),

      details:
        this.sanitizeObject(
          input.details
        ),

      at: now.iso,
      atMs: now.ms
    };

    trace.dependencies.push(
      dependency
    );

    trace.counters.dependencies += 1;

    this.recordEvent(trace, {
      type:
        "dependency_resolution",

      component:
        this.normalizeComponent(
          input.component
        ) ||
        "dependency_resolver",

      spanId:
        input.spanId ||
        null,

      status:
        dependency.ready
          ? "ready"
          : "not_ready",

      code:
        dependency.ready
          ? null
          : "dependency_not_ready",

      message:
        dependency.ready
          ? null
          : `${name} is not ready.`,

      data: dependency
    });

    return dependency;
  },

  /**
   * Run an async function inside a traced span.
   */
  async runSpan(
    trace,
    component,
    input = {},
    executor
  ) {
    const span =
      this.startSpan(
        trace,
        component,
        input
      );

    if (!span) {
      throw new Error(
        `Unable to start trace span: ${component}`
      );
    }

    try {
      const result =
        await executor(span);

      if (
        !this.isTerminalSpan(span)
      ) {
        this.completeSpan(
          trace,
          span.spanId,
          {
            outputSummary:
              typeof input
                .summarizeOutput ===
              "function"
                ? input
                    .summarizeOutput(
                      result
                    )
                : null
          }
        );
      }

      return result;
    } catch (error) {
      if (
        !this.isTerminalSpan(span)
      ) {
        this.failSpan(
          trace,
          span.spanId,
          this.failureFromError(
            error,
            {
              code:
                input.failureCode ||
                `${component}_failed`
            }
          )
        );
      }

      throw error;
    }
  },

  /**
   * Complete the overall trace.
   */
  completeTrace(trace, input = {}) {
    if (!this.isTrace(trace)) {
      return null;
    }

    const now = this.now();

    this.closeOpenSpans(
      trace,
      {
        mode:
          trace.firstFailure
            ? "blocked"
            : "completed"
      }
    );

    trace.completedAt = now.iso;
    trace.completedAtMs = now.ms;

    trace.durationMs =
      this.calculateDuration(
        trace.startedAtMs,
        now.ms
      );

    trace.completedRuntime =
      input.completedRuntime !== false;

    trace.status =
      trace.firstFailure
        ? this.status.FAILED
        : this.status.COMPLETED;

    this.recordEvent(trace, {
      type: "trace_completed",
      component:
        this.normalizeString(
          input.component
        ) ||
        "ari_runtime",
      status: trace.status,
      durationMs:
        trace.durationMs,
      data: {
        completedRuntime:
          trace.completedRuntime,

        firstFailure:
          trace.firstFailure
      }
    });

    return trace;
  },

  /**
   * Close spans that were entered but never finished.
   */
  closeOpenSpans(trace, input = {}) {
    if (!this.isTrace(trace)) {
      return trace;
    }

    const openSpanIds = [
      ...trace.activeSpanStack
    ].reverse();

    for (
      const spanId
      of openSpanIds
    ) {
      const span =
        trace.spans[spanId];

      if (
        !span ||
        this.isTerminalSpan(span)
      ) {
        continue;
      }

      if (
        input.mode === "completed"
      ) {
        this.completeSpan(
          trace,
          spanId,
          {
            metadata: {
              autoClosed: true
            }
          }
        );
      } else {
        this.blockSpan(
          trace,
          spanId,
          {
            code:
              "execution_interrupted_by_upstream_failure",

            message:
              "The component did not complete because an upstream failure interrupted execution.",

            blockedBy:
              trace.firstFailure
                ?.component ||
              null,

            upstreamFailureCode:
              trace.firstFailure
                ?.code ||
              null,

            details: {
              autoClosed: true
            }
          }
        );
      }
    }

    return trace;
  },

  /**
   * Produce a compact diagnostic summary.
   */
  summarize(trace) {
    if (!this.isTrace(trace)) {
      return null;
    }

    return {
      traceId: trace.traceId,
      turnId: trace.turnId,
      requestId: trace.requestId,

      source: trace.source,
      status: trace.status,

      enteredRuntime:
        trace.enteredRuntime,

      completedRuntime:
        trace.completedRuntime,

      startedAt:
        trace.startedAt,

      completedAt:
        trace.completedAt,

      durationMs:
        trace.durationMs,

      firstFailure:
        trace.firstFailure,

      latestFailure:
        trace.latestFailure,

      lastEntered:
        trace.lastEntered,

      lastCompleted:
        trace.lastCompleted,

      lastFailed:
        trace.lastFailed,

      lastBlocked:
        trace.lastBlocked,

      counters: {
        ...trace.counters
      },

      activeComponents:
        trace.activeSpanStack
          .map(
            spanId =>
              trace.spans[spanId]
                ?.component
          )
          .filter(Boolean),

      dependencyFailures:
        trace.dependencies
          .filter(
            dependency =>
              dependency.required &&
              !dependency.ready
          )
          .map(
            dependency => ({
              name:
                dependency.name,

              resolvedFrom:
                dependency
                  .resolvedFrom,

              source:
                dependency.source,

              version:
                dependency.version
            })
          )
    };
  },

  /**
   * Build the full Ari Lab diagnostic payload.
   */
  exportForLab(trace, input = {}) {
    if (!this.isTrace(trace)) {
      return null;
    }

    const timeline =
      trace.events.map(
        event => ({
          sequence:
            event.sequence,

          at:
            event.at,

          elapsedMs:
            this.calculateDuration(
              trace.startedAtMs,
              event.atMs
            ),

          type:
            event.type,

          component:
            event.component,

          parentComponent:
            event.parentSpanId
              ? trace.spans[
                  event.parentSpanId
                ]?.component ||
                null
              : null,

          spanId:
            event.spanId,

          status:
            event.status,

          code:
            event.code,

          message:
            event.message,

          durationMs:
            event.durationMs,

          source:
            event.source,

          version:
            event.version,

          data:
            event.data
        })
      );

    const componentTree =
      this.buildComponentTree(
        trace
      );

    return {
      schema:
        "ari.execution_trace_lab_payload",

      schemaVersion:
        "1.0.0",

      generatedAt:
        this.now().iso,

      summary:
        this.summarize(trace),

      firstFailureAnalysis:
        this.buildFirstFailureAnalysis(
          trace
        ),

      componentTree,

      timeline,

      checkpoints: [
        ...trace.checkpoints
      ],

      dependencies: [
        ...trace.dependencies
      ],

      diagnostics: {
        errors: [
          ...trace
            .diagnostics
            .errors
        ],

        warnings: [
          ...trace
            .diagnostics
            .warnings
        ]
      },

      context:
        this.sanitizeObject(
          input.context
        )
    };
  },

  /**
   * Build parent-child component hierarchy.
   */
  buildComponentTree(trace) {
    if (!this.isTrace(trace)) {
      return [];
    }

    const buildNode =
      spanId => {
        const span =
          trace.spans[spanId];

        if (!span) {
          return null;
        }

        return {
          spanId:
            span.spanId,

          component:
            span.component,

          label:
            span.label,

          status:
            span.status,

          source:
            span.source,

          version:
            span.version,

          startedAt:
            span.startedAt,

          completedAt:
            span.completedAt,

          durationMs:
            span.durationMs,

          failure:
            span.failure,

          blockReason:
            span.blockReason,

          skipReason:
            span.skipReason,

          checkpoints:
            span.checkpoints,

          children:
            span.childSpanIds
              .map(buildNode)
              .filter(Boolean)
        };
      };

    return trace.spanOrder
      .filter(
        spanId =>
          !trace.spans[spanId]
            ?.parentSpanId
      )
      .map(buildNode)
      .filter(Boolean);
  },

  /**
   * Explain the first detected failure in direct diagnostic terms.
   */
  buildFirstFailureAnalysis(trace) {
    const failure =
      trace?.firstFailure ||
      null;

    if (!failure) {
      return {
        detected: false,
        component: null,
        code: null,
        message: null,
        parentComponent: null,
        lastCompletedBeforeFailure:
          trace?.lastCompleted ||
          null
      };
    }

    const span =
      failure.spanId
        ? trace.spans[
            failure.spanId
          ] ||
          null
        : null;

    const parentSpan =
      span?.parentSpanId
        ? trace.spans[
            span.parentSpanId
          ] ||
          null
        : null;

    const failureEvent =
      trace.events.find(
        event =>
          event.sequence ===
          failure.sequence
      ) ||
      null;

    const completedBeforeFailure =
      trace.events
        .filter(
          event =>
            event.type ===
              "span_completed" &&
            (
              !failureEvent ||
              event.sequence <
                failureEvent.sequence
            )
        )
        .slice(-1)[0] ||
      null;

    return {
      detected: true,

      component:
        failure.component,

      parentComponent:
        parentSpan?.component ||
        null,

      spanId:
        failure.spanId,

      code:
        failure.code,

      message:
        failure.message,

      severity:
        failure.severity,

      boundary:
        failure.boundary,

      status:
        failure.status,

      httpStatus:
        failure.httpStatus,

      source:
        span?.source ||
        null,

      version:
        span?.version ||
        null,

      details:
        failure.details,

      occurredAt:
        failure.at,

      lastCompletedBeforeFailure:
        completedBeforeFailure
          ? {
              component:
                completedBeforeFailure
                  .component,

              spanId:
                completedBeforeFailure
                  .spanId,

              at:
                completedBeforeFailure
                  .at,

              durationMs:
                completedBeforeFailure
                  .durationMs
            }
          : null
    };
  },

  /**
   * Convert an Error into a structured failure object.
   */
  failureFromError(error, input = {}) {
    const normalizedError =
      error instanceof Error
        ? error
        : new Error(
            this.normalizeString(error) ||
            "Unknown runtime error"
          );

    return {
      code:
        this.normalizeString(
          input.code
        ) ||
        this.normalizeString(
          normalizedError.code
        ) ||
        "runtime_error",

      message:
        this.normalizeString(
          input.message
        ) ||
        normalizedError.message ||
        "Runtime execution failed.",

      severity:
        this.normalizeString(
          input.severity
        ) ||
        this.severity.ERROR,

      boundary:
        this.normalizeString(
          input.boundary
        ) ||
        null,

      status:
        this.normalizeString(
          input.status
        ) ||
        null,

      httpStatus:
        this.normalizeHttpStatus(
          input.httpStatus ||
          normalizedError.status ||
          normalizedError.statusCode
        ),

      details: {
        name:
          normalizedError.name ||
          null,

        stack:
          this.sanitizeStack(
            normalizedError.stack
          ),

        cause:
          this.sanitizeObject(
            normalizedError.cause
          ),

        ...this.sanitizeObject(
          input.details
        )
      }
    };
  },

  /**
   * Record a raw trace event.
   */
  recordEvent(trace, input = {}) {
    if (!this.isTrace(trace)) {
      return null;
    }

    const now = this.now();

    trace.sequence += 1;

    const event = {
      sequence:
        trace.sequence,

      eventId:
        `evt_${trace.sequence}`,

      type:
        this.normalizeString(
          input.type
        ) ||
        "trace_event",

      component:
        this.normalizeComponent(
          input.component
        ) ||
        "unknown_component",

      spanId:
        this.normalizeString(
          input.spanId
        ) ||
        null,

      parentSpanId:
        this.normalizeString(
          input.parentSpanId
        ) ||
        null,

      status:
        this.normalizeString(
          input.status
        ) ||
        null,

      severity:
        this.normalizeString(
          input.severity
        ) ||
        this.severity.INFO,

      code:
        this.normalizeString(
          input.code
        ) ||
        null,

      message:
        this.normalizeString(
          input.message
        ) ||
        null,

      source:
        this.normalizeString(
          input.source
        ) ||
        null,

      version:
        this.normalizeString(
          input.version
        ) ||
        null,

      durationMs:
        Number.isFinite(
          input.durationMs
        )
          ? input.durationMs
          : null,

      at: now.iso,
      atMs: now.ms,

      data:
        this.sanitizeObject(
          input.data
        )
    };

    trace.events.push(event);
    trace.lastEvent = event;

    if (
      event.severity ===
      this.severity.WARNING
    ) {
      trace.counters.warnings += 1;
    }

    return event;
  },

  /**
   * Find an existing span.
   */
  resolveSpan(trace, reference) {
    if (
      !this.isTrace(trace) ||
      !reference
    ) {
      return null;
    }

    if (
      typeof reference ===
        "object" &&
      reference.spanId
    ) {
      return trace.spans[
        reference.spanId
      ] || null;
    }

    const key =
      String(reference);

    if (trace.spans[key]) {
      return trace.spans[key];
    }

    for (
      let index =
        trace.spanOrder.length - 1;
      index >= 0;
      index -= 1
    ) {
      const span =
        trace.spans[
          trace.spanOrder[index]
        ];

      if (
        span?.component ===
        this.normalizeComponent(key)
      ) {
        return span;
      }
    }

    return null;
  },

  resolveParentSpanId(
    trace,
    explicitParentSpanId
  ) {
    if (
      explicitParentSpanId &&
      trace.spans[
        explicitParentSpanId
      ]
    ) {
      return explicitParentSpanId;
    }

    return (
      trace.activeSpanStack[
        trace.activeSpanStack.length - 1
      ] ||
      null
    );
  },

  removeActiveSpan(
    trace,
    spanId
  ) {
    trace.activeSpanStack =
      trace.activeSpanStack.filter(
        activeSpanId =>
          activeSpanId !==
          spanId
      );
  },

  isTerminalSpan(span) {
    return Boolean(
      span &&
      (
        span.status ===
          this.status.COMPLETED ||
        span.status ===
          this.status.FAILED ||
        span.status ===
          this.status.BLOCKED ||
        span.status ===
          this.status.SKIPPED ||
        span.status ===
          this.status.CANCELLED
      )
    );
  },

  normalizeFailure(
    failure = {},
    defaults = {}
  ) {
    const normalized =
      failure instanceof Error
        ? this.failureFromError(
            failure
          )
        : failure || {};

    return {
      component:
        this.normalizeComponent(
          normalized.component ||
          defaults.component
        ) ||
        "unknown_component",

      spanId:
        this.normalizeString(
          normalized.spanId ||
          defaults.spanId
        ) ||
        null,

      parentSpanId:
        this.normalizeString(
          normalized.parentSpanId ||
          defaults.parentSpanId
        ) ||
        null,

      code:
        this.normalizeString(
          normalized.code ||
          normalized.failureType ||
          normalized.reason
        ) ||
        "runtime_failure",

      message:
        this.normalizeString(
          normalized.message ||
          normalized.error
        ) ||
        "Runtime execution failed.",

      severity:
        this.normalizeString(
          normalized.severity
        ) ||
        this.severity.ERROR,

      boundary:
        this.normalizeString(
          normalized.boundary
        ) ||
        null,

      status:
        this.normalizeString(
          normalized.status
        ) ||
        null,

      httpStatus:
        this.normalizeHttpStatus(
          normalized.httpStatus ||
          normalized.statusCode
        ),

      retryable:
        normalized.retryable ===
        true,

      details:
        this.sanitizeObject(
          normalized.details ||
          normalized.diagnostics
        )
    };
  },

  addTraceError(trace, error) {
    if (!this.isTrace(trace)) {
      return;
    }

    trace.diagnostics.errors.push(
      this.normalizeString(error)
    );

    trace.diagnostics.errors =
      this.unique(
        trace.diagnostics.errors
      );

    trace.counters.errors =
      trace.diagnostics.errors.length +
      trace.counters.spansFailed;
  },

  addTraceWarning(trace, warning) {
    if (!this.isTrace(trace)) {
      return;
    }

    trace.diagnostics.warnings.push(
      this.normalizeString(warning)
    );

    trace.diagnostics.warnings =
      this.unique(
        trace.diagnostics.warnings
      );

    trace.counters.warnings =
      trace.diagnostics.warnings.length;
  },

  isTrace(value) {
    return Boolean(
      value &&
      typeof value ===
        "object" &&
      value.schema ===
        this.schema &&
      typeof value.traceId ===
        "string"
    );
  },

  normalizeComponent(value) {
    return String(
      value ||
      ""
    )
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );
  },

  normalizeString(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value).trim();
  },

  normalizePositiveInteger(value) {
    const number =
      Number(value);

    return Number.isInteger(
      number
    ) &&
      number > 0
      ? number
      : null;
  },

  normalizeHttpStatus(value) {
    const status =
      Number(value);

    return Number.isInteger(
      status
    ) &&
      status >= 100 &&
      status <= 599
      ? status
      : null;
  },

  calculateDuration(start, end) {
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end)
    ) {
      return null;
    }

    return Math.max(
      0,
      Number(
        (
          end - start
        ).toFixed(3)
      )
    );
  },

  now() {
    const ms =
      typeof performance !==
        "undefined" &&
      typeof performance.now ===
        "function"
        ? performance.timeOrigin +
          performance.now()
        : Date.now();

    return {
      ms,
      iso:
        new Date(ms)
          .toISOString()
    };
  },

  createTraceId() {
    const timestamp =
      Date.now()
        .toString(36);

    const random =
      Math.random()
        .toString(36)
        .slice(2, 10);

    return `ari_${timestamp}_${random}`;
  },

  createSpanId(
    component,
    sequence
  ) {
    return [
      "span",
      sequence,
      component,
      Math.random()
        .toString(36)
        .slice(2, 7)
    ].join("_");
  },

  createCheckpointId(sequence) {
    return [
      "checkpoint",
      sequence,
      Math.random()
        .toString(36)
        .slice(2, 7)
    ].join("_");
  },

  sanitizeStack(stack) {
    if (!stack) {
      return null;
    }

    return String(stack)
      .split("\n")
      .slice(0, 20)
      .join("\n");
  },

  /**
   * Remove unsafe or excessively large values before diagnostics are exported.
   */
  sanitizeObject(
    value,
    depth = 0,
    seen = new WeakSet()
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (depth > 6) {
      return "[max_depth]";
    }

    if (
      typeof value ===
      "string"
    ) {
      return value.length > 2000
        ? `${value.slice(
            0,
            2000
          )}...[truncated]`
        : value;
    }

    if (
      typeof value ===
        "number" ||
      typeof value ===
        "boolean"
    ) {
      return value;
    }

    if (
      typeof value ===
      "function"
    ) {
      return `[function:${
        value.name ||
        "anonymous"
      }]`;
    }

    if (
      typeof value !==
      "object"
    ) {
      return String(value);
    }

    if (seen.has(value)) {
      return "[circular]";
    }

    seen.add(value);

    if (value instanceof Error) {
      return {
        name:
          value.name,

        message:
          value.message,

        code:
          value.code ||
          null,

        stack:
          this.sanitizeStack(
            value.stack
          )
      };
    }

    if (Array.isArray(value)) {
      return value
        .slice(0, 100)
        .map(
          item =>
            this.sanitizeObject(
              item,
              depth + 1,
              seen
            )
        );
    }

    const blockedKeys =
      new Set([
        "authorization",
        "apiKey",
        "api_key",
        "accessToken",
        "access_token",
        "refreshToken",
        "refresh_token",
        "password",
        "secret",
        "token",
        "cookie",
        "set-cookie",
        "prompt",
        "systemPrompt",
        "system_prompt",
        "rawPrompt",
        "raw_prompt"
      ]);

    const output = {};

    for (
      const [
        key,
        item
      ]
      of Object.entries(value)
        .slice(0, 100)
    ) {
      if (
        blockedKeys.has(key)
      ) {
        output[key] =
          "[redacted]";

        continue;
      }

      output[key] =
        this.sanitizeObject(
          item,
          depth + 1,
          seen
        );
    }

    return output;
  },

  unique(values = []) {
    return [
      ...new Set(
        values.filter(Boolean)
      )
    ];
  },

  authority: {
    canCreateTrace: true,
    canRecordExecution: true,
    canRecordFailures: true,
    canPreserveFirstFailure: true,
    canRecordDependencies: true,
    canExportDiagnostics: true,

    canControlExecution: false,
    canRepairFailures: false,
    canSelectOperations: false,
    canInterpretSemanticMeaning: false,
    canAuthorizeActions: false,

    role:
      "runtime_execution_trace"
  }
};

window.Ari.executionTrace =
  window.AriExecutionTrace;

console.log(
  "ARI EXECUTION TRACE LOADED:",
  window.AriExecutionTrace
    ?.version
);