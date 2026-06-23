// ari/developer/ari-rebirth-developer-planner.js
// Ari Rebirth Developer Planner
// Purpose: Turn owner developer commands into investigation plans.
// V1.0.0 — Search → Read → Analyze → Edit Discipline

window.Ari = window.Ari || {};

window.AriRebirthDeveloperPlanner = {
  version: "1.0.0",

  plan(input = {}) {
    const summary = input.summary || input || {};
    const appContext = summary.appContext || {};
    const userText = this.getText(summary);

    if (!appContext.ownerMode) return null;
    if (!this.isDeveloperRequest(userText)) return null;

    const target = this.inferTarget(userText);
    const intent = this.inferIntent(userText);
    const searchQueries = this.buildSearchQueries(userText, target, intent);
    const likelyFiles = this.inferLikelyFiles(userText, target);

    return {
      enabled: true,
      type: "developer_investigation",
      planner: "ari-rebirth-developer-planner",
      plannerVersion: this.version,
      title: this.buildTitle(intent, target),
      summary: this.buildSummary(intent, target),
      priority: this.inferPriority(userText),
      ownerCommand: true,
      intent,
      target,
      likelyFiles,
      steps: this.buildSteps({
        intent,
        target,
        searchQueries,
        likelyFiles
      }),
      canEditNow: false,
      requiresReadBeforeEdit: true,
      editPolicy: {
        neverGuessFindText: true,
        requireExactFileContent: true,
        requireOwnerConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT"
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

  isDeveloperRequest(text = "") {
    const t = text.toLowerCase();

    return [
      "fix",
      "bug",
      "broken",
      "glitch",
      "error",
      "layout",
      "homepage",
      "code",
      "github",
      "file",
      "function",
      "remove",
      "change",
      "update",
      "move",
      "add",
      "search",
      "find",
      "read",
      "inspect",
      "look at",
      "where is",
      "why does",
      "why isn't",
      "why is"
    ].some(word => t.includes(word));
  },

  inferIntent(text = "") {
    const t = text.toLowerCase();

    if (this.hasAny(t, ["read", "inspect", "look at", "open"])) {
      return "read_file";
    }

    if (this.hasAny(t, ["find", "search", "locate", "where is", "where's"])) {
      return "locate_code";
    }

    if (this.hasAny(t, ["fix", "bug", "broken", "glitch", "error", "not working"])) {
      return "fix_bug";
    }

    if (this.hasAny(t, ["remove", "delete", "hide"])) {
      return "remove_ui";
    }

    if (this.hasAny(t, ["move", "relocate", "put", "place"])) {
      return "move_ui";
    }

    if (this.hasAny(t, ["add", "create", "make", "build"])) {
      return "add_feature";
    }

    if (this.hasAny(t, ["change", "update", "replace", "redesign"])) {
      return "change_ui";
    }

    return "developer_help";
  },

  inferTarget(text = "") {
    const clean = String(text || "").trim();
    const lower = clean.toLowerCase();

    const fileMatch = clean.match(
      /\b([a-zA-Z0-9_\-./]+?\.(?:html|css|js))\b/i
    );

    const labels = [];

    [
      "My Goals",
      "Progress",
      "History",
      "Conversations",
      "Calories Left",
      "Ask Ari",
      "Sign Out",
      "homepage greeting",
      "ARI_DEFAULT_BUBBLE",
      "calorie meter",
      "reset time"
    ].forEach(label => {
      if (lower.includes(label.toLowerCase())) labels.push(label);
    });

    if (fileMatch) {
      return {
        kind: "file",
        raw: clean,
        filePath: fileMatch[1],
        labels
      };
    }

    if (lower.includes("homepage")) {
      return {
        kind: "homepage",
        raw: clean,
        labels
      };
    }

    if (labels.length) {
      return {
        kind: "ui_label",
        raw: clean,
        labels
      };
    }

    return {
      kind: "unknown",
      raw: clean,
      labels
    };
  },

  buildSearchQueries(text = "", target = {}, intent = "") {
    const queries = new Set();

    const cleanedText = String(text || "")
      .replace(/\b(find|search|locate|track down|where is|where's|read|inspect|look at|open|fix|remove|change|update|move|add)\b/gi, "")
      .replace(/\b(the|a|an|from|on|in|for|please)\b/gi, "")
      .trim();

    if (cleanedText) queries.add(cleanedText);

    if (Array.isArray(target.labels)) {
      target.labels.forEach(label => {
        queries.add(label);
        queries.add(label.toUpperCase());
      });
    }

    if (target.kind === "homepage") {
      queries.add("homepage");
      queries.add("home");
      queries.add("dashboard");
      queries.add("ARI_DEFAULT_BUBBLE");
    }

    if (intent === "remove_ui" || intent === "move_ui" || intent === "change_ui") {
      queries.add("My Goals");
      queries.add("Progress");
      queries.add("History");
      queries.add("Conversations");
    }

    if (intent === "fix_bug") {
      queries.add("refreshDashboard");
      queries.add("dashboardUpdated");
      queries.add("getHomepageGreeting");
    }

    return Array.from(queries)
      .map(q => String(q || "").trim())
      .filter(Boolean)
      .slice(0, 8);
  },

  inferLikelyFiles(text = "", target = {}) {
    const t = String(text || "").toLowerCase();
    const files = new Set();

    if (target.filePath) files.add(target.filePath);

    if (
      t.includes("homepage") ||
      t.includes("my goals") ||
      t.includes("progress") ||
      t.includes("history") ||
      t.includes("conversation") ||
      t.includes("layout")
    ) {
      files.add("index.html");
      files.add("style.css");
      files.add("calbuddy-core.js");
    }

    if (
      t.includes("greeting") ||
      t.includes("bubble") ||
      t.includes("dashboard") ||
      t.includes("calories") ||
      t.includes("meter")
    ) {
      files.add("calbuddy-core.js");
      files.add("index.html");
      files.add("style.css");
    }

    if (
      t.includes("ari") ||
      t.includes("prompt") ||
      t.includes("brain") ||
      t.includes("response")
    ) {
      files.add("api/ask-calbuddy.js");
      files.add("ari/ari-rebirth-app-bridge.js");
    }

    return Array.from(files).slice(0, 6);
  },

  buildSteps({ intent, target, searchQueries, likelyFiles }) {
    const steps = [];

    if (intent === "read_file" && target.filePath) {
      steps.push({
        tool: "github_read",
        filePath: target.filePath,
        reason: "Owner asked to read a specific file."
      });

      steps.push({
        tool: "rebirth_analyze",
        reason: "Analyze the file against the owner request."
      });

      return steps;
    }

    searchQueries.forEach(query => {
      steps.push({
        tool: "github_search",
        query,
        reason: "Locate exact code references before reading or editing."
      });
    });

    likelyFiles.forEach(filePath => {
      steps.push({
        tool: "github_read",
        filePath,
        reason: "Likely file for this developer request."
      });
    });

    steps.push({
      tool: "rebirth_analyze",
      reason: "Build a code-level understanding from search/read results."
    });

    if (["fix_bug", "remove_ui", "move_ui", "change_ui", "add_feature"].includes(intent)) {
      steps.push({
        tool: "propose_edit",
        reason: "Only propose a GitHub edit after exact current code is known.",
        requiresExactFindText: true,
        requiresOwnerConfirmation: true
      });
    }

    return this.dedupeSteps(steps).slice(0, 12);
  },

  buildTitle(intent, target = {}) {
    const label = target.labels?.[0] || target.filePath || "CalBuddy code";

    const titles = {
      read_file: `Read ${label}`,
      locate_code: `Locate ${label}`,
      fix_bug: `Investigate bug in ${label}`,
      remove_ui: `Remove ${label}`,
      move_ui: `Move ${label}`,
      change_ui: `Change ${label}`,
      add_feature: `Add feature for ${label}`,
      developer_help: `Investigate ${label}`
    };

    return titles[intent] || `Investigate ${label}`;
  },

  buildSummary(intent, target = {}) {
    return `Owner requested developer work. Ari Rebirth should investigate first, read exact code, then propose a safe edit only after evidence is available. Target: ${
      target.raw || "unknown"
    }`;
  },

  inferPriority(text = "") {
    const t = text.toLowerCase();

    if (this.hasAny(t, ["broken", "not working", "error", "crash", "urgent"])) {
      return "high";
    }

    if (this.hasAny(t, ["bug", "fix", "glitch"])) {
      return "high";
    }

    return "medium";
  },

  dedupeSteps(steps = []) {
    const seen = new Set();

    return steps.filter(step => {
      const key = `${step.tool}:${step.query || step.filePath || step.reason}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  hasAny(text = "", terms = []) {
    return terms.some(term => text.includes(term));
  }
};

console.log(
  "ARI REBIRTH DEVELOPER PLANNER LOADED:",
  window.AriRebirthDeveloperPlanner.version
);