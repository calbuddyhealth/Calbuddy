// ari/developer/ari-rebirth-regression-test-engine.js
// Purpose: Generate regression tests after a proposed developer patch.
// V1.0.0 — Test Plan Only / No Search / No Read / No Patch

window.Ari = window.Ari || {};

window.AriRebirthRegressionTestEngine = {
  version: "1.0.0",

  build(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};

    if (!appContext.ownerMode) return null;

    const patchDecision =
      summary.patchDecision ||
      summary.rebirthPatchDecision ||
      null;

    const patchValidation =
      summary.patchValidation ||
      summary.rebirthPatchValidation ||
      null;

    const dependencyMap =
      summary.dependencyMap ||
      summary.rebirthDependencyMap ||
      null;

    const githubEdit =
      patchValidation?.githubEdit ||
      patchDecision?.githubEdit ||
      summary.githubEdit ||
      summary.developerIntent?.githubEdit ||
      null;

    if (!githubEdit) return null;

    const filePath = githubEdit.filePath || "unknown";

    return {
      regressionTestRan: true,
      regressionTestVersion: this.version,
      source: "ari-rebirth-regression-test-engine",

      filePath,
      operation: githubEdit.operation || "replace",

      testPriority: this.inferPriority({
        filePath,
        dependencyMap,
        patchValidation
      }),

      requiredTests: this.buildRequiredTests({
        filePath,
        githubEdit,
        dependencyMap
      }),

      smokeTests: this.buildSmokeTests(filePath),
      failureChecks: this.buildFailureChecks(filePath),
      rollbackChecks: this.buildRollbackChecks(filePath),

      testPolicy: {
        testPlanOnly: true,
        noSearch: true,
        noRead: true,
        noPatch: true,
        noCommit: true,
        mustTestAffectedArea: true,
        mustTestAriNormalChat: true,
        mustTestOwnerDeveloperFlow: true
      }
    };
  },

  inferPriority({ filePath = "", dependencyMap = null, patchValidation = null }) {
    const path = String(filePath || "").toLowerCase();
    const blast = dependencyMap?.blastRadius?.level || "unknown";
    const safetyScore = Number(patchValidation?.safetyScore || 100);

    if (
      blast === "critical" ||
      path.includes("ari-github-edit") ||
      path.includes("ari-rebirth-pipeline") ||
      safetyScore < 70
    ) {
      return "critical";
    }

    if (
      blast === "high" ||
      path.endsWith("calbuddy-core.js") ||
      path.includes("ari-rebirth-app-bridge") ||
      path.includes("ari-language-composer")
    ) {
      return "high";
    }

    if (
      blast === "medium_high" ||
      path.endsWith("index.html") ||
      path.endsWith("api/ask-calbuddy.js")
    ) {
      return "medium_high";
    }

    return "medium";
  },

  buildRequiredTests({ filePath = "", githubEdit = {}, dependencyMap = null }) {
    const tests = new Set();

    this.testsForFile(filePath).forEach(test => tests.add(test));

    const affectedAreas = dependencyMap?.blastRadius?.affectedAreas || [];

    affectedAreas.forEach(area => {
      this.testsForAffectedArea(area).forEach(test => tests.add(test));
    });

    if (githubEdit.operation === "full_replace") {
      tests.add("Verify the edited file loads without syntax/runtime errors.");
      tests.add("Verify no unrelated visible app behavior changed.");
      tests.add("Verify rollback payload exists before commit.");
    }

    tests.add("Confirm there is no blank Ari reply.");
    tests.add("Confirm no internal directive text leaks to the user.");
    tests.add("Confirm owner-only developer actions still require confirmation.");

    return Array.from(tests);
  },

  testsForFile(filePath = "") {
    const path = String(filePath || "").toLowerCase();

    if (path.endsWith("index.html")) {
      return [
        "Open homepage on mobile.",
        "Verify Ari image loads.",
        "Verify Ari speech bubble is visible.",
        "Send Ari a normal message.",
        "Verify Ask Ari input clears after sending.",
        "Verify conversation panel renders the new message.",
        "Verify Calories Left meter still displays goal/consumed/left.",
        "Click My Goals tile.",
        "Click Progress tile.",
        "Open Conversations panel."
      ];
    }

    if (path.endsWith("style.css")) {
      return [
        "Open homepage on mobile.",
        "Verify no horizontal scrolling.",
        "Verify Ari does not overlap the header.",
        "Verify Ask Ari search bar is usable.",
        "Verify meter colors still change by threshold.",
        "Verify tiles remain clickable.",
        "Verify conversation panel text is readable."
      ];
    }

    if (path.endsWith("calbuddy-core.js")) {
      return [
        "Sign in and load homepage.",
        "Ask Ari a normal nutrition question.",
        "Ask Ari to log a meal.",
        "Confirm pending meal action.",
        "Cancel a pending action.",
        "Refresh dashboard after meal logging.",
        "Ask an owner developer question.",
        "Verify GitHub read/search/edit handoff still works.",
        "Verify calories consumed and calories left update correctly."
      ];
    }

    if (path.endsWith("api/ask-calbuddy.js")) {
      return [
        "Ask normal greeting.",
        "Ask calorie estimate.",
        "Ask meal logging request.",
        "Ask owner developer request.",
        "Verify JSON response includes reply.",
        "Verify JSON response includes emotion.",
        "Verify pendingAction is null unless needed.",
        "Verify developerIntent is null unless developer request.",
        "Verify no markdown/backticks break JSON output."
      ];
    }

    if (path.endsWith("api/actions.js")) {
      return [
        "Create pending action.",
        "Log meal through confirmed action.",
        "Update profile field.",
        "Log weight.",
        "Log calories burned.",
        "Verify invalid payload returns safe error.",
        "Verify missing user_id returns safe error."
      ];
    }

    if (path.includes("ari-github-read")) {
      return [
        "Read valid file with owner_access true.",
        "Reject read with owner_access false.",
        "Reject missing filePath.",
        "Return filePath, branch, sha, and content."
      ];
    }

    if (path.includes("ari-github-search")) {
      return [
        "Search valid query with owner_access true.",
        "Reject search with owner_access false.",
        "Return result count and file paths.",
        "Handle no matches safely."
      ];
    }

    if (path.includes("ari-github-edit")) {
      return [
        "Reject edit with owner_access false.",
        "Reject unsafe file path.",
        "Reject missing confirmation text.",
        "Reject missing find text.",
        "Reject target text not found.",
        "Preview edit without committing.",
        "Commit edit only with CONFIRM GITHUB EDIT.",
        "Verify rollbackPayload is returned."
      ];
    }

    if (path.includes("ari-rebirth-app-bridge")) {
      return [
        "Ask simple question through Rebirth.",
        "Ask nutrition question through Rebirth.",
        "Ask developer request through Rebirth.",
        "Verify reply is non-empty.",
        "Verify emotion is valid.",
        "Verify actions are approval-gated.",
        "Verify developerIntent reaches CalBuddy core."
      ];
    }

    if (path.includes("ari-rebirth-pipeline")) {
      return [
        "Run Rebirth pipeline on simple question.",
        "Run Rebirth pipeline on developer request.",
        "Verify each loaded engine runs in expected order.",
        "Verify missing engine does not crash entire pipeline.",
        "Verify finalResponse or safe fallback exists."
      ];
    }

    if (path.includes("ari-language-composer")) {
      return [
        "Ask direct factual question.",
        "Ask emotional support question.",
        "Ask developer question.",
        "Verify answer is natural.",
        "Verify answer does not leak instructions.",
        "Verify answer does not only say 'Answer the primary lane directly.'"
      ];
    }

    if (path.includes("ari-communication-planner")) {
      return [
        "Ask concise request.",
        "Ask deep explanation request.",
        "Ask emotional request.",
        "Ask developer request.",
        "Verify communication plan matches user intent."
      ];
    }

    return [
      "Load the app after deployment.",
      "Open browser console and check for errors.",
      "Test the exact feature touched by the patch.",
      "Test Ari normal chat.",
      "Test owner developer request."
    ];
  },

  testsForAffectedArea(area = "") {
    const a = String(area || "").toLowerCase();

    if (a.includes("ari") || a.includes("chat")) {
      return [
        "Ask Ari a normal question.",
        "Ask Ari a follow-up question.",
        "Verify Ari reply appears in bubble and conversation panel."
      ];
    }

    if (a.includes("meal") || a.includes("logging")) {
      return [
        "Ask Ari to log food.",
        "Confirm meal logging.",
        "Verify dashboard calories update."
      ];
    }

    if (a.includes("dashboard") || a.includes("meter")) {
      return [
        "Refresh homepage.",
        "Verify Calories Left meter updates.",
        "Verify consumed/goal text is correct."
      ];
    }

    if (a.includes("github") || a.includes("developer")) {
      return [
        "Ask Ari to read a file.",
        "Ask Ari to search code.",
        "Verify owner-gated edit still requires confirmation."
      ];
    }

    return [];
  },

  buildSmokeTests(filePath = "") {
    return [
      "Homepage loads without blank screen.",
      "No visible JavaScript error appears.",
      "Ari can answer hello.",
      "Calories meter renders.",
      "Navigation buttons remain clickable."
    ];
  },

  buildFailureChecks(filePath = "") {
    const checks = [
      "Check browser console for uncaught errors.",
      "Check Network tab for failed API calls.",
      "Check Ari reply is not empty.",
      "Check no internal JSON or directive text appears to user."
    ];

    if (String(filePath).includes("github")) {
      checks.push("Check GitHub endpoint returns structured success/error JSON.");
    }

    if (String(filePath).endsWith("calbuddy-core.js")) {
      checks.push("Check CalBuddy.version logs in console.");
      checks.push("Check CalBuddy.askAri exists.");
    }

    return checks;
  },

  buildRollbackChecks(filePath = "") {
    return [
      "Confirm previous content or rollbackPayload exists before risky commit.",
      "Confirm undo path is available for GitHub edit endpoint.",
      "If deployment breaks homepage, revert the last commit.",
      `Affected file for rollback: ${filePath || "unknown"}`
    ];
  }
};

console.log(
  "ARI REBIRTH REGRESSION TEST ENGINE LOADED:",
  window.AriRebirthRegressionTestEngine.version
);