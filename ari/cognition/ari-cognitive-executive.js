// ari/cognition/ari-cognitive-executive.js
// Purpose: Create Ari's cognitive execution plan from existing semantic pipeline outputs.
// ACE V0.1.0 — Semantic Advisory Plan Only / No Meaning Authority

window.Ari = window.Ari || {};

window.AriCognitiveExecutive = {
  version: "0.1.0",

  plan(input = {}) {
    const summary = input.summary || input || {};

    const primary =
      summary.situationContractPrimary ||
      summary.primaryLane ||
      summary.triagePrimaryLane ||
      summary.triage?.primaryLane ||
      "general_understanding";

    const responseShape =
      summary.responseShape ||
      summary.situationContract?.responseShape ||
      "clear_explanation";

    const cognitiveState = this.chooseCognitiveState(summary, primary);
    const requires = this.chooseRequirements(summary, primary);
    const activate = this.chooseActivatedSystems(summary, primary, requires);

    return {
      ariExecutiveRan: true,
      ariExecutiveVersion: this.version,
      cognitiveExecutive: {
        source: "ari-cognitive-executive",
        authority: "advisory_only",
        meaningAuthority: false,
        canOverrideSafety: false,
        canOverrideContract: false,
        canOverrideDeveloperLock: false,

        primary,
        responseShape,
        cognitiveState,

        activate,
        optional: this.chooseOptionalSystems(primary),
        requires,

        confidenceThreshold: this.confidenceThreshold(primary),
        reason:
          "ACE creates a cognitive plan from existing semantic, triage, and contract outputs. It does not classify meaning or override authority."
      }
    };
  },

  chooseCognitiveState(summary = {}, primary = "") {
    const p = String(primary || "").toLowerCase();

    if (p.includes("medical")) return "clinical_reasoning";
    if (p.includes("developer") || p.includes("builder") || p.includes("coding")) return "founder_developer";
    if (p.includes("memory")) return "memory_context";
    if (p.includes("teacher") || p.includes("understanding")) return "teacher";
    if (p.includes("safety")) return "safety_first";
    if (p.includes("planning")) return "strategist";

    if (summary.githubEvidenceAvailable) return "founder_developer";
    if (summary.safetyContextGate?.riskLevel && summary.safetyContextGate.riskLevel !== "none") {
      return "safety_first";
    }

    return "companion";
  },

  chooseRequirements(summary = {}, primary = "") {
    const p = String(primary || "").toLowerCase();

    return {
      userMemory:
        p.includes("memory") ||
        summary.laneSplit?.routing?.useMemory === true,

      systemKnowledge:
        p.includes("developer") ||
        p.includes("builder") ||
        summary.githubEvidenceAvailable === true,

      knowledgeGraph:
        p.includes("teacher") ||
        p.includes("medical") ||
        p.includes("understanding") ||
        p.includes("developer") ||
        p.includes("builder"),

      liveVerification:
        summary.requiresLiveInfo === true ||
        summary.liveVerificationRequired === true,

      reflection:
        p.includes("medical") ||
        p.includes("developer") ||
        p.includes("builder") ||
        p.includes("safety") ||
        summary.safetyContextGate?.riskLevel !== "none",

      clarification:
        summary.situationContract?.clarificationRequired === true ||
        summary.safetyContextGate?.followUpNeeded === true
    };
  },

  chooseActivatedSystems(summary = {}, primary = "", requires = {}) {
    const systems = ["perception", "understanding", "communication"];

    if (requires.userMemory) systems.push("user_memory");
    if (requires.systemKnowledge) systems.push("system_knowledge");
    if (requires.knowledgeGraph) systems.push("knowledge_graph");
    if (requires.liveVerification) systems.push("live_verification");
    if (requires.reflection) systems.push("reflection");
    if (requires.clarification) systems.push("clarification");

    const p = String(primary || "").toLowerCase();

    if (
      p.includes("medical") ||
      p.includes("teacher") ||
      p.includes("developer") ||
      p.includes("builder") ||
      p.includes("understanding")
    ) {
      systems.push("reasoning");
    }

    return [...new Set(systems)];
  },

  chooseOptionalSystems(primary = "") {
    const p = String(primary || "").toLowerCase();

    if (p.includes("developer") || p.includes("builder")) {
      return ["curiosity", "research_desk", "architecture_review"];
    }

    if (p.includes("teacher") || p.includes("understanding")) {
      return ["curiosity", "teaching_feedback"];
    }

    return ["curiosity"];
  },

  confidenceThreshold(primary = "") {
    const p = String(primary || "").toLowerCase();

    if (p.includes("safety")) return 0.98;
    if (p.includes("medical")) return 0.95;
    if (p.includes("developer") || p.includes("builder")) return 0.9;
    if (p.includes("teacher") || p.includes("understanding")) return 0.85;

    return 0.75;
  }
};

console.log("ARI COGNITIVE EXECUTIVE LOADED:", window.AriCognitiveExecutive.version);