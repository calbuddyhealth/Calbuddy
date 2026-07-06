// ari/ari-rebirth-app-bridge.js
// Connects Ari Rebirth to the real CalBuddy app.
// Keeps Ari Lab separate.
// Rebirth-only: no old Ari fallback.
// V1.7.4 — Pipeline-Owned Memory Save / Bridge Deduped


window.Ari = window.Ari || {};
window.CalBuddy = window.CalBuddy || {};

window.AriRebirthAppBridge = {
version: "1.7.4",

  requiredScripts: [
    "ari/system/ari-loader.js",
    "ari/system/ari-authority.js",

    "ari/actions/ari-rebirth-action-planner.js",
    "ari/intent/ari-action-intent-classifier.js",
    "ari/intent/ari-action-contract.js",

    "ari/developer/ari-rebirth-developer-understanding-engine.js",
    "ari/developer/ari-rebirth-ui-layout-planner-engine.js",
    "ari/developer/ari-rebirth-project-knowledge-graph-engine.js",
    "ari/developer/ari-rebirth-capability-registry-engine.js",
    "ari/developer/ari-rebirth-architecture-engine.js",
    "ari/developer/ari-rebirth-bug-diagnosis-engine.js",
    "ari/developer/ari-rebirth-execution-planner-engine.js",
    "ari/developer/ari-rebirth-code-evidence-engine.js",
    "ari/developer/ari-rebirth-code-understanding-engine.js",
    "ari/developer/ari-rebirth-dependency-map-engine.js",
    "ari/developer/ari-rebirth-self-improvement-engine.js",
    "ari/developer/ari-rebirth-patch-decision-engine.js",
    "ari/developer/ari-rebirth-patch-validation-engine.js",
    "ari/developer/ari-rebirth-regression-test-engine.js",
    "ari/developer/ari-rebirth-learning-engine.js",
    "ari/developer/ari-rebirth-developer-handoff-engine.js",

    "ari/safety/ari-safety-context-gate.js",
    "ari/observer-system/ari-observer-network.js",
    "ari/conversation/ari-conversation-function-engine.js",
    "ari/conversation/ari-universal-conversation-classifier.js",
    "ari/observer-system/ari-observer-routing-evidence.js",
    "ari/routing/ari-lane-splitter-engine.js",

    "ari/continuity/ari-continuity-entry-point.js",
    "ari/continuity/ari-continuity-packet.js",
    "ari/conversation/ari-conversation-meaning-history.js",
    "ari/context/ari-thread-question-generator.js",

    "ari/storage/ari-thread-store.js",
    "ari/storage/ari-memory-store.js",
    "ari/continuity/ari-conversation-continuity-engine.js",

    "ari/memory/ari-memory-ranking-engine.js",
    "ari/memory/ari-memory-retrieval-engine.js",
    "ari/memory/ari-memory-context-builder.js",
    "ari/memory/ari-memory-candidate-engine.js",

    "ari/relationship/ari-relationship-engine.js",
    "ari/context/ari-context-assembler.js",
    "ari/context/ari-thread-understanding-engine.js",
    "ari/context/ari-entity-reference-resolver.js",

    "ari/meaning/ari-semantic-frame-builder.js",
    "ari/meaning/ari-situation-map-engine.js",

    "ari/governance/ari-triage-engine.js",
    "ari/governance/ari-multi-lane-response-planner.js",
    "ari/governance/ari-situation-contract.js",

    "ari/language/ari-lexical-grounding-engine.js",
"ari/language/ari-human-language-engine.js",
"ari/language/ari-mouth-director.js",
"ari/language/ari-composer-bridge.js",
   "ari/language/ari-blueprint-writer.js",
  "ari/language/ari-response-candidate-arbiter.js",
    // NEW composer pathway
"ari/character/ari-character-core.js",
"ari/character/ari-character-preferences.js",
"ari/character/ari-worldview.js",
"ari/character/ari-character-context-engine.js",
"ari/character/ari-character-reasoning-engine.js",
"ari/character/ari-character-expression-engine.js",
"ari/language/ari-ai-writer.js",
"ari/language/ari-response-validator.js",
     "ari/language/ari-response-compressor.js",
    "ari/language/ari-language-composer-v9.js",
    "ari/language/ari-language-composer.js",

    "ari/observer-system/ari-observer-hierarchy-engine.js",
    "ari/observer-system/ari-observation-ledger.js",
    "ari/observer-system/ari-question-understanding.js",
    "ari/observer-system/ari-life-signal-extractor.js",

    "ari/attention-system/ari-attention-system.js",
    "ari/brain/ari-router.js",

    "ari/value-system/ari-value-engine.js",
    "ari/identity-system/ari-identity-engine.js",
    "ari/conflict-system/ari-conflict-engine.js",

    "ari/confidence-system/ari-confidence-system.js",
    "ari/confidence-system/ari-confidence-calibration.js",

    "ari/executive-system/ari-executive-function.js",

    "ari/heart/ari-emotion-engine.js",
    "ari/emotion-system/ari-emotional-intelligence.js",
    "ari/emotion-system/ari-underlying-emotion-engine.js",
    "ari/emotion-system/ari-emotion-recovery-questions.js",
    "ari/emotion-system/ari-emotion-integrator.js",

    "ari/organism-system/ari-organism-function-engine.js",
    "ari/needs/ari-need-engine.js",

    "ari/integration/ari-salience-governor.js",
    "ari/integration/ari-synthesis-engine.js",

    "ari/uncertainty/ari-uncertainty-classification-engine.js",
    "ari/identity/ari-identity-priority-engine.js",
    "ari/identity/ari-identity-conflict-resolver.js",
    "ari/values/ari-value-integration-engine.js",
    "ari/emotion/ari-stewardship-fear-differentiator.js",
    "ari/meaning/ari-life-chapter-engine.js",
    "ari/teaching/ari-teaching-answer-engine.js",
    "ari/governance/ari-situation-review-console.js",

    "ari/knowledge/ari-openai-knowledge-client.js",
"ari/knowledge/ari-supabase-knowledge-client.js",
"ari/reasoning/ari-reasoning-engine.js",
"ari/cognition/ari-cognitive-executive.js",
"ari/knowledge/ari-knowledge-router.js",
"ari/knowledge/ari-knowledge-meaning-interpreter.js",

// Event ontology
"ari/ontology/events/ari-event-ontology-life-transitions.js",
"ari/ontology/events/ari-event-ontology-relationships.js",
"ari/ontology/events/ari-event-ontology-family-parenthood.js",
"ari/ontology/events/ari-event-ontology-social-life.js",
"ari/ontology/events/ari-event-ontology-education.js",
"ari/ontology/events/ari-event-ontology-career-military.js",
"ari/ontology/events/ari-event-ontology-health.js",
"ari/ontology/events/ari-event-ontology-mental-health.js",
"ari/ontology/events/ari-event-ontology-finance-legal.js",
"ari/ontology/events/ari-event-ontology-crisis-achievement-lifestyle-tech.js",
"ari/ontology/events/ari-event-ontology-index.js",

// Meaning ontology
"ari/ontology/meaning/ari-meaning-ontology.js",
"ari/ontology/meaning/ari-meaning-modifiers.js",
"ari/ontology/meaning/ari-meaning-impacts.js",

// New understanding chain
"ari/understanding/ari-language-understanding-engine.js",
"ari/understanding/ari-semantic-understanding-engine.js",
"ari/understanding/ari-event-understanding-engine.js",
"ari/understanding/ari-meaning-interpreter.js",
"ari/understanding/ari-human-state-builder.js",
"ari/understanding/ari-response-planner.js",

"ari/integration/ari-rebirth-pipeline.js"
  ],

  loaded: false,
  loadingPromise: null,

  async ensureLoaded() {
    if (
      this.loaded &&
      window.AriRebirthPipeline &&
      typeof window.AriRebirthPipeline.run === "function"
    ) {
      return true;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      for (const src of this.requiredScripts) {
        await this.loadScriptOnce(src);
      }

      this.loaded = true;
      return true;
    })();

    return this.loadingPromise;
  },

  loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const alreadyLoaded = [...document.scripts].some(script => {
        const existing = script.getAttribute("src") || "";
        return existing === src || script.src.endsWith(src);
      });

      if (alreadyLoaded) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load Ari script: ${src}`));

      document.head.appendChild(script);
    });
  },

  async ask(message, options = {}) {
    const cleanMessage = String(message || "").trim();

const debugTiming = options.debugTiming === true;
const timingStart = performance.now();
const timing = [];

const mark = (label) => {
  if (!debugTiming) return;
  timing.push({
    label,
    ms: Math.round(performance.now() - timingStart)
  });
};

const finishTiming = () => {
  if (!debugTiming) return;
  mark("AriRebirthAppBridge.ask complete");
  console.table(timing);
  console.log(
    "[AriRebirthAppBridge Timing] Total:",
    Math.round(performance.now() - timingStart) + "ms"
  );
};

mark("bridge ask started");

    if (!cleanMessage) {
      return this.makeResponse({
        reply: "Say something first.",
        emotion: "idle"
      });
    }

    try {
      mark("before ensureLoaded");
await this.ensureLoaded();
mark("after ensureLoaded");
    } catch (error) {
      console.error("ARI REBIRTH SCRIPT LOAD ERROR:", error);

      return this.makeResponse({
        reply:
          "Ari Rebirth bridge loaded, but this file failed: " +
          String(error?.message || error),
        emotion: "concerned",
        error: String(error?.message || error)
      });
    }

    const readiness = this.checkReadiness();

    if (!readiness.ready) {
      return this.makeResponse({
        reply: readiness.message,
        emotion: "concerned",
        error: readiness.error
      });
    }

    try {
      const analysis = null;

      mark("before attachAppContext");
let summary = this.attachAppContext({}, cleanMessage, options);
mark("after attachAppContext");

mark("before AriRebirthPipeline.run");
summary = await window.AriRebirthPipeline.run(summary);
mark("after AriRebirthPipeline.run");

mark("before attachDeveloperIntent");
summary = this.attachDeveloperIntent(summary);
mark("after attachDeveloperIntent");

      const fileEvidenceReply = this.extractFileEvidenceReply(summary);

      if (fileEvidenceReply) {
      finishTiming();
          return this.makeResponse({
          reply: fileEvidenceReply,
          emotion: "thinking",
          developerIntent: summary.developerIntent || null,
          summary,
          analysis
        });
      }

      const reply = this.extractReply(summary);
      const emotion = this.chooseEmotion(summary);
      const actions = this.extractActions(summary);

      finishTiming();

return this.makeResponse({
  reply,
  emotion,
  actions,
        developerIntent: summary.developerIntent || null,
        summary,
        analysis
      });
    } catch (error) {
      console.error("ARI REBIRTH APP BRIDGE ERROR:", error);

      return this.makeResponse({
        reply:
          "Ari Rebirth hit an internal error: " +
          String(error?.message || error),
        emotion: "concerned",
        error: String(error?.message || error)
      });
    }
  },

  checkReadiness() {
    if (
      !window.AriRebirthPipeline ||
      typeof window.AriRebirthPipeline.run !== "function"
    ) {
      return {
        ready: false,
        message: "Ari Rebirth pipeline is not loaded yet.",
        error: "missing_AriRebirthPipeline_run"
      };
    }

    return { ready: true };
  },

  attachAppContext(summary = {}, cleanMessage = "", options = {}) {
  const normalizedMessage = cleanMessage.toLowerCase().trim();

  const githubFileContext = options.githubFileContext || null;
  const developerInvestigation = options.developerInvestigation || null;

  return {
    ...summary,

    debugTiming: options.debugTiming === true,

    userMessage: cleanMessage,
    message: cleanMessage,
    input: cleanMessage,
    normalizedMessage,

    // IMPORTANT: promote file evidence to top-level
    githubFileContext,
    githubEvidence: githubFileContext,
    developerInvestigation,

    appContext: {
      source: options.source || "calbuddy-health",
      appMode: "rebirth-only",
      page: options.page || "unknown",
      debugTiming: options.debugTiming === true,

      userContext: options.userContext || null,
      coachMemorySummary: options.coachMemorySummary || "",
      githubFileContext,
      githubEvidence: githubFileContext,
      developerInvestigation,

      goals: options.goals || null,
      meals: Array.isArray(options.meals) ? options.meals : [],
      todayLog: Array.isArray(options.todayLog) ? options.todayLog : [],
      recentMeals: Array.isArray(options.recentMeals) ? options.recentMeals : [],
      favoriteFoods: Array.isArray(options.favoriteFoods) ? options.favoriteFoods : [],
      recentWeights: Array.isArray(options.recentWeights) ? options.recentWeights : [],

      user: options.user || null,
      ownerMode: options.ownerMode === true,
      ariPermissions: options.ariPermissions || {},

      history: Array.isArray(options.history) ? options.history.slice(-20) : [],

      permissions: {
        allowDirectWrites: false,
        requireApprovalForActions: true
      }
    }
  };
},

  attachDeveloperIntent(summary = {}) {
    const existingIntent =
      summary.developerIntent ||
      summary.developerHandoff?.developerIntent ||
      summary.appDeveloperIntent ||
      summary.ownerDeveloperIntent ||
      null;

    if (existingIntent) {
      return {
        ...summary,
        developerIntent: existingIntent
      };
    }

    return summary;
  },

  extractReply(summary = {}) {
  const candidates = [
  summary.finalResponse,
  summary.selectedDraft,
  summary.compressedResponse,
  summary.languageBody,
    summary.languageBodyOutput,
    summary.developerResponseLocked ? summary.developerHandoff?.reply : null,
    summary.developerResponseLocked ? summary.developerHandoff?.finalResponse : null,
    summary.developerResponseLocked ? summary.developerIntent?.reply : null,
    summary.languageComposerOutput,
    summary.response,
    summary.answer,
    summary.situationContract?.clarity?.question,
    summary.synthesisRecommendedQuestion,
    summary.salienceQuestion,
    summary.recommendedRecoveryQuestion
  ];

  for (const candidate of candidates) {
    const text = String(candidate || "").trim();
    if (!text) continue;
    if (this.isDiagnosticPreview(text)) continue;
    return this.cleanReply(text);
  }

  return "I heard you, but I need a cleaner response path.";
},

    extractFileEvidenceReply(summary = {}) {
    const fileContext =
      summary.githubFileContext ||
      summary.githubEvidence ||
      summary.appContext?.githubFileContext ||
      null;

    const content = String(fileContext?.content || "");
    const filePath = fileContext?.filePath || "the file";
    const userText = String(summary.userMessage || summary.message || "").toLowerCase();

    if (!content.trim()) return null;
    if (!this.isFileEvidenceDisplayRequest(userText)) return null;

    const lines = content.split("\n");

    const range = this.wantsLineRange(userText, lines.length);
    if (range) {
      return this.formatFileLines({
        filePath,
        lines,
        start: range.start,
        end: range.end
      });
    }

    if (this.wantsFullFile(userText)) {
      return [
        `I read ${filePath}. Full file content:`,
        "",
        "```",
        content.trim(),
        "```"
      ].join("\n");
    }

    if (this.wantsFileStatus(userText)) {
      return [
        `I’m currently reading ${filePath}.`,
        "",
        `Exact file content loaded: yes`,
        `Content length: ${content.length} characters`,
        `Line count: ${lines.length}`
      ].join("\n");
    }

    return null;
  },

  isFileEvidenceDisplayRequest(userText = "") {
    return Boolean(
      this.wantsLineRange(userText, 999999) ||
      this.wantsFullFile(userText) ||
      this.wantsFileStatus(userText)
    );
  },

  wantsLineRange(userText = "", lineCount = 0) {
    const text = String(userText || "").toLowerCase();

    const rangeMatch = text.match(/lines?\s+(\d+)\s*(?:-|to|through)\s*(\d+)/i);
    if (rangeMatch) {
      const start = Math.max(Number(rangeMatch[1]), 1);
      const end = Math.min(Number(rangeMatch[2]), lineCount);
      return start <= end ? { start, end } : null;
    }

    const firstMatch = text.match(/first\s+(\d+)\s+lines?/i);
    if (firstMatch) {
      const count = Math.min(Number(firstMatch[1]), lineCount);
      return { start: 1, end: count };
    }

    const lastMatch = text.match(/last\s+(\d+)\s+lines?/i);
    if (lastMatch) {
      const count = Math.min(Number(lastMatch[1]), lineCount);
      const start = Math.max(lineCount - count + 1, 1);
      return { start, end: lineCount };
    }

    return null;
  },

  wantsFullFile(userText = "") {
    const text = String(userText || "").toLowerCase();

    return (
      text.includes("show full file") ||
      text.includes("show me full file") ||
      text.includes("show all code") ||
      text.includes("full code") ||
      text.includes("entire file") ||
      text.includes("whole file") ||
      text.includes("paste the file") ||
      text.includes("send the full file")
    );
  },

  wantsFileStatus(userText = "") {
    const text = String(userText || "").toLowerCase();

    return (
      text.includes("what file are you reading") ||
      text.includes("which file are you reading") ||
      text.includes("currently reading") ||
      text.includes("current file status") ||
      text.includes("github evidence available") ||
      text.includes("githubevidenceavailable")
    );
  },

  formatFileLines({ filePath = "the file", lines = [], start = 1, end = 1 } = {}) {
    const selected = lines.slice(start - 1, end);

    return [
      `I read ${filePath}. Lines ${start}-${end}:`,
      "",
      "```",
      ...selected.map((line, index) => {
        const lineNumber = start + index;
        return `${String(lineNumber).padStart(4, " ")} | ${line}`;
      }),
      "```"
    ].join("\n");
  },

  summarizeFileContent(content = "") {
    const text = String(content || "");
    const hints = [];

    if (text.includes("<section")) hints.push("HTML page sections");
    if (text.includes("<script")) hints.push("script loading or inline JavaScript");
    if (text.includes("CalBuddy")) hints.push("CalBuddy app behavior");
    if (text.includes("Ari")) hints.push("Ari interface or Ari logic");
    if (text.includes("href=")) hints.push("navigation links");
    if (text.includes("class=")) hints.push("styled UI elements");
    if (text.includes("addEventListener")) hints.push("event handlers");
    if (text.includes("fetch(")) hints.push("API calls");

    return hints.length
      ? hints.map(item => `- ${item}`).join("\n")
      : "- General source code content";
  },

  findRelevantFileLines(content = "", userText = "", filePath = "the file") {
    const lines = String(content || "").split("\n");

    const keywords = String(userText || "")
      .replace(/[^\w\s.-]/g, " ")
      .split(/\s+/)
      .filter(word => word.length >= 4)
      .map(word => word.toLowerCase())
      .slice(0, 12);

    const matches = lines
      .map((line, index) => {
        const lower = line.toLowerCase();
        const score = keywords.reduce((total, word) => {
          return lower.includes(word) ? total + 1 : total;
        }, 0);

        return {
          line: index + 1,
          score,
          text: line
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (!matches.length) {
      return `I read ${filePath}, but I did not find a strong matching line for that request. Try naming the exact text, class, id, or feature.`;
    }

    return [
      `I read ${filePath}. The most relevant lines are:`,
      "",
      ...matches.map(item => `Line ${item.line}: ${item.text.trim()}`)
    ].join("\n");
  },

isDiagnosticPreview(text = "") {
  const t = String(text || "").toLowerCase();

  return (
    /^mode:\s*\w+/i.test(t) &&
    t.includes("domain:") &&
    t.includes("intent:") &&
    t.includes("direct answer:")
  );
},

  cleanReply(reply) {
    const text = String(reply || "").trim();

    if (!text) {
      return "I heard you, but I need a cleaner response path.";
    }

    if (
      text === "Answer the primary lane directly." ||
      text === "Compose final response." ||
      text === "Return final answer."
    ) {
      return "I understand the question, but Ari’s final response writer did not complete the answer.";
    }

    return text;
  },

  chooseEmotion(summary = {}) {
    if (summary.developerIntent && !summary.finalResponse) return "thinking";

    const primary =
      summary.situationContract?.primary ||
      summary.situationContractPrimary ||
      summary.triage?.primaryLane ||
      summary.triagePrimaryLane ||
      "none";

    const riskLevel =
      summary.safetyContextGate?.riskLevel ||
      summary.safetyRiskLevel ||
      summary.riskLevel ||
      "none";

    if (riskLevel && riskLevel !== "none") return "concerned";

    if (
      primary === "medical_body" ||
      primary === "medical_context" ||
      primary === "safety"
    ) {
      return "concerned";
    }

    if (
      primary === "builder" ||
      primary === "planning" ||
      primary === "coding" ||
      primary === "project_help"
    ) {
      return "thinking";
    }

    if (
      primary === "teacher" ||
      primary === "teaching" ||
      primary === "explanation"
    ) {
      return "happy";
    }

    if (
      primary === "emotion" ||
      primary === "connection" ||
      primary === "relationship"
    ) {
      return "listening";
    }

    return "happy";
  },

  extractActions(summary = {}) {
    const candidates =
      summary.proposedActions ||
      summary.actions ||
      summary.appActions ||
      [];

    if (Array.isArray(candidates) && candidates.length > 0) {
      return candidates.map(action => ({
        ...action,
        requiresApproval: true,
        directWriteAllowed: false
      }));
    }

    return [];
  },

  makeResponse({
    reply,
    emotion = "idle",
    actions = [],
    developerIntent = null,
    summary = null,
    analysis = null,
    error = null
  } = {}) {
    return {
      reply: this.cleanReply(reply),
      emotion,
      actions: Array.isArray(actions) ? actions : [],
      developerIntent,
      summary,
      analysis,
      error,
      source: "ari-rebirth-app-bridge",
      bridgeVersion: this.version
    };
  }
};

console.log(
  "ARI REBIRTH APP BRIDGE LOADED:",
  window.AriRebirthAppBridge.version
);