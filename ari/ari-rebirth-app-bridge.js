// =====================================================
// ARI REBIRTH
// Experimental OpenAI-Authority App Bridge
// Version 3.2.1-experimental
// =====================================================
window.Ari = window.Ari || {};
window.CalBuddy = window.CalBuddy || {};
window.AriRebirthAppBridge = {
  version: "3.2.1-experimental",
  source: "ari-rebirth-app-bridge-openai-authority",
  requiredScripts: [
    "ari/diagnostics/ari-execution-trace.js",
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

    // Canonical current-turn intake.
    "ari/conversation/ari-turn-packet.js",
    "ari/conversation/ari-turn-intake-engine.js",

    // Conversation operating state must exist before context authorities attach
    // their authoritative relationship/reference packets to the active turn.
    "ari/continuity/ari-conversation-operating-state.js",
    "ari/conversation/ari-conversation-meaning-history.js",
    "ari/continuity/ari-conversation-continuity-engine.js",
    "ari/continuity/ari-elliptical-follow-up-resolver.js",
    "ari/continuity/ari-continuity-entry-point.js",

    // Canonical conversation relationship authority. These dependencies are
    // intentionally ordered registry -> types -> evaluator -> packet -> engine.
    // The Rebirth Pipeline requires the final engine immediately after
    // Perception and before Executive Routing.
    "ari/conversation/ari-conversation-rule-registry.js",
    "ari/conversation/ari-conversation-relationship-types.js",
    "ari/conversation/ari-conversation-relationship-rules.js",
    "ari/conversation/ari-turn-classification-packet.js",
    "ari/conversation/ari-conversation-relationship-engine.js",

    // Reference resolution authority runs directly after relationship
    // classification inside the same conversation-context boundary.
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
    "ari/pipelines/ari-deliberation-pipeline.js",
    "ari/language/ari-language-composer.js",
    "ari/pipeline-stages/expression/ari-final-composition-stage.js",
    "ari/pipelines/ari-expression-pipeline.js",
    "ari/pipeline-stages/delivery/ari-action-delivery-stage.js",
    "ari/pipeline-stages/delivery/ari-learning-persistence-stage.js",
    "ari/pipeline-stages/delivery/ari-delivery-diagnostics-stage.js",
    "ari/pipelines/ari-delivery-pipeline.js",
    "ari/integration/ari-rebirth-pipeline.js"
  ],
  _bootPromise: null,
  _loadedScripts: new Set(),
  normalizeSrc(src) { return String(src || "").trim(); },
  isScriptPresent(src) {
    const clean = this.normalizeSrc(src); if (!clean) return true;
    const targetPath = clean.split("?")[0];
    return Array.from(document.scripts || []).some((script) => {
      const raw = script.getAttribute("src") || ""; if (!raw) return false;
      try { return new URL(raw, window.location.href).pathname.replace(/^\//, "") === targetPath.replace(/^\//, ""); }
      catch { return raw.split("?")[0].replace(/^\//, "") === targetPath.replace(/^\//, ""); }
    });
  },
  loadScript(src) {
    const clean = this.normalizeSrc(src);
    if (!clean || this._loadedScripts.has(clean) || this.isScriptPresent(clean)) { this._loadedScripts.add(clean); return Promise.resolve(true); }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script"); script.src = clean; script.async = false; script.dataset.ariExperimentalRuntime = "true";
      script.onload = () => { this._loadedScripts.add(clean); resolve(true); };
      script.onerror = () => reject(new Error(`ari_runtime_script_load_failed:${clean}`));
      (document.head || document.documentElement).appendChild(script);
    });
  },
  async loadRuntimeScripts() { for (const src of this.requiredScripts) await this.loadScript(src); return true; },
  async ensureReady() {
    if (this._bootPromise) return this._bootPromise;
    this._bootPromise = (async () => {
      await this.loadRuntimeScripts();
      const required = {
        runtime_request: window.AriRuntimeRequest || window.Ari?.runtimeRequest,
        rebirth_pipeline: window.AriRebirthPipeline || window.Ari?.rebirthPipeline,
        runtime_delivery: window.AriRuntimeDelivery || window.Ari?.runtimeDelivery,
        openai_reasoning_client: window.AriOpenAIReasoningClient || window.Ari?.openAIReasoningClient,
        openai_cognitive_orchestrator: window.AriOpenAICognitiveOrchestrator || window.Ari?.openAICognitiveOrchestrator,
        turn_intake: window.AriTurnIntakeEngine || window.Ari?.turnIntakeEngine,
        follow_up_resolver: window.AriEllipticalFollowUpResolver || window.Ari?.ellipticalFollowUpResolver,
        conversation_relationship_rules: window.AriConversationRelationshipRules || window.Ari?.conversationRelationshipRules,
        turn_classification_packet: window.AriTurnClassificationPacket || window.Ari?.turnClassificationPacket,
        conversation_relationship_engine: window.AriConversationRelationshipEngine || window.Ari?.conversationRelationshipEngine,
        reference_resolution_engine: window.AriEntityReferenceResolver || window.AriReferenceResolutionEngine || window.Ari?.entityReferenceResolver || window.Ari?.referenceResolutionEngine
      };
      const missing = Object.entries(required).filter(([, value]) => !value).map(([name]) => name);
      if (missing.length) throw new Error(`ari_runtime_boot_incomplete:${missing.join(",")}`);
      return true;
    })();
    try { return await this._bootPromise; } catch (error) { this._bootPromise = null; throw error; }
  },
  async ask(input = {}) {
    try {
      await this.ensureReady();
      const requestBuilder = window.AriRuntimeRequest || window.Ari?.runtimeRequest;
      const pipeline = window.AriRebirthPipeline || window.Ari?.rebirthPipeline;
      const delivery = window.AriRuntimeDelivery || window.Ari?.runtimeDelivery;
      const request = typeof requestBuilder.create === "function" ? await requestBuilder.create(input) : typeof requestBuilder.build === "function" ? await requestBuilder.build(input) : input;
      const result = typeof pipeline.run === "function" ? await pipeline.run(request) : typeof pipeline.execute === "function" ? await pipeline.execute(request) : null;
      if (!result) throw new Error("ari_pipeline_returned_no_result");
      if (typeof delivery.read === "function") return delivery.read(result);
      if (typeof delivery.deliver === "function") return delivery.deliver(result);
      if (typeof delivery.adapt === "function") return delivery.adapt(result);
      return result;
    } catch (error) {
      console.error("ARI REBIRTH EXPERIMENTAL BRIDGE FAILURE", error);
      return { ok: false, success: false, complete: false, source: this.source, bridgeVersion: this.version, error: error?.message || String(error), failureType: error?.code || "ari_rebirth_experimental_bridge_failure" };
    }
  }
};
window.Ari.appBridge = window.AriRebirthAppBridge;
window.CalBuddy.askAri = (...args) => window.AriRebirthAppBridge.ask(...args);