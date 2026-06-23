// ari/developer/ari-rebirth-architecture-engine.js
// Purpose: Design safe app architecture for new features or major redesigns.
// V1.0.0 — Architecture Only / No Search / No Read / No Patch

window.Ari = window.Ari || {};

window.AriRebirthArchitectureEngine = {
  version: "1.0.0",

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

    const normalized = this.normalize(text);
    const systemType = this.inferSystemType(normalized, understanding);

    return {
      architectureRan: true,
      architectureVersion: this.version,
      source: "ari-rebirth-architecture-engine",

      systemType,
      ownerRequest: text,
      architectureGoal: this.inferGoal(systemType, text),

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
        mustGatherEvidenceBeforeEdit: true,
        preserveCalBuddyCore: true,
        preserveAriFirstExperience: true
      }
    };
  },

  getText(summary = {}) {
    return String(
      summary.userMessage ||
        summary.message ||
        summary.input ||
        summary.normalizedMessage ||
        ""
    ).trim();
  },

  normalize(text = "") {
    return String(text || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  },

  isArchitectureRequest(text = "") {
    const t = this.normalize(text);

    return this.hasAny(t, [
      "redesign",
      "completely change",
      "new tool",
      "new feature",
      "build a tool",
      "create a tool",
      "add barcode",
      "barcode scanner",
      "anatomy knowledge",
      "knowledge engine",
      "architecture",
      "system",
      "how should this work",
      "how do we connect",
      "workflow",
      "capability"
    ]);
  },

  inferSystemType(text = "", understanding = null) {
    const targetArea = understanding?.targetArea || "";

    if (targetArea === "homepage_ui") return "homepage_redesign";
    if (targetArea === "tooling") return "new_tool_capability";
    if (targetArea === "ari_response_behavior") return "ari_behavior_system";

    if (this.hasAny(text, ["home screen", "homepage", "main screen", "redesign"])) {
      return "homepage_redesign";
    }

    if (this.hasAny(text, ["barcode", "scanner", "scan food"])) {
      return "barcode_tool";
    }

    if (this.hasAny(text, ["anatomy", "knowledge", "education", "medical knowledge"])) {
      return "knowledge_tool";
    }

    if (this.hasAny(text, ["ari", "speak", "natural", "less robotic", "behavior"])) {
      return "ari_behavior_system";
    }

    return "new_tool_capability";
  },

  inferGoal(systemType, text = "") {
    const goals = {
      homepage_redesign:
        "Redesign the homepage while preserving Ari-first visibility, Ask Ari flow, and the Calories Left meter.",
      barcode_tool:
        "Add barcode scanning as a modular food lookup tool that can create safe meal logging confirmations.",
      knowledge_tool:
        "Add a knowledge capability that can answer educational questions without contaminating nutrition logging or medical safety boundaries.",
      ari_behavior_system:
        "Improve Ari behavior through modular understanding, communication, and self-improvement layers without destabilizing CalBuddy core.",
      new_tool_capability:
        "Add a new modular tool capability without overloading calbuddy-core.js or breaking existing app actions."
    };

    return goals[systemType] || goals.new_tool_capability;
  },

  buildArchitecture(systemType) {
    const map = {
      homepage_redesign: {
        frontendLayer: "index.html owns visible layout and inline homepage behavior.",
        styleLayer: "style.css owns spacing, visual hierarchy, mobile layout, meter appearance.",
        appBrainLayer: "calbuddy-core.js owns dashboard data, context, Ari handoff, and actions.",
        ariLayer: "Ari Rebirth proposes design intent but does not directly mutate DOM.",
        rule: "Keep Ari visible. Do not hide Ari behind popup/chat launcher."
      },

      barcode_tool: {
        frontendLayer: "Scanner UI starts from Log page or Ari pending action flow.",
        appBrainLayer: "calbuddy-core.js exposes lookupBarcode and creates log_meal confirmation.",
        apiLayer: "api/barcode.js handles external lookup and normalization.",
        dataLayer: "meals table stores confirmed result only.",
        ariLayer: "Ari explains estimate and asks before logging."
      },

      knowledge_tool: {
        frontendLayer: "Ari chat remains the entry point.",
        appBrainLayer: "calbuddy-core.js calls searchKnowledge or future tool router.",
        apiLayer: "api/knowledge.js handles retrieval/answer support.",
        safetyLayer: "Medical/health answers stay educational and conservative.",
        ariLayer: "Ari separates knowledge answers from app write actions."
      },

      ari_behavior_system: {
        understandingLayer: "Developer Understanding and normal semantic engines infer request meaning.",
        communicationLayer: "Communication Planner decides speaking strategy.",
        composerLayer: "Language Composer writes final natural answer.",
        bridgeLayer: "Ari Rebirth App Bridge extracts reply/action safely.",
        selfImprovementLayer: "Self Improvement Engine turns behavior flaws into investigation work."
      },

      new_tool_capability: {
        toolDefinitionLayer: "Define the tool purpose, inputs, outputs, and safety rules.",
        appBrainLayer: "calbuddy-core.js exposes a small wrapper method only.",
        apiLayer: "New api/<tool>.js endpoint handles heavy work.",
        actionLayer: "Only confirmed app writes become pendingAction or server action.",
        ariLayer: "Ari decides when to suggest the tool and how to explain results."
      }
    };

    return map[systemType] || map.new_tool_capability;
  },

  requiredFiles(systemType) {
    const map = {
      homepage_redesign: ["index.html", "style.css", "calbuddy-core.js"],
      barcode_tool: ["log.html", "calbuddy-core.js", "api/barcode.js", "api/actions.js"],
      knowledge_tool: ["calbuddy-core.js", "api/knowledge.js", "api/ask-calbuddy.js"],
      ari_behavior_system: [
        "ari/ari-rebirth-app-bridge.js",
        "ari/language/ari-communication-planner.js",
        "ari/language/ari-language-composer.js",
        "ari/developer/ari-rebirth-self-improvement-engine.js"
      ],
      new_tool_capability: ["calbuddy-core.js", "api/actions.js", "api/ask-calbuddy.js"]
    };

    return map[systemType] || map.new_tool_capability;
  },

  integrationPoints(systemType) {
    const common = [
      "Ari must return intent/action, not secretly change production state.",
      "CalBuddy core executes only approved actions.",
      "GitHub edits require exact file evidence and owner confirmation."
    ];

    const map = {
      homepage_redesign: [
        "index.html structure",
        "style.css layout classes",
        "calbuddy:dashboardUpdated event",
        "sendAriMessage flow"
      ],
      barcode_tool: [
        "CalBuddy.lookupBarcode",
        "/api/barcode",
        "pendingAction: log_meal",
        "meals table"
      ],
      knowledge_tool: [
        "CalBuddy.searchKnowledge",
        "/api/knowledge",
        "Ari response safety layer",
        "no automatic app writes"
      ],
      ari_behavior_system: [
        "AriRebirthPipeline",
        "AriRebirthAppBridge.extractReply",
        "communication planner",
        "language composer"
      ],
      new_tool_capability: [
        "CalBuddy tool wrapper",
        "new API endpoint",
        "Ari action planner",
        "pending action confirmation"
      ]
    };

    return [...common, ...(map[systemType] || map.new_tool_capability)];
  },

  dataNeeds(systemType) {
    const map = {
      homepage_redesign: [
        "No new database tables unless storing layout/user preferences."
      ],
      barcode_tool: [
        "Barcode value",
        "normalized food name",
        "calories/macros",
        "serving size",
        "confirmed meal write"
      ],
      knowledge_tool: [
        "Knowledge source",
        "query",
        "answer",
        "safety category",
        "optional citation/source metadata"
      ],
      ari_behavior_system: [
        "Owner feedback",
        "failure type",
        "affected engine",
        "developer investigation result"
      ],
      new_tool_capability: [
        "Tool input schema",
        "tool result schema",
        "whether result can create pendingAction"
      ]
    };

    return map[systemType] || map.new_tool_capability;
  },

  risks(systemType) {
    const map = {
      homepage_redesign: [
        "Breaking mobile layout.",
        "Hiding Ari or making the page feel less Ari-first.",
        "Breaking inline chat functions.",
        "Breaking meter click/navigation."
      ],
      barcode_tool: [
        "Bad calorie data from external source.",
        "Logging without confirmation.",
        "Barcode lookup failure or missing product.",
        "Serving size mismatch."
      ],
      knowledge_tool: [
        "Medical overconfidence.",
        "Mixing education with diagnosis.",
        "Untrusted knowledge sources.",
        "Answering outside safe scope."
      ],
      ari_behavior_system: [
        "Composer changes affecting all answers.",
        "Bridge extraction returning directive text.",
        "Too many engines competing for authority.",
        "Self-improvement loop proposing unsafe edits."
      ],
      new_tool_capability: [
        "Tool bloat inside calbuddy-core.js.",
        "Unclear action contract.",
        "Backend endpoint not matching frontend payload.",
        "No test path before deployment."
      ]
    };

    return map[systemType] || map.new_tool_capability;
  },

  buildOrder(systemType) {
    const map = {
      homepage_redesign: [
        "Define exact layout goal.",
        "Read index.html.",
        "Read style.css.",
        "Read calbuddy-core.js only for affected behavior.",
        "Patch smallest layout block.",
        "Test mobile homepage, Ari chat, meter, navigation."
      ],
      barcode_tool: [
        "Define barcode result schema.",
        "Verify or build /api/barcode.",
        "Connect CalBuddy.lookupBarcode.",
        "Convert result into pending log_meal action.",
        "Test known barcode, unknown barcode, failed lookup."
      ],
      knowledge_tool: [
        "Define knowledge scope.",
        "Build or verify /api/knowledge.",
        "Connect CalBuddy.searchKnowledge.",
        "Add safety boundaries.",
        "Test normal education, medical caution, unknown answer."
      ],
      ari_behavior_system: [
        "Identify behavior failure.",
        "Run self-improvement investigation.",
        "Read bridge/composer/planner.",
        "Patch only the bottleneck.",
        "Test greeting, normal answer, developer request, food logging."
      ],
      new_tool_capability: [
        "Define tool purpose.",
        "Define input/output schema.",
        "Create API endpoint.",
        "Add CalBuddy wrapper.",
        "Teach Ari when to use it.",
        "Test success/failure/confirmation paths."
      ]
    };

    return map[systemType] || map.new_tool_capability;
  },

  testPlan(systemType) {
    const map = {
      homepage_redesign: [
        "Open homepage on mobile.",
        "Send Ari a normal message.",
        "Expand conversations.",
        "Check Calories Left meter.",
        "Navigate to Goals, Progress, Daily Intake."
      ],
      barcode_tool: [
        "Scan or submit valid barcode.",
        "Handle unknown barcode.",
        "Confirm log meal.",
        "Cancel log meal.",
        "Verify dashboard updates."
      ],
      knowledge_tool: [
        "Ask educational question.",
        "Ask unsafe/medical diagnostic question.",
        "Ask unknown-source question.",
        "Verify no accidental pendingAction."
      ],
      ari_behavior_system: [
        "Ask simple greeting.",
        "Ask hard follow-up.",
        "Ask developer request.",
        "Ask food logging request.",
        "Verify no directive text leaks."
      ],
      new_tool_capability: [
        "Test valid input.",
        "Test missing input.",
        "Test API failure.",
        "Test Ari explanation.",
        "Test pendingAction only when appropriate."
      ]
    };

    return map[systemType] || map.new_tool_capability;
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(term));
  }
};

console.log(
  "ARI REBIRTH ARCHITECTURE ENGINE LOADED:",
  window.AriRebirthArchitectureEngine.version
);