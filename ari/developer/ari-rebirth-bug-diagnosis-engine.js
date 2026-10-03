// ari/developer/ari-rebirth-bug-diagnosis-engine.js
// Compatibility diagnosis engine for Owner developer workflows.
// V2.0.0 — vNext-aware diagnosis / no search / no read / no patch.

window.Ari = window.Ari || {};

window.AriRebirthBugDiagnosisEngine = {
  version: "2.0.0",

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

    return {
      bugDiagnosisRan: true,
      bugDiagnosisVersion: this.version,
      source: "ari-rebirth-bug-diagnosis-engine",
      compatibilityEngine: true,
      canonicalRuntime: "ari-vnext",
      isBugReport: true,
      failureDomain: domain,
      userReport: text,
      likelyCauses: this.buildFailureTheories(domain),
      recommendedFiles: this.recommendFiles(domain, understanding),
      evidenceToGather: this.evidenceToGather(domain),
      safeDebugOrder: this.safeDebugOrder(domain),
      diagnosisPolicy: {
        diagnosisOnly: true,
        noSearch: true,
        noRead: true,
        noPatch: true,
        canonicalVNextFirst: true,
        cleanMainBaselineBeforeBranchRescue: true,
        requiresEvidenceBeforePatch: true,
        distinguishTestFailureFromProductFailure: true
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
    return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
  },

  isBugReport(text = "") {
    const t = this.normalize(text);
    return this.hasAny(t, [
      "broken", "not working", "stopped working", "glitch", "bug", "error",
      "crash", "won't", "doesn't", "does not", "isn't", "is not", "stuck",
      "blank", "not updating", "not showing", "not loading", "keeps"
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

    if (this.hasAny(text, ["homepage", "home screen", "layout", "button", "tile", "composer"])) return "homepage_ui";
    if (this.hasAny(text, ["ari", "answer", "reply", "response", "talk", "speak", "reasoning"])) return "ari_response_behavior";
    if (this.hasAny(text, ["calorie", "meter", "calories left", "not updating"])) return "calorie_meter";
    if (this.hasAny(text, ["login", "sign in", "profile", "meal", "weight", "supabase", "database"])) return "data_layer";
    if (this.hasAny(text, ["github", "commit", "pull request", "branch", "read file", "search repo", "edit file", "ci"])) return "github_workflow";
    if (this.hasAny(text, ["barcode", "photo", "api", "tool", "knowledge", "rpc"])) return "tooling";
    return "unknown";
  },

  buildFailureTheories(domain = "unknown") {
    const map = {
      homepage_ui: [
        { cause: "The live Home DOM, Home controller, or feature stylesheet may disagree about the current component contract.", confidence: 0.78, evidenceNeeded: ["Read home.html", "Read the affected js/home*.js or feature module", "Read the owning assets/css file"] },
        { cause: "A mobile viewport, event-order, or cache-busted asset boundary may be masking the real UI state.", confidence: 0.67, evidenceNeeded: ["Reproduce on the affected device", "Inspect script/style versions", "Check runtime console errors"] }
      ],
      ari_response_behavior: [
        { cause: "The canonical vNext route, orchestrator, model policy, or deliberation layer may be producing the wrong behavior before the browser renderer sees it.", confidence: 0.82, evidenceNeeded: ["Read api/ari-vnext.js", "Read api/_lib/ari-vnext/orchestrator.js", "Read the relevant vNext cognition authority"] },
        { cause: "The browser runtime bridge or context guard may be changing inputs or outputs around the canonical server result.", confidence: 0.7, evidenceNeeded: ["Read ari/runtime/ari-runtime-controller.js", "Read ari/vnext/ari-vnext-bridge.js", "Check actual response payload"] }
      ],
      calorie_meter: [
        { cause: "Nutrition/profile state may be correct in storage but stale in the current page-level projection.", confidence: 0.75, evidenceNeeded: ["Read nutrition.html and js/nutrition.js", "Trace authoritative profile/nutrition reads", "Compare live values to rendered values"] },
        { cause: "A compatibility cache may be winning over current Supabase state.", confidence: 0.63, evidenceNeeded: ["Inspect authoritative-context resolver", "Inspect browser fallback values"] }
      ],
      data_layer: [
        { cause: "The live schema/RPC contract may differ from the caller's assumed payload or field names.", confidence: 0.8, evidenceNeeded: ["Read the caller", "Read the latest migration/RPC", "Inspect the returned error or row shape"] },
        { cause: "Browser compatibility state may be overriding or duplicating authoritative Supabase state.", confidence: 0.68, evidenceNeeded: ["Read api/_lib/ari-vnext/authoritative-context.js", "Inspect local cache fallback only after live data"] }
      ],
      github_workflow: [
        { cause: "A developer engine may be starting from stale Rebirth-era file assumptions instead of current main.", confidence: 0.84, evidenceNeeded: ["Compare recommended files to current main", "Search by live symbol/visible label", "Read exact current file before patch"] },
        { cause: "CI may be reporting a stale contract or unrelated regression rather than the original product failure.", confidence: 0.71, evidenceNeeded: ["Classify each failing test by causal relevance", "Reproduce the user-visible bug independently"] }
      ],
      tooling: [
        { cause: "The vNext tool registry, validation, application-action mapping, or endpoint/RPC contract may disagree.", confidence: 0.8, evidenceNeeded: ["Read api/_lib/ari-vnext/tools.js", "Read tools-core.js", "Trace toolToApplicationAction and the backing endpoint/RPC"] },
        { cause: "A legacy CalBuddy wrapper may still sit beside the canonical vNext tool path.", confidence: 0.66, evidenceNeeded: ["Find every caller of the tool", "Identify the single write authority"] }
      ],
      unknown: [
        { cause: "The visible symptom does not yet identify the failing layer.", confidence: 0.5, evidenceNeeded: ["Reproduce the exact user-visible failure", "Search by visible label, symbol, RPC, or error", "Build the causal path before patching"] }
      ]
    };
    return map[domain] || map.unknown;
  },

  recommendFiles(domain = "unknown", understanding = null) {
    const files = new Set(Array.isArray(understanding?.likelyFiles) ? understanding.likelyFiles : []);
    const map = {
      homepage_ui: ["home.html", "js/home.js", "js/home-resilience.js", "assets/css/home.css", "assets/css/home-thread-ux.css"],
      ari_response_behavior: ["api/ari-vnext.js", "api/_lib/ari-vnext/orchestrator.js", "api/_lib/ari-vnext/deliberation-harness.js", "ari/runtime/ari-runtime-controller.js", "ari/vnext/ari-vnext-bridge.js"],
      calorie_meter: ["nutrition.html", "js/nutrition.js", "api/_lib/ari-vnext/authoritative-context.js", "calbuddy-core.js"],
      data_layer: ["api/_lib/ari-vnext/authoritative-context.js", "api/_lib/ari-vnext/context-router.js", "js/auth.js", "supabase/migrations"],
      github_workflow: ["api/_lib/ari-vnext/orchestrator.js", "api/ari-github-read.js", "api/ari-github-search.js", "api/ari-github-edit.js", "ari/developer/ari-rebirth-code-evidence-engine.js"],
      tooling: ["api/_lib/ari-vnext/tools.js", "api/_lib/ari-vnext/tools-core.js", "api/_lib/ari-vnext/orchestrator.js"]
    };
    (map[domain] || ["api/_lib/ari-vnext/orchestrator.js", "ari/runtime/ari-runtime-controller.js", "home.html"]).forEach(file => files.add(file));
    return Array.from(files).slice(0, 10);
  },

  evidenceToGather(domain = "unknown") {
    const common = [
      "Exact user action that triggers the bug.",
      "Exact visible result, server error, console error, or failing assertion.",
      "Current main behavior and current file content before any patch.",
      "Which observed evidence supports the leading theory and which evidence contradicts it."
    ];
    const map = {
      homepage_ui: ["Affected DOM selector.", "Owning script and stylesheet.", "Device/browser viewport state."],
      ari_response_behavior: ["vNext route/model policy.", "Orchestrator result.", "Browser bridge payload."],
      calorie_meter: ["Authoritative nutrition/profile values.", "Rendered values.", "Cache/fallback source if live data is unavailable."],
      data_layer: ["Supabase/RPC error.", "Payload fields.", "Latest migration contract."],
      github_workflow: ["Current main SHA.", "Exact changed branch SHA.", "Causal relevance of each CI failure."],
      tooling: ["Tool registry entry.", "Validated arguments.", "Backing endpoint/RPC response."]
    };
    return [...common, ...(map[domain] || [])];
  },

  safeDebugOrder(domain = "unknown") {
    const start = [
      "Reproduce or precisely define the original user-visible failure.",
      "Treat current main and live contracts as the baseline; do not assume an old Rebirth file map is still authoritative.",
      "Map the causal path from UI/input through runtime/API/RPC/state back to rendering.",
      "Generate competing hypotheses and gather discriminating evidence before patching."
    ];
    const domainSteps = {
      homepage_ui: ["Read home.html and the owning feature module.", "Inspect mobile/event/cache behavior.", "Patch the smallest causal layer."],
      ari_response_behavior: ["Read vNext route/orchestrator first.", "Inspect deliberation/model policy and browser bridge only as needed.", "Verify with the original conversation scenario."],
      calorie_meter: ["Compare authoritative data to rendered data.", "Trace cache fallbacks only after live state.", "Patch projection/event flow rather than guessing at storage."],
      data_layer: ["Read caller and latest migration/RPC together.", "Verify auth and returned errors.", "Avoid schema changes until the mismatch is proven."],
      github_workflow: ["Search by current symbol/label instead of static seed files.", "Classify CI failures as causal, stale-contract, or unrelated.", "After repeated failures, compare against clean main and decide repair versus rebuild."],
      tooling: ["Read tools.js/tools-core.js.", "Trace validation and application-action mapping.", "Verify backing endpoint/RPC before changing UI."]
    };
    return [...start, ...(domainSteps[domain] || ["Search current main by live evidence.", "Read exact current files.", "Diagnose before patching."])];
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(term));
  }
};

console.log(
  "ARI COMPATIBILITY BUG DIAGNOSIS ENGINE LOADED:",
  window.AriRebirthBugDiagnosisEngine.version
);