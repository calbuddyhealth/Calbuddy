// ari/developer/ari-rebirth-code-understanding-engine.js
// Purpose: Read developer investigation evidence and build code-level meaning.
// V1.0.0 — Semantic Code Understanding / Evidence Before Patch

window.Ari = window.Ari || {};

window.AriRebirthCodeUnderstandingEngine = {
  version: "1.0.0",

  understand(input = {}) {
    const summary = input.summary || input || {};
    const developerIntent =
      summary.developerIntent ||
      summary.summary?.developerIntent ||
      null;

    const githubFileContext =
      summary.githubFileContext ||
      summary.appContext?.githubFileContext ||
      null;

    if (!developerIntent && !githubFileContext?.content) return null;

    const filePath = githubFileContext?.filePath || developerIntent?.filePath || "unknown";
    const content = String(githubFileContext?.content || "");

    if (!content.trim()) {
      return {
        enabled: true,
        type: "code_understanding",
        status: "needs_file_content",
        filePath,
        message: "Code understanding needs exact file content before patching."
      };
    }

    const map = this.mapCode({
      filePath,
      content,
      developerIntent
    });

    return {
      enabled: true,
      type: "code_understanding",
      engine: "ari-rebirth-code-understanding-engine",
      engineVersion: this.version,
      filePath,
      purpose: map.purpose,
      importantSections: map.importantSections,
      likelyChangeZones: map.likelyChangeZones,
      risks: map.risks,
      safeEditCandidates: map.safeEditCandidates,
      patchReadiness: this.assessPatchReadiness(map),
      evidence: map.evidence
    };
  },

  mapCode({ filePath = "", content = "", developerIntent = null }) {
    const lines = String(content || "").split("\n");
    const intentText = JSON.stringify(developerIntent || {}).toLowerCase();

    const sections = this.findSections(lines);
    const functions = this.findFunctions(lines);
    const constants = this.findConstants(lines);
    const domIds = this.findDomIds(lines);
    const eventHooks = this.findEventHooks(lines);

    const purpose = this.inferFilePurpose(filePath, content);
    const likelyChangeZones = this.findLikelyChangeZones({
      lines,
      intentText,
      sections,
      functions,
      constants,
      domIds,
      eventHooks
    });

    const risks = this.inferRisks({
      filePath,
      content,
      likelyChangeZones
    });

    const safeEditCandidates = this.buildSafeEditCandidates({
      lines,
      likelyChangeZones,
      intentText
    });

    return {
      purpose,
      importantSections: {
        sections,
        functions,
        constants,
        domIds,
        eventHooks
      },
      likelyChangeZones,
      risks,
      safeEditCandidates,
      evidence: {
        lineCount: lines.length,
        characterCount: content.length,
        filePath
      }
    };
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

        if (label.length >= 3 && label.length <= 80) {
          sections.push({
            line: index + 1,
            label
          });
        }
      }
    });

    return sections.slice(0, 40);
  },

  findFunctions(lines = []) {
    const functions = [];

    lines.forEach((line, index) => {
      const clean = line.trim();

      const patterns = [
        /function\s+([a-zA-Z0-9_$]+)\s*\(/,
        /([a-zA-Z0-9_$]+)\s*:\s*function\s*\(/,
        /([a-zA-Z0-9_$]+)\s*=\s*async\s*function\s*\(/,
        /([a-zA-Z0-9_$.]+)\s*=\s*async\s*function\s*\(/,
        /([a-zA-Z0-9_$.]+)\s*=\s*function\s*\(/,
        /async\s+([a-zA-Z0-9_$]+)\s*\(/
      ];

      for (const pattern of patterns) {
        const match = clean.match(pattern);
        if (match?.[1]) {
          functions.push({
            line: index + 1,
            name: match[1],
            preview: clean.slice(0, 180)
          });
          break;
        }
      }
    });

    return functions.slice(0, 80);
  },

  findConstants(lines = []) {
    const constants = [];

    lines.forEach((line, index) => {
      const clean = line.trim();
      const match = clean.match(/\b(?:const|let|var)\s+([A-Z0-9_$]+)\s*=/);

      if (match?.[1]) {
        constants.push({
          line: index + 1,
          name: match[1],
          preview: clean.slice(0, 180)
        });
      }
    });

    return constants.slice(0, 40);
  },

  findDomIds(lines = []) {
    const ids = [];

    lines.forEach((line, index) => {
      const matches = [...String(line).matchAll(/id=["']([^"']+)["']/g)];

      matches.forEach(match => {
        ids.push({
          line: index + 1,
          id: match[1]
        });
      });
    });

    return ids.slice(0, 80);
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
        clean.includes("dispatchEvent")
      ) {
        hooks.push({
          line: index + 1,
          preview: clean.slice(0, 220)
        });
      }
    });

    return hooks.slice(0, 80);
  },

  findLikelyChangeZones({
    lines = [],
    intentText = "",
    sections = [],
    functions = [],
    constants = [],
    domIds = [],
    eventHooks = []
  }) {
    const zones = [];

    const concepts = this.extractConcepts(intentText);

    const scoreLine = (line = "") => {
      const lower = line.toLowerCase();
      let score = 0;

      concepts.forEach(concept => {
        if (lower.includes(concept)) score += 3;
      });

      if (intentText.includes("homepage") && lower.includes("ari")) score += 2;
      if (intentText.includes("conversation") && lower.includes("conversation")) score += 4;
      if (intentText.includes("meter") && lower.includes("meter")) score += 4;
      if (intentText.includes("greeting") && lower.includes("greeting")) score += 4;
      if (intentText.includes("natural") && lower.includes("reply")) score += 2;
      if (intentText.includes("developer") && lower.includes("developerintent")) score += 4;

      return score;
    };

    lines.forEach((line, index) => {
      const score = scoreLine(line);

      if (score > 0) {
        zones.push({
          line: index + 1,
          score,
          preview: line.trim().slice(0, 220)
        });
      }
    });

    functions.forEach(fn => {
      const lowerName = fn.name.toLowerCase();

      concepts.forEach(concept => {
        if (lowerName.includes(concept)) {
          zones.push({
            line: fn.line,
            score: 5,
            preview: fn.preview,
            kind: "function"
          });
        }
      });
    });

    domIds.forEach(item => {
      const lowerId = item.id.toLowerCase();

      concepts.forEach(concept => {
        if (lowerId.includes(concept)) {
          zones.push({
            line: item.line,
            score: 5,
            preview: `DOM id: ${item.id}`,
            kind: "dom_id"
          });
        }
      });
    });

    return zones
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  },

  extractConcepts(text = "") {
    const concepts = new Set();

    const conceptMap = {
      homepage: ["homepage", "home", "dashboard"],
      conversation: ["conversation", "chat", "thread", "messages"],
      greeting: ["greeting", "welcome", "bubble"],
      meter: ["meter", "calories", "calorie", "arch"],
      goals: ["goals", "goal"],
      progress: ["progress"],
      history: ["history"],
      ari: ["ari", "mascot", "bubble", "reply"],
      developer: ["developer", "github", "edit", "investigation"],
      natural: ["natural", "language", "composer", "reply", "response"]
    };

    Object.entries(conceptMap).forEach(([key, words]) => {
      if (words.some(word => text.includes(word))) {
        words.forEach(word => concepts.add(word));
        concepts.add(key);
      }
    });

    String(text)
      .replace(/[^\w\s.-]/g, " ")
      .split(/\s+/)
      .filter(word => word.length >= 5)
      .slice(0, 20)
      .forEach(word => concepts.add(word.toLowerCase()));

    return Array.from(concepts).slice(0, 30);
  },

  inferRisks({ filePath = "", content = "", likelyChangeZones = [] }) {
    const risks = [];
    const path = filePath.toLowerCase();

    if (path.endsWith("calbuddy-core.js")) {
      risks.push("This file controls app data, pending actions, dashboard refresh, and Ari handoff. Bad edits can break core app behavior.");
    }

    if (path.endsWith("index.html")) {
      risks.push("This file contains homepage structure and inline scripts. Bad edits can break visible UI or Ari message sending.");
    }

    if (path.endsWith("style.css")) {
      risks.push("Style edits are safer than logic edits but can still hide important UI or damage mobile layout.");
    }

    if (path.includes("ask-calbuddy")) {
      risks.push("Prompt edits can change Ari behavior broadly. Keep patches small and test with normal chat, developer requests, and food logging.");
    }

    if (content.includes("CONFIRM GITHUB EDIT")) {
      risks.push("This file participates in GitHub edit safety. Preserve confirmation and owner authorization rules.");
    }

    if (likelyChangeZones.length === 0) {
      risks.push("No strong matching code zone found. More search/read evidence is needed before editing.");
    }

    return risks;
  },

  buildSafeEditCandidates({ lines = [], likelyChangeZones = [], intentText = "" }) {
    return likelyChangeZones.slice(0, 5).map(zone => {
      const currentLine = lines[zone.line - 1] || "";

      return {
        fileLine: zone.line,
        confidence: zone.score >= 5 ? "medium" : "low",
        currentTextPreview: currentLine.trim().slice(0, 240),
        recommendation:
          "Use this area only if the full exact block is read and matched before replace.",
        canPatchDirectly: false,
        reason:
          "Candidate identified semantically, but exact find/replace must be built from current file content."
      };
    });
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

    return {
      ready: false,
      level: "analysis_ready_patch_not_ready",
      reason:
        "Code meaning is mapped, but patch creation still requires exact find/replace construction and owner confirmation."
    };
  }
};

console.log(
  "ARI REBIRTH CODE UNDERSTANDING ENGINE LOADED:",
  window.AriRebirthCodeUnderstandingEngine.version
);