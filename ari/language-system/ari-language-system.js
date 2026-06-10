// ari/language-system/ari-language-system.js
// Ari Language System
// Purpose: Convert Ari's deep analysis into short, human, useful responses.
// V2.0: Adds wisdom compression.

window.Ari = window.Ari || {};

window.Ari.languageSystem = {
  version: "2.0.0",

  generate(analysis = {}, options = {}) {
    const summary = window.Ari.core
      ? window.Ari.core.createSystemSummary(analysis)
      : {};

    const length = options.length || this.chooseLength(analysis);
    const style = options.style || this.chooseStyle(analysis);

    const coreInsight = this.getCoreInsight(analysis, summary);
    const direction = this.getDirection(analysis, summary);
    const nextStep = this.getNextStep(analysis, summary);

    if (length === "brief") {
      return this.briefResponse(coreInsight, direction, nextStep);
    }

    if (length === "deep") {
      return this.deepResponse(coreInsight, direction, nextStep, analysis, summary);
    }

    return this.normalResponse(coreInsight, direction, nextStep, style);
  },

  chooseLength(analysis = {}) {
    const text = analysis.message || "";

    if (text.length < 80) return "brief";

    if (
      text.includes("why") ||
      text.includes("what am i actually") ||
      text.includes("hidden conflict") ||
      text.includes("meaning")
    ) {
      return "deep";
    }

    return "normal";
  },

  chooseStyle(analysis = {}) {
    const emotion = analysis.emotion || {};
    const executive = analysis.executive || {};

    if (executive.executiveDecision) return "steward";

    if (emotion.primaryEmotion === "compassion") return "companion";

    return "clear";
  },

  getCoreInsight(analysis = {}, summary = {}) {
    if (summary.primaryPriority === "family") {
      return "For this season, family comes first.";
    }

    if (summary.primaryConflict === "identity_vs_transition") {
      return "The real conflict is not just your goals. It is who gets to become primary next.";
    }

    if (summary.conflictIntensity === "critical") {
      return "You are carrying too many major priorities at the same time.";
    }

    if (summary.dominantValue) {
      return `Your strongest value here appears to be ${summary.dominantValue}.`;
    }

    return "The important thing is to identify what matters most before acting.";
  },

  getDirection(analysis = {}, summary = {}) {
    const executive = analysis.executive || {};

    if (executive.recommendedFocus) {
      return executive.recommendedFocus;
    }

    if (summary.needsExecutiveFunction) {
      return "Do not treat every goal as equal. One has to lead, and the others need to support it.";
    }

    return "Move slowly enough to make a clear decision.";
  },

  getNextStep(analysis = {}, summary = {}) {
    const delay = summary.thingsToDelay || [];

    if (delay.length > 0) {
      return `Put ${delay[0]} into maintenance mode first.`;
    }

    if (summary.primaryPriority) {
      return `Protect ${summary.primaryPriority} this week with one concrete action.`;
    }

    return "Choose one next action instead of trying to solve everything at once.";
  },

  compressInsight(text = "") {
    const replacements = [
      {
        from: "For this season, family comes first.",
        to: "Some opportunities return.\nFamily moments don't."
      },
      {
        from: "Make family the primary focus for this season. Keep other identities alive, but do not let them compete equally.",
        to: "Keep your other ambitions alive.\nJust don't let them sit in the driver's seat."
      },
      {
        from: "The move is simple: Protect family this week with one concrete action.",
        to: "This week, protect one family moment on purpose."
      },
      {
        from: "The tradeoff is that something meaningful may need to slow down so something irreplaceable can be protected.",
        to: "The tradeoff is simple:\nSomething meaningful may need to slow down so something irreplaceable can be protected."
      },
      {
        from: "You are carrying too many major priorities at the same time.",
        to: "You are carrying too many futures at once."
      },
      {
        from: "Do not treat every goal as equal. One has to lead, and the others need to support it.",
        to: "Not every goal gets to be first.\nOne leads. The others support."
      }
    ];

    let result = text;

    replacements.forEach((rule) => {
      result = result.replace(rule.from, rule.to);
    });

    return result;
  },

  applyWisdomCompression(response = "") {
    return this.compressInsight(response).trim();
  },

  briefResponse(coreInsight, direction, nextStep) {
    const response = [
      coreInsight,
      "",
      direction,
      "",
      `Next step: ${nextStep}`
    ].join("\n");

    return this.applyWisdomCompression(response);
  },

  normalResponse(coreInsight, direction, nextStep, style = "clear") {
    const response = [
      coreInsight,
      "",
      direction,
      "",
      `The move is simple: ${nextStep}`
    ].join("\n");

    return this.applyWisdomCompression(response);
  },

  deepResponse(coreInsight, direction, nextStep, analysis = {}, summary = {}) {
    const response = [
      coreInsight,
      "",
      direction,
      "",
      "The tradeoff is that something meaningful may need to slow down so something irreplaceable can be protected.",
      "",
      `Next step: ${nextStep}`
    ].join("\n");

    return this.applyWisdomCompression(response);
  }
};