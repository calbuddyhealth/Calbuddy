// ari/developer/ari-rebirth-architecture-engine.js
// Compatibility architecture engine for Owner developer workflows.
// V2.0.0 — vNext-aware architecture / no search / no read / no patch.

window.Ari = window.Ari || {};

window.AriRebirthArchitectureEngine = {
  version: "2.0.0",

  design(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};
    const text = this.getText(summary);
    if (!appContext.ownerMode) return null;

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    const isArchitectureRequest =
      this.isArchitectureRequest(text) ||
      understanding?.intentFamily === "tool_or_feature_build" ||
      understanding?.intentFamily === "homepage_redesign_or_patch";
    if (!isArchitectureRequest) return null;

    const systemType = this.inferSystemType(this.normalize(text), understanding);

    return {
      architectureRan: true,
      architectureVersion: this.version,
      source: "ari-rebirth-architecture-engine",
      compatibilityEngine: true,
      canonicalRuntime: "ari-vnext",
      systemType,
      ownerRequest: text,
      architectureGoal: this.inferGoal(systemType),
      recommendedArchitecture: this.buildArchitecture(systemType),
      requiredFiles: this.requiredFiles(systemType),
      integrationPoints: this.integrationPoints(systemType),
      dataNeeds: this.dataNeeds(systemType),
      risks: this.risks(systemType),
      buildOrder: this.buildOrder(systemType),
      testPlan: this.testPlan(systemType),
      architecturePolicy: {
        architectureOnly: true,
        noSearch: true,
        noRead: true,
        noPatch: true,
        canonicalVNextFirst: true,
        singleSemanticAuthority: true,
        stateFirstForNewCognition: true,
        mustGatherEvidenceBeforeEdit: true,
        preserveAriFirstExperience: true
      }
    };
  },

  getText(summary = {}) {
    return String(summary.userMessage || summary.message || summary.input || summary.normalizedMessage || "").trim();
  },

  normalize(text = "") {
    return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
  },

  isArchitectureRequest(text = "") {
    const t = this.normalize(text);
    return this.hasAny(t, [
      "redesign", "completely change", "new tool", "new feature", "build a tool",
      "create a tool", "barcode scanner", "knowledge engine", "architecture",
      "system", "how should this work", "how do we connect", "workflow", "capability"
    ]);
  },

  inferSystemType(text = "", understanding = null) {
    const targetArea = understanding?.targetArea || "";
    if (targetArea === "homepage_ui") return "homepage_redesign";
    if (targetArea === "tooling") return "new_tool_capability";
    if (targetArea === "ari_response_behavior") return "ari_behavior_system";
    if (this.hasAny(text, ["home screen", "homepage", "main screen", "redesign"])) return "homepage_redesign";
    if (this.hasAny(text, ["barcode", "scanner", "scan food"])) return "barcode_tool";
    if (this.hasAny(text, ["anatomy", "knowledge", "education", "medical knowledge"])) return "knowledge_tool";
    if (this.hasAny(text, ["ari", "speak", "natural", "behavior", "reasoning", "harness"])) return "ari_behavior_system";
    return "new_tool_capability";
  },

  inferGoal(systemType) {
    const goals = {
      homepage_redesign: "Change the live Home experience while preserving the canonical vNext runtime, mobile behavior, and current navigation contracts.",
      barcode_tool: "Add barcode capability through the vNext tool/action boundary with explicit confirmation before any meal write.",
      knowledge_tool: "Add read-only knowledge capability through vNext without creating a competing prompt or write authority.",
      ari_behavior_system: "Improve Ari by extending the canonical vNext authorities, evidence sources, and deliberation harness instead of adding another Rebirth-era prompt stack.",
      new_tool_capability: "Add a modular vNext capability with one clear owner, validated inputs, one write authority, and regression coverage."
    };
    return goals[systemType] || goals.new_tool_capability;
  },

  buildArchitecture(systemType) {
    const map = {
      homepage_redesign: {
        frontendLayer: "home.html owns the live Home document and script/style composition.",
        interactionLayer: "js/home.js and focused Home modules own browser interaction.",
        runtimeLayer: "ari/runtime/ari-runtime-controller.js keeps conversation on vNext.",
        serverLayer: "api/ari-vnext.js plus api/_lib/ari-vnext/orchestrator.js own canonical semantic/tool behavior.",
        rule: "Prefer focused feature modules over adding more inline compatibility logic."
      },
      barcode_tool: {
        uiLayer: "Nutrition/Log UI captures or displays the barcode result.",
        toolLayer: "api/_lib/ari-vnext/tools.js and tools-core.js define/validate the capability.",
        actionLayer: "toolToApplicationAction maps only confirmed writes into the application action boundary.",
        backendLayer: "A focused API/RPC performs lookup and normalization.",
        dataLayer: "Only confirmed meal writes reach authoritative storage."
      },
      knowledge_tool: {
        entryLayer: "Ari chat remains the entry point.",
        orchestrationLayer: "The vNext route/orchestrator selects a bounded read-only capability.",
        toolLayer: "The capability returns evidence, not a second prompt constitution.",
        safetyLayer: "Domain-specific safety remains enforced above the tool.",
        writeRule: "Knowledge lookup must not silently create application writes."
      },
      ari_behavior_system: {
        authorityLayer: "Companion Core, Communication Profile, Ari Executive, and Deliberation Harness are the model-facing authorities.",
        substrateLayer: "Instinct Kernel supplies deterministic pressure rather than an independent prompt.",
        stateLayer: "Memory, continuity, reward, affect, curiosity, imagination, conviction, and related systems produce state/evidence.",
        orchestrationLayer: "api/_lib/ari-vnext/orchestrator.js resolves the turn and tools.",
        browserLayer: "ari/runtime/ari-runtime-controller.js and ari/vnext/ari-vnext-bridge.js transport the canonical result."
      },
      new_tool_capability: {
        contractLayer: "Define the capability purpose, inputs, outputs, permissions, and whether it can write.",
        registryLayer: "Register/validate it in the vNext tool stack.",
        backendLayer: "Use a focused endpoint or RPC for heavy work.",
        actionLayer: "Route writes through one confirmation/application-action authority.",
        verificationLayer: "Add focused regression tests plus broader affected-surface checks."
      }
    };
    return map[systemType] || map.new_tool_capability;
  },

  requiredFiles(systemType) {
    const map = {
      homepage_redesign: ["home.html", "js/home.js", "ari/runtime/ari-runtime-controller.js", "assets/css/home.css", "assets/css/home-thread-ux.css"],
      barcode_tool: ["api/_lib/ari-vnext/tools.js", "api/_lib/ari-vnext/tools-core.js", "api/_lib/ari-vnext/orchestrator.js", "nutrition.html", "js/nutrition.js"],
      knowledge_tool: ["api/_lib/ari-vnext/tools.js", "api/_lib/ari-vnext/orchestrator.js", "api/ari-vnext.js"],
      ari_behavior_system: ["api/_lib/ari-vnext/orchestrator.js", "api/_lib/ari-vnext/ari-executive.js", "api/_lib/ari-vnext/deliberation-harness.js", "docs/ARI_COGNITION_AUTHORITY_MAP.md", "ari/runtime/ari-runtime-controller.js"],
      new_tool_capability: ["api/_lib/ari-vnext/tools.js", "api/_lib/ari-vnext/tools-core.js", "api/_lib/ari-vnext/orchestrator.js"]
    };
    return map[systemType] || map.new_tool_capability;
  },

  integrationPoints(systemType) {
    const common = [
      "Current user intent and verified evidence outrank learned/legacy state.",
      "One canonical semantic authority owns the turn.",
      "Application writes require the existing confirmation/action boundary.",
      "A compatibility layer may adapt data but must not become a second semantic authority."
    ];
    const map = {
      homepage_redesign: ["home.html", "sendAriMessage flow", "Ari.Runtime", "mobile visual viewport"],
      barcode_tool: ["vNext tool registry", "tool validation", "toolToApplicationAction", "meal persistence"],
      knowledge_tool: ["vNext routing", "read-only tool result", "response grounding"],
      ari_behavior_system: ["Ari Executive", "Deliberation Harness", "Unified Cognition Coordinator", "AriVNextBridge"],
      new_tool_capability: ["vNext tool registry", "focused endpoint/RPC", "application action confirmation", "regression tests"]
    };
    return [...common, ...(map[systemType] || map.new_tool_capability)];
  },

  dataNeeds(systemType) {
    const map = {
      homepage_redesign: ["No new persistence unless the user-facing feature itself needs durable state."],
      barcode_tool: ["barcode", "normalized product/food identity", "serving", "nutrition values", "confirmed write payload"],
      knowledge_tool: ["query", "retrieved evidence", "source metadata", "domain/safety classification"],
      ari_behavior_system: ["current turn", "relevant context", "cognitive state", "tool evidence", "verification outcome"],
      new_tool_capability: ["input schema", "result schema", "permission/write classification", "verification evidence"]
    };
    return map[systemType] || map.new_tool_capability;
  },

  risks(systemType) {
    const common = [
      "Creating a second semantic or write authority.",
      "Reusing a legacy file map that no longer owns the live feature.",
      "Changing production code to satisfy a stale test without proving causal relevance."
    ];
    const map = {
      homepage_redesign: ["Breaking mobile viewport behavior.", "Breaking Home conversation/navigation wiring."],
      barcode_tool: ["Untrusted product data.", "Logging without confirmation.", "Serving-size mismatch."],
      knowledge_tool: ["Ungrounded answers.", "Domain overconfidence.", "Accidental write coupling."],
      ari_behavior_system: ["Prompt-authority duplication.", "Legacy Rebirth instructions competing with vNext.", "Excessive context/prompt bloat."],
      new_tool_capability: ["Tool contract ambiguity.", "Endpoint/validator mismatch.", "Unbounded side effects."]
    };
    return [...common, ...(map[systemType] || map.new_tool_capability)];
  },

  buildOrder(systemType) {
    const common = [
      "Define the user-visible success condition.",
      "Identify the current canonical owner on main.",
      "Read the current contract before changing code.",
      "Prefer the smallest additive or consolidating change that preserves one authority."
    ];
    const map = {
      homepage_redesign: ["Trace Home DOM, owning JS, CSS, and runtime wiring.", "Implement focused change.", "Test mobile, conversation, navigation, and viewport behavior."],
      barcode_tool: ["Define result schema.", "Register/validate vNext tool.", "Connect focused backend.", "Map confirmed write.", "Test valid/unknown/failure/cancel paths."],
      knowledge_tool: ["Define evidence scope.", "Add bounded read-only capability.", "Ground response in returned evidence.", "Test success, missing evidence, and safety boundaries."],
      ari_behavior_system: ["Identify which existing authority/evidence source owns the behavior.", "Extend that owner rather than adding a new prompt layer.", "Test representative conversation and failure-recovery scenarios."],
      new_tool_capability: ["Define contract.", "Register tool.", "Implement endpoint/RPC.", "Wire application action only if needed.", "Test success/failure/authorization/confirmation paths."]
    };
    return [...common, ...(map[systemType] || map.new_tool_capability)];
  },

  testPlan(systemType) {
    const common = [
      "Reproduce the target scenario before the change.",
      "Verify the focused regression after the change.",
      "Run affected subsystem tests and CI.",
      "Confirm no competing legacy path became active."
    ];
    const map = {
      homepage_redesign: ["Test iPhone Safari viewport/keyboard transitions.", "Send a normal Ari message.", "Verify navigation and quick actions."],
      barcode_tool: ["Known barcode.", "Unknown barcode.", "Provider/API failure.", "Confirm and cancel write."],
      knowledge_tool: ["Grounded answer.", "Missing evidence.", "Restricted/sensitive domain boundary.", "No accidental pending action."],
      ari_behavior_system: ["Simple conversation.", "Hard debugging turn.", "Correction after failure.", "Tool/action turn.", "No legacy prompt competition."],
      new_tool_capability: ["Valid input.", "Invalid/missing input.", "Backend failure.", "Authorization/confirmation path."]
    };
    return [...common, ...(map[systemType] || map.new_tool_capability)];
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(term));
  }
};

console.log(
  "ARI COMPATIBILITY ARCHITECTURE ENGINE LOADED:",
  window.AriRebirthArchitectureEngine.version
);