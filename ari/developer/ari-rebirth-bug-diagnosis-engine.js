// ari/developer/ari-rebirth-bug-diagnosis-engine.js
// Purpose: Build semantic bug theories from owner reports.
// V1.0.0 — Diagnosis Only / No Search / No Read / No Patch

window.Ari = window.Ari || {};

window.AriRebirthBugDiagnosisEngine = {
  version: "1.0.0",

  diagnose(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};
    const text = this.getText(summary);

    if (!appContext.ownerMode) return null;

    const understanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    const isBugLike =
      understanding?.intentFamily === "bug_investigation" ||
      this.isBugReport(text);

    if (!isBugLike) return null;

    const normalized = this.normalize(text);
    const domain = this.inferFailureDomain(normalized, understanding);
    const theories = this.buildFailureTheories({
      text: normalized,
      domain,
      understanding
    });

    return {
      bugDiagnosisRan: true,
      bugDiagnosisVersion: this.version,
      source: "ari-rebirth-bug-diagnosis-engine",

      isBugReport: true,
      failureDomain: domain,
      userReport: text,

      likelyCauses: theories,
      recommendedFiles: this.recommendFiles(domain, understanding),
      evidenceToGather: this.evidenceToGather(domain),
      safeDebugOrder: this.safeDebugOrder(domain),

      diagnosisPolicy: {
        diagnosisOnly: true,
        noSearch: true,
        noRead: true,
        noPatch: true,
        requiresEvidenceBeforePatch: true
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

  isBugReport(text = "") {
    const t = this.normalize(text);

    return this.hasAny(t, [
      "broken",
      "not working",
      "stopped working",
      "glitch",
      "bug",
      "error",
      "crash",
      "won't",
      "doesn't",
      "does not",
      "isn't",
      "is not",
      "stuck",
      "blank",
      "not updating",
      "not showing",
      "not loading",
      "keeps"
    ]);
  },

  inferFailureDomain(text = "", understanding = null) {
    const targetArea = understanding?.targetArea || "";

    if (targetArea === "homepage_ui") return "homepage_ui";
    if (targetArea === "ari_response_behavior") return "ari_response_behavior";
    if (targetArea === "calorie_meter") return "calorie_meter";
    if (targetArea === "data_layer") return "data_layer";
    if (targetArea === "repository_layer") return "github_workflow";
    if (targetArea === "tooling") return "tooling";

    if (this.hasAny(text, ["homepage", "home screen", "layout", "button", "tile"])) {
      return "homepage_ui";
    }

    if (this.hasAny(text, ["ari", "answer", "reply", "response", "talk", "speak"])) {
      return "ari_response_behavior";
    }

    if (this.hasAny(text, ["calorie", "meter", "arch", "calories left", "not updating"])) {
      return "calorie_meter";
    }

    if (this.hasAny(text, ["login", "sign in", "profile", "meal", "weight", "supabase", "database"])) {
      return "data_layer";
    }

    if (this.hasAny(text, ["github", "commit", "read file", "search repo", "edit file"])) {
      return "github_workflow";
    }

    if (this.hasAny(text, ["barcode", "photo", "api", "tool", "knowledge"])) {
      return "tooling";
    }

    return "unknown";
  },

  buildFailureTheories({ text = "", domain = "unknown", understanding = null }) {
    const theoriesByDomain = {
      homepage_ui: [
        {
          cause: "index.html structure or inline script is not matching the expected DOM IDs/classes.",
          confidence: 0.78,
          evidenceNeeded: ["Read index.html", "Check DOM IDs and script load order"]
        },
        {
          cause: "style.css may be hiding or compressing an element on mobile.",
          confidence: 0.66,
          evidenceNeeded: ["Read style.css", "Inspect affected class names"]
        },
        {
          cause: "Ari Rebirth or CalBuddy script load order may be preventing homepage functions from attaching.",
          confidence: 0.61,
          evidenceNeeded: ["Check script tags", "Check console errors"]
        }
      ],

      ari_response_behavior: [
        {
          cause: "The Rebirth pipeline may produce meaning, but the final response extraction path is incomplete.",
          confidence: 0.82,
          evidenceNeeded: ["Read ari-rebirth-app-bridge.js", "Check extractReply output"]
        },
        {
          cause: "Language composer or communication planner may be returning directive text instead of final speech.",
          confidence: 0.73,
          evidenceNeeded: ["Read ari-language-composer.js", "Read ari-communication-planner.js"]
        },
        {
          cause: "calbuddy-core.js may not be forwarding developerIntent, emotion, or reply correctly.",
          confidence: 0.58,
          evidenceNeeded: ["Read calbuddy-core.js", "Check askAri Rebirth branch"]
        }
      ],

      calorie_meter: [
        {
          cause: "Dashboard context may not be refreshing after meals/profile changes.",
          confidence: 0.78,
          evidenceNeeded: ["Read refreshDashboard", "Check dashboardUpdated event"]
        },
        {
          cause: "index.html renderDashboard or updateLiveArchMeter may be using stale or mismatched values.",
          confidence: 0.7,
          evidenceNeeded: ["Read index.html inline dashboard functions"]
        },
        {
          cause: "Supabase/local cache may be returning old calories after reset-window changes.",
          confidence: 0.62,
          evidenceNeeded: ["Read getNutritionWindow", "Read clearCalorieCache"]
        }
      ],

      data_layer: [
        {
          cause: "Supabase write/read mismatch or missing table field may be causing silent fallback.",
          confidence: 0.76,
          evidenceNeeded: ["Read calbuddy-core.js", "Read api/actions.js"]
        },
        {
          cause: "Profile or meal fields may not match database schema.",
          confidence: 0.69,
          evidenceNeeded: ["Inspect payload fields", "Check Supabase response errors"]
        },
        {
          cause: "Auth/session state may be missing, forcing local-only behavior.",
          confidence: 0.58,
          evidenceNeeded: ["Read getCurrentUser", "Check session state"]
        }
      ],

      github_workflow: [
        {
          cause: "GitHub read/search/edit endpoint may be blocked by owner_access or env variables.",
          confidence: 0.8,
          evidenceNeeded: ["Read api/ari-github-read.js", "Read api/ari-github-edit.js"]
        },
        {
          cause: "calbuddy-core.js may save developerIntent but not execute investigation steps correctly.",
          confidence: 0.72,
          evidenceNeeded: ["Read handleDeveloperIntent", "Read runDeveloperInvestigation"]
        },
        {
          cause: "Patch find text may not exactly match current GitHub file content.",
          confidence: 0.66,
          evidenceNeeded: ["Read current file", "Compare exact find text"]
        }
      ],

      tooling: [
        {
          cause: "Tool endpoint may exist in CalBuddy core but not have a working backend API.",
          confidence: 0.74,
          evidenceNeeded: ["Read calbuddy-core.js tool methods", "Read api folder endpoint"]
        },
        {
          cause: "Tool may require auth, payload format, or database support not yet wired.",
          confidence: 0.69,
          evidenceNeeded: ["Check requireUser", "Check request payload"]
        },
        {
          cause: "Ari may understand the tool request but not emit the correct pendingAction/developerIntent.",
          confidence: 0.61,
          evidenceNeeded: ["Read api/ask-calbuddy.js", "Read Rebirth bridge"]
        }
      ],

      unknown: [
        {
          cause: "The bug report does not identify a clear system yet.",
          confidence: 0.5,
          evidenceNeeded: ["Clarify affected screen", "Search repository by visible label or function"]
        }
      ]
    };

    return theoriesByDomain[domain] || theoriesByDomain.unknown;
  },

  recommendFiles(domain = "unknown", understanding = null) {
    const files = new Set();

    const likely = Array.isArray(understanding?.likelyFiles)
      ? understanding.likelyFiles
      : [];

    likely.forEach(file => files.add(file));

    const map = {
      homepage_ui: ["index.html", "style.css", "calbuddy-core.js"],
      ari_response_behavior: [
        "ari/ari-rebirth-app-bridge.js",
        "ari/language/ari-language-composer.js",
        "ari/language/ari-communication-planner.js",
        "calbuddy-core.js"
      ],
      calorie_meter: ["index.html", "style.css", "calbuddy-core.js"],
      data_layer: ["calbuddy-core.js", "api/actions.js", "supabase-config.js"],
      github_workflow: [
        "calbuddy-core.js",
        "api/ari-github-read.js",
        "api/ari-github-search.js",
        "api/ari-github-edit.js"
      ],
      tooling: ["calbuddy-core.js", "api/actions.js", "api/ask-calbuddy.js"]
    };

    (map[domain] || ["index.html", "calbuddy-core.js", "api/ask-calbuddy.js"])
      .forEach(file => files.add(file));

    return Array.from(files).slice(0, 8);
  },

  evidenceToGather(domain = "unknown") {
    const common = [
      "Exact user action that triggers the bug.",
      "Exact visible result or console error.",
      "Current file content before any patch."
    ];

    const map = {
      homepage_ui: [
        "Affected DOM ID/class.",
        "Script loading order.",
        "Relevant CSS rules."
      ],
      ari_response_behavior: [
        "Final Rebirth summary fields.",
        "extractReply result.",
        "Composer output."
      ],
      calorie_meter: [
        "Current dashboard context.",
        "Calories consumed/burned/goal values.",
        "Meter DOM update function."
      ],
      data_layer: [
        "Supabase response error.",
        "Payload fields.",
        "Authenticated user ID."
      ],
      github_workflow: [
        "owner_access value.",
        "GitHub endpoint response.",
        "Exact filePath/find text."
      ],
      tooling: [
        "Tool endpoint path.",
        "Request payload.",
        "Expected action type."
      ]
    };

    return [...common, ...(map[domain] || [])];
  },

  safeDebugOrder(domain = "unknown") {
    const map = {
      homepage_ui: [
        "Read index.html first.",
        "Check script order and DOM IDs.",
        "Read style.css only after structure is known.",
        "Patch smallest visible block."
      ],
      ari_response_behavior: [
        "Read ari-rebirth-app-bridge.js first.",
        "Check summary fields used by extractReply.",
        "Read composer/planner if bridge output is directive text.",
        "Patch final response path only after exact cause is found."
      ],
      calorie_meter: [
        "Read index.html meter functions.",
        "Read calbuddy-core.js dashboard context.",
        "Verify event dispatch/listener path.",
        "Patch calculation or event flow only after values are known."
      ],
      data_layer: [
        "Read calbuddy-core.js write/read path.",
        "Read api/actions.js if server write is involved.",
        "Check Supabase fields before patching.",
        "Avoid schema-changing patches without confirmation."
      ],
      github_workflow: [
        "Read calbuddy-core.js developer handoff.",
        "Read GitHub endpoint involved.",
        "Confirm owner_access and env variables.",
        "Patch endpoint/core handoff only after exact failure."
      ],
      tooling: [
        "Read calbuddy-core.js tool method.",
        "Read backend endpoint.",
        "Verify action/payload contract.",
        "Patch tool bridge before adding UI."
      ]
    };

    return map[domain] || [
      "Clarify affected area.",
      "Search likely code references.",
      "Read current file.",
      "Diagnose before patch."
    ];
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(term));
  }
};

console.log(
  "ARI REBIRTH BUG DIAGNOSIS ENGINE LOADED:",
  window.AriRebirthBugDiagnosisEngine.version
);