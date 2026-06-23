// ari/developer/ari-rebirth-code-understanding-engine.js
// Purpose: Read developer investigation evidence and build code-level meaning.
// V1.1.1 — Semantic Code Understanding / Planner Consolidated / Evidence Before Patch

window.Ari = window.Ari || {};

window.AriRebirthCodeUnderstandingEngine = {
  version: "1.1.1",

  understand(input = {}) {
    const summary = input.summary || input || {};

    const developerUnderstanding =
      summary.developerUnderstanding ||
      summary.rebirthDeveloperUnderstanding ||
      null;

    const developerIntent =
      summary.developerIntent ||
      summary.summary?.developerIntent ||
      null;

    const githubFileContext =
  summary.githubFileContext ||
  summary.githubEvidence ||
  summary.appContext?.githubFileContext ||
  null;

    const hasGithubContent =
  Boolean(githubFileContext?.content) ||
  Boolean(summary.githubEvidence?.content);

if (
  !developerUnderstanding?.isDeveloperWork &&
  !developerIntent &&
  !hasGithubContent
) {
  return null;
}

    const filePath =
      githubFileContext?.filePath ||
      developerIntent?.filePath ||
      developerUnderstanding?.targetObject?.filePath ||
      developerUnderstanding?.likelyFiles?.[0] ||
      "unknown";

    const content = String(
  githubFileContext?.content ||
  summary.githubEvidence?.content ||
  ""
);

console.log(
  "CODE UNDERSTANDING EVIDENCE:",
  {
    githubFileContext: Boolean(githubFileContext),
    githubEvidence: Boolean(summary.githubEvidence),
    contentLength: content.length
  }
);

    if (!content.trim()) {
      return {
        enabled: true,
        type: "code_understanding",
        status: "needs_file_content",
        engine: "ari-rebirth-code-understanding-engine",
        engineVersion: this.version,
        filePath,
        message: "Code understanding needs exact file content before patching.",
        requiredNextStep: {
          tool: "github_read",
          filePath,
          reason: "Read exact current file content before patch decision."
        }
      };
    }

    const map = this.mapCode({
      filePath,
      content,
      developerIntent,
      developerUnderstanding
    });

    return {
      enabled: true,
      type: "code_understanding",
      status: "mapped",
      engine: "ari-rebirth-code-understanding-engine",
      engineVersion: this.version,

      filePath,
      purpose: map.purpose,
      ownerGoal: map.ownerGoal,
      intentFamily: map.intentFamily,
      targetArea: map.targetArea,

      importantSections: map.importantSections,
      semanticInventory: map.semanticInventory,
      likelyChangeZones: map.likelyChangeZones,
      risks: map.risks,
      safeEditCandidates: map.safeEditCandidates,
      patchReadiness: this.assessPatchReadiness(map),
      evidence: map.evidence,

      nextPatchInput: {
        filePath,
        contentAvailable: true,
        bestZones: map.likelyChangeZones.slice(0, 5),
        candidates: map.safeEditCandidates.slice(0, 5),
        requireExactFindText: true,
        requireOwnerConfirmation: true,
        confirmationText: "CONFIRM GITHUB EDIT"
      }
    };
  },

  mapCode({
    filePath = "",
    content = "",
    developerIntent = null,
    developerUnderstanding = null
  }) {
    const lines = String(content || "").split("\n");

    const intentText = this.normalizeIntentText({
      developerIntent,
      developerUnderstanding
    });

    const sections = this.findSections(lines);
    const functions = this.findFunctions(lines);
    const constants = this.findConstants(lines);
    const domIds = this.findDomIds(lines);
    const classes = this.findClasses(lines);
    const imports = this.findImports(lines);
    const eventHooks = this.findEventHooks(lines);
    const apiRoutes = this.findApiRoutes(lines);

    const purpose = this.inferFilePurpose(filePath, content);

    const semanticInventory = this.buildSemanticInventory({
      filePath,
      content,
      lines,
      functions,
      constants,
      domIds,
      classes,
      eventHooks,
      apiRoutes
    });

    const likelyChangeZones = this.findLikelyChangeZones({
      lines,
      intentText,
      sections,
      functions,
      constants,
      domIds,
      classes,
      eventHooks,
      apiRoutes,
      semanticInventory
    });

    const risks = this.inferRisks({
      filePath,
      content,
      likelyChangeZones,
      developerUnderstanding
    });

    const safeEditCandidates = this.buildSafeEditCandidates({
      lines,
      likelyChangeZones,
      intentText,
      filePath,
      developerUnderstanding
    });

    return {
      purpose,
      ownerGoal:
        developerUnderstanding?.userGoal ||
        developerIntent?.summary ||
        "Understand current code before patching.",
      intentFamily:
        developerUnderstanding?.intentFamily ||
        developerIntent?.intent ||
        developerIntent?.type ||
        "unknown",
      targetArea:
        developerUnderstanding?.targetArea ||
        "unknown",

      importantSections: {
        sections,
        functions,
        constants,
        domIds,
        classes,
        imports,
        eventHooks,
        apiRoutes
      },

      semanticInventory,
      likelyChangeZones,
      risks,
      safeEditCandidates,

      evidence: {
        lineCount: lines.length,
        characterCount: content.length,
        filePath,
        hasExactContent: true,
        strongestZone: likelyChangeZones[0] || null
      }
    };
  },

  normalizeIntentText({ developerIntent = null, developerUnderstanding = null }) {
    return JSON.stringify({
      developerIntent,
      developerUnderstanding
    }).toLowerCase();
  },

  inferFilePurpose(filePath = "", content = "") {
    const path = filePath.toLowerCase();
    const text = content.toLowerCase();

    if (path.endsWith("index.html")) {
      return "Homepage layout, visible Ari UI, meter structure, navigation, and inline page scripts.";
    }

    if (path.endsWith("style.css")) {
      return "Visual styling, layout, spacing, meter colors, responsive behavior, and Ari presentation.";
    }

    if (path.endsWith("calbuddy-core.js")) {
      return "CalBuddy client brain: auth, context, meals, profile, Ari handoff, GitHub actions, and dashboard refresh.";
    }

    if (path.includes("ask-calbuddy")) {
      return "Server AI prompt and response contract for old/server Ari fallback and developerIntent generation.";
    }

    if (path.includes("ari-rebirth-app-bridge")) {
      return "Bridge between Ari Rebirth local pipeline and the CalBuddy app response/action format.";
    }

    if (path.includes("ari-rebirth-pipeline")) {
      return "Ari Rebirth engine orchestration layer.";
    }

    if (path.includes("code-evidence")) {
      return "Evidence gathering engine that decides what repository searches and reads are needed.";
    }

    if (path.includes("patch-decision")) {
      return "Patch gatekeeper that decides whether a safe GitHub edit can be proposed.";
    }

    if (path.includes("developer-understanding")) {
      return "Semantic developer request understanding engine.";
    }

    if (path.includes("self-improvement")) {
      return "Ari self-improvement engine for detecting internal flaws and suggesting safe upgrades.";
    }

    if (text.includes("developerintent") || text.includes("github")) {
      return "Developer workflow or GitHub automation support file.";
    }

    return "General CalBuddy or Ari Rebirth source file.";
  },

  findSections(lines = []) {
    const sections = [];

    lines.forEach((line, index) => {
      const clean = line.trim();

      if (
        clean.startsWith("/*") ||
        clean.startsWith("//") ||
        clean.includes("-----------------------------")
      ) {
        const label = clean
          .replace(/\/\*/g, "")
          .replace(/\*\//g, "")
          .replace(/\/\//g, "")
          .replace(/[-]/g, "")
          .trim();

        if (label.length >= 3 && label.length <= 100) {
          sections.push({
            line: index + 1,
            label
          });
        }
      }
    });

    return sections.slice(0, 60);
  },

  findFunctions(lines = []) {
    const functions = [];

    lines.forEach((line, index) => {
      const clean = line.trim();

      const patterns = [
        /function\s+([a-zA-Z0-9_$]+)\s*\(/,
        /async\s+function\s+([a-zA-Z0-9_$]+)\s*\(/,
        /async\s+([a-zA-Z0-9_$]+)\s*\(/,
        /([a-zA-Z0-9_$]+)\s*:\s*function\s*\(/,
        /([a-zA-Z0-9_$]+)\s*:\s*async\s*function\s*\(/,
        /([a-zA-Z0-9_$.]+)\s*=\s*async\s*function\s*\(/,
        /([a-zA-Z0-9_$.]+)\s*=\s*function\s*\(/,
        /([a-zA-Z0-9_$.]+)\s*=\s*\([^)]*\)\s*=>/,
        /([a-zA-Z0-9_$.]+)\s*=\s*async\s*\([^)]*\)\s*=>/,
        /([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/
      ];

      for (const pattern of patterns) {
        const match = clean.match(pattern);

        if (match?.[1]) {
          functions.push({
            line: index + 1,
            name: match[1],
            preview: clean.slice(0, 220)
          });
          break;
        }
      }
    });

    return this.dedupeByNameLine(functions).slice(0, 120);
  },

  findConstants(lines = []) {
    const constants = [];

    lines.forEach((line, index) => {
      const clean = line.trim();
      const match = clean.match(/\b(?:const|let|var)\s+([A-Z0-9_$a-z]+)\s*=/);

      if (match?.[1]) {
        constants.push({
          line: index + 1,
          name: match[1],
          preview: clean.slice(0, 220)
        });
      }
    });

    return constants.slice(0, 80);
  },

  findDomIds(lines = []) {
    const ids = [];

    lines.forEach((line, index) => {
      const htmlMatches = [...String(line).matchAll(/id=["']([^"']+)["']/g)];
      const jsMatches = [
        ...String(line).matchAll(/getElementById\(["']([^"']+)["']\)/g)
      ];

      [...htmlMatches, ...jsMatches].forEach(match => {
        ids.push({
          line: index + 1,
          id: match[1]
        });
      });
    });

    return this.dedupeByKey(ids, "id").slice(0, 120);
  },

  findClasses(lines = []) {
    const classes = [];

    lines.forEach((line, index) => {
      const classMatches = [...String(line).matchAll(/class=["']([^"']+)["']/g)];
      const queryMatches = [...String(line).matchAll(/querySelector\(["']\.([^"']+)["']\)/g)];

      classMatches.forEach(match => {
        String(match[1])
          .split(/\s+/)
          .filter(Boolean)
          .forEach(cls => {
            classes.push({
              line: index + 1,
              className: cls
            });
          });
      });

      queryMatches.forEach(match => {
        classes.push({
          line: index + 1,
          className: match[1]
        });
      });
    });

    return this.dedupeByKey(classes, "className").slice(0, 160);
  },

  findImports(lines = []) {
    const imports = [];

    lines.forEach((line, index) => {
      const clean = line.trim();

      if (
        clean.startsWith("import ") ||
        clean.includes("<script src=") ||
        clean.includes("<link rel=")
      ) {
        imports.push({
          line: index + 1,
          preview: clean.slice(0, 260)
        });
      }
    });

    return imports.slice(0, 80);
  },

  findEventHooks(lines = []) {
    const hooks = [];

    lines.forEach((line, index) => {
      const clean = line.trim();

      if (
        clean.includes("addEventListener") ||
        clean.includes("onclick=") ||
        clean.includes("oninput=") ||
        clean.includes("onkeydown=") ||
        clean.includes("dispatchEvent") ||
        clean.includes("CustomEvent")
      ) {
        hooks.push({
          line: index + 1,
          preview: clean.slice(0, 260)
        });
      }
    });

    return hooks.slice(0, 100);
  },

  findApiRoutes(lines = []) {
    const routes = [];

    lines.forEach((line, index) => {
      const clean = line.trim();
      const matches = [
        ...clean.matchAll(/fetch\(["']([^"']+)["']/g),
        ...clean.matchAll(/CalBuddy\.api\(["']([^"']+)["']/g)
      ];

      matches.forEach(match => {
        routes.push({
          line: index + 1,
          route: match[1],
          preview: clean.slice(0, 240)
        });
      });
    });

    return this.dedupeByKey(routes, "route").slice(0, 80);
  },

  buildSemanticInventory({
    filePath = "",
    content = "",
    functions = [],
    constants = [],
    domIds = [],
    classes = [],
    eventHooks = [],
    apiRoutes = []
  }) {
    const text = content.toLowerCase();

    return {
      hasAriUI:
        text.includes("ari") &&
        (text.includes("bubble") || text.includes("mascot") || text.includes("conversation")),
      hasCalorieMeter:
        text.includes("calorieslefttext") ||
        text.includes("truemeterfill") ||
        text.includes("updateLiveArchMeter".toLowerCase()),
      hasDeveloperWorkflow:
        text.includes("developerintent") ||
        text.includes("github") ||
        text.includes("githubedit"),
      hasPendingActions:
        text.includes("pendingaction") ||
        text.includes("confirmPendingAction".toLowerCase()),
      hasSupabase:
        text.includes("supabase") ||
        text.includes("calbuddysupabase"),
      hasServerHandler:
        text.includes("export default async function handler"),
      hasPromptContract:
        text.includes("systemprompt") ||
        text.includes("return only valid json"),
      counts: {
        functions: functions.length,
        constants: constants.length,
        domIds: domIds.length,
        classes: classes.length,
        eventHooks: eventHooks.length,
        apiRoutes: apiRoutes.length
      },
      filePath
    };
  },

  findLikelyChangeZones({
    lines = [],
    intentText = "",
    sections = [],
    functions = [],
    constants = [],
    domIds = [],
    classes = [],
    eventHooks = [],
    apiRoutes = [],
    semanticInventory = {}
  }) {
    const zones = [];
    const concepts = this.extractConcepts(intentText);

    const scoreLine = (line = "") => {
      const lower = line.toLowerCase();
      let score = 0;
      const reasons = [];

      concepts.forEach(concept => {
        if (lower.includes(concept)) {
          score += 3;
          reasons.push(`matches concept:${concept}`);
        }
      });

      const semanticChecks = [
        ["homepage", ["ari", "home", "hero", "section", "grid", "tile"], 2],
        ["conversation", ["conversation", "thread", "messages", "chat"], 4],
        ["meter", ["meter", "calorie", "calories", "truemeter"], 4],
        ["greeting", ["greeting", "welcome", "bubble", "default"], 4],
        ["natural", ["reply", "response", "compose", "language", "finalresponse"], 3],
        ["developer", ["developerintent", "github", "edit", "investigation"], 4],
        ["tooling", ["tool", "barcode", "knowledge", "analyzeimage", "api"], 3],
        ["supabase", ["supabase", "profile", "meals", "weight_logs"], 4]
      ];

      semanticChecks.forEach(([intentConcept, lineTerms, value]) => {
        if (intentText.includes(intentConcept) && lineTerms.some(term => lower.includes(term))) {
          score += value;
          reasons.push(`semantic:${intentConcept}`);
        }
      });

      return { score, reasons };
    };

    lines.forEach((line, index) => {
      const scored = scoreLine(line);

      if (scored.score > 0) {
        zones.push({
          line: index + 1,
          score: scored.score,
          kind: "line",
          reasons: scored.reasons,
          preview: line.trim().slice(0, 260)
        });
      }
    });

    functions.forEach(fn => {
      const lowerName = fn.name.toLowerCase();
      const matched = concepts.filter(concept => lowerName.includes(concept));

      if (matched.length) {
        zones.push({
          line: fn.line,
          score: 7 + matched.length,
          kind: "function",
          reasons: matched.map(x => `function matches:${x}`),
          name: fn.name,
          preview: fn.preview
        });
      }
    });

    constants.forEach(item => {
      const lowerName = item.name.toLowerCase();
      const matched = concepts.filter(concept => lowerName.includes(concept));

      if (matched.length) {
        zones.push({
          line: item.line,
          score: 6 + matched.length,
          kind: "constant",
          reasons: matched.map(x => `constant matches:${x}`),
          name: item.name,
          preview: item.preview
        });
      }
    });

    domIds.forEach(item => {
      const lowerId = item.id.toLowerCase();
      const matched = concepts.filter(concept => lowerId.includes(concept));

      if (matched.length) {
        zones.push({
          line: item.line,
          score: 7 + matched.length,
          kind: "dom_id",
          reasons: matched.map(x => `dom id matches:${x}`),
          name: item.id,
          preview: `DOM id: ${item.id}`
        });
      }
    });

    classes.forEach(item => {
      const lowerClass = item.className.toLowerCase();
      const matched = concepts.filter(concept => lowerClass.includes(concept));

      if (matched.length) {
        zones.push({
          line: item.line,
          score: 6 + matched.length,
          kind: "class",
          reasons: matched.map(x => `class matches:${x}`),
          name: item.className,
          preview: `CSS/HTML class: ${item.className}`
        });
      }
    });

    return this.dedupeZones(zones)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
  },

  extractConcepts(text = "") {
    const concepts = new Set();

    const conceptMap = {
      homepage: ["homepage", "home", "dashboard", "main", "screen"],
      conversation: ["conversation", "chat", "thread", "messages", "history"],
      greeting: ["greeting", "welcome", "bubble", "default"],
      meter: ["meter", "calories", "calorie", "arch", "truemeter"],
      goals: ["goals", "goal"],
      progress: ["progress"],
      history: ["history"],
      ari: ["ari", "mascot", "bubble", "reply", "rebirth"],
      developer: ["developer", "github", "edit", "investigation", "patch"],
      natural: ["natural", "language", "composer", "reply", "response", "speak"],
      tooling: ["tool", "barcode", "scanner", "knowledge", "anatomy", "api"],
      data: ["supabase", "database", "profile", "meals", "weight"]
    };

    Object.entries(conceptMap).forEach(([key, words]) => {
      if (words.some(word => text.includes(word))) {
        concepts.add(key);
        words.forEach(word => concepts.add(word));
      }
    });

    String(text)
      .replace(/[^\w\s.-]/g, " ")
      .split(/\s+/)
      .filter(word => word.length >= 5)
      .slice(0, 30)
      .forEach(word => concepts.add(word.toLowerCase()));

    return Array.from(concepts).slice(0, 40);
  },

  inferRisks({ filePath = "", content = "", likelyChangeZones = [], developerUnderstanding = null }) {
    const risks = [];
    const path = filePath.toLowerCase();

    if (path.endsWith("calbuddy-core.js")) {
      risks.push("This file controls app data, pending actions, dashboard refresh, Ari handoff, and GitHub action handling.");
    }

    if (path.endsWith("index.html")) {
      risks.push("This file contains homepage structure and inline scripts. Bad edits can break visible UI or Ari message sending.");
    }

    if (path.endsWith("style.css")) {
      risks.push("Style edits are safer than logic edits but can still hide important UI or damage mobile layout.");
    }

    if (path.includes("ask-calbuddy")) {
      risks.push("Prompt edits can change Ari behavior broadly. Test normal chat, developer requests, and food logging after changes.");
    }

    if (path.includes("ari-rebirth-app-bridge")) {
      risks.push("Bridge edits can break Rebirth-to-app action handoff.");
    }

    if (content.includes("CONFIRM GITHUB EDIT")) {
      risks.push("This file participates in GitHub edit safety. Preserve confirmation and owner authorization rules.");
    }

    if (developerUnderstanding?.riskLevel === "high") {
      risks.push("Developer understanding marked this request high risk.");
    }

    if (likelyChangeZones.length === 0) {
      risks.push("No strong matching code zone found. More search/read evidence is needed before editing.");
    }

    return risks;
  },

  buildSafeEditCandidates({
    lines = [],
    likelyChangeZones = [],
    intentText = "",
    filePath = "",
    developerUnderstanding = null
  }) {
    return likelyChangeZones.slice(0, 8).map(zone => {
      const currentLine = lines[zone.line - 1] || "";
      const block = this.extractNearbyBlock(lines, zone.line);

      return {
        filePath,
        fileLine: zone.line,
        zoneKind: zone.kind || "line",
        confidence:
          zone.score >= 8 ? "medium_high" :
          zone.score >= 5 ? "medium" :
          "low",
        currentTextPreview: currentLine.trim().slice(0, 260),
        nearbyBlockPreview: block.preview,
        recommendation:
          "Use this area only if the exact current block is matched before replace.",
        canPatchDirectly: false,
        reason:
          "Candidate identified semantically, but exact find/replace must be decided by the patch decision engine.",
        evidence: {
          zoneScore: zone.score,
          reasons: zone.reasons || []
        }
      };
    });
  },

  extractNearbyBlock(lines = [], lineNumber = 1) {
    const index = Math.max(Number(lineNumber || 1) - 1, 0);
    const start = Math.max(index - 3, 0);
    const end = Math.min(index + 4, lines.length);

    const block = lines.slice(start, end).join("\n");

    return {
      startLine: start + 1,
      endLine: end,
      preview: block.trim().slice(0, 900)
    };
  },

  assessPatchReadiness(map = {}) {
    const hasZones = Array.isArray(map.likelyChangeZones) && map.likelyChangeZones.length > 0;
    const hasCandidates =
      Array.isArray(map.safeEditCandidates) && map.safeEditCandidates.length > 0;

    if (!hasZones || !hasCandidates) {
      return {
        ready: false,
        level: "needs_more_evidence",
        reason: "No reliable exact change zone found yet."
      };
    }

    const bestZone = map.likelyChangeZones[0];

    return {
      ready: false,
      level:
        bestZone?.score >= 8
          ? "strong_code_understanding_patch_not_ready"
          : "analysis_ready_patch_not_ready",
      reason:
        "Code meaning is mapped, but patch creation still requires exact find/replace construction and owner confirmation.",
      bestZone
    };
  },

  dedupeByKey(items = [], key = "") {
    const seen = new Set();

    return items.filter(item => {
      const value = item?.[key];
      if (!value) return false;

      const normalized = String(value).toLowerCase();
      if (seen.has(normalized)) return false;

      seen.add(normalized);
      return true;
    });
  },

  dedupeByNameLine(items = []) {
    const seen = new Set();

    return items.filter(item => {
      const key = `${item.name}:${item.line}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },

  dedupeZones(zones = []) {
    const seen = new Set();

    return zones.filter(zone => {
      const key = `${zone.line}:${zone.kind || "line"}:${zone.name || zone.preview}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
};

console.log(
  "ARI REBIRTH CODE UNDERSTANDING ENGINE LOADED:",
  window.AriRebirthCodeUnderstandingEngine.version
);