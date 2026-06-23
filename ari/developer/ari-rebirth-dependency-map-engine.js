// ari/developer/ari-rebirth-dependency-map-engine.js
// Purpose: Predict what could be affected before Ari proposes code changes.
// V1.0.0 — Dependency Awareness / Blast Radius Only / No Patch

window.Ari = window.Ari || {};

window.AriRebirthDependencyMapEngine = {
  version: "1.0.0",

  map(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};

    if (!appContext.ownerMode) return null;

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    const patchDecision =
      summary.patchDecision ||
      summary.rebirthPatchDecision ||
      null;

    const targetFiles = this.getTargetFiles({ understanding, patchDecision });

    if (!targetFiles.length) return null;

    const dependencies = targetFiles.map(filePath =>
      this.mapFileDependency(filePath)
    );

    return {
      dependencyMapRan: true,
      dependencyMapVersion: this.version,
      source: "ari-rebirth-dependency-map-engine",

      targetFiles,
      dependencies,
      blastRadius: this.inferBlastRadius(dependencies),
      safestPatchStrategy: this.inferSafestPatchStrategy(dependencies),
      requiredRegressionTests: this.buildRegressionTests(dependencies),

      dependencyPolicy: {
        mappingOnly: true,
        noSearch: true,
        noRead: true,
        noPatch: true,
        checkBlastRadiusBeforeCommit: true,
        preferSmallestSafePatch: true
      }
    };
  },

  getTargetFiles({ understanding = null, patchDecision = null } = {}) {
    const files = new Set();

    if (patchDecision?.filePath) files.add(patchDecision.filePath);

    if (understanding?.targetObject?.filePath) {
      files.add(understanding.targetObject.filePath);
    }

    if (Array.isArray(understanding?.likelyFiles)) {
      understanding.likelyFiles.forEach(file => files.add(file));
    }

    return Array.from(files).filter(Boolean).slice(0, 8);
  },

  mapFileDependency(filePath = "") {
    const path = String(filePath || "").toLowerCase();

    if (path.endsWith("index.html")) {
      return {
        filePath,
        role: "Homepage layout and inline homepage behavior.",
        dependsOn: [
          "style.css",
          "supabase-config.js",
          "calbuddy-core.js",
          "ari/ari-rebirth-app-bridge.js",
          "ari/integration/ari-rebirth-pipeline.js"
        ],
        affects: [
          "Ari homepage visibility",
          "Ask Ari input",
          "Conversation panel",
          "Calories Left meter",
          "Navigation tiles",
          "Auth button",
          "Dashboard rendering"
        ],
        riskLevel: "medium_high",
        fragileAreas: [
          "Script loading order",
          "DOM IDs used by inline JavaScript",
          "Ari message send flow",
          "Meter SVG IDs/classes",
          "Mobile layout structure"
        ]
      };
    }

    if (path.endsWith("style.css")) {
      return {
        filePath,
        role: "Visual styling, spacing, responsive layout, and meter colors.",
        dependsOn: ["index.html class names"],
        affects: [
          "Homepage layout",
          "Ari visual presence",
          "Conversation expansion",
          "Meter appearance",
          "Mobile usability"
        ],
        riskLevel: "medium",
        fragileAreas: [
          "Shared class names",
          "Mobile media rules",
          "Hidden overflow",
          "Positioning",
          "Meter color classes"
        ]
      };
    }

    if (path.endsWith("calbuddy-core.js")) {
      return {
        filePath,
        role: "Client app brain: auth, context, meals, profile, actions, dashboard refresh, Ari handoff.",
        dependsOn: [
          "supabase-config.js",
          "Supabase tables",
          "api/actions.js",
          "api/ask-calbuddy.js",
          "api/ari-github-read.js",
          "api/ari-github-search.js",
          "api/ari-github-edit.js",
          "Ari Rebirth bridge"
        ],
        affects: [
          "Authentication redirects",
          "Meal logging",
          "Weight logging",
          "Profile updates",
          "Dashboard calories",
          "Ari chat",
          "Pending actions",
          "GitHub developer workflow"
        ],
        riskLevel: "high",
        fragileAreas: [
          "CalBuddy.askAri",
          "Pending action confirmation",
          "Developer intent handling",
          "Dashboard refresh recursion",
          "Supabase write fallback",
          "Owner mode detection"
        ]
      };
    }

    if (path.endsWith("api/ask-calbuddy.js")) {
      return {
        filePath,
        role: "Server AI prompt, JSON response contract, old/server Ari fallback, developerIntent generation.",
        dependsOn: [
          "OPENAI_API_KEY",
          "calbuddy-core.js request payload",
          "OpenAI JSON response format"
        ],
        affects: [
          "Ari fallback responses",
          "Food logging suggestions",
          "Developer intent creation",
          "Memory candidates",
          "Tone and behavior"
        ],
        riskLevel: "medium_high",
        fragileAreas: [
          "JSON-only output contract",
          "Prompt length",
          "developerIntent format",
          "pendingAction schema",
          "fallback reply handling"
        ]
      };
    }

    if (path.endsWith("api/actions.js")) {
      return {
        filePath,
        role: "Server-side Supabase action execution.",
        dependsOn: [
          "SUPABASE_URL",
          "SUPABASE_SERVICE_ROLE_KEY",
          "Supabase table schemas"
        ],
        affects: [
          "Meal writes",
          "Profile updates",
          "Weight logs",
          "Activity logs",
          "Pending action records"
        ],
        riskLevel: "high",
        fragileAreas: [
          "Service role security",
          "Payload validation",
          "Table field names",
          "Write permissions",
          "Error reporting"
        ]
      };
    }

    if (path.includes("ari-github-read")) {
      return {
        filePath,
        role: "Reads repository file content for Ari developer workflow.",
        dependsOn: [
          "GITHUB_TOKEN",
          "GITHUB_REPO",
          "GITHUB_BRANCH",
          "owner_access"
        ],
        affects: [
          "Developer investigation",
          "Code understanding",
          "Patch decision"
        ],
        riskLevel: "medium_high",
        fragileAreas: [
          "Owner authorization",
          "File path encoding",
          "Branch selection",
          "GitHub API response handling"
        ]
      };
    }

    if (path.includes("ari-github-search")) {
      return {
        filePath,
        role: "Searches repository code references for Ari developer workflow.",
        dependsOn: [
          "GITHUB_TOKEN",
          "GITHUB_REPO",
          "GITHUB_BRANCH",
          "owner_access"
        ],
        affects: [
          "Evidence gathering",
          "File discovery",
          "Bug investigation"
        ],
        riskLevel: "medium_high",
        fragileAreas: [
          "Search query quality",
          "Owner authorization",
          "GitHub API limits",
          "Result formatting"
        ]
      };
    }

    if (path.includes("ari-github-edit")) {
      return {
        filePath,
        role: "Creates GitHub preview/commit/undo edits after owner confirmation.",
        dependsOn: [
          "GITHUB_TOKEN",
          "GITHUB_REPO",
          "GITHUB_BRANCH",
          "owner_access",
          "CONFIRM GITHUB EDIT"
        ],
        affects: [
          "Production code changes",
          "Vercel redeploys",
          "Undo workflow",
          "Patch safety"
        ],
        riskLevel: "critical",
        fragileAreas: [
          "Exact find/replace",
          "Confirmation gate",
          "Rollback payload",
          "Branch target",
          "Unsafe file path rejection"
        ]
      };
    }

    if (path.includes("ari-rebirth-app-bridge")) {
      return {
        filePath,
        role: "Connects Ari Rebirth pipeline output to CalBuddy app response/action format.",
        dependsOn: [
          "Ari core",
          "AriRebirthPipeline",
          "calbuddy-core.js"
        ],
        affects: [
          "Ari replies",
          "Emotion mapping",
          "Action extraction",
          "Developer intent handoff"
        ],
        riskLevel: "high",
        fragileAreas: [
          "extractReply",
          "extractActions",
          "developerIntent forwarding",
          "fallback reply text",
          "pipeline readiness checks"
        ]
      };
    }

    if (path.includes("ari-rebirth-pipeline")) {
      return {
        filePath,
        role: "Runs Ari Rebirth engines in sequence.",
        dependsOn: [
          "Loaded Ari engines",
          "Correct script order"
        ],
        affects: [
          "All Ari Rebirth reasoning",
          "Developer engine activation",
          "Final response path"
        ],
        riskLevel: "critical",
        fragileAreas: [
          "Engine order",
          "Summary field names",
          "Missing script guards",
          "Authority conflicts"
        ]
      };
    }

    if (path.includes("ari-language-composer")) {
      return {
        filePath,
        role: "Final response writer.",
        dependsOn: [
          "Situation contract",
          "Communication planner",
          "Mouth/directive output",
          "Semantic frame"
        ],
        affects: [
          "Ari naturalness",
          "Directness",
          "Answer quality",
          "No-directive leakage"
        ],
        riskLevel: "high",
        fragileAreas: [
          "Directive leakage",
          "Over-clarifying",
          "Empty final response",
          "Ignoring primary user question"
        ]
      };
    }

    if (path.includes("ari-communication-planner")) {
      return {
        filePath,
        role: "Decides how Ari should speak before final composition.",
        dependsOn: [
          "Situation contract",
          "Triage",
          "Human language profile"
        ],
        affects: [
          "Tone",
          "Answer length",
          "Follow-up discipline",
          "Directness"
        ],
        riskLevel: "medium_high",
        fragileAreas: [
          "Overly generic plans",
          "Too many follow-ups",
          "Wrong communication style",
          "Not matching user preference"
        ]
      };
    }

    return {
      filePath,
      role: "Unknown or uncategorized file.",
      dependsOn: [],
      affects: ["Unknown impact"],
      riskLevel: "unknown",
      fragileAreas: [
        "Read file before editing.",
        "Map imports/script references.",
        "Patch only exact known blocks."
      ]
    };
  },

  inferBlastRadius(dependencies = []) {
    const riskRank = {
      low: 1,
      medium: 2,
      medium_high: 3,
      high: 4,
      critical: 5,
      unknown: 3
    };

    const maxRisk = dependencies.reduce((max, item) => {
      return Math.max(max, riskRank[item.riskLevel] || 3);
    }, 0);

    const affected = new Set();

    dependencies.forEach(item => {
      (item.affects || []).forEach(area => affected.add(area));
    });

    let level = "low";

    if (maxRisk >= 5) level = "critical";
    else if (maxRisk >= 4) level = "high";
    else if (maxRisk >= 3) level = "medium_high";
    else if (maxRisk >= 2) level = "medium";

    return {
      level,
      affectedAreas: Array.from(affected),
      reason:
        level === "critical"
          ? "A target file can change production code flow, engine orchestration, or GitHub commits."
          : "Blast radius estimated from known file responsibilities."
    };
  },

  inferSafestPatchStrategy(dependencies = []) {
    const hasCritical = dependencies.some(item => item.riskLevel === "critical");
    const hasHigh = dependencies.some(item => item.riskLevel === "high");

    if (hasCritical) {
      return {
        strategy: "preview_first_or_small_replace_only",
        rules: [
          "Read exact current file.",
          "Prefer preview mode before commit.",
          "Patch one concern at a time.",
          "Require CONFIRM GITHUB EDIT.",
          "Keep rollback payload."
        ]
      };
    }

    if (hasHigh) {
      return {
        strategy: "small_exact_replace",
        rules: [
          "Patch only the smallest exact block.",
          "Avoid broad rewrites.",
          "Test normal app flow immediately.",
          "Require owner confirmation."
        ]
      };
    }

    return {
      strategy: "normal_safe_patch",
      rules: [
        "Use exact find/replace.",
        "Keep change isolated.",
        "Test affected UI/action."
      ]
    };
  },

  buildRegressionTests(dependencies = []) {
    const tests = new Set();

    dependencies.forEach(item => {
      const path = item.filePath.toLowerCase();

      if (path.endsWith("index.html") || path.endsWith("style.css")) {
        [
          "Open homepage on mobile.",
          "Send Ari a normal message.",
          "Expand/collapse conversations.",
          "Check Calories Left meter.",
          "Click Goals, Progress, and Daily Intake routes."
        ].forEach(test => tests.add(test));
      }

      if (path.endsWith("calbuddy-core.js")) {
        [
          "Ask Ari a normal question.",
          "Create and confirm a meal pending action.",
          "Cancel a pending action.",
          "Refresh dashboard after logging.",
          "Test owner developer request."
        ].forEach(test => tests.add(test));
      }

      if (path.includes("ask-calbuddy")) {
        [
          "Ask normal greeting.",
          "Ask food calorie estimate.",
          "Ask developer request.",
          "Verify JSON response has reply, emotion, pendingAction, developerIntent."
        ].forEach(test => tests.add(test));
      }

      if (path.includes("github")) {
        [
          "Test owner_access false rejection.",
          "Test read/search endpoint with valid file/query.",
          "Test edit preview before commit.",
          "Test missing find text error."
        ].forEach(test => tests.add(test));
      }

      if (path.includes("ari-rebirth")) {
        [
          "Ask simple question through Rebirth.",
          "Ask developer request through Rebirth.",
          "Verify no directive text leaks.",
          "Verify developerIntent reaches CalBuddy core."
        ].forEach(test => tests.add(test));
      }
    });

    if (!tests.size) {
      tests.add("Read current file before editing.");
      tests.add("Test the exact feature touched by the patch.");
    }

    return Array.from(tests);
  }
};

console.log(
  "ARI REBIRTH DEPENDENCY MAP ENGINE LOADED:",
  window.AriRebirthDependencyMapEngine.version
);