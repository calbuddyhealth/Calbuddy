// ari/developer/ari-rebirth-project-knowledge-graph-engine.js
// Purpose: Build Ari's semantic map of CalBuddy systems, files, and responsibilities.
// V1.0.0 — Project Map Only / No Search / No Read / No Patch

window.Ari = window.Ari || {};

window.AriRebirthProjectKnowledgeGraphEngine = {
  version: "1.0.0",

  build(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};

    if (!appContext.ownerMode) return null;

    const text = this.getText(summary);
    const graph = this.buildGraph();
    const focusedArea = this.inferFocusedArea(text, summary);

    return {
      projectKnowledgeGraphRan: true,
      projectKnowledgeGraphVersion: this.version,
      source: "ari-rebirth-project-knowledge-graph-engine",

      focusedArea,
      graph,
      relevantNodes: this.getRelevantNodes(focusedArea, graph),
      relevantFiles: this.getRelevantFiles(focusedArea, graph),
      systemRelationships: this.getSystemRelationships(focusedArea, graph),
      likelyOwners: this.getLikelyOwners(focusedArea, graph),
      safeNavigationPath: this.getSafeNavigationPath(focusedArea, graph),

      graphPolicy: {
        mapOnly: true,
        noSearch: true,
        noRead: true,
        noPatch: true,
        noExecution: true,
        semanticProjectMap: true
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

  buildGraph() {
    return {
      systems: [
        {
          id: "homepage",
          name: "Homepage Experience",
          purpose: "Main CalBuddy home screen with Ari, chat, meter, and navigation.",
          files: ["index.html", "style.css", "calbuddy-core.js"],
          owns: [
            "Ari visible homepage presence",
            "Ask Ari input",
            "Conversation panel",
            "Calories Left meter",
            "Main navigation tiles"
          ],
          dependsOn: ["app_core", "ari_rebirth_bridge", "auth", "dashboard_state"],
          riskLevel: "medium_high"
        },

        {
          id: "app_core",
          name: "CalBuddy Core",
          purpose: "Client-side app brain for auth, user context, meals, goals, actions, dashboard, and Ari handoff.",
          files: ["calbuddy-core.js"],
          owns: [
            "User context",
            "Nutrition window",
            "Meal logging",
            "Weight logging",
            "Profile updates",
            "Pending actions",
            "Dashboard refresh",
            "Ari ask flow",
            "GitHub developer handoff"
          ],
          dependsOn: ["supabase", "server_actions", "ari_rebirth_bridge", "github_tools"],
          riskLevel: "high"
        },

        {
          id: "ari_rebirth",
          name: "Ari Rebirth Reasoning System",
          purpose: "Local Ari reasoning pipeline before final app response.",
          files: [
            "ari/integration/ari-rebirth-pipeline.js",
            "ari/ari-rebirth-app-bridge.js",
            "ari/actions/ari-rebirth-action-planner.js"
          ],
          owns: [
            "Rebirth pipeline execution",
            "Response extraction",
            "Emotion selection",
            "Action recovery",
            "App context attachment"
          ],
          dependsOn: ["ari_core", "app_core", "developer_layer"],
          riskLevel: "critical"
        },

        {
          id: "developer_layer",
          name: "Ari Developer Layer",
          purpose: "Owner-only developer reasoning for bugs, features, architecture, patching, and safe GitHub handoff.",
          files: [
            "ari/developer/ari-rebirth-developer-understanding-engine.js",
            "ari/developer/ari-rebirth-capability-registry-engine.js",
            "ari/developer/ari-rebirth-architecture-engine.js",
            "ari/developer/ari-rebirth-bug-diagnosis-engine.js",
            "ari/developer/ari-rebirth-code-evidence-engine.js",
            "ari/developer/ari-rebirth-code-understanding-engine.js",
            "ari/developer/ari-rebirth-dependency-map-engine.js",
            "ari/developer/ari-rebirth-patch-decision-engine.js",
            "ari/developer/ari-rebirth-self-improvement-engine.js",
            "ari/developer/ari-rebirth-developer-handoff-engine.js"
          ],
          owns: [
            "Developer request understanding",
            "Capability inventory",
            "Architecture planning",
            "Bug diagnosis",
            "Evidence planning",
            "Code meaning",
            "Dependency blast radius",
            "Patch decision",
            "Self-improvement planning",
            "Developer handoff"
          ],
          dependsOn: ["github_tools", "ari_rebirth", "app_core"],
          riskLevel: "high"
        },

        {
          id: "github_tools",
          name: "GitHub Tooling",
          purpose: "Owner-gated read, search, edit, commit, preview, and undo workflows.",
          files: [
            "api/ari-github-read.js",
            "api/ari-github-search.js",
            "api/ari-github-edit.js",
            "calbuddy-core.js"
          ],
          owns: [
            "Repository file reading",
            "Repository code search",
            "Safe GitHub edits",
            "Preview mode",
            "Commit mode",
            "Undo mode",
            "Owner confirmation gate"
          ],
          dependsOn: ["GITHUB_TOKEN", "GITHUB_REPO", "GITHUB_BRANCH", "owner_access"],
          riskLevel: "critical"
        },

        {
          id: "server_ai",
          name: "Server Ari Fallback",
          purpose: "Server-side AI response, JSON contract, memory candidate, and developerIntent fallback.",
          files: ["api/ask-calbuddy.js"],
          owns: [
            "OpenAI request",
            "JSON response shape",
            "pendingAction generation",
            "memoryCandidate generation",
            "developerIntent generation",
            "fallback behavior"
          ],
          dependsOn: ["OPENAI_API_KEY", "app_core"],
          riskLevel: "medium_high"
        },

        {
          id: "server_actions",
          name: "Server Actions",
          purpose: "Supabase service-role action execution for app writes.",
          files: ["api/actions.js"],
          owns: [
            "create_pending_action",
            "log_meal",
            "update_profile",
            "log_weight",
            "log_calories_burned"
          ],
          dependsOn: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "supabase"],
          riskLevel: "high"
        },

        {
          id: "supabase",
          name: "Supabase Data Layer",
          purpose: "Auth, profiles, meals, weights, activity logs, memories, and app actions.",
          files: ["supabase-config.js", "calbuddy-core.js", "api/actions.js"],
          owns: [
            "Auth session",
            "profiles table",
            "meals table",
            "weight_logs table",
            "activity_logs table",
            "ai_app_actions table",
            "memories table"
          ],
          dependsOn: ["Supabase project", "RLS policies", "service role key"],
          riskLevel: "high"
        },

        {
          id: "nutrition_tools",
          name: "Nutrition Tools",
          purpose: "Food logging, barcode, image analysis, food search, calorie calculations.",
          files: [
            "calbuddy-core.js",
            "api/actions.js",
            "api/barcode.js",
            "api/image-analyze.js",
            "api/knowledge.js"
          ],
          owns: [
            "Meal logging",
            "Barcode lookup",
            "Image food analysis",
            "Food knowledge",
            "Calorie estimates",
            "Macro payloads"
          ],
          dependsOn: ["app_core", "server_actions", "supabase"],
          riskLevel: "medium_high"
        },

        {
          id: "ari_language",
          name: "Ari Language System",
          purpose: "Plan and compose Ari's natural final response.",
          files: [
            "ari/language/ari-communication-planner.js",
            "ari/language/ari-language-composer.js",
            "ari/ari-rebirth-app-bridge.js"
          ],
          owns: [
            "Tone",
            "Directness",
            "Final answer",
            "Follow-up discipline",
            "Natural speech",
            "Directive cleanup"
          ],
          dependsOn: ["ari_rebirth", "semantic_context"],
          riskLevel: "high"
        },

        {
          id: "semantic_context",
          name: "Semantic Context System",
          purpose: "Understand current turn, thread meaning, continuity, and context.",
          files: [
            "ari/meaning/ari-semantic-frame-builder.js",
            "ari/context/ari-thread-understanding-engine.js",
            "ari/context/ari-context-assembler.js"
          ],
          owns: [
            "Current user meaning",
            "Thread context",
            "Conversation continuity",
            "Entity/context handoff"
          ],
          dependsOn: ["ari_core", "ari_rebirth"],
          riskLevel: "high"
        }
      ],

      relationships: [
        {
          from: "homepage",
          to: "app_core",
          relationship: "homepage calls CalBuddy core for dashboard and Ari chat"
        },
        {
          from: "app_core",
          to: "ari_rebirth",
          relationship: "CalBuddy.askAri sends user context into Ari Rebirth bridge"
        },
        {
          from: "ari_rebirth",
          to: "developer_layer",
          relationship: "Rebirth pipeline can produce developerIntent through developer engines"
        },
        {
          from: "developer_layer",
          to: "github_tools",
          relationship: "Developer handoff uses GitHub read/search/edit endpoints"
        },
        {
          from: "app_core",
          to: "github_tools",
          relationship: "CalBuddy core executes owner-gated GitHub requests"
        },
        {
          from: "app_core",
          to: "server_actions",
          relationship: "CalBuddy core can execute server-side write actions"
        },
        {
          from: "server_actions",
          to: "supabase",
          relationship: "Server actions write to Supabase with service role"
        },
        {
          from: "app_core",
          to: "supabase",
          relationship: "Client reads/writes user-scoped Supabase data"
        },
        {
          from: "server_ai",
          to: "app_core",
          relationship: "Server fallback returns reply, pendingAction, memoryCandidate, developerIntent"
        },
        {
          from: "ari_language",
          to: "ari_rebirth",
          relationship: "Language system creates final answer consumed by bridge"
        },
        {
          from: "semantic_context",
          to: "ari_language",
          relationship: "Semantic context informs communication and final composition"
        },
        {
          from: "nutrition_tools",
          to: "app_core",
          relationship: "Nutrition tools reuse pendingAction, logMeal, and dashboard refresh"
        }
      ]
    };
  },

  inferFocusedArea(text = "", summary = {}) {
    const t = String(text || "").toLowerCase();

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    if (understanding?.targetArea === "homepage_ui") return "homepage";
    if (understanding?.targetArea === "ari_response_behavior") return "ari_language";
    if (understanding?.targetArea === "tooling") return "nutrition_tools";
    if (understanding?.targetArea === "data_layer") return "supabase";
    if (understanding?.targetArea === "repository_layer") return "github_tools";

    if (this.hasAny(t, ["home screen", "homepage", "layout", "tile", "meter"])) return "homepage";
    if (this.hasAny(t, ["ari", "speak", "response", "reply", "natural"])) return "ari_language";
    if (this.hasAny(t, ["github", "repo", "commit", "read file", "search code"])) return "github_tools";
    if (this.hasAny(t, ["supabase", "database", "profile", "meals", "weight"])) return "supabase";
    if (this.hasAny(t, ["barcode", "photo", "food", "calories", "tool"])) return "nutrition_tools";
    if (this.hasAny(t, ["bug", "fix", "developer", "patch"])) return "developer_layer";

    return "project";
  },

  getRelevantNodes(focusedArea = "project", graph = {}) {
    const systems = graph.systems || [];

    if (focusedArea === "project") return systems;

    const direct = systems.find(system => system.id === focusedArea);
    if (!direct) return [];

    const relatedIds = new Set([direct.id]);

    (direct.dependsOn || []).forEach(id => relatedIds.add(id));

    (graph.relationships || []).forEach(rel => {
      if (rel.from === direct.id) relatedIds.add(rel.to);
      if (rel.to === direct.id) relatedIds.add(rel.from);
    });

    return systems.filter(system => relatedIds.has(system.id));
  },

  getRelevantFiles(focusedArea = "project", graph = {}) {
    const files = new Set();

    this.getRelevantNodes(focusedArea, graph).forEach(node => {
      (node.files || []).forEach(file => files.add(file));
    });

    return Array.from(files);
  },

  getSystemRelationships(focusedArea = "project", graph = {}) {
    if (focusedArea === "project") return graph.relationships || [];

    return (graph.relationships || []).filter(rel =>
      rel.from === focusedArea || rel.to === focusedArea
    );
  },

  getLikelyOwners(focusedArea = "project", graph = {}) {
    return this.getRelevantNodes(focusedArea, graph).map(node => ({
      system: node.name,
      id: node.id,
      files: node.files,
      owns: node.owns,
      riskLevel: node.riskLevel
    }));
  },

  getSafeNavigationPath(focusedArea = "project", graph = {}) {
    const paths = {
      homepage: [
        "Start with index.html for structure.",
        "Read style.css for layout/styling.",
        "Read calbuddy-core.js only if behavior or dashboard flow is affected.",
        "Patch visible structure/style before core logic when possible."
      ],

      app_core: [
        "Read calbuddy-core.js first.",
        "Identify exact function affected.",
        "Check dependency map before patching.",
        "Patch smallest exact block."
      ],

      ari_language: [
        "Read ari-rebirth-app-bridge.js first if reply extraction is wrong.",
        "Read communication planner if tone/strategy is wrong.",
        "Read language composer if final wording is wrong.",
        "Avoid broad prompt rewrites."
      ],

      github_tools: [
        "Read calbuddy-core.js developer handoff first.",
        "Read involved GitHub endpoint.",
        "Verify owner_access and confirmation gate.",
        "Use preview or exact replace only."
      ],

      developer_layer: [
        "Start with developer understanding.",
        "Then evidence/code understanding.",
        "Then dependency map.",
        "Only then patch decision."
      ],

      nutrition_tools: [
        "Check capability registry first.",
        "Reuse pendingAction and logMeal.",
        "Add API endpoint only if missing.",
        "Never log without confirmation."
      ],

      supabase: [
        "Check client payload.",
        "Check server action endpoint.",
        "Check table field names.",
        "Avoid schema changes without explicit owner approval."
      ],

      project: [
        "Identify system area first.",
        "Use relevant graph node.",
        "Read only affected files.",
        "Patch smallest safe unit."
      ]
    };

    return paths[focusedArea] || paths.project;
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(term));
  }
};

console.log(
  "ARI REBIRTH PROJECT KNOWLEDGE GRAPH ENGINE LOADED:",
  window.AriRebirthProjectKnowledgeGraphEngine.version
);