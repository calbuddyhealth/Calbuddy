// =====================================================
// ARI REBIRTH
// Experimental OpenAI-Authority App Bridge
// Version 3.0.0-experimental
// =====================================================

window.Ari = window.Ari || {};
window.CalBuddy = window.CalBuddy || {};

window.AriRebirthAppBridge = {
  version: "3.0.0-experimental",
  source: "ari-rebirth-app-bridge-openai-authority",

  // Deliberately small runtime. OpenAI performs semantic interpretation,
  // reasoning, response strategy, and conversational drafting. Local modules
  // provide evidence, continuity, restrictions, actions, persistence/delivery.
  requiredScripts: [
    "ari/diagnostics/ari-execution-trace.js",
    "ari/system/ari-loader.js",
    "ari/system/ari-authority.js",
    "ari/contracts/ari-operation-registry.js",
    "ari/contracts/ari-application-operation-registry.js?v=1.0.0",
    "ari/bridge/ari-runtime-request.js",
    "ari/bridge/ari-runtime-readiness.js",
    "ari/bridge/ari-runtime-delivery.js",
    "ari/safety/ari-safety-context-gate.js",
    "ari/governance/ari-restriction-governor.js?v=1.0.0",
    "ari/storage/ari-thread-store.js",
    "ari/storage/ari-memory-store.js",
    "ari/profile/ari-user-preference-contract.js?v=1.1.1",
    "ari/profile/ari-user-preference-store.js?v=1.0.1",
    "ari/profile/ari-preference-resolver.js?v=2.1.0",
    "ari/profile/ari-preference-runtime.js?v=1.1.0",
    "ari/conversation/ari-turn-packet.js",
    "ari/continuity/ari-conversation-operating-state.js",
    "ari/conversation/ari-conversation-meaning-history.js",
    "ari/continuity/ari-conversation-continuity-engine.js",
    "ari/context/ari-reference-packet.js",
    "ari/context/ari-entity-reference-resolver.js",
    "ari/memory/ari-memory-ranking-engine.js",
    "ari/memory/ari-memory-retrieval-engine.js",
    "ari/memory/ari-memory-context-builder.js",
    "ari/context/ari-context-assembler.js",
    "ari/perception/ari-evidence-builder.js",
    "ari/knowledge/ari-openai-knowledge-client.js",
    "ari/knowledge/ari-supabase-knowledge-client.js",
    "ari/knowledge/ari-knowledge-router.js",
    "ari/reasoning/ari-reasoning-context-engine.js",
    "ari/reasoning/ari-openai-reasoning-client.js",
    "ari/reasoning/ari-openai-cognitive-orchestrator.js",
    "ari/reasoning/ari-reasoning-engine.js",
    "ari/understanding/ari-response-planner.js",
    "ari/character/ari-constitution.js",
    "ari/character/ari-character-core.js",
    "ari/character/ari-character-preferences.js",
    "ari/character/ari-character-preference-resolver.js",
    "ari/character/ari-relationship-style.js",
    "ari/actions/ari-rebirth-action-planner.js",
    "ari/intent/ari-action-contract.js",
    "ari/pipelines/ari-perception-pipeline.js",
    "ari/pipelines/ari-executive-routing-pipeline.js",
    "ari/pipeline-stages/deliberation/ari-continuity-stage.js",
    "ari/pipeline-stages/deliberation/ari-safety-stage.js",
    "ari/pipeline-stages/deliberation/ari-reasoning-stage.js",
    "ari/pipeline-stages/deliberation/ari-memory-stage.js",
    "ari/pipeline-stages/deliberation/ari-response-planning-stage.js",
    "ari/pipelines/ari-deliberation-pipeline.js",
    "ari/realization/ari-response-realization-engine.js",
    "ari/language/ari-language-composer.js",
    "ari/pipeline-stages/expression/ari-response-realization-stage.js",
    "ari/pipeline-stages/expression/ari-final-composition-stage.js",
    "ari/pipelines/ari-expression-pipeline.js",
    "ari/pipeline-stages/delivery/ari-action-delivery-stage.js",
    "ari/pipeline-stages/delivery/ari-learning-persistence-stage.js",
    "ari/pipeline-stages/delivery/ari-delivery-diagnostics-stage.js",
    "ari/pipelines/ari-delivery-pipeline.js",
    "ari/integration/ari-rebirth-pipeline.js"
  ],

  _bootPromise: null,

  async ensureReady() {
    if (this._bootPromise) return this._bootPromise;
    this._bootPromise = (async () => {
      const loader = window.AriLoader || window.Ari?.loader;
      if (!loader) throw new Error("ari_loader_unavailable");
      if (typeof loader.loadScripts === "function") {
        await loader.loadScripts(this.requiredScripts);
      } else if (typeof loader.load === "function") {
        for (const src of this.requiredScripts) await loader.load(src);
      } else if (typeof loader.ensure === "function") {
        for (const src of this.requiredScripts) await loader.ensure(src);
      } else {
        throw new Error("ari_loader_has_no_supported_load_method");
      }
      return true;
    })();
    try { return await this._bootPromise; }
    catch (error) { this._bootPromise = null; throw error; }
  },

  async ask(input = {}) {
    try {
      await this.ensureReady();
      const requestBuilder = window.AriRuntimeRequest || window.Ari?.runtimeRequest;
      const pipeline = window.AriRebirthPipeline || window.Ari?.rebirthPipeline;
      const delivery = window.AriRuntimeDelivery || window.Ari?.runtimeDelivery;
      if (!requestBuilder || !pipeline || !delivery) throw new Error("ari_runtime_boundary_unavailable");

      const request = typeof requestBuilder.create === "function"
        ? await requestBuilder.create(input)
        : typeof requestBuilder.build === "function"
          ? await requestBuilder.build(input)
          : input;

      const result = typeof pipeline.run === "function"
        ? await pipeline.run(request)
        : typeof pipeline.execute === "function"
          ? await pipeline.execute(request)
          : null;

      if (!result) throw new Error("ari_pipeline_returned_no_result");
      if (typeof delivery.read === "function") return delivery.read(result);
      if (typeof delivery.deliver === "function") return delivery.deliver(result);
      if (typeof delivery.adapt === "function") return delivery.adapt(result);
      return result;
    } catch (error) {
      console.error("ARI REBIRTH EXPERIMENTAL BRIDGE FAILURE", error);
      return {
        ok: false,
        success: false,
        complete: false,
        source: this.source,
        error: error?.message || String(error),
        failureType: error?.code || "ari_rebirth_experimental_bridge_failure"
      };
    }
  }
};

window.Ari.appBridge = window.AriRebirthAppBridge;
window.CalBuddy.askAri = (...args) => window.AriRebirthAppBridge.ask(...args);